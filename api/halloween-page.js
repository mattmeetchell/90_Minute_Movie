const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const siteUrl = 'https://www.90minutemovie.com';
const title = 'Halloween Movie Picks Under 90 Minutes | 90 Minute Movie';
const description = 'Find a spooky movie that fits your mood and your night. Explore Halloween-friendly picks around 90 minutes long.';

module.exports = async function halloweenPage(_request, response) {
  const indexHtml = await readFile(join(process.cwd(), 'index.html'), 'utf8');
  const html = indexHtml
    .replace('<title>90 Minute Movie Picker</title>', `<title>${title}</title>`)
    .replaceAll('content="Choose your favorite genre, choose your era, and get a comfy 90 minute movie."', `content="${description}"`)
    .replace('<link rel="canonical" href="https://www.90minutemovie.com/" />', `<link rel="canonical" href="${siteUrl}/halloween-movies" />`)
    .replace('<meta property="og:title" content="90 Minute Movie Picker" />', `<meta property="og:title" content="${title}" />`)
    .replace('<meta name="twitter:title" content="90 Minute Movie Picker" />', `<meta name="twitter:title" content="${title}" />`);

  response
    .status(200)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
    .send(html);
};
