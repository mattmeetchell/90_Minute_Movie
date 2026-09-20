import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { draftToQueueEntry, generateDrafts } from './queue-utils.mjs';

const startDate = '2026-10-01';
const days = 31;
const theme = 'october';
const outputDirectory = resolve(process.env.BOT_OCTOBER_REVIEW_OUTPUT || 'bot-october-review');

// These anchor the month. Every other slot remains selected by the regular
// availability and runtime rules, then can be reviewed before replacing a queue.
const fixedSlots = {
  '2026-10-01-12': 176,
  '2026-10-31-12': 23202,
  '2026-10-31-20': 948
};

const drafts = await generateDrafts({ startDate, days, outputDirectory, keepOutput: true, theme, fixedSlots });
const candidateQueue = {
  version: 1,
  timeZone: 'America/New_York',
  theme,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entries: drafts.map((draft) => draftToQueueEntry(draft))
};

await writeFile(
  resolve(outputDirectory, 'candidate-queue.json'),
  `${JSON.stringify(candidateQueue, null, 2)}\n`
);

console.log(
  `Created a review-only batch of ${candidateQueue.entries.length} October 2026 posts. `
  + `The live queue was not changed. Review files are in ${outputDirectory}.`
);
