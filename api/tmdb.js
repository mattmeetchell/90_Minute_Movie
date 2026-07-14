const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

module.exports = async function handler(request, response) {
  const tmdbApiKey = process.env.TMDB_API_KEY;
  const tmdbBearerToken = process.env.TMDB_BEARER_TOKEN;
  const { path, ...params } = request.query;

  if (!path || Array.isArray(path) || !path.startsWith('/')) {
    return response.status(400).json({ error: 'Missing or invalid TMDb path.' });
  }

  if (!tmdbApiKey && !tmdbBearerToken) {
    return response.status(500).json({ error: 'TMDb credentials are not configured.' });
  }

  const tmdbUrl = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => tmdbUrl.searchParams.append(key, item));
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      tmdbUrl.searchParams.set(key, value);
    }
  });

  const headers = { accept: 'application/json' };
  if (tmdbBearerToken) {
    headers.Authorization = `Bearer ${tmdbBearerToken}`;
  } else {
    tmdbUrl.searchParams.set('api_key', tmdbApiKey);
  }

  try {
    const tmdbResponse = await fetch(tmdbUrl, { headers });
    const body = await tmdbResponse.text();

    response
      .status(tmdbResponse.status)
      .setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
      .setHeader('Content-Type', tmdbResponse.headers.get('content-type') || 'application/json')
      .send(body);
  } catch (error) {
    response.status(502).json({ error: 'TMDb request failed.' });
  }
};
