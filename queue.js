const grid = document.querySelector('#queueGrid');
const summary = document.querySelector('#queueSummary');
const errorMessage = document.querySelector('#queueError');
const filters = [...document.querySelectorAll('[data-filter]')];

let entries = [];
let activeFilter = 'upcoming';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

const formatDate = (entry) => {
  const date = new Date(`${entry.date}T12:00:00Z`);
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(date),
    time: entry.hour === 12 ? '12 PM ET' : '8 PM ET'
  };
};

const render = () => {
  const visibleEntries = entries.filter((entry) => {
    if (activeFilter === 'posted') return entry.state === 'posted';
    // Skipped slots are retained in the source queue for audit history, but
    // should not appear as planned or published movies on the public page.
    if (activeFilter === 'all') return entry.state !== 'skipped';
    return entry.state === 'queued';
  });

  if (!visibleEntries.length) {
    grid.innerHTML = '<p class="empty">There are no matching movies in the queue right now.</p>';
    return;
  }

  grid.innerHTML = visibleEntries.map((entry) => {
    const date = formatDate(entry);
    const isPosted = entry.state === 'posted';
    const status = isPosted ? 'Posted' : 'Queued';
    const tweetLink = entry.tweetUrl ? `<a href="${escapeHtml(entry.tweetUrl)}" target="_blank" rel="noreferrer">View post</a>` : '';
    return `<article class="queue-card">
      <div class="queue-date" aria-label="${escapeHtml(entry.slotLabel)}"><span class="queue-date-month">${date.month}</span><span class="queue-date-day">${date.day}</span><span class="queue-date-time">${date.time}</span></div>
      <div class="queue-content">
        <span class="status ${isPosted ? 'posted' : ''}">${status}</span>
        <h2 class="queue-title">${escapeHtml(entry.title)} <span class="queue-year">(${escapeHtml(entry.year)})</span></h2>
        <p class="metadata">${escapeHtml(entry.runtime)} min · ${escapeHtml(entry.certification)} · ${escapeHtml(entry.director)}<br>${escapeHtml((entry.genres || []).join(', '))}</p>
        <div class="actions"><a href="/?movie=${encodeURIComponent(entry.id)}">Open movie</a>${tweetLink}</div>
        <details class="post-copy"><summary>Post copy</summary><pre>${escapeHtml(entry.postText)}</pre></details>
      </div>
    </article>`;
  }).join('');
};

filters.forEach((filter) => filter.addEventListener('click', () => {
  activeFilter = filter.dataset.filter;
  filters.forEach((button) => button.classList.toggle('is-active', button === filter));
  render();
}));

try {
  const response = await fetch('/bot-queue/queue.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Queue could not be loaded (${response.status}).`);
  const queue = await response.json();
  entries = [...(queue.entries || [])].sort((first, second) => `${first.date}-${first.hour}`.localeCompare(`${second.date}-${second.hour}`));
  const queued = entries.filter((entry) => entry.state === 'queued').length;
  summary.textContent = `${queued} upcoming ${queued === 1 ? 'movie' : 'movies'} · updated automatically by the movie bot.`;
  render();
} catch (error) {
  summary.textContent = 'The current queue is temporarily unavailable.';
  errorMessage.hidden = false;
  errorMessage.textContent = error.message;
}
