import { resolve } from 'node:path';
import { generateDrafts, readQueue, writeQueue } from './queue-utils.mjs';

const novemberPrefix = '2026-11-';
const fixedSlots = {
  // Editorial Thanksgiving Day pick, scheduled for the daytime post.
  '2026-11-26-12': 1071215
};
const queue = await readQueue();
const retainedEntries = queue.entries.filter((entry) => !entry.date.startsWith(novemberPrefix));
const excludedMovieIds = new Set(retainedEntries.map((entry) => entry.id));
const drafts = await generateDrafts({
  startDate: '2026-11-01',
  days: 30,
  outputDirectory: resolve('bot-november-2026-review'),
  keepOutput: true,
  theme: 'standard',
  excludedMovieIds,
  fixedSlots,
  hours: [12]
});
const novemberDrafts = drafts.filter((draft) => draft.date.startsWith(novemberPrefix));

if (novemberDrafts.length !== 30) {
  throw new Error(`Expected 30 November drafts; found ${novemberDrafts.length}.`);
}

const thanksgiving = novemberDrafts.find((draft) => draft.date === '2026-11-26' && draft.hour === 12);
if (thanksgiving?.id !== 1071215) {
  throw new Error('Thanksgiving Day must be pinned to Thanksgiving (2023), TMDB 1071215.');
}

queue.entries = [...retainedEntries, ...novemberDrafts.map((draft) => ({
  ...draft,
  state: 'queued',
  source: 'automatic-november-2026',
  postedAt: null,
  tweetId: null,
  tweetUrl: null
}))].sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
delete queue.autoReplenishUntil;
queue.updatedAt = new Date().toISOString();

await writeQueue(queue);
console.log(`Added ${novemberDrafts.length} standard November posts and re-enabled automatic replenishment after November.`);
