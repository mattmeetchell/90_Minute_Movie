import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const queueFile = resolve(process.env.BOT_QUEUE_FILE || 'bot-queue/queue.json');
export const easternTimeZone = 'America/New_York';

const dateParts = (date = new Date()) => Object.fromEntries(new Intl.DateTimeFormat('en-US', {
  timeZone: easternTimeZone,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
}).formatToParts(date).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));

export const easternToday = () => {
  const parts = dateParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const easternNow = () => {
  const parts = dateParts();
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
};

export const addDays = (date, offset) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};

export const readQueue = async () => JSON.parse(await readFile(queueFile, 'utf8'));

export const writeQueue = async (queue) => {
  await mkdir(resolve(queueFile, '..'), { recursive: true });
  await writeFile(queueFile, `${JSON.stringify(queue, null, 2)}\n`);
};

export const draftToQueueEntry = (draft, source = 'automatic') => ({
  ...draft,
  state: 'queued',
  source,
  postedAt: null,
  tweetId: null,
  tweetUrl: null
});

export const generateDrafts = async ({ startDate, days, outputDirectory }) => {
  await rm(outputDirectory, { recursive: true, force: true });
  const result = spawnSync(process.execPath, ['bot/generate-review-batch.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BOT_BATCH_OUTPUT_DIR: outputDirectory,
      BOT_BATCH_START_DATE: startDate,
      BOT_BATCH_DAYS: String(days)
    },
    encoding: 'utf8'
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Could not generate queue drafts.');
  const batch = JSON.parse(await readFile(resolve(outputDirectory, 'queue.json'), 'utf8'));
  await rm(outputDirectory, { recursive: true, force: true });
  return batch.drafts;
};
