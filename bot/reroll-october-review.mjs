import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceDirectory = resolve(process.env.BOT_REROLL_SOURCE || 'bot-october-review');
const outputDirectory = resolve(process.env.BOT_REROLL_OUTPUT || 'bot-october-reroll-review');
const rerollIds = new Set((process.env.BOT_REROLL_IDS || '').split(',').map((value) => value.trim()).filter(Boolean));
const maxAttemptsPerSlot = 60;
const seedBase = Number.parseInt(process.env.SELECTION_SEED || '', 10) || Date.now();

if (!rerollIds.size) throw new Error('Set BOT_REROLL_IDS to the comma-separated review IDs to replace.');

const htmlEscape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[character]);
const normalizeTitle = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const buildReviewHtml = (drafts) => {
  const cards = drafts.map((draft) => `<article class="draft">
    <img src="${draft.cardPath}" alt="${htmlEscape(draft.title)} card" />
    <div class="draft-copy"><p class="slot">${htmlEscape(draft.slotLabel)}</p><h2>${htmlEscape(draft.title)} <span>(${htmlEscape(draft.year)})</span></h2><p class="providers">${htmlEscape(draft.providers.join(' · '))}</p><pre>${htmlEscape(draft.postText)}</pre><p class="reroll">Reroll ID: <strong>${draft.draftId}</strong></p></div>
  </article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>90 Minute Movie — October reroll review</title><style>body{margin:0;background:#06080b;color:#f8f8f8;font:16px/1.45 Arial,sans-serif}header{padding:48px max(24px,calc((100vw - 1200px)/2));background:linear-gradient(120deg,#050608,#431006 55%,#bd4d08)}h1{margin:0;font-size:42px}header p{max-width:760px;color:#f4d7c6}.grid{max-width:1200px;margin:0 auto;padding:32px 24px 64px;display:grid;gap:24px}.draft{overflow:hidden;border:1px solid #7b5441;border-radius:18px;background:#17100d}.draft img{display:block;width:100%;background:#000}.draft-copy{padding:20px}.slot{margin:0 0 8px;color:#ffb072;font-weight:700}.draft h2{margin:0;font-size:28px}.draft h2 span{font-weight:400;color:#d9b9a9}.providers{color:#d9b9a9}pre{white-space:pre-wrap;margin:18px 0;padding:16px;border-radius:10px;background:#090604;font:14px/1.5 ui-monospace,monospace}.reroll{margin:0;color:#e8d598}@media(min-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style></head><body><header><h1>October 2026 reroll review</h1><p>${rerollIds.size} selected cards were regenerated using the Horror and no-sequels rules. Every other card is preserved from the original review package. Nothing in this package is published to X.</p></header><main class="grid">${cards}</main></body></html>`;
};

const canRetry = (output) => (
  output.includes("does not meet this slot's selection policy")
  || output.includes('No eligible movie was returned by TMDb.')
);

const sourceBatch = JSON.parse(await readFile(resolve(sourceDirectory, 'queue.json'), 'utf8'));
const drafts = sourceBatch.drafts;
const requestedDrafts = drafts.filter((draft) => rerollIds.has(draft.draftId));

if (requestedDrafts.length !== rerollIds.size) {
  const found = new Set(requestedDrafts.map((draft) => draft.draftId));
  const unknownIds = [...rerollIds].filter((draftId) => !found.has(draftId));
  throw new Error(`Could not find reroll IDs: ${unknownIds.join(', ')}`);
}

await rm(outputDirectory, { recursive: true, force: true });
await cp(sourceDirectory, outputDirectory, { recursive: true });
const preservedDrafts = drafts.filter((draft) => !rerollIds.has(draft.draftId));
const usedMovieIds = new Set(preservedDrafts.map((draft) => draft.id));
const usedTitles = new Set(preservedDrafts.map((draft) => normalizeTitle(draft.title)));

for (const [rerollIndex, original] of requestedDrafts.entries()) {
  const draftDirectory = resolve(outputDirectory, 'drafts', original.draftId);
  let replacement;

  for (let attempt = 0; attempt < maxAttemptsPerSlot; attempt += 1) {
    await rm(draftDirectory, { recursive: true, force: true });
    const result = spawnSync(process.execPath, ['bot/generate-dry-run.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOT_OUTPUT_DIR: draftDirectory,
        SCHEDULE_DATE: original.date,
        SCHEDULE_AT: original.slotLabel,
        BOT_CARD_THEME: 'october',
        REQUIRE_HORROR: '1',
        ALLOW_LONG_RUNTIME: (Number(original.draftId) - 1) % 5 === 4 ? '1' : '0',
        SELECTION_SEED: String(seedBase + (rerollIndex * 97) + attempt)
      },
      encoding: 'utf8'
    });
    const output = result.stderr || result.stdout || '';
    if (result.status !== 0) {
      if (canRetry(output)) continue;
      throw new Error(output || `Failed to reroll ${original.draftId}.`);
    }

    const movie = JSON.parse(await readFile(resolve(draftDirectory, 'movie.json'), 'utf8'));
    if (!movie.providers.length || usedMovieIds.has(movie.id) || usedTitles.has(normalizeTitle(movie.title))) continue;
    replacement = {
      ...original,
      ...movie,
      draftId: original.draftId,
      date: original.date,
      hour: original.hour,
      slotLabel: original.slotLabel,
      scheduledAt: original.scheduledAt,
      cardPath: original.cardPath
    };
    break;
  }

  if (!replacement) throw new Error(`Could not find a unique Horror replacement for reroll ID ${original.draftId}.`);
  usedMovieIds.add(replacement.id);
  usedTitles.add(normalizeTitle(replacement.title));
  const draftIndex = drafts.findIndex((draft) => draft.draftId === original.draftId);
  drafts[draftIndex] = replacement;
}

const queue = {
  version: 1,
  timeZone: 'America/New_York',
  theme: 'october',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entries: drafts.map((draft) => ({ ...draft, state: 'queued', source: 'automatic', postedAt: null, tweetId: null, tweetUrl: null }))
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, 'queue.json'), `${JSON.stringify({ ...sourceBatch, generatedAt: new Date().toISOString(), drafts }, null, 2)}\n`),
  writeFile(resolve(outputDirectory, 'candidate-queue.json'), `${JSON.stringify(queue, null, 2)}\n`),
  writeFile(resolve(outputDirectory, 'review.html'), buildReviewHtml(drafts))
]);

console.log(`Rerolled ${requestedDrafts.length} October cards in ${outputDirectory}.`);
