# 90 Minute Movie X bot

This folder is deliberately separate from the website. It contains the future X bot and its dry-run card generator.

## Dry run

The GitHub Action can be started manually. It uses TMDb to select a streamable US movie around 90 minutes and creates these downloadable artifacts:

- `card.png` — 1680 × 945 social image
- `post.txt` — the post copy
- `movie.json` — selection metadata for review

It does **not** publish to X or update the live website.

The workflow needs a `TMDB_API_KEY` or `TMDB_BEARER_TOKEN` GitHub Actions secret. X credentials are intentionally not used until publishing is explicitly enabled.
