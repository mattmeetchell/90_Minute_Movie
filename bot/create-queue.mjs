import { resolve } from 'node:path';
import { addDays, draftToQueueEntry, easternToday, generateDrafts, writeQueue } from './queue-utils.mjs';

const days = Math.max(1, Math.min(31, Number.parseInt(process.env.BOT_QUEUE_DAYS || '14', 10)));
const startDate = process.env.BOT_QUEUE_START_DATE || addDays(easternToday(), 1);
const outputDirectory = resolve('.bot-queue-build');

const drafts = await generateDrafts({ startDate, days, outputDirectory });
const queue = {
  version: 1,
  timeZone: 'America/New_York',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entries: drafts.map((draft) => draftToQueueEntry(draft))
};

await writeQueue(queue);
console.log(`Created ${queue.entries.length} queued posts starting ${startDate}.`);
