import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const outputDirectory = resolve(process.env.BOT_OUTPUT_DIR || 'bot-output');
const tmdbBaseUrl = 'https://api.themoviedb.org/3';
const imageBaseUrl = 'https://image.tmdb.org/t/p';
const websiteUrl = process.env.WEBSITE_URL || 'https://90minutemovie.com';
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbBearerToken = process.env.TMDB_BEARER_TOKEN;

if (!tmdbApiKey && !tmdbBearerToken) {
  throw new Error('Set TMDB_API_KEY or TMDB_BEARER_TOKEN before generating a bot preview.');
}

const tmdbFetch = async (path, parameters = {}) => {
  const url = new URL(`${tmdbBaseUrl}${path}`);
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const headers = { accept: 'application/json' };
  if (tmdbBearerToken) headers.Authorization = `Bearer ${tmdbBearerToken}`;
  else url.searchParams.set('api_key', tmdbApiKey);

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`TMDb ${path} failed (${response.status}).`);
  return response.json();
};

const fetchBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
};

const toDataUri = (buffer, contentType = 'image/png') => `data:${contentType};base64,${buffer.toString('base64')}`;
const xmlEscape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[character]);

// The card has a deliberately generous right-side gutter; titles must never
// enter the logo area or run off the exported image.
const createTrackedCharacters = (line, tracking) => Array.from(line).map((character, characterIndex) => (
  `<tspan dx="${characterIndex === 0 ? 0 : tracking}">${xmlEscape(character)}</tspan>`
)).join('');

const splitTitleIntoLines = (words, lineCount) => {
  if (lineCount === 1) return [[words.join(' ')]];
  const candidates = [];
  for (let index = 1; index <= words.length - lineCount + 1; index += 1) {
    const firstLine = words.slice(0, index).join(' ');
    splitTitleIntoLines(words.slice(index), lineCount - 1).forEach((remainingLines) => {
      candidates.push([firstLine, ...remainingLines]);
    });
  }
  return candidates;
};

const fontSizeForTitleLength = (length) => {
  if (length <= 8) return 126;
  if (length <= 10) return 116;
  if (length <= 12) return 104;
  if (length <= 14) return 88;
  if (length <= 16) return 72;
  if (length <= 18) return 60;
  if (length <= 22) return 52;
  return 48;
};

const getTitleLayout = (title) => {
  const words = title.split(/\s+/).filter(Boolean);
  if (title.length <= 15 || words.length < 2) {
    const fontSize = fontSizeForTitleLength(title.length);
    return { lines: [title], fontSize, tracking: (fontSize * 0.02).toFixed(2) };
  }

  const twoLineCandidates = splitTitleIntoLines(words, 2);
  const bestTwoLineCandidate = twoLineCandidates.sort((first, second) => (
    Math.max(...first.map((line) => line.length)) - Math.max(...second.map((line) => line.length))
  ))[0];
  const longestTwoLineLength = Math.max(...bestTwoLineCandidate.map((line) => line.length));
  const lines = longestTwoLineLength <= 18 || words.length < 3
    ? bestTwoLineCandidate
    : splitTitleIntoLines(words, 3).sort((first, second) => (
      Math.max(...first.map((line) => line.length)) - Math.max(...second.map((line) => line.length))
    ))[0];
  const fontSize = fontSizeForTitleLength(Math.max(...lines.map((line) => line.length)));
  return { lines, fontSize, tracking: (fontSize * 0.02).toFixed(2) };
};

const dateSeed = () => {
  const now = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return [...now].reduce((sum, character) => sum + character.charCodeAt(0), 0);
};

const selectionSeed = Number.parseInt(process.env.SELECTION_SEED || '', 10) || dateSeed();
const requestedMovieId = Number.parseInt(process.env.MOVIE_ID || '', 10);
const scheduledDate = process.env.SCHEDULE_DATE || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const avoidHorrorForThisSlot = /^\d{4}-09-/.test(scheduledDate);
const isOccasionalLongPick = process.env.ALLOW_LONG_RUNTIME === undefined
  ? selectionSeed % 5 === 0
  : process.env.ALLOW_LONG_RUNTIME === '1';

const discoverMovie = async (seed) => {
  // Most picks stay close to the 100-minute brief. One in five attempts may
  // draw from the upper edge so the feed still has some longer variety.
  const discovery = await tmdbFetch('/discover/movie', {
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    'primary_release_date.lte': new Date().toISOString().slice(0, 10),
    'vote_count.gte': 25,
    'with_runtime.gte': isOccasionalLongPick ? 103 : 90,
    'with_runtime.lte': 105,
    without_genres: avoidHorrorForThisSlot ? '27' : undefined,
    watch_region: 'US',
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    page: (seed % 50) + 1
  });
  const candidates = discovery.results.filter((movie) => movie.poster_path && movie.release_date);
  if (!candidates.length) throw new Error('No eligible movie was returned by TMDb.');
  return candidates[Math.floor(seed / 50) % candidates.length];
};

const main = async () => {
  const candidate = requestedMovieId ? { id: requestedMovieId } : await discoverMovie(selectionSeed);
  const [details, credits, providers, releaseDates] = await Promise.all([
    tmdbFetch(`/movie/${candidate.id}`),
    tmdbFetch(`/movie/${candidate.id}/credits`),
    tmdbFetch(`/movie/${candidate.id}/watch/providers`),
    tmdbFetch(`/movie/${candidate.id}/release_dates`)
  ]);

  const director = credits.crew.find((person) => person.job === 'Director')?.name || 'Unknown';
  const year = (details.release_date || candidate.release_date || '').slice(0, 4) || '—';
  const isHorror = details.genres.some((genre) => genre.id === 27);
  const hasTargetRuntime = details.runtime >= (isOccasionalLongPick ? 103 : 90)
    && details.runtime <= (isOccasionalLongPick ? 105 : 102);
  if (!requestedMovieId && (!hasTargetRuntime || (avoidHorrorForThisSlot && isHorror))) {
    throw new Error(`Movie ${details.id} does not meet this slot's selection policy.`);
  }
  const usReleaseDates = releaseDates.results?.find((release) => release.iso_3166_1 === 'US')?.release_dates || [];
  const certification = usReleaseDates.find((release) => release.certification)?.certification || 'NR';
  const genres = details.genres.slice(0, 2).map((genre) => genre.name);
  const providersForUs = providers.results?.US?.flatrate?.slice(0, 5) || [];
  const poster = await fetchBuffer(`${imageBaseUrl}/w780${details.poster_path}`);
  const [logo, providerImages] = await Promise.all([
    readFile(resolve('assets/brand/90_M_Logo.svg')),
    Promise.all(providersForUs.map((provider) => fetchBuffer(`${imageBaseUrl}/w185${provider.logo_path}`).catch(() => null)))
  ]);

  const titleLayout = getTitleLayout(details.title);
  const { lines: titleLines, fontSize: titleFontSize, tracking: titleTracking } = titleLayout;
  const yearPillBottom = 199;
  const titleTop = yearPillBottom + 40;
  const titleLineHeight = titleFontSize + 14;
  const providerSvg = providerImages.map((image, index) => image
    ? `<clipPath id="provider-${index}"><circle cx="${846 + index * 118}" cy="813" r="40" /></clipPath><image href="${toDataUri(image)}" x="${806 + index * 118}" y="773" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#provider-${index})" />`
    : '').join('');
  const titleSvg = titleLines.map((line, index) => {
    const trackedCharacters = createTrackedCharacters(line, titleTracking);
    return `<text x="806" y="${titleTop + index * titleLineHeight}" class="title" dominant-baseline="hanging" xml:space="preserve">${trackedCharacters}</text>`;
  }).join('');
  const meta = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m • ${certification} • Director: ${director}`;
  const titleBottom = titleTop + ((titleLines.length - 1) * titleLineHeight) + titleFontSize;
  // Keep 60px between the title block and the extra movie information.
  const metadataTop = titleBottom + 60;
  const cardSvg = `<svg width="1680" height="945" viewBox="0 0 1680 945" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050608"/><stop offset=".48" stop-color="#183042"/><stop offset="1" stop-color="#159b82"/></linearGradient>
      <radialGradient id="glow" cx="0" cy="1" r=".75"><stop stop-color="#96002e"/><stop offset="1" stop-color="#96002e" stop-opacity="0"/></radialGradient>
      <style>.title { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: ${titleFontSize}px; font-weight: 900; } .copy { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: 28px; font-weight: 400; } .label { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: 23px; font-weight: 700; letter-spacing: 2px; }</style>
    </defs>
    <rect width="1680" height="945" fill="url(#background)"/><rect width="820" height="945" fill="url(#glow)"/>
    <rect x="158" y="64" width="560" height="816" rx="35" fill="none" stroke="#fff" stroke-width="4"/>
    <image href="${toDataUri(poster, 'image/jpeg')}" x="184" y="89" width="510" height="765" preserveAspectRatio="xMidYMid slice" clip-path="url(#poster-clip)"/>
    <clipPath id="poster-clip"><rect x="184" y="89" width="510" height="765" rx="31"/></clipPath>
    <rect x="806" y="129" width="136" height="70" rx="35" fill="#fff"/><text x="874" y="175" text-anchor="middle" fill="#111" font-family="Roboto Flex, Arial, sans-serif" font-size="35">${year}</text>
    ${titleSvg}
    <text x="806" y="${metadataTop}" class="copy" dominant-baseline="hanging">${xmlEscape(meta)}</text>
    <text x="806" y="708" class="label">WATCH IT ON</text><line x1="806" y1="746" x2="1602" y2="746" stroke="#fff" stroke-width="4"/>
    ${providerSvg || '<text x="806" y="817" class="copy">Check local availability</text>'}
    <image href="${toDataUri(logo, 'image/svg+xml')}" x="1502" y="68" width="112" height="112" />
  </svg>`;

  const postText = `${details.title} (${year})\nDirector: ${director}\nGenres: ${genres.join(', ')}\n${websiteUrl}/?movie=${details.id}`;
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, 'post.txt'), `${postText}\n`),
    sharp(Buffer.from(cardSvg)).png().toFile(resolve(outputDirectory, 'card.png')),
    writeFile(resolve(outputDirectory, 'movie.json'), `${JSON.stringify({ id: details.id, title: details.title, year, runtime: details.runtime, certification, director, genres, providers: providersForUs.map((provider) => provider.provider_name), postText, scheduledAt: process.env.SCHEDULE_AT || null }, null, 2)}\n`)
  ]);
  console.log(postText);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
