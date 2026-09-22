import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readQueue } from './queue-utils.mjs';

const outputDirectory = resolve(process.env.BOT_INSTAGRAM_OUTPUT_DIR || 'bot-instagram-assets');
const limit = Math.max(1, Math.min(28, Number.parseInt(process.env.BOT_INSTAGRAM_LIMIT || '14', 10)));
const source = process.env.BOT_INSTAGRAM_SOURCE || 'queued';
const startAfter = (process.env.BOT_INSTAGRAM_START_AFTER || '').trim();

if (!['queued', 'posted', 'all'].includes(source)) {
  throw new Error('BOT_INSTAGRAM_SOURCE must be queued, posted, or all.');
}

const directoryNameFor = (entry) => `${entry.date}-${String(entry.hour).padStart(2, '0')}-${entry.title
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const normalizedTitle = (title) => title.trim().toLocaleLowerCase();

const main = async () => {
  const queue = await readQueue();
  const matchingEntries = queue.entries.filter((entry) => (
    source === 'all' ? ['queued', 'posted'].includes(entry.state) : entry.state === source
  ))
    .sort((first, second) => `${first.date}-${first.hour}`.localeCompare(`${second.date}-${second.hour}`));
  let startIndex = 0;
  if (startAfter) {
    const matches = matchingEntries.filter((entry) => normalizedTitle(entry.title) === normalizedTitle(startAfter));
    if (!matches.length) throw new Error(`Could not find "${startAfter}" among the ${source} queue entries.`);
    if (matches.length > 1) throw new Error(`More than one ${source} queue entry is titled "${startAfter}". Use a unique title.`);
    startIndex = matchingEntries.indexOf(matches[0]) + 1;
  }
  const entries = matchingEntries.slice(startIndex, startIndex + limit);
  if (!entries.length) throw new Error(`There are no ${source === 'all' ? 'queued or posted' : source} movies to export for Instagram.`);

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
      env: { ...process.env, BOT_OUTPUT_DIR: renderDirectory, BOT_EXPORT_INSTAGRAM: '1', MOVIE_ID: String(entry.id), SCHEDULE_DATE: entry.date, SCHEDULE_AT: entry.slotLabel, BOT_CARD_THEME: entry.theme || queue.theme || 'standard' },
      encoding: 'utf8'
    });
    if (render.status !== 0) throw new Error(render.stderr || render.stdout || `Could not render ${entry.title}.`);
    await Promise.all([
      cp(resolve(renderDirectory, 'instagram-poster-1080x1080@2x.png'), resolve(destination, '01-poster-1080x1080@2x.png')),
      cp(resolve(renderDirectory, 'instagram-details-1080x1080@2x.png'), resolve(destination, '02-details-1080x1080@2x.png')),
      cp(resolve(renderDirectory, 'instagram-caption.txt'), resolve(destination, 'caption.txt')),
      cp(resolve(renderDirectory, 'movie.json'), resolve(destination, 'movie.json'))
    ]);
    await rm(renderDirectory, { recursive: true, force: true });
    manifest.push({ title: entry.title, scheduledAt: entry.slotLabel, directory });
  }
  await writeFile(resolve(outputDirectory, 'README.txt'), 'Each folder contains the two ordered 1080 x 1080 Instagram images at 2× export resolution (2160 x 2160), plus the matching caption. This export never posts to Instagram and never changes the queue.\n');
  await writeFile(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), source, entries: manifest }, null, 2)}\n`);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
