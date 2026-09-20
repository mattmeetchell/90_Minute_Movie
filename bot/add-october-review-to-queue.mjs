import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readQueue, writeQueue } from './queue-utils.mjs';

const reviewDirectory = process.env.BOT_OCTOBER_APPROVED_REVIEW;

if (!reviewDirectory) {
  throw new Error('Set BOT_OCTOBER_APPROVED_REVIEW to the approved October review package directory.');
}

const candidateQueue = JSON.parse(await readFile(resolve(reviewDirectory, 'candidate-queue.json'), 'utf8'));
const octoberEntries = candidateQueue.entries.filter((entry) => entry.date.startsWith('2026-10-'));

if (octoberEntries.length !== 62) {
  throw new Error(`Expected 62 October entries in the approved package; found ${octoberEntries.length}.`);
}

const queue = await readQueue();
const retainedEntries = queue.entries.filter((entry) => !entry.date.startsWith('2026-10-'));
const queuedEntries = octoberEntries.map((entry) => ({
  ...entry,
  state: 'queued',
  source: 'approved-october-2026',
  postedAt: null,
  tweetId: null,
  tweetUrl: null
}));

queue.entries = [...retainedEntries, ...queuedEntries].sort((a, b) => (
  a.date.localeCompare(b.date) || a.hour - b.hour
));
queue.updatedAt = new Date().toISOString();
queue.autoReplenishUntil = '2026-09-30';

await writeQueue(queue);
console.log(`Added ${queuedEntries.length} approved October posts; preserved ${retainedEntries.length} existing queue entries.`);
