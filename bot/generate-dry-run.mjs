import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { getCardTheme } from './card-themes.mjs';
import { createTrackedCharacters, getSquareTitleLayout, getTitleLayout } from './card-layout.mjs';

const outputDirectory = resolve(process.env.BOT_OUTPUT_DIR || 'bot-output');
const tmdbBaseUrl = 'https://api.themoviedb.org/3';
const imageBaseUrl = 'https://image.tmdb.org/t/p';
const websiteUrl = process.env.WEBSITE_URL || 'https://90minutemovie.com';
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbBearerToken = process.env.TMDB_BEARER_TOKEN;

if (!tmdbApiKey && !tmdbBearerToken) {
  throw new Error('Set TMDB_API_KEY or TMDB_BEARER_TOKEN before generating a bot preview.');
}

const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

const tmdbFetch = async (path, parameters = {}) => {
  const url = new URL(`${tmdbBaseUrl}${path}`);
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const headers = { accept: 'application/json' };
  if (tmdbBearerToken) headers.Authorization = `Bearer ${tmdbBearerToken}`;
  else url.searchParams.set('api_key', tmdbApiKey);

  const maxAttempts = 4;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) return response.json();

      // Transient upstream failures and rate limits should not discard an
      // entire month-long review run. All other responses remain fail-fast.
      if (response.status !== 429 && response.status < 500) {
        const error = new Error(`TMDb ${path} failed (${response.status}).`);
        error.nonRetryable = true;
        throw error;
      }
      lastError = new Error(`TMDb ${path} failed (${response.status}).`);
    } catch (error) {
      lastError = error;
      if (error.nonRetryable) throw error;
      if (attempt === maxAttempts - 1) break;
    }

    if (attempt < maxAttempts - 1) await wait(750 * (2 ** attempt));
  }

  throw lastError;
};

const fetchBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
};

const toDataUri = (buffer, contentType = 'image/png') => `data:${contentType};base64,${buffer.toString('base64')}`;
const xmlEscape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[character]);


const dateSeed = () => {
  const now = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return [...now].reduce((sum, character) => sum + character.charCodeAt(0), 0);
};

const selectionSeed = Number.parseInt(process.env.SELECTION_SEED || '', 10) || dateSeed();
const requestedMovieId = Number.parseInt(process.env.MOVIE_ID || '', 10);
const excludedMovieIds = new Set((process.env.BOT_EXCLUDED_MOVIE_IDS || '')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter(Number.isFinite));
const scheduledDate = process.env.SCHEDULE_DATE || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const avoidHorrorForThisSlot = /^\d{4}-09-/.test(scheduledDate);
const requireHorrorForThisSlot = process.env.REQUIRE_HORROR === '1';
const cardTheme = getCardTheme(process.env.BOT_CARD_THEME);
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
    with_genres: requireHorrorForThisSlot ? '27' : undefined,
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

const movieReleaseTimestamp = (movie) => {
  if (!movie?.release_date) return 0;
  const timestamp = Date.parse(`${movie.release_date}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const looksLikeNumberedSequel = (title = '') => {
  const normalizedTitle = title.normalize().trim();
  return (
    /\b(?:part|chapter|volume|vol\.?)\s*(?:[2-9]|\d{2,}|ii|iii|iv|v|vi|vii|viii|ix|x)\b/i.test(normalizedTitle)
    || /(?:\s|:)(?:[2-9]|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(normalizedTitle)
  );
};

// Match the served site's policy: choose only the first released film in a
// collection, with a title-pattern fallback for titles outside collections.
const isEligibleFranchiseEntry = async (details) => {
  const collectionId = details.belongs_to_collection?.id;
  if (!collectionId) return !looksLikeNumberedSequel(details.title);

  try {
    const collection = await tmdbFetch(`/collection/${collectionId}`, { language: 'en-US' });
    const candidateRelease = movieReleaseTimestamp(details);
    if (!candidateRelease) return !looksLikeNumberedSequel(details.title);

    const hasEarlierInstallment = (collection.parts || []).some((part) => {
      if (String(part.id) === String(details.id)) return false;
      const partRelease = movieReleaseTimestamp(part);
      return partRelease && partRelease < candidateRelease;
    });
    return !hasEarlierInstallment;
  } catch (error) {
    console.warn(`Could not verify collection order for "${details.title}".`, error.message);
    return !looksLikeNumberedSequel(details.title);
  }
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
  const leadCast = credits.cast.slice(0, 4).map((person) => person.name).filter(Boolean);
  const year = (details.release_date || candidate.release_date || '').slice(0, 4) || '—';
  const isHorror = details.genres.some((genre) => genre.id === 27);
  const hasTargetRuntime = details.runtime >= (isOccasionalLongPick ? 103 : 90)
    && details.runtime <= (isOccasionalLongPick ? 105 : 102);
  if (!requestedMovieId && (
    !hasTargetRuntime
    || excludedMovieIds.has(details.id)
    || (avoidHorrorForThisSlot && isHorror)
    || (requireHorrorForThisSlot && !isHorror)
    || !await isEligibleFranchiseEntry(details)
  )) {
    throw new Error(`Movie ${details.id} does not meet this slot's selection policy.`);
  }
  const usReleaseDates = releaseDates.results?.find((release) => release.iso_3166_1 === 'US')?.release_dates || [];
  const certification = usReleaseDates.find((release) => release.certification)?.certification || 'NR';
  const genreNames = details.genres.map((genre) => genre.name);
  const genres = isHorror
    ? ['Horror', ...genreNames.filter((genre) => genre !== 'Horror')].slice(0, 2)
    : genreNames.slice(0, 2);
  const providersForUs = providers.results?.US?.flatrate?.slice(0, 5) || [];
  const poster = await fetchBuffer(`${imageBaseUrl}/w780${details.poster_path}`);
  const [logo, bluRayIcon, providerImages, instagramPosterTemplate, instagramDetailsTemplate] = await Promise.all([
    readFile(resolve('assets/brand/90_M_Logo.svg')),
    readFile(resolve('assets/media/Blu-ray.svg')),
    Promise.all(providersForUs.map((provider) => fetchBuffer(`${imageBaseUrl}/w185${provider.logo_path}`).catch(() => null))),
    readFile(resolve('bot/templates/instagram-poster-template.png')),
    readFile(resolve('bot/templates/instagram-details-template.png'))
  ]);

  const titleLayout = getTitleLayout(details.title);
  const { lines: titleLines, fontSize: titleFontSize, tracking: titleTracking } = titleLayout;
  const yearPillBottom = 199;
  const titleTop = yearPillBottom + 80;
  const titleLineHeight = titleFontSize + 14;
  const providerSvg = providerImages.map((image, index) => image
    ? `<clipPath id="provider-${index}"><circle cx="${846 + index * 118}" cy="813" r="40" /></clipPath><image href="${toDataUri(image)}" x="${806 + index * 118}" y="773" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#provider-${index})" />`
    : '').join('');
  const availabilitySvg = providerSvg || `<image href="${toDataUri(bluRayIcon, 'image/svg+xml')}" x="806" y="773" width="80" height="80" />`;
  const titleSvg = titleLines.map((line, index) => {
    const trackedCharacters = createTrackedCharacters(line, titleTracking, xmlEscape);
    return `<text x="806" y="${titleTop + index * titleLineHeight}" class="title" dominant-baseline="hanging" xml:space="preserve">${trackedCharacters}</text>`;
  }).join('');
  const meta = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m • ${certification} • Director: ${director}`;
  const titleBottom = titleTop + ((titleLines.length - 1) * titleLineHeight) + titleFontSize;
  // Keep 60px between the title block and the extra movie information.
  const metadataTop = titleBottom + 60;
  const cardSvg = `<svg width="1680" height="945" viewBox="0 0 1680 945" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${cardTheme.svgDefinitions}
      <style>.title { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: ${titleFontSize}px; font-weight: 900; } .copy { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: 28px; font-weight: 400; } .label { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: 23px; font-weight: 700; letter-spacing: 2px; }</style>
    </defs>
    ${cardTheme.svgLayers}
    <rect x="158" y="64" width="560" height="816" rx="35" fill="none" stroke="#fff" stroke-width="4"/>
    <image href="${toDataUri(poster, 'image/jpeg')}" x="184" y="89" width="510" height="765" preserveAspectRatio="xMidYMid slice" clip-path="url(#poster-clip)"/>
    <clipPath id="poster-clip"><rect x="184" y="89" width="510" height="765" rx="31"/></clipPath>
    <rect x="806" y="129" width="136" height="70" rx="35" fill="#fff"/><text x="874" y="175" text-anchor="middle" fill="#111" font-family="Roboto Flex, Arial, sans-serif" font-size="35">${year}</text>
    ${titleSvg}
    <text x="806" y="${metadataTop}" class="copy" dominant-baseline="hanging">${xmlEscape(meta)}</text>
    <text x="806" y="708" class="label">WATCH IT ON</text><line x1="806" y1="746" x2="1602" y2="746" stroke="#fff" stroke-width="4"/>
    ${availabilitySvg}
    <image href="${toDataUri(logo, 'image/svg+xml')}" x="1502" y="68" width="112" height="112" />
  </svg>`;

  const squareTitle = getSquareTitleLayout(details.title);
  const squareTitleSvg = squareTitle.lines.map((line, index) => (
    `<text x="84" y="${272 + index * (squareTitle.fontSize + 18)}" class="square-title" dominant-baseline="hanging" xml:space="preserve">${createTrackedCharacters(line, squareTitle.tracking, xmlEscape)}</text>`
  )).join('');
  const squareProviderSvg = providerImages.filter(Boolean).slice(0, 5).map((image, index) => {
    const size = 96;
    const gap = 56;
    const x = 84 + index * (size + gap);
    const y = 902;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    return `<clipPath id="square-provider-${index}"><circle cx="${centerX}" cy="${centerY}" r="48"/></clipPath><image href="${toDataUri(image)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#square-provider-${index})"/>`;
  }).join('');
  const instagramPosterLayer = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg"><clipPath id="instagram-poster"><rect x="254" y="112" width="574" height="858" rx="30"/></clipPath><image href="${toDataUri(poster, 'image/jpeg')}" x="254" y="112" width="574" height="858" preserveAspectRatio="xMidYMid slice" clip-path="url(#instagram-poster)"/></svg>`;
  const instagramDetailsLayer = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <defs><style>.square-title{fill:#fff;font-family:'Roboto Flex',Arial,sans-serif;font-size:${squareTitle.fontSize}px;font-weight:900}.square-copy{fill:#fff;font-family:'Roboto Flex',Arial,sans-serif;font-size:22px;font-weight:400}.square-label{fill:#fff;font-family:'Roboto Flex',Arial,sans-serif;font-size:28px;font-weight:400;letter-spacing:2px}</style></defs>
    <rect x="84" y="145" width="120" height="58" rx="29" fill="#fff"/><text x="144" y="183" text-anchor="middle" fill="#111" font-family="Roboto Flex, Arial, sans-serif" font-size="29">${year}</text>
    ${squareTitleSvg}<text x="84" y="${272 + squareTitle.lines.length * (squareTitle.fontSize + 18) + 34}" class="square-copy">${xmlEscape(meta)}</text>
    <text x="84" y="820" class="square-label">WATCH IT ON</text><line x1="84" y1="872" x2="996" y2="872" stroke="#fff" stroke-width="4"/>${squareProviderSvg}
  </svg>`;

  const postText = `${details.title} (${year})\nDirector: ${director}\nGenres: ${genres.join(', ')}\n${websiteUrl}/?movie=${details.id}`;
  const instagramCaption = [
    `${details.title} (${year})`,
    `Director: ${director}`,
    `Starring: ${leadCast.join(', ') || 'Cast details unavailable'}`,
    `Genres: ${genres.join(', ')}`,
    details.overview || 'A 90-ish minute movie pick from 90 Minute Movie.',
    websiteUrl ? `${websiteUrl}/?movie=${details.id}` : ''
  ].filter(Boolean).join('\n\n');
  await mkdir(outputDirectory, { recursive: true });
  const files = [
    writeFile(resolve(outputDirectory, 'post.txt'), `${postText}\n`),
    sharp(Buffer.from(cardSvg)).png().toFile(resolve(outputDirectory, 'card.png')),
    writeFile(resolve(outputDirectory, 'movie.json'), `${JSON.stringify({ id: details.id, title: details.title, year, runtime: details.runtime, certification, director, genres, providers: providersForUs.map((provider) => provider.provider_name), postText, scheduledAt: process.env.SCHEDULE_AT || null, theme: cardTheme.name }, null, 2)}\n`)
  ];
  if (process.env.BOT_EXPORT_INSTAGRAM === '1') {
    files.push(
      sharp(instagramPosterTemplate).resize(1080, 1080).composite([{ input: Buffer.from(instagramPosterLayer) }]).png().toFile(resolve(outputDirectory, 'instagram-poster-1080x1080.png')),
      sharp(instagramDetailsTemplate).resize(1080, 1080).composite([{ input: Buffer.from(instagramDetailsLayer) }]).png().toFile(resolve(outputDirectory, 'instagram-details-1080x1080.png')),
      writeFile(resolve(outputDirectory, 'instagram-caption.txt'), `${instagramCaption}\n`)
    );
  }
  await Promise.all(files);
  console.log(postText);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
