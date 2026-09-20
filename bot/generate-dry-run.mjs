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

const titleMaxWidth = 720;

const createTrackedCharacters = (line, tracking) => Array.from(line).map((character, characterIndex) => (
  `<tspan dx="${characterIndex === 0 ? 0 : tracking}">${xmlEscape(character)}</tspan>`
)).join('');

const measureTitleWidth = async (line, fontSize, tracking) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="220"><style>.title { fill: #fff; font-family: 'Roboto Flex', Arial, sans-serif; font-size: ${fontSize}px; font-weight: 900; }</style><text x="20" y="${fontSize + 20}" class="title" xml:space="preserve">${createTrackedCharacters(line, tracking)}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  return info.width;
};

const getTitleLineCandidates = (title) => {
  const words = title.split(/\s+/).filter(Boolean);
  const candidates = [[title]];
  for (let index = 1; index < words.length; index += 1) {
    candidates.push([words.slice(0, index).join(' '), words.slice(index).join(' ')]);
  }
  return candidates;
};

const getTitleLayout = async (title) => {
  const candidates = getTitleLineCandidates(title);
  for (let fontSize = 126; fontSize >= 64; fontSize -= 4) {
    const tracking = (fontSize * 0.02).toFixed(2);
    const measured = await Promise.all(candidates.map(async (lines) => ({
      lines,
      widths: await Promise.all(lines.map((line) => measureTitleWidth(line, fontSize, tracking)))
    })));
    const fitting = measured.filter(({ widths }) => widths.every((width) => width <= titleMaxWidth));
    if (fitting.length) {
      fitting.sort((first, second) => {
        if (first.lines.length !== second.lines.length) return first.lines.length - second.lines.length;
        return Math.max(...first.widths) - Math.max(...second.widths);
      });
      return { ...fitting[0], fontSize, tracking };
    }
  }
  const fontSize = 60;
  const tracking = (fontSize * 0.02).toFixed(2);
  return { lines: [title], widths: [await measureTitleWidth(title, fontSize, tracking)], fontSize, tracking };
};

const dateSeed = () => {
  const now = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return [...now].reduce((sum, character) => sum + character.charCodeAt(0), 0);
};

const selectionSeed = Number.parseInt(process.env.SELECTION_SEED || '', 10) || dateSeed();
const requestedMovieId = Number.parseInt(process.env.MOVIE_ID || '', 10);

const discoverMovie = async (seed) => {
  const discovery = await tmdbFetch('/discover/movie', {
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    'primary_release_date.lte': new Date().toISOString().slice(0, 10),
    'vote_count.gte': 25,
    'with_runtime.gte': 75,
    'with_runtime.lte': 105,
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
  const [details, credits, providers] = await Promise.all([
    tmdbFetch(`/movie/${candidate.id}`),
    tmdbFetch(`/movie/${candidate.id}/credits`),
    tmdbFetch(`/movie/${candidate.id}/watch/providers`)
  ]);

  const director = credits.crew.find((person) => person.job === 'Director')?.name || 'Unknown';
  const year = (details.release_date || candidate.release_date || '').slice(0, 4) || '—';
  const genres = details.genres.slice(0, 2).map((genre) => genre.name);
  const providersForUs = providers.results?.US?.flatrate?.slice(0, 5) || [];
  const poster = await fetchBuffer(`${imageBaseUrl}/w780${details.poster_path}`);
  const [logo, providerImages] = await Promise.all([
    readFile(resolve('assets/brand/90_M_Logo.svg')),
    Promise.all(providersForUs.map((provider) => fetchBuffer(`${imageBaseUrl}/w185${provider.logo_path}`).catch(() => null)))
  ]);

  const titleLayout = await getTitleLayout(details.title);
  const { lines: titleLines, fontSize: titleFontSize, tracking: titleTracking } = titleLayout;
  const titleY = titleLines.length === 1 ? 360 : 324;
  const providerSvg = providerImages.map((image, index) => image
    ? `<clipPath id="provider-${index}"><circle cx="${846 + index * 118}" cy="813" r="40" /></clipPath><image href="${toDataUri(image)}" x="${806 + index * 118}" y="773" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#provider-${index})" />`
    : '').join('');
  const titleSvg = titleLines.map((line, index) => {
    const trackedCharacters = createTrackedCharacters(line, titleTracking);
    return `<text x="806" y="${titleY + index * (titleFontSize + 14)}" class="title" xml:space="preserve">${trackedCharacters}</text>`;
  }).join('');
  const meta = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m • ${details.certification || 'NR'} • Director: ${director}`;
  const lastTitleBaseline = titleY + ((titleLines.length - 1) * (titleFontSize + 14));
  // The metadata baseline is 40px below the visual bottom of the final title line.
  const metadataY = lastTitleBaseline + 62;
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
    <text x="806" y="${metadataY}" class="copy">${xmlEscape(meta)}</text>
    <text x="806" y="708" class="label">WATCH IT ON</text><line x1="806" y1="746" x2="1602" y2="746" stroke="#fff" stroke-width="4"/>
    ${providerSvg || '<text x="806" y="817" class="copy">Check local availability</text>'}
    <image href="${toDataUri(logo, 'image/svg+xml')}" x="1502" y="68" width="112" height="112" />
  </svg>`;

  const postText = `${details.title} (${year})\nDirector: ${director}\nGenres: ${genres.join(', ')}\n${websiteUrl}/?movie=${details.id}`;
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, 'post.txt'), `${postText}\n`),
    sharp(Buffer.from(cardSvg)).png().toFile(resolve(outputDirectory, 'card.png')),
    writeFile(resolve(outputDirectory, 'movie.json'), `${JSON.stringify({ id: details.id, title: details.title, year, director, genres, providers: providersForUs.map((provider) => provider.provider_name), postText, scheduledAt: process.env.SCHEDULE_AT || null }, null, 2)}\n`)
  ]);
  console.log(postText);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
