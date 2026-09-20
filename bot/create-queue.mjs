import { resolve } from 'node:path';
import { addDays, draftToQueueEntry, easternToday, generateDrafts, writeQueue } from './queue-utils.mjs';

const days = Math.max(1, Math.min(31, Number.parseInt(process.env.BOT_QUEUE_DAYS || '14', 10)));
const startDate = process.env.BOT_QUEUE_START_DATE || addDays(easternToday(), 1);
const outputDirectory = resolve(process.env.BOT_QUEUE_REVIEW_OUTPUT || 'bot-queue-review');
const queueTheme = process.env.BOT_QUEUE_THEME || 'standard';

const drafts = await generateDrafts({ startDate, days, outputDirectory, keepOutput: true, theme: queueTheme });
const queue = {
  version: 1,
  timeZone: 'America/New_York',
  theme: queueTheme,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entries: drafts.map((draft) => draftToQueueEntry(draft))
};

await writeQueue(queue);
console.log(`Created ${queue.entries.length} ${queueTheme} queued posts starting ${startDate}. Review files are in ${outputDirectory}.`);
