const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const VALID_SIZES = new Set(['w185', 'w780', 'original']);

module.exports = async function handler(request, response) {
  const imagePath = typeof request.query.path === 'string' ? request.query.path : '';
  const size = VALID_SIZES.has(request.query.size) ? request.query.size : 'w780';

  if (!imagePath.startsWith('/') || imagePath.includes('..')) {
    return response.status(400).json({ error: 'Missing or invalid image path.' });
  }

  try {
    const imageResponse = await fetch(`${TMDB_IMAGE_BASE_URL}${size}${imagePath}`);
    if (!imageResponse.ok) return response.status(imageResponse.status).end();

    response
      .status(200)
      .setHeader('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg')
      .setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return response.send(Buffer.from(await imageResponse.arrayBuffer()));
  } catch (error) {
    return response.status(502).json({ error: 'TMDb image request failed.' });
  }
};
