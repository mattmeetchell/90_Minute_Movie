# 90 Minute Movie Picker

A static TMDb-powered movie picker for finding movies around 90 minutes, with genre and decade filters plus a private personal-list flow.

## Files

- `index.html` - app markup
- `styles.css` - visual system, responsive layout, and animations
- `script.js` - TMDb fetching, filters, result rendering, and interactions
- `api/tmdb.js` - Vercel serverless proxy for TMDb requests
- `api/lists.js` - anonymous saved-list API for private list links
- `personal-movies.js` - private movie feed used by the hidden footer flow
- `assets/` - logos, media icons, and genre artwork
- `vercel.json` - static hosting config for Vercel

## Local Preview

Opening `index.html` directly works for layout-only UI testing. TMDb requests now go through a Vercel API route so the API key is not exposed in browser code.

For local static layout preview:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

For full TMDb API testing, use Vercel's local dev server and a local env file:

```bash
TMDB_API_KEY=your_tmdb_key vercel dev
```

For saved-list link testing without cloud storage, run `local-preview-server.js`; it includes an in-memory `/api/lists` store that resets when the server restarts.

```bash
TMDB_API_KEY=your_tmdb_key PORT=8004 node local-preview-server.js
```

## Deploy To Vercel

### Option 1: Vercel Dashboard

1. Push this folder to a GitHub repo.
2. In Vercel, choose `Add New... -> Project`.
3. Import the repo.
4. Framework Preset: `Other`.
5. Build Command: leave blank.
6. Output Directory: leave blank.
7. Add an Environment Variable named `TMDB_API_KEY` with your TMDb API key.
8. Add saved-list storage variables from Vercel KV or Upstash Redis: `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
9. Deploy.

### Option 2: Vercel CLI

From this folder:

```bash
vercel
```

For production:

```bash
vercel --prod
```

Then add `TMDB_API_KEY` in the Vercel project settings under `Settings -> Environment Variables`.

## MVP Notes

- TMDb requests are routed through `/api/tmdb`, so the TMDb key should live in Vercel Environment Variables and should not be committed to GitHub.
- Saved list links are routed through `/api/lists`, so KV/Redis REST credentials should live in Vercel Environment Variables and should not be committed to GitHub.
- The private flow password is an affordance, not real security. Anyone inspecting source can find it.
- For a more secure future version, move the private list and password check behind a serverless API route too.
