import { resolve } from 'node:path';
import { addDays, draftToQueueEntry, easternToday, generateDrafts, readQueue, writeQueue } from './queue-utils.mjs';

const targetEntries = Math.max(2, Number.parseInt(process.env.BOT_QUEUE_TARGET || '28', 10));
let queue;
try {
  queue = await readQueue();
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No queue exists yet. Initialize one before replenishing.');
    process.exit(0);
  }
  throw error;
}
const pendingEntries = queue.entries.filter((entry) => entry.state === 'queued');
const cutoffDate = queue.autoReplenishUntil;

if (pendingEntries.length >= targetEntries) {
  console.log(`Queue already has ${pendingEntries.length} pending posts; no replenishment needed.`);
  process.exit(0);
}

const lastScheduledDate = queue.entries.map((entry) => entry.date).sort().at(-1);
if (cutoffDate && lastScheduledDate >= cutoffDate) {
  console.log(`Queue replenishment stops at ${cutoffDate}; no new posts will be added.`);
  process.exit(0);
}

const startDate = lastScheduledDate ? addDays(lastScheduledDate, 1) : addDays(easternToday(), 1);
const needed = targetEntries - pendingEntries.length;
const outputDirectory = resolve('.bot-queue-replenish');
const drafts = await generateDrafts({ startDate, days: Math.ceil(needed / 2) + 3, outputDirectory, theme: queue.theme || 'standard' });
const seenMovieIds = new Set(queue.entries.map((entry) => entry.id));
const additions = drafts
  .filter((draft) => !seenMovieIds.has(draft.id) && (!cutoffDate || draft.date <= cutoffDate))
  .slice(0, needed);

if (additions.length < needed && !cutoffDate) {
  throw new Error(`Only found ${additions.length} unique additions; needed ${needed}.`);
}

if (additions.length === 0) {
  console.log(`No eligible posts available before the ${cutoffDate} cutoff.`);
  process.exit(0);
}

queue.entries.push(...additions.map((draft) => draftToQueueEntry(draft)));
queue.updatedAt = new Date().toISOString();
await writeQueue(queue);
console.log(`Added ${additions.length} posts; ${queue.entries.filter((entry) => entry.state === 'queued').length} remain queued.`);
