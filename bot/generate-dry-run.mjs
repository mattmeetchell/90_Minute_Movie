import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const outputDirectory = resolve('bot-output');
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

const wrapTitle = (title) => {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length < 2 || title.length < 20) return [title];
  let best = [title];
  let bestDifference = Infinity;
  for (let index = 1; index < words.length; index += 1) {
    const candidate = [words.slice(0, index).join(' '), words.slice(index).join(' ')];
    const difference = Math.abs(candidate[0].length - candidate[1].length);
    if (difference < bestDifference) {
      best = candidate;
      bestDifference = difference;
    }
  }
  return best;
};

const dateSeed = () => {
  const now = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return [...now].reduce((sum, character) => sum + character.charCodeAt(0), 0);
};

const discoverMovie = async () => {
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
    page: (dateSeed() % 5) + 1
  });
  const candidates = discovery.results.filter((movie) => movie.poster_path && movie.release_date);
  if (!candidates.length) throw new Error('No eligible movie was returned by TMDb.');
  return candidates[dateSeed() % candidates.length];
};

const main = async () => {
  const candidate = await discoverMovie();
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

  const titleLines = wrapTitle(details.title);
  const titleFontSize = titleLines.some((line) => line.length > 18) ? 105 : 126;
  const titleY = titleLines.length === 1 ? 360 : 324;
  const providerSvg = providerImages.map((image, index) => image
    ? `<clipPath id="provider-${index}"><circle cx="${846 + index * 118}" cy="813" r="40" /></clipPath><image href="${toDataUri(image)}" x="${806 + index * 118}" y="773" width="80" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#provider-${index})" />`
    : '').join('');
  const titleTracking = (titleFontSize * 0.02).toFixed(2);
  const titleSvg = titleLines.map((line, index) => `<text x="806" y="${titleY + index * (titleFontSize + 14)}" class="title" letter-spacing="${titleTracking}px">${xmlEscape(line)}</text>`).join('');
  const meta = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m • ${details.certification || 'NR'} • Director: ${director}`;
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
    <text x="806" y="611" class="copy">${xmlEscape(meta)}</text>
    <text x="806" y="708" class="label">WATCH IT ON</text><line x1="806" y1="746" x2="1602" y2="746" stroke="#fff" stroke-width="4"/>
    ${providerSvg || '<text x="806" y="817" class="copy">Check local availability</text>'}
    <image href="${toDataUri(logo, 'image/svg+xml')}" x="1502" y="68" width="112" height="112" />
  </svg>`;

  const postText = `${details.title} (${year})\nDirector: ${director}\nGenres: ${genres.join(', ')}\n${websiteUrl}/?movie=${details.id}`;
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, 'post.txt'), `${postText}\n`),
    sharp(Buffer.from(cardSvg)).png().toFile(resolve(outputDirectory, 'card.png')),
    writeFile(resolve(outputDirectory, 'movie.json'), `${JSON.stringify({ id: details.id, title: details.title, year, director, genres, providers: providersForUs.map((provider) => provider.provider_name), postText }, null, 2)}\n`)
  ]);
  console.log(postText);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
