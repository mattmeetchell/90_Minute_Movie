import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const batchDirectory = resolve(process.env.BOT_BATCH_OUTPUT_DIR || 'bot-review-batch');
const days = Math.max(1, Math.min(31, Number.parseInt(process.env.BOT_BATCH_DAYS || '14', 10)));
const slots = [12, 20];
const maxAttemptsPerSlot = 12;
const seedBase = Number.parseInt(process.env.SELECTION_SEED || '', 10) || Date.now();

const htmlEscape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[character]);

const easternToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const addDays = (date, offset) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};

const startDate = process.env.BOT_BATCH_START_DATE || addDays(easternToday(), 1);
const formatSlot = (date, hour) => {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long' }).format(new Date(`${date}T12:00:00Z`));
  const monthDay = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00Z`));
  return `${weekday}, ${monthDay} · ${hour === 12 ? '12:00 PM' : '8:00 PM'} ET`;
};

const main = async () => {
  await rm(batchDirectory, { recursive: true, force: true });
  await mkdir(resolve(batchDirectory, 'drafts'), { recursive: true });
  const usedMovieIds = new Set();
  const drafts = [];
  let slotIndex = 0;

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const date = addDays(startDate, dayOffset);
    for (const hour of slots) {
      const slotLabel = formatSlot(date, hour);
      const draftId = String(slotIndex + 1).padStart(2, '0');
      const draftDirectory = resolve(batchDirectory, 'drafts', draftId);
      let movie;

      for (let attempt = 0; attempt < maxAttemptsPerSlot; attempt += 1) {
        await rm(draftDirectory, { recursive: true, force: true });
        const result = spawnSync(process.execPath, ['bot/generate-dry-run.mjs'], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            BOT_OUTPUT_DIR: draftDirectory,
            SCHEDULE_AT: slotLabel,
            SELECTION_SEED: String(seedBase + (slotIndex * 37) + attempt)
          },
          encoding: 'utf8'
        });
        if (result.status !== 0) throw new Error(result.stderr || result.stdout || `Failed to create draft ${draftId}.`);
        movie = JSON.parse(await readFile(resolve(draftDirectory, 'movie.json'), 'utf8'));
        if (movie.providers.length && !usedMovieIds.has(movie.id)) break;
        movie = null;
      }

      if (!movie) throw new Error(`Could not find a unique streaming movie for ${slotLabel}.`);
      usedMovieIds.add(movie.id);
      drafts.push({ ...movie, draftId, date, hour, slotLabel, cardPath: `drafts/${draftId}/card.png` });
      slotIndex += 1;
    }
  }

  const cards = drafts.map((draft) => `<article class="draft">
    <img src="${draft.cardPath}" alt="${htmlEscape(draft.title)} card" />
    <div class="draft-copy"><p class="slot">${htmlEscape(draft.slotLabel)}</p><h2>${htmlEscape(draft.title)} <span>(${htmlEscape(draft.year)})</span></h2><p class="providers">${htmlEscape(draft.providers.join(' · '))}</p><pre>${htmlEscape(draft.postText)}</pre><p class="reroll">Reroll ID: <strong>${draft.draftId}</strong></p></div>
  </article>`).join('');
  const gallery = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>90 Minute Movie — Draft review</title><style>body{margin:0;background:#06080b;color:#f8f8f8;font:16px/1.45 Arial,sans-serif}header{padding:48px max(24px,calc((100vw - 1200px)/2));background:linear-gradient(120deg,#050608,#153b49 55%,#158d78)}h1{margin:0;font-size:42px}header p{max-width:680px;color:#d5dedf}.grid{max-width:1200px;margin:0 auto;padding:32px 24px 64px;display:grid;gap:24px}.draft{overflow:hidden;border:1px solid #526167;border-radius:18px;background:#11171a}.draft img{display:block;width:100%;background:#000}.draft-copy{padding:20px}.slot{margin:0 0 8px;color:#8ff0cf;font-weight:700}.draft h2{margin:0;font-size:28px}.draft h2 span{font-weight:400;color:#b8c1c4}.providers{color:#b8c1c4}pre{white-space:pre-wrap;margin:18px 0;padding:16px;border-radius:10px;background:#070a0b;font:14px/1.5 ui-monospace,monospace}.reroll{margin:0;color:#e8d598}@media(min-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style></head><body><header><h1>Two-week draft review</h1><p>${drafts.length} scheduled draft posts. Review the card and copy for each slot; note the reroll ID for anything you would like replaced. Nothing in this package is published to X.</p></header><main class="grid">${cards}</main></body></html>`;

  await Promise.all([
    writeFile(resolve(batchDirectory, 'review.html'), gallery),
    writeFile(resolve(batchDirectory, 'queue.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), startDate, drafts }, null, 2)}\n`)
  ]);
  console.log(`Created ${drafts.length} review drafts in ${batchDirectory}.`);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
