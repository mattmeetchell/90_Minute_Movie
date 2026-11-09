import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readQueue } from './queue-utils.mjs';

const outputDirectory = resolve(process.env.BOT_X_OUTPUT_DIR || 'bot-x-assets');
const limit = Math.max(1, Math.min(62, Number.parseInt(process.env.BOT_X_LIMIT || '31', 10)));
const source = process.env.BOT_X_SOURCE || 'queued';
const startAfter = (process.env.BOT_X_START_AFTER || '').trim();

if (!['queued', 'posted', 'all'].includes(source)) {
  throw new Error('BOT_X_SOURCE must be queued, posted, or all.');
}

const directoryNameFor = (entry) => `${entry.date}-${String(entry.hour).padStart(2, '0')}-${entry.title
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
const normalizedTitle = (title) => title.trim().toLocaleLowerCase();

const main = async () => {
  const queue = await readQueue();
  const matchingEntries = queue.entries
    .filter((entry) => (source === 'all' ? ['queued', 'posted'].includes(entry.state) : entry.state === source))
    .sort((first, second) => `${first.date}-${first.hour}`.localeCompare(`${second.date}-${second.hour}`));
  let startIndex = 0;
  if (startAfter) {
    const matches = matchingEntries.filter((entry) => normalizedTitle(entry.title) === normalizedTitle(startAfter));
    if (matches.length !== 1) throw new Error(`Expected exactly one ${source} queue entry named "${startAfter}".`);
    startIndex = matchingEntries.indexOf(matches[0]) + 1;
  }
  const entries = matchingEntries.slice(startIndex, startIndex + limit);
  if (!entries.length) throw new Error('No queue entries matched the X export request.');

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const manifest = [];
  for (const entry of entries) {
    const directory = directoryNameFor(entry);
    const destination = resolve(outputDirectory, directory);
    const renderDirectory = resolve(outputDirectory, `.render-${directory}`);
    await mkdir(destination, { recursive: true });
    const render = spawnSync(process.execPath, ['bot/generate-dry-run.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOT_OUTPUT_DIR: renderDirectory,
        MOVIE_ID: String(entry.id),
        SCHEDULE_DATE: entry.date,
        SCHEDULE_AT: entry.slotLabel,
        BOT_CARD_THEME: entry.theme || queue.theme || 'standard'
      },
      encoding: 'utf8'
    });
    if (render.status !== 0) throw new Error(render.stderr || render.stdout || `Could not render ${entry.title}.`);
    await Promise.all([
      cp(resolve(renderDirectory, 'card.png'), resolve(destination, 'card-1680x945.png')),
      cp(resolve(renderDirectory, 'post.txt'), resolve(destination, 'post.txt')),
      cp(resolve(renderDirectory, 'movie.json'), resolve(destination, 'movie.json'))
    ]);
    await rm(renderDirectory, { recursive: true, force: true });
    manifest.push({ title: entry.title, scheduledAt: entry.slotLabel, directory });
  }
  await Promise.all([
    writeFile(resolve(outputDirectory, 'README.txt'), 'Each folder contains a 1680 x 945 X card, post copy, and metadata. This export never posts to X and does not edit the queue.\n'),
    writeFile(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), source, entries: manifest }, null, 2)}\n`)
  ]);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
