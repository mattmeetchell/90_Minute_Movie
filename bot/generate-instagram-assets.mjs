import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readQueue } from './queue-utils.mjs';

const outputDirectory = resolve(process.env.BOT_INSTAGRAM_OUTPUT_DIR || 'bot-instagram-assets');
const limit = Math.max(1, Math.min(28, Number.parseInt(process.env.BOT_INSTAGRAM_LIMIT || '14', 10)));

const directoryNameFor = (entry) => `${entry.date}-${String(entry.hour).padStart(2, '0')}-${entry.title
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const main = async () => {
  const queue = await readQueue();
  const entries = queue.entries.filter((entry) => entry.state === 'queued')
    .sort((first, second) => `${first.date}-${first.hour}`.localeCompare(`${second.date}-${second.hour}`))
    .slice(0, limit);
  if (!entries.length) throw new Error('There are no queued movies to export for Instagram.');

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
  await writeFile(resolve(outputDirectory, 'README.txt'), 'Each folder contains the two ordered 1080 x 1080 Instagram images at 2× export resolution (2160 x 2160), plus the matching caption for one queued movie. This export never posts to Instagram and never changes the queue.\n');
  await writeFile(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: manifest }, null, 2)}\n`);
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
