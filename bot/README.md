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

## Queue and publishing

The persistent queue is `bot-queue/queue.json`. It stores only metadata and
post state; cards are regenerated immediately before publishing so image files
do not accumulate in the repository.

- `npm run bot:queue:create` creates a new 14-day queue, starting tomorrow.
- `npm run bot:queue:replenish` tops the queue back up to 28 pending posts.
- `npm run bot:publish` finds the next due item and renders it. It exits safely
  unless `PUBLISH_ENABLED=true` is explicitly set.

The publisher needs these GitHub Actions secrets: `X_API_KEY`,
`X_API_SECRET`, `X_ACCESS_TOKEN`, and `X_ACCESS_TOKEN_SECRET`. The X app and
the access token must have Read and Write permission.

## Instagram assets

`Movie bot Instagram assets` is manual-only. It turns the next queued movies
into a pair of 1080 × 1080 images at 2× export resolution (2160 × 2160): the poster card and the matching details /
availability card, plus the caption. It never posts to Instagram or edits the
queue. In the Action, choose `posted` to generate older Twitter-published
entries in chronological order for an Instagram catch-up batch, or `all` to
include both posted and upcoming queue entries.

`workflow-templates/` contains the two GitHub Actions workflows needed to
initialize the queue and publish it. They are templates because workflow
changes must be added through the repository's GitHub workflow editor in this
setup. Copy them into `.github/workflows/` when enabling the bot.
