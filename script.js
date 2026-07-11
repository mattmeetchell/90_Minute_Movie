const TMDB_PROXY_URL = '/api/tmdb';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';
const PROFILE_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const PROVIDER_LOGO_BASE = 'https://image.tmdb.org/t/p/original';
const PHYSICAL_MEDIA_LOGO = 'assets/media/Bluray.svg';
const MAX_RUNTIME_MINUTES = 105;
const SECRET_PASSWORD = 'Monke';
const SECRET_SHEET_ID = '16xflKfxJMpwWbKOXNPsQA7RjO8ta4K6EO9AOzdp7UXU';
const SECRET_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SECRET_SHEET_ID}/export?format=csv&gid=0`;
const SECRET_SHEET_JSONP_URL = `https://docs.google.com/spreadsheets/d/${SECRET_SHEET_ID}/gviz/tq?gid=0`;

const EXCLUDED_GENRES = new Set(['History', 'TV Movie', 'War', 'Western']);
const DECADES = [
  { label: "1950's", start: 1950, end: 1959 },
  { label: "1960's", start: 1960, end: 1969 },
  { label: "1970's", start: 1970, end: 1979 },
  { label: "1980's", start: 1980, end: 1989 },
  { label: "1990's", start: 1990, end: 1999 },
  { label: "2000's", start: 2000, end: 2009 },
  { label: "2010's", start: 2010, end: 2019 },
  { label: "2020's", start: 2020, end: 2029 }
];
const DESKTOP_POSTER_SIZES = ['float-card-large', 'float-card-small', 'float-card-tiny', '', 'float-card-small', 'float-card-large', ''];
const MOBILE_POSTER_SIZES = [
  'float-card-large',
  'float-card-small',
  'float-card-tiny',
  '',
  'float-card-small',
  'float-card-large',
  '',
  'float-card-small',
  'float-card-tiny',
  'float-card-large',
  'float-card-small'
];
const GENRE_ICONS = {
  Action: 'assets/genre-icons/Action.svg',
  Adventure: 'assets/genre-icons/Adventure.svg',
  Animation: 'assets/genre-icons/Animation.svg',
  Comedy: 'assets/genre-icons/Comedy.svg',
  Crime: 'assets/genre-icons/Crime.svg',
  Documentary: 'assets/genre-icons/Documentary.svg',
  Drama: 'assets/genre-icons/Drama.svg',
  Family: 'assets/genre-icons/Family.svg',
  Fantasy: 'assets/genre-icons/Fantasy.svg',
  Horror: 'assets/genre-icons/Horror.svg',
  Music: 'assets/genre-icons/Music.svg',
  Mystery: 'assets/genre-icons/Mystery.svg',
  Romance: 'assets/genre-icons/Romance.svg',
  'Science Fiction': 'assets/genre-icons/Science%20Fiction.svg',
  Thriller: 'assets/genre-icons/Thriller.svg'
};
const GENRE_FILLED_ICONS = {
  Action: 'assets/genre-icons/filled/Action.svg',
  Adventure: 'assets/genre-icons/filled/Adventure.svg',
  Animation: 'assets/genre-icons/filled/Animation.svg',
  Comedy: 'assets/genre-icons/filled/Comedy.svg',
  Crime: 'assets/genre-icons/filled/Crime.svg',
  Documentary: 'assets/genre-icons/filled/Documentary.svg',
  Drama: 'assets/genre-icons/filled/Drama.svg',
  Family: 'assets/genre-icons/filled/Family.svg',
  Fantasy: 'assets/genre-icons/filled/Fantasy.svg',
  Horror: 'assets/genre-icons/filled/Horror.svg',
  Music: 'assets/genre-icons/filled/Music.svg',
  Mystery: 'assets/genre-icons/filled/Mystery.svg',
  Romance: 'assets/genre-icons/filled/Romance.svg',
  'Science Fiction': 'assets/genre-icons/filled/ScienceFiction.svg',
  Thriller: 'assets/genre-icons/filled/Thriller.svg'
};

const state = {
  genres: [],
  selectedGenreIds: [],
  selectedDecades: [],
  isLoadingCount: false,
  activeView: 'landing',
  resultSource: 'filtered',
  transitionTimer: null,
  trailerUrl: '',
  hasShownResult: false,
  secretMovies: null,
  secretActive: false
};

let currentPosterSamples = [];

const els = {
  appShell: document.querySelector('.app-shell'),
  landingView: document.getElementById('landingView'),
  posterTrack: document.getElementById('posterTrack'),
  pickerView: document.getElementById('pickerView'),
  decadeView: document.getElementById('decadeView'),
  homeButton: document.getElementById('homeButton'),
  headerGoToDecades: document.getElementById('headerGoToDecades'),
  headerClearFilters: document.getElementById('headerClearFilters'),
  headerPickMovie: document.getElementById('headerPickMovie'),
  headerBackToGenres: document.getElementById('headerBackToGenres'),
  resultView: document.getElementById('resultView'),
  startPicking: document.getElementById('startPicking'),
  genresTray: document.getElementById('genresTray'),
  decadesTray: document.getElementById('decadesTray'),
  goToDecades: document.getElementById('goToDecades'),
  backToGenres: document.getElementById('backToGenres'),
  pickMovie: document.getElementById('pickMovie'),
  clearFilters: document.getElementById('clearFilters'),
  clearResultFilters: document.getElementById('clearResultFilters'),
  tryAgain: document.getElementById('tryAgain'),
  resultCount: document.getElementById('resultCount'),
  movieResult: document.getElementById('movieResult'),
  posterButton: document.getElementById('posterButton'),
  posterHint: document.getElementById('posterHint'),
  poster: document.getElementById('poster'),
  movieCopy: document.querySelector('.movie-copy'),
  title: document.getElementById('title'),
  year: document.getElementById('year'),
  runtime: document.getElementById('runtime'),
  rating: document.getElementById('rating'),
  overview: document.getElementById('overview'),
  toggleOverview: document.getElementById('toggleOverview'),
  director: document.getElementById('director'),
  cast: document.getElementById('cast'),
  providers: document.getElementById('providers'),
  trailerModal: document.getElementById('trailerModal'),
  closeTrailer: document.getElementById('closeTrailer'),
  trailer: document.getElementById('trailer'),
  selectionSummary: document.getElementById('selectionSummary'),
  decadeSummary: document.getElementById('decadeSummary'),
  decadeResultCount: document.getElementById('decadeResultCount'),
  footer: document.querySelector('.site-footer'),
  secretFlowTrigger: document.getElementById('secretFlowTrigger')
};

const mobileMediaQuery = window.matchMedia('(max-width: 760px)');

async function tmdbFetch(path, params = {}) {
  const url = new URL(TMDB_PROXY_URL, window.location.origin);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`TMDb request failed: ${response.status}`);
  }
  return response.json();
}

function showView(viewName) {
  closeTrailer();
  const previousView = state.activeView;
  const isFilterTransition =
    (previousView === 'picker' && viewName === 'decade') ||
    (previousView === 'decade' && viewName === 'picker');

  if (state.transitionTimer) {
    clearTimeout(state.transitionTimer);
    state.transitionTimer = null;
  }

  state.activeView = viewName;
  els.appShell.dataset.view = viewName;
  clearScreenTransitionClasses();

  if (isFilterTransition) {
    const outgoing = previousView === 'picker' ? els.pickerView : els.decadeView;
    const incoming = viewName === 'picker' ? els.pickerView : els.decadeView;
    const movingForward = previousView === 'picker' && viewName === 'decade';

    outgoing.classList.remove('hidden');
    incoming.classList.remove('hidden');
    outgoing.classList.add(movingForward ? 'screen-exit-left' : 'screen-exit-right');
    incoming.classList.add(movingForward ? 'screen-enter-right' : 'screen-enter-left');
    els.landingView.classList.add('hidden');
    els.resultView.classList.add('hidden');

    state.transitionTimer = setTimeout(() => {
      outgoing.classList.add('hidden');
      clearScreenTransitionClasses();
      state.transitionTimer = null;
      scheduleMobileActionOffsetUpdate();
    }, 380);
  } else {
    els.landingView.classList.toggle('hidden', viewName !== 'landing');
    els.pickerView.classList.toggle('hidden', viewName !== 'picker');
    els.decadeView.classList.toggle('hidden', viewName !== 'decade');
    els.resultView.classList.toggle('hidden', viewName !== 'result');
  }

  window.scrollTo(0, 0);
  scheduleMobileActionOffsetUpdate();
}

function updateMobileActionOffset() {
  if (!mobileMediaQuery.matches || !els.footer) {
    els.appShell.style.setProperty('--mobile-action-footer-offset', '0px');
    els.appShell.dataset.mobileActionsLocked = 'false';
    return;
  }

  const footerTop = els.footer.getBoundingClientRect().top;
  const overlap = Math.max(0, window.innerHeight - footerTop);
  els.appShell.style.setProperty('--mobile-action-footer-offset', `${Math.ceil(overlap)}px`);
  els.appShell.dataset.mobileActionsLocked = overlap > 0 ? 'true' : 'false';
}

function scheduleMobileActionOffsetUpdate() {
  updateMobileActionOffset();
  requestAnimationFrame(updateMobileActionOffset);
  requestAnimationFrame(() => requestAnimationFrame(updateMobileActionOffset));
  setTimeout(updateMobileActionOffset, 120);
  setTimeout(updateMobileActionOffset, 420);
  setTimeout(updateMobileActionOffset, 720);
}

function clearScreenTransitionClasses() {
  [els.pickerView, els.decadeView].forEach((view) => {
    view.classList.remove('screen-enter-right', 'screen-enter-left', 'screen-exit-left', 'screen-exit-right');
  });
}

async function loadGenres() {
  const data = await tmdbFetch('/genre/movie/list', { language: 'en-US' });
  state.genres = data.genres.filter((genre) => !EXCLUDED_GENRES.has(genre.name));
  renderGenrePills();
}

async function loadFloatingPosters() {
  if (!els.posterTrack) return;
  renderPosterMarquee(getFallbackPosterSamples());

  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const data = await tmdbFetch('/discover/movie', {
      ...buildDiscoverParams(randomPage),
      page: randomPage
    });
    const posters = await getValidPosterSamples(data.results.filter((movie) => movie.poster_path), 10);
    renderPosterMarquee(posters);
  } catch (error) {
    console.error(error);
  }
}

function renderPosterMarquee(posters) {
  currentPosterSamples = posters;
  const sizes = getPosterSizes();
  const uniquePosters = dedupePosterSamples(posters);
  const sequenceMovies = getNonAdjacentPosterSequence(uniquePosters, sizes.filter(Boolean).length);
  let movieIndex = 0;
  const sequence = sizes.map((size, index) => {
    if (!size) return { size, movie: null };
    const movie = sequenceMovies[movieIndex % Math.max(sequenceMovies.length, 1)] || null;
    movieIndex += 1;
    return { size, movie };
  });
  const items = Array.from({ length: 8 }, () => sequence).flat();
  const fragment = document.createDocumentFragment();

  items.forEach(({ size, movie }) => {
    const card = document.createElement(movie?.id ? 'button' : 'div');
    card.className = `float-card ${size} ${movie ? 'poster-card' : 'blank-card'}`.trim();

    if (movie) {
      const image = document.createElement('img');
      image.src = movie.localSrc || `${IMAGE_BASE_URL}${movie.poster_path}`;
      image.alt = '';
      card.appendChild(image);

      if (movie.id) {
        card.type = 'button';
        card.setAttribute('aria-label', `Show ${movie.title || 'sample movie'}`);
        card.addEventListener('click', () => {
          els.posterTrack.classList.add('paused');
          showFloatingMovie(movie.id);
        });
      } else {
        card.setAttribute('aria-hidden', 'true');
      }
    } else {
      card.setAttribute('aria-hidden', 'true');
    }

    fragment.appendChild(card);
  });

  els.posterTrack.replaceChildren(fragment);
  requestAnimationFrame(updatePosterLoopWidth);
}

function getPosterSizes() {
  return mobileMediaQuery.matches ? MOBILE_POSTER_SIZES : DESKTOP_POSTER_SIZES;
}

function dedupePosterSamples(posters) {
  const seen = new Set();
  return posters.filter((movie) => {
    const key = getPosterKey(movie);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getPosterKey(movie) {
  return movie?.id || movie?.poster_path || movie?.localSrc || movie?.title || '';
}

function getNonAdjacentPosterSequence(posters, count) {
  if (!posters.length) return [];

  const sequence = [];
  const pool = [...posters];

  for (let index = 0; index < count; index += 1) {
    const previous = sequence[sequence.length - 1];
    const first = sequence[0];
    const candidate =
      pool.find((movie) => getPosterKey(movie) !== getPosterKey(previous) && (index < count - 1 || getPosterKey(movie) !== getPosterKey(first))) ||
      pool.find((movie) => getPosterKey(movie) !== getPosterKey(previous)) ||
      pool[0];

    sequence.push(candidate);
    const selectedIndex = pool.indexOf(candidate);
    if (selectedIndex >= 0) {
      pool.splice(selectedIndex, 1);
      pool.push(candidate);
    }
  }

  return sequence;
}

function updatePosterLoopWidth() {
  if (!els.posterTrack) return;

  const loopLength = getPosterSizes().length;
  const firstCard = els.posterTrack.children[0];
  const nextUnitFirstCard = els.posterTrack.children[loopLength];
  if (!firstCard || !nextUnitFirstCard) return;

  const loopDistance = nextUnitFirstCard.offsetLeft - firstCard.offsetLeft;
  if (loopDistance > 0) {
    const currentDistance = parseFloat(els.posterTrack.style.getPropertyValue('--poster-loop-distance')) || 0;
    if (Math.abs(loopDistance - currentDistance) > 0.5) {
      els.posterTrack.style.setProperty('--poster-loop-distance', `${loopDistance}px`);
    }
  }
}

function getFallbackPosterSamples() {
  return [];
}

async function getValidPosterSamples(movies, limit = 5) {
  const samples = [];

  for (const movie of shuffle(movies)) {
    if (samples.length >= limit) break;

    try {
      const details = await tmdbFetch(`/movie/${movie.id}`, { language: 'en-US' });
      if (isValidRuntime(details.runtime)) {
        samples.push({ ...movie, runtime: details.runtime });
      }
    } catch (error) {
      console.error(error);
    }
  }

  return samples;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderDecadePills() {
  els.decadesTray.innerHTML = '';

  DECADES.forEach((decade) => {
    const active = state.selectedDecades.includes(decade.label);
    const button = document.createElement('button');
    button.className = `decade-pill ${active ? 'active' : ''}`.trim();
    button.type = 'button';
    button.setAttribute('aria-pressed', String(active));
    button.textContent = decade.label;
    button.addEventListener('click', () => toggleDecade(decade.label));
    els.decadesTray.appendChild(button);
  });
}

function renderGenrePills() {
  els.genresTray.innerHTML = '';
  updateGenreStage();

  state.genres.forEach((genre) => {
    const active = state.selectedGenreIds.includes(genre.id);
    const disable = !active && state.selectedGenreIds.length >= 2;
    const button = document.createElement('button');
    const iconPath = active ? GENRE_FILLED_ICONS[genre.name] || GENRE_ICONS[genre.name] : GENRE_ICONS[genre.name];
    button.className = `genre-card ${iconPath ? 'has-art' : ''} ${active ? 'active' : ''} ${disable ? 'disabled' : ''}`.trim();
    button.type = 'button';
    button.disabled = disable;
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => toggleGenre(genre.id));

    const icon = document.createElement('span');
    icon.className = 'genre-icon';

    if (iconPath) {
      const image = document.createElement('img');
      image.src = iconPath;
      image.alt = '';
      icon.appendChild(image);
    } else {
      icon.textContent = genre.name.slice(0, 2).toUpperCase();
    }

    const label = document.createElement('span');
    label.className = 'genre-name';
    label.textContent = genre.name;

    button.append(icon, label);
    els.genresTray.appendChild(button);
  });
}

function updateGenreStage() {
  els.appShell.dataset.genreCount = String(Math.min(state.selectedGenreIds.length, 2));
}

function toggleGenre(id) {
  if (state.selectedGenreIds.includes(id)) {
    state.selectedGenreIds = state.selectedGenreIds.filter((genreId) => genreId !== id);
  } else if (state.selectedGenreIds.length < 2) {
    state.selectedGenreIds = [...state.selectedGenreIds, id];
  }

  renderGenrePills();
  updateGenreStage();
  updateSelectionSummary();
  refreshCount();
}

function toggleDecade(label) {
  if (state.selectedDecades.includes(label)) {
    state.selectedDecades = state.selectedDecades.filter((decade) => decade !== label);
  } else {
    state.selectedDecades = [...state.selectedDecades, label];
  }

  renderDecadePills();
  updateDecadeSummary();
  refreshCount();
}

function updateSelectionSummary() {
  const selectedGenres = state.genres
    .filter((genre) => state.selectedGenreIds.includes(genre.id))
    .map((genre) => genre.name);

  if (!selectedGenres.length) {
    els.selectionSummary.textContent = 'Choose up to 2 genres, or leave it open for any vibe.';
    return;
  }

  els.selectionSummary.textContent = `Selected: ${selectedGenres.join(' + ')}`;
}

function updateDecadeSummary() {
  if (!state.selectedDecades.length) {
    els.decadeSummary.textContent = 'Choose any decades, or leave it open for all eras.';
    return;
  }

  els.decadeSummary.textContent = `Selected: ${state.selectedDecades.join(' + ')}`;
}

function buildDiscoverParams(page = 1, decadeLabel = null) {
  const params = {
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    page,
    sort_by: 'popularity.desc',
    'vote_count.gte': 60,
    'with_runtime.lte': MAX_RUNTIME_MINUTES
  };

  if (state.selectedGenreIds.length) {
    params.with_genres = state.selectedGenreIds.join(',');
  }

  if (decadeLabel) {
    const selectedRanges = DECADES.filter((decade) => decade.label === decadeLabel);
    const minYear = Math.min(...selectedRanges.map((decade) => decade.start));
    const maxYear = Math.max(...selectedRanges.map((decade) => decade.end));
    params['primary_release_date.gte'] = `${minYear}-01-01`;
    params['primary_release_date.lte'] = `${maxYear}-12-31`;
  }

  return params;
}

async function refreshCount() {
  if (state.isLoadingCount) return;
  state.isLoadingCount = true;
  els.resultCount.textContent = '...';
  els.decadeResultCount.textContent = '...';

  try {
    const decadeLabels = state.selectedDecades.length ? state.selectedDecades : [null];
    const counts = await Promise.all(
      decadeLabels.map((decade) => tmdbFetch('/discover/movie', buildDiscoverParams(1, decade)))
    );
    const totalResults = counts.reduce((total, data) => total + data.total_results, 0);
    els.resultCount.textContent = totalResults.toLocaleString();
    els.decadeResultCount.textContent = totalResults.toLocaleString();
  } catch (error) {
    console.error(error);
    els.resultCount.textContent = '-';
    els.decadeResultCount.textContent = '-';
  } finally {
    state.isLoadingCount = false;
  }
}

async function pickRandomMovie(options = {}) {
  const cyclePoster = options.cyclePosterOnly && state.activeView === 'result';
  const animateCopy = !state.hasShownResult || state.activeView !== 'result';
  const posterExitDelay = cyclePoster ? wait(320) : Promise.resolve();

  if (cyclePoster) {
    animatePosterExit();
  }

  setLoading(true);

  try {
    const decade = getRandomSelectedDecade();
    const firstPage = await tmdbFetch('/discover/movie', buildDiscoverParams(1, decade));

    if (!firstPage.results.length) {
      throw new Error('No matches found for the current filters.');
    }

    const maxPage = Math.min(firstPage.total_pages, 20);
    const randomPage = Math.floor(Math.random() * maxPage) + 1;
    const pageData = randomPage === 1
      ? firstPage
      : await tmdbFetch('/discover/movie', buildDiscoverParams(randomPage, decade));

    const validResults = shuffle(pageData.results.filter((movie) => movie.poster_path));
    const [details, credits, videos, providers, releaseDates] = await fetchValidMovieBundle(validResults);

    await Promise.all([posterExitDelay, preloadPoster(details.poster_path)]);
    renderMovie(details, credits, videos, providers, releaseDates);
    setResultSource('filtered');
    showView('result');
    animateResultReveal({ animateCopy, cyclePoster });
    state.hasShownResult = true;
  } catch (error) {
    console.error(error);
    alert(error.message || 'Something went wrong while picking a movie.');
  } finally {
    setLoading(false);
  }
}

async function showFloatingMovie(movieId) {
  setLoading(true);

  try {
    const [details, credits, videos, providers, releaseDates] = await fetchMovieBundle(movieId);
    if (!isValidRuntime(details.runtime)) {
      throw new Error('That sample is longer than 1h 45m, so it is not available in this picker.');
    }
    await preloadPoster(details.poster_path);
    renderMovie(details, credits, videos, providers, releaseDates);
    setResultSource('sample');
    showView('result');
    animateResultReveal({ animateCopy: true });
    state.hasShownResult = true;
  } catch (error) {
    console.error(error);
    alert(error.message || 'Something went wrong while loading that movie.');
  } finally {
    setLoading(false);
  }
}

async function startSecretFlow() {
  const password = window.prompt('Password');
  if (password === null) return;

  const normalizedPassword = password.normalize().trim().toLowerCase();
  if (normalizedPassword !== SECRET_PASSWORD.toLowerCase()) {
    alert('Wrong password.');
    return;
  }

  state.secretActive = true;
  state.hasShownResult = false;
  await pickSecretMovie();
}

async function pickSecretMovie(options = {}) {
  const cyclePoster = options.cyclePosterOnly && state.activeView === 'result';
  const animateCopy = !state.hasShownResult || state.activeView !== 'result';
  const shouldAnticipate = animateCopy && !cyclePoster;
  const posterExitDelay = cyclePoster ? wait(320) : Promise.resolve();

  if (cyclePoster) {
    animatePosterExit();
  }

  setLoading(true);

  try {
    const rows = await loadSecretMovies();
    if (!rows.length) {
      throw new Error('The personal list is empty, or I could not read any usable movie rows from it.');
    }

    const row = rows[Math.floor(Math.random() * rows.length)];
    const [details, credits, videos, providers, releaseDates] = await fetchSecretMovieBundle(row);
    details.ownedPhysical = Boolean(row.ownedPhysical);
    details.physicalNote = row.physicalNote || '';

    await preloadPoster(details.poster_path);
    if (shouldAnticipate) {
      await posterExitDelay;
      setResultSource('secret');
      showView('result');
      const anticipation = runPersonalPickAnticipation();
      await wait(1180);
      els.posterButton.classList.add('personal-card-rest');
      renderMovie(details, credits, videos, providers, releaseDates);
      els.posterButton.querySelector('.personal-pick-reel')?.remove();
      els.movieResult.classList.remove('personal-picking');
      els.posterButton.classList.remove('personal-card-rest');
      els.posterButton.classList.add('personal-poster-reveal');
      await wait(860);
      await revealPersonalPosterStroke();
      await wait(160);
      anticipation.then(() => {});
    } else {
      await posterExitDelay;
      renderMovie(details, credits, videos, providers, releaseDates);
    }

    setResultSource('secret');
    showView('result');
    animateResultReveal({ animateCopy, cyclePoster, personalReveal: shouldAnticipate });
    state.hasShownResult = true;
  } catch (error) {
    console.error(error);
    alert(error.message || 'Something went wrong while loading the personal list.');
    if (state.activeView !== 'result') {
      state.secretActive = false;
    }
  } finally {
    setLoading(false);
  }
}

async function loadSecretMovies() {
  if (state.secretMovies) return state.secretMovies;

  if (Array.isArray(window.PERSONAL_MOVIE_FEED) && window.PERSONAL_MOVIE_FEED.length) {
    state.secretMovies = window.PERSONAL_MOVIE_FEED
      .map((movie) => ({
        ...movie,
        tmdbId: String(movie.tmdbId || '').trim(),
        imdbId: String(movie.imdbId || '').trim(),
        title: String(movie.title || '').trim(),
        ownedPhysical: Boolean(movie.ownedPhysical),
        physicalNote: String(movie.physicalNote || '').trim()
      }))
      .filter((movie) => movie.tmdbId || movie.imdbId || movie.title);
    return state.secretMovies;
  }

  const rows = await loadSecretSheetRows();
  const [headers = [], ...dataRows] = rows;
  const normalizedHeaders = headers.map(normalizeSheetHeader);

  state.secretMovies = dataRows
    .map((row) => normalizeSecretMovieRow(row, normalizedHeaders))
    .filter((movie) => movie.tmdbId || movie.imdbId || movie.title);

  return state.secretMovies;
}

async function loadSecretSheetRows() {
  try {
    const response = await fetch(SECRET_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Sheet CSV request failed: ${response.status}`);
    }

    return parseCsv(await response.text()).filter((row) => row.some((cell) => cell.trim()));
  } catch (error) {
    console.warn('CSV sheet fetch failed; trying JSONP sheet loader.', error);
    return loadSecretSheetRowsViaJsonp();
  }
}

function loadSecretSheetRowsViaJsonp() {
  return new Promise((resolve, reject) => {
    const callbackName = `handleSecretSheet_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const cleanup = () => {
      script.remove();
      delete window[callbackName];
    };

    window[callbackName] = (response) => {
      cleanup();

      if (response?.status === 'error') {
        reject(new Error(response.errors?.[0]?.detailed_message || 'Google Sheet returned an error.'));
        return;
      }

      const table = response?.table;
      if (!table?.cols?.length) {
        reject(new Error('I could not read columns from the personal sheet.'));
        return;
      }

      const headers = table.cols.map((col) => col.label || col.id || '');
      const rows = table.rows.map((row) => {
        return table.cols.map((_, index) => {
          const cell = row.c?.[index];
          return String(cell?.f ?? cell?.v ?? '').trim();
        });
      });

      resolve([headers, ...rows].filter((row) => row.some((cell) => cell.trim())));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('I could not load the personal sheet. Make sure link sharing is set to anyone with the link.'));
    };
    script.src = `${SECRET_SHEET_JSONP_URL}&tqx=responseHandler:${callbackName}`;
    document.head.appendChild(script);
  });
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeSecretMovieRow(row, headers) {
  const get = (...names) => {
    const wanted = names.map(normalizeSheetHeader);
    const index = headers.findIndex((header) => wanted.includes(header));
    return index >= 0 ? (row[index] || '').trim() : '';
  };
  const physicalNote = get('note', 'physical', 'owned physical', 'owned_physical', 'bluray', 'blu ray');

  return {
    tmdbId: get('tmdb_id', 'tmdb id', 'tmdb', 'id'),
    imdbId: get('imdb_id', 'imdb id', 'imdb'),
    title: get('title', 'movie', 'film', 'name'),
    year: get('year', 'release year', 'release_year'),
    ownedPhysical: isOwnedPhysicalNote(physicalNote),
    physicalNote
  };
}

function normalizeSheetHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function isOwnedPhysicalNote(value) {
  return /blu\s?-?ray|bluray|owned|yes|true/i.test(String(value || ''));
}

async function fetchSecretMovieBundle(row) {
  if (row.tmdbId) {
    return fetchMovieBundle(row.tmdbId);
  }

  if (row.imdbId) {
    const found = await tmdbFetch(`/find/${row.imdbId}`, { external_source: 'imdb_id' });
    const match = found.movie_results?.find((movie) => movie.id);
    if (match?.id) {
      return fetchMovieBundle(match.id);
    }
  }

  if (!row.title) {
    throw new Error('A personal list row needs either tmdb_id, imdb_id, or title.');
  }

  const search = await tmdbFetch('/search/movie', {
    include_adult: 'false',
    language: 'en-US',
    query: row.title,
    year: row.year || undefined
  });
  const match = search.results?.find((movie) => movie.poster_path) || search.results?.[0];
  if (!match?.id) {
    throw new Error(`I could not match "${row.title}" in TMDb.`);
  }

  return fetchMovieBundle(match.id);
}

function fetchMovieBundle(movieId) {
  return Promise.all([
    tmdbFetch(`/movie/${movieId}`, { language: 'en-US' }),
    tmdbFetch(`/movie/${movieId}/credits`, { language: 'en-US' }),
    tmdbFetch(`/movie/${movieId}/videos`, { language: 'en-US' }),
    tmdbFetch(`/movie/${movieId}/watch/providers`),
    tmdbFetch(`/movie/${movieId}/release_dates`)
  ]);
}

async function fetchValidMovieBundle(candidates) {
  const fallbackCandidates = candidates.length ? candidates : [];

  for (const movie of fallbackCandidates.slice(0, 10)) {
    const bundle = await fetchMovieBundle(movie.id);
    const [details] = bundle;

    if (isValidRuntime(details.runtime)) {
      return bundle;
    }
  }

  throw new Error('No under-105-minute matches found for the current filters.');
}

function isValidRuntime(runtime) {
  return runtime && runtime <= MAX_RUNTIME_MINUTES;
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function preloadPoster(posterPath) {
  if (!posterPath) return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = `${IMAGE_BASE_URL}${posterPath}`;
  });
}

function animatePosterExit() {
  els.posterButton.classList.remove('result-poster-enter', 'result-poster-fanfare', 'poster-cycle-in', 'poster-cycle-out', 'personal-card-rest', 'personal-poster-reveal', 'personal-stroke-reveal');
  void els.posterButton.offsetWidth;
  els.posterButton.classList.add('poster-cycle-out');
}

function runPersonalPickAnticipation() {
  els.movieResult.classList.add('personal-picking');
  els.posterButton.classList.remove('result-poster-enter', 'result-poster-fanfare', 'poster-cycle-in', 'poster-cycle-out', 'personal-card-rest', 'personal-poster-reveal', 'personal-stroke-reveal');
  els.poster.src = '';
  els.poster.alt = '';
  els.posterHint.textContent = 'Picking...';
  els.posterButton.disabled = true;

  const reel = document.createElement('span');
  reel.className = 'personal-pick-reel';
  reel.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 6; index += 1) {
    const frame = document.createElement('span');
    frame.className = 'personal-pick-frame';
    reel.appendChild(frame);
  }

  els.posterButton.appendChild(reel);

  return wait(1580).then(() => {
    reel.remove();
    els.movieResult.classList.remove('personal-picking');
  });
}

function revealPersonalPosterStroke() {
  els.posterButton.classList.add('personal-stroke-reveal');
  void els.posterButton.offsetWidth;

  return wait(420).then(() => {
    els.posterButton.classList.remove('personal-stroke-reveal');
    els.posterButton.classList.add('personal-stroke-visible');
  });
}

function animateResultReveal({ animateCopy = false, cyclePoster = false, personalReveal = false } = {}) {
  els.movieResult.classList.remove('sample-result-exit');
  els.posterButton.classList.remove('result-poster-enter', 'result-poster-fanfare', 'poster-cycle-in', 'poster-cycle-out', 'personal-card-rest', 'personal-poster-reveal', 'personal-stroke-reveal', 'personal-stroke-visible');
  els.movieCopy.classList.remove('result-copy-enter');
  els.movieCopy.classList.remove('result-lockup-enter');
  els.movieCopy.classList.remove('result-lockup-cycle');
  void els.posterButton.offsetWidth;

  if (cyclePoster) {
    els.posterButton.classList.add('poster-cycle-in');
  } else if (!personalReveal) {
    els.posterButton.classList.add(animateCopy ? 'result-poster-fanfare' : 'result-poster-enter');
  }

  if (animateCopy) {
    els.movieCopy.classList.add('result-copy-enter');
    els.movieCopy.classList.add('result-lockup-enter');
  } else if (cyclePoster) {
    els.movieCopy.classList.add('result-lockup-cycle');
  }
}

function getRandomSelectedDecade() {
  if (!state.selectedDecades.length) return null;
  return state.selectedDecades[Math.floor(Math.random() * state.selectedDecades.length)];
}

function updateOverviewToggle() {
  els.toggleOverview.classList.add('hidden');

  if (!els.overview.textContent.trim()) return;

  requestAnimationFrame(() => {
    const overflows = els.overview.scrollHeight > els.overview.clientHeight + 1;
    els.toggleOverview.classList.toggle('hidden', !overflows);
  });
}

function renderMovie(details, credits, videos, providerData, releaseDates) {
  const director = credits.crew.find((person) => person.job === 'Director')?.name || '-';
  const cast = credits.cast.slice(0, 5);
  const trailer = videos.results.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer'
  );
  const certification = getCertification(releaseDates);

  els.poster.src = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : '';
  els.poster.alt = `${details.title} poster`;
  els.title.textContent = details.title;
  updateTitleSize();
  els.year.textContent = (details.release_date || '-').slice(0, 4);
  els.runtime.textContent = formatRuntime(details.runtime);
  els.rating.textContent = certification;
  els.rating.classList.toggle('hidden', !certification);
  els.director.textContent = director;
  els.overview.textContent = details.overview || '';
  els.overview.classList.remove('expanded');
  els.toggleOverview.textContent = 'See more';
  updateOverviewToggle();
  renderCast(cast);

  renderProviders(providerData.results?.US || providerData.results?.GB || null, details);

  if (trailer?.key) {
    state.trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    els.posterButton.disabled = false;
    els.posterHint.textContent = 'Play trailer';
  } else {
    state.trailerUrl = '';
    els.posterButton.disabled = true;
    els.posterHint.textContent = 'No trailer';
  }
}

function updateTitleSize() {
  els.title.classList.remove('long-title');

  requestAnimationFrame(() => {
    const styles = window.getComputedStyle(els.title);
    const lineHeight = parseFloat(styles.lineHeight);
    if (!lineHeight) return;

    const lineCount = Math.round(els.title.scrollHeight / lineHeight);
    els.title.classList.toggle('long-title', lineCount >= 4);
  });
}

function renderCast(cast) {
  els.cast.innerHTML = '';

  if (!cast.length) return;

  const prefix = document.createElement('span');
  prefix.className = 'cast-prefix';
  prefix.textContent = 'Featuring';
  els.cast.appendChild(prefix);

  cast.forEach((person) => {
    const member = document.createElement('span');
    member.className = 'cast-member';
    member.tabIndex = 0;
    member.textContent = person.name;

    if (person.profile_path) {
      const headshot = document.createElement('span');
      headshot.className = 'cast-headshot';

      const image = document.createElement('img');
      image.src = `${PROFILE_IMAGE_BASE_URL}${person.profile_path}`;
      image.alt = `${person.name} headshot`;

      headshot.appendChild(image);
      member.appendChild(headshot);
    }

    els.cast.appendChild(member);
  });
}

function getCertification(releaseDates) {
  const usRelease = releaseDates.results?.find((item) => item.iso_3166_1 === 'US');
  const ratedRelease = usRelease?.release_dates.find((item) => item.certification);
  return ratedRelease?.certification || '';
}

function renderProviders(regionData, movie) {
  els.providers.innerHTML = '';

  if (movie?.ownedPhysical) {
    const marker = createProviderLink({
      name: movie.physicalNote || 'Owned on Blu-ray',
      url: getPhysicalMediaUrl(movie),
      logoSrc: PHYSICAL_MEDIA_LOGO
    });
    marker.classList.add('owned-media-marker');
    els.providers.appendChild(marker);
  }

  const flatrate = regionData?.flatrate || [];
  if (!flatrate.length) {
    if (movie?.ownedPhysical) return;

    const fallback = createProviderLink({
      name: 'Blu-ray',
      url: getPhysicalMediaUrl(movie),
      logoSrc: PHYSICAL_MEDIA_LOGO
    });
    els.providers.appendChild(fallback);
    return;
  }

  const seen = new Set();
  flatrate.slice(0, 5).forEach((provider) => {
    const normalizedName = normalizeProviderName(provider.provider_name);
    if (seen.has(normalizedName)) return;
    seen.add(normalizedName);

    const pill = createProviderLink({
      name: normalizedName,
      url: getProviderUrl(normalizedName),
      logoSrc: provider.logo_path ? `${PROVIDER_LOGO_BASE}${provider.logo_path}` : ''
    });

    els.providers.appendChild(pill);
  });
}

function createProviderLink({ name, url, logoSrc }) {
  const pill = document.createElement('a');
  pill.className = 'provider-pill';
  pill.href = url;
  pill.target = '_blank';
  pill.rel = 'noreferrer';
  pill.title = name;
  pill.setAttribute('aria-label', name);

  if (logoSrc) {
    const logo = document.createElement('img');
    logo.src = logoSrc;
    logo.alt = '';
    pill.appendChild(logo);
  } else {
    const text = document.createElement('span');
    text.textContent = name;
    pill.appendChild(text);
  }

  return pill;
}

function getPhysicalMediaUrl(movie) {
  const title = movie?.title || 'movie';
  const year = (movie?.release_date || '').slice(0, 4);
  const query = encodeURIComponent(`${title} ${year} blu ray`);
  return `https://www.amazon.com/s?k=${query}`;
}

function getProviderUrl(name) {
  const normalized = name.toLowerCase();
  const urls = [
    [/netflix/, 'https://www.netflix.com/'],
    [/hulu/, 'https://www.hulu.com/'],
    [/disney/, 'https://www.disneyplus.com/search'],
    [/prime video|amazon/, 'https://www.primevideo.com/'],
    [/max|hbo/, 'https://www.max.com/search'],
    [/apple tv/, 'https://tv.apple.com/search'],
    [/paramount/, 'https://www.paramountplus.com/search/'],
    [/peacock/, 'https://www.peacocktv.com/search'],
    [/starz/, 'https://www.starz.com/us/en/search'],
    [/showtime/, 'https://www.paramountplus.com/search/'],
    [/mubi/, 'https://mubi.com/search'],
    [/criterion/, 'https://www.criterionchannel.com/search'],
    [/kanopy/, 'https://www.kanopy.com/search'],
    [/tubi/, 'https://tubitv.com/search/'],
    [/pluto/, 'https://pluto.tv/search'],
    [/crunchyroll/, 'https://www.crunchyroll.com/search']
  ];
  const match = urls.find(([pattern]) => pattern.test(normalized));
  return match ? match[1] : `https://www.google.com/search?q=${encodeURIComponent(name)}`;
}

function normalizeProviderName(name) {
  const replacements = [
    [/HBO Max Amazon Channel/i, 'HBO Max'],
    [/Max Amazon Channel/i, 'Max'],
    [/Paramount Plus Apple TV Channel /i, 'Paramount Plus'],
    [/Paramount\+ Amazon Channel/i, 'Paramount Plus'],
    [/Paramount\+/i, 'Paramount Plus'],
    [/with Ads/i, ''],
    [/ Premium/i, ''],
    [/ Standard/i, '']
  ];

  return replacements.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement).trim();
  }, name);
}

function formatRuntime(runtime) {
  if (!runtime) return '';
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function setLoading(isLoading) {
  els.pickMovie.disabled = isLoading;
  els.headerPickMovie.disabled = isLoading;
  els.tryAgain.disabled = isLoading;
  els.pickMovie.textContent = isLoading ? 'Picking...' : 'Find Movie';
  els.headerPickMovie.textContent = isLoading ? 'Picking...' : 'Find Movie';
  els.tryAgain.textContent = isLoading ? 'Picking...' : 'Try Again';
}

function openTrailer() {
  if (!state.trailerUrl) return;
  els.trailer.src = state.trailerUrl;
  els.trailerModal.classList.remove('hidden');
}

function closeTrailer() {
  els.trailer.src = '';
  els.trailerModal.classList.add('hidden');
}

function clearFilters() {
  state.selectedGenreIds = [];
  state.selectedDecades = [];
  renderGenrePills();
  renderDecadePills();
  updateSelectionSummary();
  updateDecadeSummary();
  refreshCount();
}

async function clearFiltersAndReturn() {
  if (state.resultSource === 'sample' || state.resultSource === 'secret') {
    els.movieResult.classList.add('sample-result-exit');
    await wait(760);
    els.movieResult.classList.remove('sample-result-exit');
    els.posterTrack.classList.remove('paused');
    state.secretActive = false;
    showView('landing');
    return;
  }

  clearFilters();
  state.hasShownResult = false;
  showView('picker');
}

function setResultSource(source) {
  state.resultSource = source;
  els.appShell.dataset.resultSource = source;
  els.clearResultFilters.textContent = source === 'sample' || source === 'secret' ? 'Go Back' : 'Clear Filters';
}

function wireEvents() {
  els.homeButton.addEventListener('click', () => showView('landing'));
  els.startPicking.addEventListener('click', () => showView('picker'));
  els.goToDecades.addEventListener('click', () => showView('decade'));
  els.headerGoToDecades.addEventListener('click', () => showView('decade'));
  els.backToGenres.addEventListener('click', () => showView('picker'));
  els.headerBackToGenres.addEventListener('click', () => showView('picker'));
  els.pickMovie.addEventListener('click', pickRandomMovie);
  els.headerPickMovie.addEventListener('click', pickRandomMovie);
  els.headerClearFilters.addEventListener('click', clearFilters);
  els.tryAgain.addEventListener('click', () => {
    if (state.resultSource === 'secret') {
      pickSecretMovie({ cyclePosterOnly: true });
      return;
    }

    pickRandomMovie({ cyclePosterOnly: true });
  });
  els.toggleOverview.addEventListener('click', () => {
    const expanded = els.overview.classList.toggle('expanded');
    els.toggleOverview.textContent = expanded ? 'See less' : 'See more';
  });
  els.posterButton.addEventListener('click', openTrailer);
  els.closeTrailer.addEventListener('click', closeTrailer);
  els.trailerModal.addEventListener('click', (event) => {
    if (event.target === els.trailerModal) closeTrailer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTrailer();
  });
  els.clearFilters.addEventListener('click', clearFilters);
  els.clearResultFilters.addEventListener('click', clearFiltersAndReturn);
  els.secretFlowTrigger.addEventListener('click', startSecretFlow);
  window.addEventListener('scroll', updateMobileActionOffset, { passive: true });
  window.addEventListener('resize', () => {
    scheduleMobileActionOffsetUpdate();
    updatePosterLoopWidth();
  });
  mobileMediaQuery.addEventListener('change', () => {
    scheduleMobileActionOffsetUpdate();
    renderPosterMarquee(currentPosterSamples);
  });
}

async function init() {
  els.appShell.dataset.view = state.activeView;
  els.appShell.dataset.resultSource = state.resultSource;
  scheduleMobileActionOffsetUpdate();
  updateSelectionSummary();
  renderDecadePills();
  updateDecadeSummary();
  wireEvents();
  loadFloatingPosters();

  try {
    await loadGenres();
    await refreshCount();
  } catch (error) {
    console.error(error);
    els.resultCount.textContent = 'Add TMDb token';
  }
}

init();
