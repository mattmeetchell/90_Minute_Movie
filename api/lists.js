const LIST_KEY_PREFIX = 'movie-list:';
const LIST_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_SAVED_MOVIES = 200;
const { randomBytes } = require('crypto');

function json(response, status, body) {
  response
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Cache-Control', 'no-store')
    .json(body);
}

function getKvConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}

async function kvCommand(command) {
  const { url, token } = getKvConfig();

  if (!url || !token) {
    const error = new Error('List storage is not configured.');
    error.status = 501;
    throw error;
  }

  const kvResponse = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  const body = await kvResponse.json().catch(() => ({}));
  if (!kvResponse.ok || body.error) {
    const error = new Error(body.error || 'List storage request failed.');
    error.status = 502;
    throw error;
  }

  return body.result;
}

function createListId() {
  return Array.from(randomBytes(12))
    .map((byte) => byte.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 18);
}

function normalizeListId(id) {
  return typeof id === 'string' && /^[a-z0-9_-]{8,48}$/i.test(id) ? id : '';
}

function normalizeMovies(movies) {
  if (!Array.isArray(movies)) return [];

  return movies
    .filter((movie) => movie && movie.id && movie.title)
    .slice(0, MAX_SAVED_MOVIES)
    .map((movie) => ({
      id: movie.id,
      title: String(movie.title).slice(0, 180),
      poster_path: movie.poster_path ? String(movie.poster_path).slice(0, 220) : '',
      release_date: movie.release_date ? String(movie.release_date).slice(0, 24) : '',
      runtime: Number.isFinite(movie.runtime) ? movie.runtime : null,
      genres: Array.isArray(movie.genres)
        ? movie.genres.slice(0, 8).map((genre) => ({
          id: genre.id || '',
          name: genre.name ? String(genre.name).slice(0, 80) : ''
        })).filter((genre) => genre.name)
        : [],
      savedAt: movie.savedAt || new Date().toISOString()
    }));
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;

  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 250000) {
        reject(new Error('List payload is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    request.on('error', reject);
  });
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const id = normalizeListId(request.query.id);
      if (!id) return json(response, 400, { error: 'Missing or invalid list id.' });

      const storedList = await kvCommand(['GET', `${LIST_KEY_PREFIX}${id}`]);
      if (!storedList) return json(response, 404, { error: 'List not found.' });

      const list = typeof storedList === 'string' ? JSON.parse(storedList) : storedList;
      return json(response, 200, { id, movies: normalizeMovies(list.movies), updatedAt: list.updatedAt || null });
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      const id = normalizeListId(body.id) || createListId();
      const movies = normalizeMovies(body.movies);
      const updatedAt = new Date().toISOString();

      await kvCommand(['SET', `${LIST_KEY_PREFIX}${id}`, JSON.stringify({ movies, updatedAt }), 'EX', LIST_TTL_SECONDS]);
      return json(response, 200, { id, movies, updatedAt });
    }

    response.setHeader('Allow', 'GET, POST');
    return json(response, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || 'List request failed.' });
  }
};
