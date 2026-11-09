import { resolve } from 'node:path';
import { generateDrafts, readQueue, writeQueue } from './queue-utils.mjs';

const decemberPrefix = '2026-12-';
// December's seasonal catalog is smaller once duplicate, franchise, runtime,
// and US streaming-availability rules are applied, so allow a deeper search.
process.env.BOT_MAX_ATTEMPTS_PER_SLOT = '180';
const fixedSlots = {
  // Christmas Eve is a deliberate editorial pick; it remains valid even if
  // TMDb's live US flatrate listing is temporarily unavailable.
  '2026-12-24-12': 287903,
  // Preserve a recognizable post-holiday pick when the automated catalog is
  // exhausted by the month-long uniqueness constraint.
  '2026-12-26-12': 9647,
  // Curated final-week holiday run. These are editorially approved even when
  // current US flatrate availability is absent or changing in TMDb.
  '2026-12-27-12': 10439,
  '2026-12-28-12': 2064,
  '2026-12-29-12': 9021,
  '2026-12-30-12': 104,
  '2026-12-31-12': 639
};
const queue = await readQueue();
const retainedEntries = queue.entries.filter((entry) => !entry.date.startsWith(decemberPrefix));
const excludedMovieIds = new Set(retainedEntries.map((entry) => entry.id));
const drafts = await generateDrafts({
  startDate: '2026-12-01',
  days: 31,
  outputDirectory: resolve('bot-december-2026-review'),
  keepOutput: true,
  theme: 'standard',
  excludedMovieIds,
  fixedSlots,
  hours: [12]
});
const decemberDrafts = drafts.filter((draft) => draft.date.startsWith(decemberPrefix));

if (decemberDrafts.length !== 31) {
  throw new Error(`Expected 31 December drafts; found ${decemberDrafts.length}.`);
}

queue.entries = [...retainedEntries, ...decemberDrafts.map((draft) => ({
  ...draft,
  state: 'queued',
  source: 'automatic-december-2026',
  postedAt: null,
  tweetId: null,
  tweetUrl: null
}))].sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
delete queue.autoReplenishUntil;
queue.updatedAt = new Date().toISOString();

await writeQueue(queue);
console.log(`Added ${decemberDrafts.length} standard December posts and re-enabled automatic replenishment after December.`);
