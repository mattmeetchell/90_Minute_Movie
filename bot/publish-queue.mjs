import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { TwitterApi } from 'twitter-api-v2';
import { easternNow, queueFile, readQueue, writeQueue } from './queue-utils.mjs';

const publishingEnabled = process.env.PUBLISH_ENABLED === 'true';
let queue;
try {
  queue = await readQueue();
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No queue exists yet. Initialize one before enabling publishing.');
    process.exit(0);
  }
  throw error;
}
const now = easternNow();
const dueEntry = queue.entries
  .filter((entry) => entry.state === 'queued' && (entry.date < now.date || (entry.date === now.date && entry.hour <= now.hour)))
  .sort((first, second) => `${first.date}-${first.hour}`.localeCompare(`${second.date}-${second.hour}`))[0];

if (!dueEntry) {
  console.log(`No queued post is due at ${now.date} ${now.hour}:00 ET.`);
  process.exit(0);
}

if (!publishingEnabled) {
  console.log(`Publishing is disabled. The next due post is ${dueEntry.title} (${dueEntry.date} ${dueEntry.hour}:00 ET).`);
  process.exit(0);
}

for (const key of ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET']) {
  if (!process.env[key]) throw new Error(`Missing required X credential: ${key}.`);
}

const outputDirectory = resolve(`.bot-publish-${process.pid}`);
const render = spawnSync(process.execPath, ['bot/generate-dry-run.mjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    BOT_OUTPUT_DIR: outputDirectory,
    MOVIE_ID: String(dueEntry.id),
    SCHEDULE_DATE: dueEntry.date,
    SCHEDULE_AT: dueEntry.slotLabel,
    BOT_CARD_THEME: dueEntry.theme || queue.theme || 'standard'
  },
  encoding: 'utf8'
});
if (render.status !== 0) throw new Error(render.stderr || render.stdout || `Could not render ${dueEntry.title}.`);

try {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET
  });
  const cardPath = resolve(outputDirectory, 'card.png');
  const mediaId = await client.v1.uploadMedia(cardPath, { mimeType: 'image/png' });
  const tweet = await client.v2.tweet({ text: dueEntry.postText, media: { media_ids: [mediaId] } });
  dueEntry.state = 'posted';
  dueEntry.postedAt = new Date().toISOString();
  dueEntry.tweetId = tweet.data.id;
  dueEntry.tweetUrl = `https://x.com/90minutemovie/status/${tweet.data.id}`;
  queue.updatedAt = dueEntry.postedAt;
  await writeQueue(queue);
  console.log(`Posted ${dueEntry.title}: ${dueEntry.tweetUrl}`);
} finally {
  await rm(outputDirectory, { recursive: true, force: true });
}

console.log(`Updated ${queueFile}.`);
