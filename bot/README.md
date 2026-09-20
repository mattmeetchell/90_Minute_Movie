# 90 Minute Movie X bot

This folder is deliberately separate from the website. It contains the future X bot and its dry-run card generator.

The workflow downloads the official Google Fonts release of Roboto Flex before
rendering, so exported cards use the same typeface as the served site without
adding a font binary to the repository.

## Dry run

The GitHub Action can be started manually. It uses TMDb to select a streamable US movie around 90 minutes and creates these downloadable artifacts:

- `card.png` — 1680 × 945 social image
- `post.txt` — the post copy
- `movie.json` — selection metadata for review

It does **not** publish to X or update the live website.

The workflow needs a `TMDB_API_KEY` or `TMDB_BEARER_TOKEN` GitHub Actions secret. X credentials are intentionally not used until publishing is explicitly enabled.

## Two-week review batch

`Movie bot review batch` creates two scheduled drafts per day (12 PM and 8 PM Eastern), starting tomorrow unless a date is supplied. Its artifact contains `review.html`, a browsable gallery of all cards and post copy, plus `queue.json` and the individual draft images. It never posts to X.
