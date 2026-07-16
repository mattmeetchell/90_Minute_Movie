const TMDB_PROXY_URL = '/api/tmdb';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';
const PROFILE_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const PROVIDER_LOGO_BASE = 'https://image.tmdb.org/t/p/original';
const PHYSICAL_MEDIA_LOGO = 'assets/media/Blu-ray.svg';
const MAX_RUNTIME_MINUTES = 105;
const SECRET_PASSWORD = 'Monke';
const SECRET_SHEET_ID = '16xflKfxJMpwWbKOXNPsQA7RjO8ta4K6EO9AOzdp7UXU';
const SECRET_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SECRET_SHEET_ID}/export?format=csv&gid=0`;
const SECRET_SHEET_JSONP_URL = `https://docs.google.com/spreadsheets/d/${SECRET_SHEET_ID}/gviz/tq?gid=0`;
const tmdbResponseCache = new Map();

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
const DESKTOP_DECADE_ORDER = [...DECADES].reverse();
const YEAR_ICONS = {
  all: {
    icon: 'assets/year-icons/Icon_Anytime.svg',
    activeIcon: 'assets/year-icons/selected/Icon_Anytime_selected.svg'
  },
  "1950's": {
    icon: 'assets/year-icons/Icon_50s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_50s_selected.svg'
  },
  "1960's": {
    icon: 'assets/year-icons/Icon_60s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_60s_selected.svg'
  },
  "1970's": {
    icon: 'assets/year-icons/Icon_70s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_70s_selected.svg'
  },
  "1980's": {
    icon: 'assets/year-icons/Icon_80s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_80s.svg'
  },
  "1990's": {
    icon: 'assets/year-icons/Icon_90s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_90s_selected.svg'
  },
  "2000's": {
    icon: 'assets/year-icons/Icon_2000s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_2000s_selected.svg'
  },
  "2010's": {
    icon: 'assets/year-icons/Icon_2010s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_2010s_selected.svg'
  },
  "2020's": {
    icon: 'assets/year-icons/Icon_2020s.svg',
    activeIcon: 'assets/year-icons/selected/Icon_2020s_selected.svg'
  }
};
const RATINGS = [
  {
    label: 'Any',
    certification: 'ANY',
    icon: 'assets/rating-icons/Any.svg',
    activeIcon: 'assets/rating-icons/AnySelected.svg'
  },
  {
    label: 'G',
    certification: 'G',
    icon: 'assets/rating-icons/G.svg',
    activeIcon: 'assets/rating-icons/GSelected.svg'
  },
  {
    label: 'PG-13',
    certification: 'PG-13',
    icon: 'assets/rating-icons/PG13.svg',
    activeIcon: 'assets/rating-icons/PG13Selected.svg'
  },
  {
    label: 'R',
    certification: 'R',
    icon: 'assets/rating-icons/R.svg',
    activeIcon: 'assets/rating-icons/RSelected.svg'
  }
];
const MONKE_FORMATS = [
  {
    id: 'stream',
    label: 'Stream',
    icon: 'assets/monke-icons/Streaming.svg',
    activeIcon: 'assets/monke-icons/StreamingSelected.svg'
  },
  {
    id: 'bluray',
    label: 'Blu-ray',
    icon: 'assets/monke-icons/Bluray.svg',
    activeIcon: 'assets/monke-icons/BluraySelected.svg'
  }
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

const TRY_AGAIN_HOVER_LABELS = [
  'Nnnnnot quite',
  'NEXT',
  'NO THANKS',
  'NOPE',
  'ONCE MORE',
  'Fingers crossed',
  'HELL NO',
  'Nah fam',
  'YUCK',
  'PASS'
];

const FOOTER_DVD_FILTERS = [
  'brightness(0) saturate(100%) invert(72%) sepia(92%) saturate(716%) hue-rotate(118deg) brightness(101%) contrast(96%)',
  'brightness(0) saturate(100%) invert(83%) sepia(88%) saturate(1333%) hue-rotate(359deg) brightness(105%) contrast(104%)',
  'brightness(0) saturate(100%) invert(60%) sepia(88%) saturate(3898%) hue-rotate(306deg) brightness(101%) contrast(101%)',
  'brightness(0) saturate(100%) invert(54%) sepia(98%) saturate(1924%) hue-rotate(181deg) brightness(101%) contrast(101%)',
  'brightness(0) saturate(100%) invert(68%) sepia(76%) saturate(1568%) hue-rotate(72deg) brightness(104%) contrast(102%)'
];

const state = {
  genres: [],
  selectedGenreIds: [],
  selectedRatings: [],
  anyRatingSelected: false,
  selectedDecades: [],
  anyEraSelected: false,
  isLoadingCount: false,
  activeView: 'landing',
  resultSource: 'filtered',
  currentResultMovie: null,
  transitionTimer: null,
  trailerUrl: '',
  hasShownResult: false,
  secretMovies: null,
  secretActive: false,
  physicalMode: false,
  mode: 'streamer',
  monkeFormats: [],
  tryAgainLabelBag: [],
  lastTryAgainLabel: '',
  tryAgainExitTimer: null,
  footerBounceFrame: null,
  footerBounceLastTime: null,
  footerBounce: null,
  footerDvdColorIndex: 0
};

let currentPosterSamples = [];
let floatingPosterLoadToken = 0;

const els = {
  appShell: document.querySelector('.app-shell'),
  landingView: document.getElementById('landingView'),
  heroEyebrow: document.getElementById('heroEyebrow'),
  heroSupport: document.getElementById('heroSupport'),
  modeToggle: document.getElementById('modeToggle'),
  posterTrack: document.getElementById('posterTrack'),
  pickerView: document.getElementById('pickerView'),
  ratingView: document.getElementById('ratingView'),
  decadeView: document.getElementById('decadeView'),
  monkeFilterView: document.getElementById('monkeFilterView'),
  homeButton: document.getElementById('homeButton'),
  headerGoToRatings: document.getElementById('headerGoToRatings'),
  headerGoToDecades: document.getElementById('headerGoToDecades'),
  headerClearFilters: document.getElementById('headerClearFilters'),
  headerPickMovie: document.getElementById('headerPickMovie'),
  headerBackToGenres: document.getElementById('headerBackToGenres'),
  headerBackToRatings: document.getElementById('headerBackToRatings'),
  headerPickMonkeMovie: document.getElementById('headerPickMonkeMovie'),
  headerBackToMonkeHome: document.getElementById('headerBackToMonkeHome'),
  resultView: document.getElementById('resultView'),
  startPicking: document.getElementById('startPicking'),
  genresTray: document.getElementById('genresTray'),
  ratingsTray: document.getElementById('ratingsTray'),
  decadesTray: document.getElementById('decadesTray'),
  monkeFormatTray: document.getElementById('monkeFormatTray'),
  goToRatings: document.getElementById('goToRatings'),
  goToDecades: document.getElementById('goToDecades'),
  backToGenres: document.getElementById('backToGenres'),
  backToRatings: document.getElementById('backToRatings'),
  pickMovie: document.getElementById('pickMovie'),
  pickMonkeMovie: document.getElementById('pickMonkeMovie'),
  backToMonkeHome: document.getElementById('backToMonkeHome'),
  clearFilters: document.getElementById('clearFilters'),
  clearResultFilters: document.getElementById('clearResultFilters'),
  tryAgain: document.getElementById('tryAgain'),
  resultCount: document.getElementById('resultCount'),
  movieResult: document.getElementById('movieResult'),
  posterButton: document.getElementById('posterButton'),
  posterHint: document.getElementById('posterHint'),
  poster: document.getElementById('poster'),
  movieCopy: document.querySelector('.movie-copy'),
  titleHeading: document.getElementById('titleHeading'),
  title: document.getElementById('title'),
  year: document.getElementById('year'),
  runtime: document.getElementById('runtime'),
  rating: document.getElementById('rating'),
  overview: document.getElementById('overview'),
  toggleOverview: document.getElementById('toggleOverview'),
  director: document.getElementById('director'),
  cast: document.getElementById('cast'),
  resultFilters: document.getElementById('resultFilters'),
  resultActions: document.querySelector('.result-actions'),
  providers: document.getElementById('providers'),
  trailerModal: document.getElementById('trailerModal'),
  closeTrailer: document.getElementById('closeTrailer'),
  trailer: document.getElementById('trailer'),
  selectionSummary: document.getElementById('selectionSummary'),
  genreHeaderResultCount: document.getElementById('genreHeaderResultCount'),
  ratingSummary: document.getElementById('ratingSummary'),
  ratingResultCount: document.getElementById('ratingResultCount'),
  ratingHeaderResultCount: document.getElementById('ratingHeaderResultCount'),
  decadeSummary: document.getElementById('decadeSummary'),
  monkeFormatSummary: document.getElementById('monkeFormatSummary'),
  monkeFormatResultCount: document.getElementById('monkeFormatResultCount'),
  monkeHeaderFormatResultCount: document.getElementById('monkeHeaderFormatResultCount'),
  decadeResultCount: document.getElementById('decadeResultCount'),
  decadeHeaderResultCount: document.getElementById('decadeHeaderResultCount'),
  footer: document.querySelector('.site-footer'),
  footerLogoButton: document.getElementById('footerLogoButton'),
  footerCopy: document.querySelector('.footer-copy'),
  secretFlowTrigger: document.getElementById('secretFlowTrigger'),
  physicalFlowTrigger: document.getElementById('physicalFlowTrigger')
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

  const cacheKey = url.toString();
  if (tmdbResponseCache.has(cacheKey)) {
    return tmdbResponseCache.get(cacheKey);
  }

  const response = await fetch(cacheKey, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`TMDb request failed: ${response.status}`);
  }
  const data = await response.json();
  tmdbResponseCache.set(cacheKey, data);
  return data;
}

function showView(viewName) {
  closeTrailer();
  const previousView = state.activeView;
  const filterViews = ['picker', 'rating', 'decade'];
  const isFilterTransition =
    previousView !== viewName &&
    filterViews.includes(previousView) &&
    filterViews.includes(viewName);

  if (state.transitionTimer) {
    clearTimeout(state.transitionTimer);
    state.transitionTimer = null;
  }

  state.activeView = viewName;
  els.appShell.dataset.view = viewName;
  clearScreenTransitionClasses();

  if (isFilterTransition) {
    const viewEls = {
      picker: els.pickerView,
      rating: els.ratingView,
      decade: els.decadeView
    };
    const outgoing = viewEls[previousView];
    const incoming = viewEls[viewName];
    const movingForward = filterViews.indexOf(previousView) < filterViews.indexOf(viewName);

    outgoing.classList.add('hidden');
    incoming.classList.remove('hidden');
    incoming.classList.add(movingForward ? 'screen-enter-right' : 'screen-enter-left');
    els.landingView.classList.add('hidden');
    els.resultView.classList.add('hidden');

    state.transitionTimer = setTimeout(() => {
      clearScreenTransitionClasses();
      state.transitionTimer = null;
      scheduleMobileActionOffsetUpdate();
    }, 380);
  } else {
    els.landingView.classList.toggle('hidden', viewName !== 'landing');
    els.pickerView.classList.toggle('hidden', viewName !== 'picker');
    els.ratingView.classList.toggle('hidden', viewName !== 'rating');
    els.decadeView.classList.toggle('hidden', viewName !== 'decade');
    els.monkeFilterView.classList.toggle('hidden', viewName !== 'monkeFilter');
    els.resultView.classList.toggle('hidden', viewName !== 'result');
  }

  window.scrollTo(0, 0);
  if (viewName === 'landing') {
    playLandingIntro();
  } else {
    els.landingView.classList.remove('landing-intro');
  }
  scheduleMobileActionOffsetUpdate();
}

function playLandingIntro() {
  els.landingView.classList.remove('landing-intro');
  void els.landingView.offsetWidth;
  els.landingView.classList.add('landing-intro');
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

function getFooterBounceBounds() {
  const inset = mobileMediaQuery.matches ? 18 : 24;
  const maxX = Math.max(inset, els.footer.clientWidth - els.footerLogoButton.offsetWidth - inset);
  const maxY = Math.max(inset, els.footer.clientHeight - els.footerLogoButton.offsetHeight - inset);

  return {
    inset,
    maxX,
    maxY
  };
}

function setFooterLogoPosition(x, y) {
  els.footer.style.setProperty('--footer-dvd-x', `${Math.round(x)}px`);
  els.footer.style.setProperty('--footer-dvd-y', `${Math.round(y)}px`);
}

function advanceFooterDvdColor() {
  state.footerDvdColorIndex = (state.footerDvdColorIndex + 1) % FOOTER_DVD_FILTERS.length;
  els.footer.style.setProperty('--footer-dvd-filter', FOOTER_DVD_FILTERS[state.footerDvdColorIndex]);
}

function runFooterBounce(timestamp) {
  if (!state.footerBounce) return;

  const bounds = getFooterBounceBounds();
  const delta = state.footerBounceLastTime ? Math.min(32, timestamp - state.footerBounceLastTime) : 16;
  state.footerBounceLastTime = timestamp;
  let didHitWall = false;

  state.footerBounce.x += state.footerBounce.vx * delta;
  state.footerBounce.y += state.footerBounce.vy * delta;

  if (state.footerBounce.x <= bounds.inset) {
    state.footerBounce.x = bounds.inset;
    state.footerBounce.vx = Math.abs(state.footerBounce.vx);
    didHitWall = true;
  } else if (state.footerBounce.x >= bounds.maxX) {
    state.footerBounce.x = bounds.maxX;
    state.footerBounce.vx = -Math.abs(state.footerBounce.vx);
    didHitWall = true;
  }

  if (state.footerBounce.y <= bounds.inset) {
    state.footerBounce.y = bounds.inset;
    state.footerBounce.vy = Math.abs(state.footerBounce.vy);
    didHitWall = true;
  } else if (state.footerBounce.y >= bounds.maxY) {
    state.footerBounce.y = bounds.maxY;
    state.footerBounce.vy = -Math.abs(state.footerBounce.vy);
    didHitWall = true;
  }

  if (didHitWall) advanceFooterDvdColor();
  setFooterLogoPosition(state.footerBounce.x, state.footerBounce.y);
  state.footerBounceFrame = requestAnimationFrame(runFooterBounce);
}

function stopFooterBounce() {
  if (state.footerBounceFrame) cancelAnimationFrame(state.footerBounceFrame);
  state.footerBounceFrame = null;
  state.footerBounceLastTime = null;
  state.footerBounce = null;
  els.footer.classList.remove('footer-logo-bouncing', 'footer-logo-roaming');
  els.footer.style.removeProperty('--footer-dvd-x');
  els.footer.style.removeProperty('--footer-dvd-y');
  els.footer.style.removeProperty('--footer-dvd-filter');
}

function startFooterBounce() {
  const footerRect = els.footer.getBoundingClientRect();
  const logoRect = els.footerLogoButton.getBoundingClientRect();
  const bounds = getFooterBounceBounds();
  const startX = Math.min(Math.max(logoRect.left - footerRect.left, bounds.inset), bounds.maxX);
  const startY = Math.min(Math.max(logoRect.top - footerRect.top, bounds.inset), bounds.maxY);

  els.footer.classList.add('footer-logo-bouncing');
  state.footerDvdColorIndex = 0;
  els.footer.style.setProperty('--footer-dvd-filter', FOOTER_DVD_FILTERS[state.footerDvdColorIndex]);
  setFooterLogoPosition(startX, startY);

  window.setTimeout(() => {
    if (!els.footer.classList.contains('footer-logo-bouncing')) return;

    els.footer.classList.add('footer-logo-roaming');
    state.footerBounce = {
      x: startX,
      y: startY,
      vx: mobileMediaQuery.matches ? 0.08 : 0.1,
      vy: mobileMediaQuery.matches ? 0.065 : 0.078
    };
    state.footerBounceLastTime = null;
    state.footerBounceFrame = requestAnimationFrame(runFooterBounce);
  }, 260);
}

function toggleFooterBounce() {
  if (els.footer.classList.contains('footer-logo-bouncing')) {
    stopFooterBounce();
  } else {
    startFooterBounce();
  }
}

function clearScreenTransitionClasses() {
  [els.pickerView, els.ratingView, els.decadeView, els.monkeFilterView].forEach((view) => {
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
  const loadToken = ++floatingPosterLoadToken;
  renderPosterMarquee(getFallbackPosterSamples(), { loading: true });

  try {
    if (state.mode === 'monke') {
      const posters = await getPersonalPosterSamples(10);
      if (loadToken !== floatingPosterLoadToken) return;
      renderPosterMarquee(posters, { animateIn: true });
      return;
    }

    const posterCandidates = [];
    const firstPage = Math.floor(Math.random() * 5) + 1;
    const pages = [firstPage, ((firstPage + 1) % 5) + 1, ((firstPage + 2) % 5) + 1];

    const pageResults = await Promise.all(
      pages.map((page) => tmdbFetch('/discover/movie', getFloatingPosterDiscoverParams(page)))
    );
    pageResults.forEach((data) => {
      posterCandidates.push(...data.results.filter((movie) => movie.poster_path));
    });

    const posters = state.physicalMode
      ? await getValidPosterSamples(posterCandidates, 10)
      : await getRuntimeValidPosterSamples(posterCandidates, 10);
    if (loadToken !== floatingPosterLoadToken) return;
    renderPosterMarquee(posters, { animateIn: true });
  } catch (error) {
    console.error(error);
  }
}

async function getPersonalPosterSamples(limit = 10) {
  const rows = shuffle(getFilteredSecretMovies(await loadSecretMovies()));
  const settled = await Promise.allSettled(
    rows.slice(0, limit * 2).map(async (row) => {
      const details = row.tmdbId
        ? await tmdbFetch(`/movie/${row.tmdbId}`, { language: 'en-US' })
        : (await fetchSecretMovieBundle(row))[0];

      return details?.id && details.poster_path && isValidRuntime(details.runtime)
        ? { ...details, ownedPhysical: Boolean(row.ownedPhysical) }
        : null;
    })
  );

  settled
    .filter((result) => result.status === 'rejected')
    .forEach((result) => console.error(result.reason));

  const samples = settled
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value)
    .slice(0, limit);

  return samples.length ? samples : getFallbackPosterSamples();
}

function getFloatingPosterDiscoverParams(page) {
  const params = {
    ...buildDiscoverParams(page),
    page
  };

  if (!state.physicalMode) {
    params.watch_region = 'US';
    params.with_watch_monetization_types = 'flatrate';
  }

  return params;
}

function renderPosterMarquee(posters, options = {}) {
  currentPosterSamples = posters;
  els.posterTrack.classList.toggle('poster-track-loading', Boolean(options.loading));
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

  items.forEach(({ size, movie }, index) => {
    const card = document.createElement(movie?.id ? 'button' : 'div');
    card.className = `float-card ${size} ${movie ? 'poster-card' : 'blank-card'}`.trim();

    if (movie) {
      if (options.animateIn) {
        card.classList.add('poster-card-loading-in');
        card.style.setProperty('--poster-load-delay', `${(index % sizes.length) * 70}ms`);
        card.addEventListener('animationend', () => {
          card.classList.remove('poster-card-loading-in');
          card.style.removeProperty('--poster-load-delay');
        }, { once: true });
      }

      const image = document.createElement('img');
      image.src = movie.localSrc || `${IMAGE_BASE_URL}${movie.poster_path}`;
      image.alt = '';
      image.decoding = 'async';
      image.loading = index < sizes.length ? 'eager' : 'lazy';
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

function getFastPosterSamples(movies, limit = 5) {
  return dedupePosterSamples(shuffle(movies)).slice(0, limit);
}

async function getValidPosterSamples(movies, limit = 5) {
  const samples = [];

  for (const movie of shuffle(movies)) {
    if (samples.length >= limit) break;

    try {
      const [details, , , providers] = await fetchMovieBundle(movie.id);

      if (isValidSampleMovie(details, providers)) {
        samples.push({ ...movie, runtime: details.runtime });
      }
    } catch (error) {
      console.error(error);
    }
  }

  return samples;
}

async function getRuntimeValidPosterSamples(movies, limit = 5) {
  const candidates = dedupePosterSamples(shuffle(movies)).slice(0, limit * 3);
  const settled = await Promise.allSettled(
    candidates.map(async (movie) => {
      const details = await tmdbFetch(`/movie/${movie.id}`, { language: 'en-US' });
      return isValidRuntime(details.runtime) ? { ...movie, runtime: details.runtime } : null;
    })
  );

  return settled
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value)
    .slice(0, limit);
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function renderDecadePills() {
  els.decadesTray.innerHTML = '';
  updateDecadeStage();

  if (!mobileMediaQuery.matches) {
    els.decadesTray.appendChild(createAnyEraButton({ label: 'All eras', useIcon: true }));
  }

  const decades = mobileMediaQuery.matches ? DECADES : DESKTOP_DECADE_ORDER;
  decades.forEach((decade) => {
    const active = state.selectedDecades.includes(decade.label);
    const button = document.createElement('button');
    const useIcon = !mobileMediaQuery.matches && YEAR_ICONS[decade.label];
    button.className = `decade-pill ${useIcon ? 'decade-card has-art' : ''} ${active ? 'active' : ''}`.trim();
    button.type = 'button';
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => toggleDecade(decade.label));
    if (useIcon) {
      appendYearIconContent(button, decade.label, active);
    } else {
      button.textContent = decade.label;
    }
    els.decadesTray.appendChild(button);

    if (mobileMediaQuery.matches && decade.label === "1990's") {
      const breakPoint = document.createElement('span');
      breakPoint.className = 'decade-row-break';
      breakPoint.setAttribute('aria-hidden', 'true');
      els.decadesTray.appendChild(breakPoint);
    }
  });

  if (mobileMediaQuery.matches) {
    els.decadesTray.appendChild(createAnyEraButton({ label: 'Any era ∞', useIcon: false }));
  }
}

function createAnyEraButton({ label, useIcon }) {
  const anyEraButton = document.createElement('button');
  anyEraButton.className = `decade-pill any-era-pill ${useIcon ? 'decade-card has-art' : ''} ${state.anyEraSelected ? 'active' : ''}`.trim();
  anyEraButton.type = 'button';
  anyEraButton.setAttribute('aria-pressed', String(state.anyEraSelected));
  if (useIcon) {
    appendYearIconContent(anyEraButton, 'all', state.anyEraSelected, label);
  } else {
    anyEraButton.textContent = label;
  }
  anyEraButton.addEventListener('click', () => {
    state.selectedDecades = [];
    state.anyEraSelected = !state.anyEraSelected;
    renderDecadePills();
    updateDecadeSummary();
    refreshCount();
  });
  return anyEraButton;
}

function appendYearIconContent(button, iconKey, active, labelText = iconKey) {
  const iconPath = active ? YEAR_ICONS[iconKey].activeIcon : YEAR_ICONS[iconKey].icon;
  button.setAttribute('aria-label', labelText);

  const icon = document.createElement('span');
  icon.className = 'decade-icon';

  const image = document.createElement('img');
  image.src = iconPath;
  image.alt = '';
  icon.appendChild(image);

  const label = document.createElement('span');
  label.className = 'decade-name';
  label.textContent = labelText;

  button.append(icon, label);
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

function renderRatingPills() {
  els.ratingsTray.innerHTML = '';
  updateRatingStage();

  RATINGS.forEach((rating) => {
    const isAny = rating.certification === 'ANY';
    const active = isAny
      ? state.anyRatingSelected
      : state.selectedRatings.includes(rating.certification);
    const iconPath = active ? rating.activeIcon : rating.icon;
    const button = document.createElement('button');
    button.className = `rating-card ${active ? 'active' : ''}`.trim();
    button.type = 'button';
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => toggleRating(rating.certification));

    const icon = document.createElement('span');
    icon.className = 'rating-icon';

    const image = document.createElement('img');
    image.src = iconPath;
    image.alt = '';
    icon.appendChild(image);

    const label = document.createElement('span');
    label.className = 'rating-name';
    label.textContent = rating.label;

    button.append(icon, label);
    els.ratingsTray.appendChild(button);
  });
}

function renderMonkeFormatPills() {
  els.monkeFormatTray.innerHTML = '';

  MONKE_FORMATS.forEach((format) => {
    const active = state.monkeFormats.includes(format.id);
    const button = document.createElement('button');
    button.className = `monke-format-card ${active ? 'active' : ''}`.trim();
    button.type = 'button';
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => toggleMonkeFormat(format.id));

    const icon = document.createElement('span');
    icon.className = 'monke-format-icon';

    const image = document.createElement('img');
    image.src = active ? format.activeIcon : format.icon;
    image.alt = '';
    icon.appendChild(image);

    const label = document.createElement('span');
    label.className = 'monke-format-name';
    label.textContent = format.label;

    button.append(icon, label);
    els.monkeFormatTray.appendChild(button);
  });

  updateMonkeFormatSummary();
}

function updateGenreStage() {
  els.appShell.dataset.genreCount = String(Math.min(state.selectedGenreIds.length, 2));
  updateGenreBackClearButtons();
}

function updateRatingStage() {
  const ratingCount = state.anyRatingSelected ? 1 : Math.min(state.selectedRatings.length, 2);
  els.appShell.dataset.ratingCount = String(ratingCount);
}

function updateDecadeStage() {
  const decadeCount = state.anyEraSelected ? 1 : Math.min(state.selectedDecades.length, 2);
  els.appShell.dataset.decadeCount = String(decadeCount);
}

function updateGenreBackClearButtons() {
  const hasGenreFilters = state.selectedGenreIds.length > 0;
  const label = hasGenreFilters ? 'Clear' : 'Back';
  [els.clearFilters, els.headerClearFilters].forEach((button) => {
    if (!button) return;
    button.textContent = label;
    button.setAttribute('aria-label', hasGenreFilters ? 'Clear genre filters' : 'Back to homepage');
  });
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

function toggleRating(certification) {
  if (certification === 'ANY') {
    state.selectedRatings = [];
    state.anyRatingSelected = !state.anyRatingSelected;
  } else {
    state.anyRatingSelected = false;
    if (state.selectedRatings.includes(certification)) {
      state.selectedRatings = state.selectedRatings.filter((rating) => rating !== certification);
    } else {
      state.selectedRatings = [...state.selectedRatings, certification];
    }
  }

  renderRatingPills();
  updateRatingSummary();
  refreshCount();
}

function toggleDecade(label) {
  state.anyEraSelected = false;
  if (state.selectedDecades.includes(label)) {
    state.selectedDecades = state.selectedDecades.filter((decade) => decade !== label);
  } else {
    state.selectedDecades = [...state.selectedDecades, label];
  }

  renderDecadePills();
  updateDecadeSummary();
  refreshCount();
}

function toggleMonkeFormat(formatId) {
  if (state.monkeFormats.includes(formatId)) {
    state.monkeFormats = state.monkeFormats.filter((format) => format !== formatId);
  } else {
    state.monkeFormats = [...state.monkeFormats, formatId];
  }

  renderMonkeFormatPills();
  loadFloatingPosters();
}

function getSelectedRatingLabels() {
  return RATINGS
    .filter((rating) => rating.certification !== 'ANY' && state.selectedRatings.includes(rating.certification))
    .map((rating) => rating.label);
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

function updateRatingSummary() {
  if (state.anyRatingSelected) {
    els.ratingSummary.textContent = 'Selected: Any rating';
    return;
  }

  const selectedRatings = getSelectedRatingLabels();
  if (!selectedRatings.length) {
    els.ratingSummary.textContent = 'Choose any ratings, or leave it open for all MPAA ratings.';
    return;
  }

  els.ratingSummary.textContent = `Selected: ${selectedRatings.join(' + ')}`;
}

function updateDecadeSummary() {
  if (state.anyEraSelected) {
    els.decadeSummary.textContent = 'Selected: All eras';
    return;
  }

  if (!state.selectedDecades.length) {
    els.decadeSummary.textContent = 'Choose any decades, or leave it open for all eras.';
    return;
  }

  els.decadeSummary.textContent = `Selected: ${state.selectedDecades.join(' + ')}`;
}

function updateMonkeFormatSummary() {
  updateMonkeFormatCount();

  if (!state.monkeFormats.length || state.monkeFormats.length === MONKE_FORMATS.length) {
    els.monkeFormatSummary.textContent = 'Selected: Stream + Blu-ray';
    return;
  }

  const selectedFormats = MONKE_FORMATS
    .filter((format) => state.monkeFormats.includes(format.id))
    .map((format) => format.label);
  els.monkeFormatSummary.textContent = `Selected: ${selectedFormats.join(' + ')}`;
}

async function updateMonkeFormatCount() {
  if (!els.monkeFormatResultCount) return;

  [els.monkeFormatResultCount, els.monkeHeaderFormatResultCount].forEach((count) => {
    if (count) count.textContent = '-';
  });

  try {
    const rows = await loadSecretMovies();
    const countText = getFilteredSecretMovies(rows).length.toLocaleString();
    [els.monkeFormatResultCount, els.monkeHeaderFormatResultCount].forEach((count) => {
      if (count) count.textContent = countText;
    });
  } catch (error) {
    console.error(error);
    [els.monkeFormatResultCount, els.monkeHeaderFormatResultCount].forEach((count) => {
      if (count) count.textContent = '-';
    });
  }
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

  if (state.selectedRatings.length && !state.anyRatingSelected) {
    params.certification_country = 'US';
    params.certification = state.selectedRatings.join('|');
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
  els.genreHeaderResultCount.textContent = '...';
  els.ratingResultCount.textContent = '...';
  els.ratingHeaderResultCount.textContent = '...';
  els.decadeResultCount.textContent = '...';
  els.decadeHeaderResultCount.textContent = '...';

  try {
    const decadeLabels = state.selectedDecades.length ? state.selectedDecades : [null];
    const counts = await Promise.all(
      decadeLabels.map((decade) => tmdbFetch('/discover/movie', buildDiscoverParams(1, decade)))
    );
    const totalResults = counts.reduce((total, data) => total + data.total_results, 0);
    els.resultCount.textContent = totalResults.toLocaleString();
    els.genreHeaderResultCount.textContent = totalResults.toLocaleString();
    els.ratingResultCount.textContent = totalResults.toLocaleString();
    els.ratingHeaderResultCount.textContent = totalResults.toLocaleString();
    els.decadeResultCount.textContent = totalResults.toLocaleString();
    els.decadeHeaderResultCount.textContent = totalResults.toLocaleString();
  } catch (error) {
    console.error(error);
    els.resultCount.textContent = '-';
    els.genreHeaderResultCount.textContent = '-';
    els.ratingResultCount.textContent = '-';
    els.ratingHeaderResultCount.textContent = '-';
    els.decadeResultCount.textContent = '-';
    els.decadeHeaderResultCount.textContent = '-';
  } finally {
    state.isLoadingCount = false;
  }
}

async function pickRandomMovie(options = {}) {
  const cyclePoster = options.cyclePosterOnly && state.activeView === 'result';
  const animateCopy = !state.hasShownResult || state.activeView !== 'result';
  const shouldAnticipate = animateCopy && !cyclePoster;
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

    const validResults = await getRandomCandidateMovies(firstPage, decade);
    const [details, credits, videos, providers, releaseDates] = await fetchValidMovieBundle(validResults);

    await preloadPoster(details.poster_path);
    if (shouldAnticipate) {
      await posterExitDelay;
      await runResultAnticipationReveal(details, credits, videos, providers, releaseDates, state.physicalMode ? 'physical' : 'filtered');
    } else {
      await posterExitDelay;
      setResultSource(state.physicalMode ? 'physical' : 'filtered');
      renderMovie(details, credits, videos, providers, releaseDates);
      showView('result');
    }

    if (!shouldAnticipate) setResultSource(state.physicalMode ? 'physical' : 'filtered');
    animateResultReveal({ animateCopy, cyclePoster, personalReveal: shouldAnticipate });
    state.hasShownResult = true;
  } catch (error) {
    console.error(error);
    alert(error.message || 'Something went wrong while picking a movie.');
  } finally {
    setLoading(false);
  }
}

async function getRandomCandidateMovies(firstPage, decade) {
  const maxPage = Math.min(firstPage.total_pages, 20);
  const pages = new Set([1]);

  while (pages.size < Math.min(4, maxPage)) {
    pages.add(Math.floor(Math.random() * maxPage) + 1);
  }

  const pageResults = await Promise.all(
    [...pages].map((page) => (
      page === 1
        ? Promise.resolve(firstPage)
        : tmdbFetch('/discover/movie', buildDiscoverParams(page, decade))
    ))
  );

  const seen = new Set();
  const candidates = pageResults
    .flatMap((page) => page.results || [])
    .filter((movie) => {
      if (!movie.poster_path || seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });

  return shuffle(candidates);
}

async function showFloatingMovie(movieId) {
  setLoading(true);

  try {
    const [details, credits, videos, providers, releaseDates] = await fetchMovieBundle(movieId);
    if (!isValidRuntime(details.runtime)) {
      throw new Error('That sample is longer than 1h 45m, so it is not available in this picker.');
    }
    await preloadPoster(details.poster_path);
    setResultSource('sample');
    renderMovie(details, credits, videos, providers, releaseDates);
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

  setAppMode('monke', { refreshPosters: false });
  state.hasShownResult = false;
  loadFloatingPosters();
  showView('landing');
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
    const rows = getFilteredSecretMovies(await loadSecretMovies());
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
      await runResultAnticipationReveal(details, credits, videos, providers, releaseDates, 'secret');
    } else {
      await posterExitDelay;
      setResultSource('secret');
      renderMovie(details, credits, videos, providers, releaseDates);
    }

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

function getFilteredSecretMovies(rows) {
  const selectedFormats = state.monkeFormats;

  if (!selectedFormats.length || selectedFormats.length === MONKE_FORMATS.length) {
    return rows;
  }

  if (selectedFormats.includes('bluray')) {
    return rows.filter((row) => row.ownedPhysical);
  }

  if (selectedFormats.includes('stream')) {
    return rows.filter((row) => !row.ownedPhysical);
  }

  return rows;
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
  const physicalNote = get('note', 'physical', 'owned physical', 'owned_physical', 'blu-ray', 'blu_ray');

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
  return /blu[\s-]?ray|owned|yes|true/i.test(String(value || ''));
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

  for (const movie of fallbackCandidates.slice(0, 60)) {
    const bundle = await fetchMovieBundle(movie.id);
    const [details, , , providers] = bundle;

    if (!isValidRuntime(details.runtime)) continue;

    const hasStreamers = hasStreamingProviders(providers.results?.US || providers.results?.GB || null);
    if (state.physicalMode ? !hasStreamers : hasStreamers) {
      return bundle;
    }
  }

  throw new Error(state.physicalMode
    ? 'No physical-media matches found for the current filters.'
    : 'No streaming matches found for the current filters.');
}

function isValidRuntime(runtime) {
  return runtime && runtime <= MAX_RUNTIME_MINUTES;
}

function isValidSampleMovie(details, providers) {
  if (!isValidRuntime(details.runtime)) return false;

  const hasStreamers = hasStreamingProviders(providers.results?.US || providers.results?.GB || null);
  return state.physicalMode ? !hasStreamers : hasStreamers;
}

function hasStreamingProviders(regionData) {
  return Boolean(regionData?.flatrate?.length);
}

function updatePhysicalModeCopy() {
  state.physicalMode = state.mode === 'physical';
  state.secretActive = state.mode === 'monke';
  els.appShell.dataset.physicalMode = state.physicalMode ? 'true' : 'false';
  els.appShell.dataset.appMode = state.mode;

  if (els.modeToggle) {
    const label = state.mode === 'monke'
      ? 'Monke mode'
      : state.physicalMode ? 'Blu-ray mode' : 'Streamer mode';
    els.modeToggle.textContent = label;
    els.modeToggle.setAttribute('aria-pressed', String(state.mode !== 'streamer'));
  }

  if (state.mode === 'monke') {
    els.heroEyebrow.textContent = 'HELLO MONKE';
    els.heroSupport.textContent = "Let's pick from our agreed upon list. And let's remember to check stuff off and add stuff as we move forward.";
    els.startPicking.textContent = 'OK PRECIOUS';
  } else if (state.physicalMode) {
    els.heroEyebrow.textContent = 'Got 90ish min? Own a blu-ray player?';
    els.heroSupport.textContent = "Choose your favorite genre, choose your era, and let's pick a comfy 90ish minute movie for you. It's up to you to go find it at your local physical media store....or you can support a blood thirsty corporate giant, I'm not your dad.";
    els.startPicking.textContent = 'Lets Go';
  } else {
    els.heroEyebrow.textContent = 'Got 90ish min?';
    els.heroSupport.innerHTML = "Choose your favorite genre, choose your era, and let's pick a comfy 90ish minute movie for&nbsp;you.";
    els.startPicking.textContent = 'Lets Go';
  }
}

function setAppMode(mode, options = {}) {
  if (state.mode === mode) return;
  state.mode = mode;
  state.physicalMode = mode === 'physical';
  state.secretActive = mode === 'monke';
  if (mode !== 'monke') state.monkeFormats = [];
  state.hasShownResult = false;
  updatePhysicalModeCopy();
  renderMonkeFormatPills();
  if (options.refreshPosters !== false) loadFloatingPosters();
  if (mode === 'monke') showView('landing');
}

function setPhysicalMode(isPhysical) {
  setAppMode(isPhysical ? 'physical' : 'streamer');
}

function startPhysicalFlow() {
  setAppMode('physical');
  showView('landing');
}

function cycleAppMode() {
  const shouldReturnHome = state.activeView === 'result';

  if (state.mode === 'streamer') {
    setAppMode('physical');
  } else {
    setAppMode('streamer');
  }

  if (shouldReturnHome) showView('landing');
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
  els.posterButton.classList.remove('result-poster-enter', 'result-poster-fanfare', 'poster-cycle-in', 'poster-cycle-out', 'personal-card-rest', 'personal-poster-reveal', 'personal-stroke-reveal', 'personal-stroke-visible');
  void els.posterButton.offsetWidth;
  els.posterButton.classList.add('poster-cycle-out');
}

function runPersonalPickAnticipation() {
  els.movieResult.classList.add('personal-picking');
  els.posterButton.classList.remove('result-poster-enter', 'result-poster-fanfare', 'poster-cycle-in', 'poster-cycle-out', 'personal-card-rest', 'personal-poster-reveal', 'personal-stroke-reveal', 'personal-stroke-visible');
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

async function runResultAnticipationReveal(details, credits, videos, providers, releaseDates, resultSource) {
  setResultSource(resultSource);
  showView('result');
  const anticipation = runPersonalPickAnticipation();

  await wait(1520);
  els.posterButton.classList.add('personal-card-rest');
  renderMovie(details, credits, videos, providers, releaseDates);
  els.movieCopy.classList.add('personal-copy-pending');
  els.posterButton.querySelector('.personal-pick-reel')?.remove();
  els.movieResult.classList.remove('personal-picking');
  els.posterButton.classList.remove('personal-card-rest');
  els.posterButton.classList.add('personal-poster-reveal');

  await wait(1240);
  await revealPersonalPosterStroke();
  await wait(220);
  anticipation.then(() => {});
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
  els.posterButton.classList.remove('result-poster-enter', 'result-poster-fanfare', 'poster-cycle-in', 'poster-cycle-out', 'personal-card-rest', 'personal-stroke-reveal');
  if (!personalReveal) {
    els.posterButton.classList.remove('personal-poster-reveal', 'personal-stroke-visible');
  }
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
    els.movieCopy.classList.remove('personal-copy-pending');
    els.movieCopy.classList.add('result-copy-enter');
    els.movieCopy.classList.add('result-lockup-enter');
  } else if (cyclePoster) {
    els.movieCopy.classList.remove('personal-copy-pending');
    els.movieCopy.classList.add('result-lockup-cycle');
  } else {
    els.movieCopy.classList.remove('personal-copy-pending');
  }

  updateTitleSize();
  updateResultLayoutGuards();
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

function updateResultLayoutGuards() {
  els.movieCopy.classList.remove('compact-overview');

  if (mobileMediaQuery.matches || state.activeView !== 'result' || els.overview.classList.contains('expanded')) {
    updateOverviewToggle();
    return;
  }

  requestAnimationFrame(() => {
    els.movieCopy.classList.remove('compact-overview');

    const posterRect = els.posterButton.getBoundingClientRect();
    const actionsRect = els.resultActions.getBoundingClientRect();
    if (actionsRect.bottom > posterRect.bottom) {
      els.movieCopy.classList.add('compact-overview');
    }

    updateOverviewToggle();
  });
}

function renderMovie(details, credits, videos, providerData, releaseDates) {
  const director = credits.crew.find((person) => person.job === 'Director')?.name || '-';
  const cast = credits.cast.slice(0, 5);
  const trailer = videos.results.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer'
  );
  const certification = getCertification(releaseDates);
  state.currentResultMovie = details;

  els.poster.src = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : '';
  els.poster.alt = `${details.title} poster`;
  els.title.textContent = formatTitleForBalancedWrap(details.title);
  els.title.href = getLetterboxdFilmUrl(details);
  els.title.setAttribute('aria-label', `Find ${details.title} on Letterboxd`);
  updateTitleSize();
  els.year.textContent = (details.release_date || '-').slice(0, 4);
  els.runtime.textContent = formatRuntime(details.runtime);
  els.rating.textContent = certification;
  els.rating.classList.toggle('hidden', !certification);
  els.director.textContent = director;
  els.overview.textContent = details.overview || '';
  els.movieCopy.classList.remove('compact-overview');
  els.overview.classList.remove('expanded');
  els.toggleOverview.textContent = 'See more';
  updateOverviewToggle();
  renderCast(cast);
  renderResultFilters(details);

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
  els.titleHeading.classList.remove('long-title', 'balanced-title', 'actions-collision-title');

  if (shouldUseBalancedTitleSize(els.title.textContent)) {
    els.titleHeading.classList.add('balanced-title');
  }

  requestAnimationFrame(() => {
    const styles = window.getComputedStyle(els.titleHeading);
    const lineHeight = parseFloat(styles.lineHeight);
    if (!lineHeight) return;

    const lineCount = Math.round(els.titleHeading.scrollHeight / lineHeight);
    if (lineCount >= 3) {
      els.titleHeading.classList.add('long-title');
      updateResultLayoutGuards();
      return;
    }

    if (shouldReduceTitleForActions()) {
      els.titleHeading.classList.add('actions-collision-title');
    }

    updateResultLayoutGuards();
  });
}

function formatTitleForBalancedWrap(title) {
  return String(title || '').trim().replace(/\s+(\S+)\s*$/, '\u00a0$1');
}

function shouldUseBalancedTitleSize(title) {
  const words = String(title || '').trim().split(/\s+/).filter(Boolean);
  const characterCount = words.join(' ').length;

  return words.length >= 4 && characterCount >= 30 && characterCount < 48;
}

function shouldReduceTitleForActions() {
  if (mobileMediaQuery.matches || state.activeView !== 'result') return false;

  const watchBlock = els.movieCopy.querySelector('.watch-block');
  if (!watchBlock || !els.tryAgain) return false;

  const watchRect = watchBlock.getBoundingClientRect();
  const actionsRect = els.tryAgain.getBoundingClientRect();
  const lockupBottom = watchRect.bottom + 120;

  return actionsRect.top > lockupBottom;
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
      image.decoding = 'async';
      image.loading = 'lazy';

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

function renderResultFilters(movie = null) {
  const filters = getResultFilterItems(movie);
  els.resultFilters.replaceChildren();
  els.resultFilters.classList.toggle('hidden', !filters.length);

  filters.forEach((filter) => {
    const pill = document.createElement(filter.removable ? 'button' : 'span');
    pill.className = 'result-filter-pill';
    pill.textContent = filter.label;
    pill.dataset.filterKey = getResultFilterKey(filter);
    if (filter.removable) {
      pill.type = 'button';
      pill.dataset.filterType = filter.type;
      pill.dataset.filterValues = filter.values.join(',');
      pill.setAttribute('aria-label', `Remove ${filter.label} and reroll`);
    }
    els.resultFilters.appendChild(pill);
  });
}

function getResultFilterKey(filter) {
  return `${filter.type}:${filter.label}:${filter.values.join('|')}`;
}

function getResultFilterItems(movie = null) {
  if (state.resultSource === 'sample') return [];

  if (state.resultSource === 'secret') {
    const genres = getMovieGenrePills(movie);
    const formats = getSecretFormatPills();

    return [...genres, ...formats];
  }

  const genres = state.genres
    .filter((genre) => state.selectedGenreIds.includes(genre.id))
    .map((genre) => ({
      label: genre.name,
      removable: true,
      type: 'genre',
      values: [String(genre.id)]
    }));
  const ratings = state.anyRatingSelected
    ? [{ label: 'Any rating', removable: false, type: 'rating', values: [] }]
    : formatSelectedRatingPills(state.selectedRatings);
  const eras = state.anyEraSelected
    ? [{ label: 'All eras', removable: false, type: 'era', values: [] }]
    : formatSelectedEraPills(state.selectedDecades);

  return [
    ...(genres.length ? genres : [{ label: 'Any vibe', removable: false, type: 'genre', values: [] }]),
    ...(ratings.length ? ratings : [{ label: 'Any rating', removable: false, type: 'rating', values: [] }]),
    ...(eras.length ? eras : [{ label: 'All eras', removable: false, type: 'era', values: [] }])
  ];
}

function getMovieGenrePills(movie) {
  return (movie?.genres || [])
    .filter((genre) => genre?.name)
    .map((genre) => ({
      label: genre.name,
      removable: false,
      type: 'movieGenre',
      values: [String(genre.id || '')]
    }));
}

function getSecretFormatPills() {
  if (!state.monkeFormats.length || state.monkeFormats.length === MONKE_FORMATS.length) {
    return [{ label: 'Stream + Blu-ray', removable: false, type: 'monkeFormat', values: [] }];
  }

  return MONKE_FORMATS
    .filter((format) => state.monkeFormats.includes(format.id))
    .map((format) => ({
      label: format.label,
      removable: true,
      type: 'monkeFormat',
      values: [format.id]
    }));
}

function formatSelectedEraPills(selectedDecades) {
  const selected = DECADES
    .filter((decade) => selectedDecades.includes(decade.label))
    .map((decade) => ({ label: decade.label, start: decade.start }));

  if (!selected.length) return [];

  const ranges = [];
  let rangeStart = selected[0];
  let previous = selected[0];

  selected.slice(1).forEach((decade) => {
    if (decade.start === previous.start + 10) {
      previous = decade;
      return;
    }

    ranges.push(formatEraRange(rangeStart, previous));
    rangeStart = decade;
    previous = decade;
  });

  ranges.push(formatEraRange(rangeStart, previous));
  return ranges;
}

function formatEraRange(startDecade, endDecade) {
  const startIndex = DECADES.findIndex((decade) => decade.label === startDecade.label);
  const endIndex = DECADES.findIndex((decade) => decade.label === endDecade.label);
  const values = DECADES.slice(startIndex, endIndex + 1).map((decade) => decade.label);
  return {
    label: startDecade.label === endDecade.label ? startDecade.label : `${startDecade.label}-${endDecade.label}`,
    removable: true,
    type: 'era',
    values
  };
}

function formatSelectedRatingPills(selectedRatings) {
  const selected = RATINGS
    .filter((rating) => rating.certification !== 'ANY' && selectedRatings.includes(rating.certification))
    .map((rating) => ({ label: rating.label, value: rating.certification }));

  if (selected.length <= 1) {
    return selected.map((rating) => ({
      label: rating.label,
      removable: true,
      type: 'rating',
      values: [rating.value]
    }));
  }
  return [{
    label: `${selected[0].label}-${selected[selected.length - 1].label}`,
    removable: true,
    type: 'rating',
    values: selected.map((rating) => rating.value)
  }];
}

function renderProviders(regionData, movie) {
  els.providers.innerHTML = '';

  const shouldShowPhysical = movie?.ownedPhysical || state.resultSource === 'physical';
  if (shouldShowPhysical) {
    const marker = createProviderLink({
      name: movie?.ownedPhysical ? 'Owned on Blu-ray' : 'Blu-ray',
      url: getPhysicalMediaUrl(movie),
      logoSrc: PHYSICAL_MEDIA_LOGO
    });
    els.providers.appendChild(marker);
  }

  const flatrate = regionData?.flatrate || [];
  if (!flatrate.length || state.resultSource === 'physical') {
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
    logo.decoding = 'async';
    logo.loading = 'lazy';
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
  const query = encodeURIComponent(`${title} ${year} blu-ray`);
  return `https://www.amazon.com/s?k=${query}`;
}

function getLetterboxdFilmUrl(movie) {
  if (movie?.imdb_id) {
    return `https://letterboxd.com/imdb/${movie.imdb_id}/`;
  }

  const title = movie?.title || 'movie';
  return `https://letterboxd.com/film/${getLetterboxdSlug(title)}/`;
}

function getLetterboxdSlug(title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[\u00b7\u2018\u2019']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function getCurrentLetterboxdUrl() {
  return els.title.href || '';
}

function handleTitleLetterboxdClick(event) {
  const url = getCurrentLetterboxdUrl();
  if (!url) {
    event.preventDefault();
    return;
  }

  els.title.href = url;
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
    [/arrow/, 'https://www.arrow-player.com/'],
    [/shudder/, 'https://www.shudder.com/'],
    [/amc\+|amc plus/, 'https://www.amcplus.com/'],
    [/criterion/, 'https://www.criterionchannel.com/search'],
    [/mubi/, 'https://mubi.com/search'],
    [/fandor/, 'https://www.fandor.com/'],
    [/film movement/, 'https://www.filmmovementplus.com/'],
    [/night flight/, 'https://www.nightflightplus.com/'],
    [/britbox/, 'https://www.britbox.com/'],
    [/acorn/, 'https://www.acorn.tv/'],
    [/kanopy/, 'https://www.kanopy.com/search'],
    [/hoopla/, 'https://www.hoopladigital.com/'],
    [/tubi/, 'https://tubitv.com/search/'],
    [/plex/, 'https://watch.plex.tv/'],
    [/roku/, 'https://therokuchannel.roku.com/'],
    [/freevee/, 'https://www.amazon.com/gp/video/storefront/'],
    [/fubo/, 'https://www.fubo.tv/'],
    [/philo/, 'https://www.philo.com/'],
    [/youtube/, 'https://www.youtube.com/feed/storefront'],
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
  els.pickMonkeMovie.disabled = isLoading;
  els.headerPickMonkeMovie.disabled = isLoading;
  els.tryAgain.disabled = isLoading;
  els.pickMovie.textContent = isLoading ? 'Picking...' : "Let's do it";
  els.headerPickMovie.textContent = isLoading ? 'Picking...' : "Let's do it";
  els.pickMonkeMovie.textContent = isLoading ? 'Picking...' : 'OK Precious';
  els.headerPickMonkeMovie.textContent = isLoading ? 'Picking...' : 'OK Precious';
  els.tryAgain.textContent = isLoading ? 'Picking...' : 'Try Again';
}

function getRandomTryAgainLabel() {
  if (!state.tryAgainLabelBag.length) {
    state.tryAgainLabelBag = shuffle(TRY_AGAIN_HOVER_LABELS);
    if (state.tryAgainLabelBag[0] === state.lastTryAgainLabel && state.tryAgainLabelBag.length > 1) {
      state.tryAgainLabelBag.push(state.tryAgainLabelBag.shift());
    }
  }

  const label = state.tryAgainLabelBag.shift();
  state.lastTryAgainLabel = label;
  return label;
}

function startTryAgainHoverLabels({ force = false } = {}) {
  if (!force && els.tryAgain.dataset.hoverLabel && els.tryAgain.classList.contains('try-again-hovering')) {
    return;
  }

  if (state.tryAgainExitTimer) {
    window.clearTimeout(state.tryAgainExitTimer);
    state.tryAgainExitTimer = null;
  }
  els.tryAgain.classList.remove('try-again-leaving');
  els.tryAgain.classList.add('try-again-hovering');
  els.tryAgain.dataset.hoverLabel = getRandomTryAgainLabel();
}

function rotateTryAgainTouchLabel(event) {
  if (event.pointerType === 'mouse' || els.tryAgain.disabled) return;
  startTryAgainHoverLabels({ force: true });
}

function stopTryAgainHoverLabels() {
  if (!els.tryAgain.dataset.hoverLabel) return;
  els.tryAgain.classList.remove('try-again-hovering');
  els.tryAgain.classList.add('try-again-leaving');
  state.tryAgainExitTimer = window.setTimeout(() => {
    els.tryAgain.classList.remove('try-again-leaving');
    delete els.tryAgain.dataset.hoverLabel;
    state.tryAgainExitTimer = null;
  }, 240);
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
  state.selectedRatings = [];
  state.anyRatingSelected = false;
  state.selectedDecades = [];
  state.anyEraSelected = false;
  renderGenrePills();
  renderRatingPills();
  renderDecadePills();
  updateSelectionSummary();
  updateRatingSummary();
  updateDecadeSummary();
  refreshCount();
}

function syncFilterControls() {
  renderGenrePills();
  renderRatingPills();
  renderDecadePills();
  if (state.mode === 'monke' || state.resultSource === 'secret') {
    renderMonkeFormatPills();
  }
  updateSelectionSummary();
  updateRatingSummary();
  updateDecadeSummary();
  refreshCount();
}

async function handleResultFilterDismiss(event) {
  const pill = event.target.closest('.result-filter-pill[data-filter-type]');
  if (!pill || pill.classList.contains('is-dismissing')) return;

  const values = pill.dataset.filterValues.split(',').filter(Boolean);
  if (!values.length) return;
  const previousRects = getResultFilterRects();
  await animateResultFilterDismiss(pill);

  switch (pill.dataset.filterType) {
    case 'genre':
      state.selectedGenreIds = state.selectedGenreIds.filter((id) => !values.includes(String(id)));
      break;
    case 'rating':
      state.anyRatingSelected = false;
      state.selectedRatings = state.selectedRatings.filter((rating) => !values.includes(rating));
      break;
    case 'era':
      state.anyEraSelected = false;
      state.selectedDecades = state.selectedDecades.filter((decade) => !values.includes(decade));
      break;
    case 'monkeFormat':
      state.monkeFormats = state.monkeFormats.filter((format) => !values.includes(format));
      break;
    default:
      return;
  }

  syncFilterControls();
  renderResultFilters(state.currentResultMovie);
  animateResultFilterReflow(previousRects);
}

function getResultFilterRects() {
  return new Map(
    Array.from(els.resultFilters.querySelectorAll('.result-filter-pill[data-filter-key]')).map((pill) => [
      pill.dataset.filterKey,
      pill.getBoundingClientRect()
    ])
  );
}

function animateResultFilterDismiss(pill) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }

  pill.classList.add('is-dismissing');
  return new Promise((resolve) => {
    const finish = () => {
      pill.removeEventListener('transitionend', finish);
      resolve();
    };

    pill.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 180);
  });
}

function animateResultFilterReflow(previousRects) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  els.resultFilters.querySelectorAll('.result-filter-pill[data-filter-key]').forEach((pill) => {
    const previousRect = previousRects.get(pill.dataset.filterKey);
    if (!previousRect) {
      animateResultFilterEntrance(pill);
      return;
    }

    const nextRect = pill.getBoundingClientRect();
    const deltaX = previousRect.left - nextRect.left;
    const deltaY = previousRect.top - nextRect.top;
    if (!deltaX && !deltaY) return;

    pill.style.transition = 'none';
    pill.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    requestAnimationFrame(() => {
      pill.style.transition = '';
      pill.style.transform = '';
    });
  });
}

function animateResultFilterEntrance(pill) {
  if (!pill.textContent.trim().toLowerCase().startsWith('any ')) return;

  pill.style.transition = 'none';
  pill.style.opacity = '0';
  pill.style.transform = 'translateX(-18px) scale(0.94)';

  requestAnimationFrame(() => {
    pill.style.transition = '';
    pill.style.opacity = '';
    pill.style.transform = '';
  });
}

function handleGenreBackClear() {
  if (!state.selectedGenreIds.length) {
    showView('landing');
    return;
  }

  clearFilters();
}

async function clearFiltersAndReturn() {
  if (state.resultSource === 'secret') {
    els.movieResult.classList.add('sample-result-exit');
    await wait(760);
    els.movieResult.classList.remove('sample-result-exit');
    els.posterTrack.classList.remove('paused');
    showView('monkeFilter');
    return;
  }

  if (state.resultSource === 'sample') {
    els.movieResult.classList.add('sample-result-exit');
    await wait(760);
    els.movieResult.classList.remove('sample-result-exit');
    els.posterTrack.classList.remove('paused');
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
  els.clearResultFilters.textContent = source === 'sample' || source === 'secret' ? 'Go Back' : 'Back to filters';
}

function wireEvents() {
  els.homeButton.addEventListener('click', () => showView('landing'));
  els.startPicking.addEventListener('click', () => {
    if (state.mode === 'monke') {
      showView('monkeFilter');
      return;
    }

    showView('picker');
  });
  els.goToRatings.addEventListener('click', () => showView('rating'));
  els.headerGoToRatings.addEventListener('click', () => showView('rating'));
  els.goToDecades.addEventListener('click', () => showView('decade'));
  els.headerGoToDecades.addEventListener('click', () => showView('decade'));
  els.backToGenres.addEventListener('click', () => showView('picker'));
  els.headerBackToGenres.addEventListener('click', () => showView('picker'));
  els.backToRatings.addEventListener('click', () => showView('rating'));
  els.headerBackToRatings.addEventListener('click', () => showView('rating'));
  els.pickMovie.addEventListener('click', pickRandomMovie);
  els.pickMonkeMovie.addEventListener('click', pickSecretMovie);
  els.headerPickMonkeMovie.addEventListener('click', pickSecretMovie);
  els.backToMonkeHome.addEventListener('click', () => showView('landing'));
  els.headerBackToMonkeHome.addEventListener('click', () => showView('landing'));
  els.headerPickMovie.addEventListener('click', pickRandomMovie);
  els.headerClearFilters.addEventListener('click', handleGenreBackClear);
  els.tryAgain.addEventListener('click', () => {
    if (state.resultSource === 'secret') {
      pickSecretMovie({ cyclePosterOnly: true });
      return;
    }

    pickRandomMovie({ cyclePosterOnly: true });
  });
  els.tryAgain.addEventListener('pointerdown', rotateTryAgainTouchLabel);
  els.tryAgain.addEventListener('mouseenter', startTryAgainHoverLabels);
  els.tryAgain.addEventListener('focus', startTryAgainHoverLabels);
  els.tryAgain.addEventListener('mouseleave', stopTryAgainHoverLabels);
  els.tryAgain.addEventListener('blur', stopTryAgainHoverLabels);
  els.toggleOverview.addEventListener('click', () => {
    const expanded = els.overview.classList.toggle('expanded');
    els.toggleOverview.textContent = expanded ? 'See less' : 'See more';
    updateResultLayoutGuards();
  });
  els.posterButton.addEventListener('click', openTrailer);
  els.title.addEventListener('click', handleTitleLetterboxdClick);
  els.resultFilters.addEventListener('click', handleResultFilterDismiss);
  els.closeTrailer.addEventListener('click', closeTrailer);
  els.trailerModal.addEventListener('click', (event) => {
    if (event.target === els.trailerModal) closeTrailer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTrailer();
  });
  els.clearFilters.addEventListener('click', handleGenreBackClear);
  els.clearResultFilters.addEventListener('click', clearFiltersAndReturn);
  els.footerLogoButton.addEventListener('click', toggleFooterBounce);
  els.secretFlowTrigger.addEventListener('click', startSecretFlow);
  els.physicalFlowTrigger.addEventListener('click', startPhysicalFlow);
  els.modeToggle.addEventListener('click', cycleAppMode);
  window.addEventListener('scroll', updateMobileActionOffset, { passive: true });
  window.addEventListener('resize', () => {
    scheduleMobileActionOffsetUpdate();
    updatePosterLoopWidth();
    updateTitleSize();
  });
  mobileMediaQuery.addEventListener('change', () => {
    scheduleMobileActionOffsetUpdate();
    renderPosterMarquee(currentPosterSamples);
    renderDecadePills();
    updateResultLayoutGuards();
  });
}

async function init() {
  els.appShell.dataset.view = state.activeView;
  els.appShell.dataset.resultSource = state.resultSource;
  updatePhysicalModeCopy();
  scheduleMobileActionOffsetUpdate();
  updateSelectionSummary();
  renderRatingPills();
  updateRatingSummary();
  renderDecadePills();
  updateDecadeSummary();
  renderMonkeFormatPills();
  wireEvents();
  playLandingIntro();
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
