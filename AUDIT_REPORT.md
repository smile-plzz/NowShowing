# AUDIT_REPORT.md
**NowShowing — Phase 1: Product Manager Audit**
_Completed before any code changes_

---

## Executive Summary

NowShowing is a well-conceived movie streaming aggregator with solid core functionality: search, browsing, multi-source video playback, watchlist, and continue-watching all work. The app is deployed as a Vercel static site with serverless API routes and has a clean dark-themed UI.

However, the project suffers from several issues that prevent it from feeling polished: the navbar is cluttered with developer-facing utility buttons that confuse end users; a dead-code Ctrl+R keyboard shortcut overrides the browser's native page reload; the news "load more" button is permanently hidden due to a pagination math bug; stale dead code in `getImageStats`/`showImageStatus` litters the codebase; there is no search-type filter (Movie vs Series); and the video availability check system is architecturally unreliable. These are all fixable without touching the core feature set.

---

## Prioritized Issue Registry

---

### 🔴 CRITICAL

---

**ISS-001**
**Title:** Ctrl+R keyboard shortcut overrides browser native page reload
**Category:** Functionality
**Priority:** Critical
**Description:** `app.js` (line ~2000) intercepts `Ctrl+R` / `Cmd+R` globally with `e.preventDefault()` and calls `ui.refreshImages()` instead. This breaks the universal browser shortcut users rely on to hard-reload the page. A user who has a broken UI state can no longer recover via keyboard. The feature it invokes (image refresh) is already exposed via the Force Refresh button.
**Fix:** Remove this keyboard listener entirely. It provides zero user value and actively harms usability.
**Affected files:** `app.js`

---

**ISS-002**
**Title:** `closeButton` event listener uses unbound method reference — modal won't close
**Category:** Functionality
**Priority:** Critical
**Description:** `closeButton.addEventListener('click', ui.closeVideoModal)` — `ui.closeVideoModal` is called without `.bind(ui)`, so `this` inside `closeVideoModal` is `undefined`/`window`, causing `lastFocusedElement` and DOM references to fail. The close (×) button on the video modal is broken in strict-mode environments or when `this` context matters.
**Fix:** Change to `closeButton.addEventListener('click', () => ui.closeVideoModal())` (arrow wrapper preserves `ui` context).
**Affected files:** `app.js`

---

### 🟠 HIGH

---

**ISS-003**
**Title:** News "Load More" button is permanently hidden — pagination math is wrong
**Category:** Functionality / Bug
**Priority:** High
**Description:** `fetch-news.js` returns max 10 articles (GNews free tier). In `renderNews`, the condition `newsPage * 6 < data.totalResults` uses `6` instead of the actual articles-per-page count. Since GNews returns `totalResults` (often thousands) but only 10 articles at once, `1 * 6 < 10000` is true — but on subsequent pages, attempting to fetch page 2 returns no new articles because the free tier doesn't paginate. The button shows but clicks do nothing useful. This feature needs to be hidden or redesigned.
**Fix:** Since GNews free tier returns only one batch of articles (max 10), hide the Load More button always and remove the pagination logic. Alternatively, cap it so the button only shows if `data.articles.length >= 10`.
**Affected files:** `app.js`, `api/fetch-news.js`

---

**ISS-004**
**Title:** Navbar cluttered with developer-only utility buttons (Force Refresh, Cleanup)
**Category:** UI/UX
**Priority:** High
**Description:** The navbar contains 5 control elements: theme toggle, notification bell, developer message (info), force refresh, and emergency cleanup. The last two are pure developer/debugging tools. A first-time user is confused by "Force Refresh" (with a triple-click hidden feature) and "Emergency Cleanup." These make the product look unfinished.
**Fix:** Remove the "Force Refresh Images" button and "Cleanup" button from the navbar. The image refresh functionality can remain in the codebase (triggered by network events and visibility changes, as already coded) without a UI-facing button. The nuclear refresh can be triggered via the dev console if needed.
**Affected files:** `index.html`, `app.js`, `style.css`

---

**ISS-005**
**Title:** Dead code: `getImageStats` and `showImageStatus` are stale and misleading
**Category:** Code Quality
**Priority:** High
**Description:** Both functions contain comments saying "This function is no longer relevant" yet remain in the codebase. `showImageStatus` is still bound to the double-click event of the refresh button. Dead code increases maintenance burden and confusion.
**Fix:** Remove both functions and their double-click event listener.
**Affected files:** `app.js`

---

**ISS-006**
**Title:** Missing type filter in search (Movie vs. TV Show)
**Category:** Missing Feature
**Priority:** High
**Description:** When a user searches, results include both movies and TV shows intermingled with no way to filter. The OMDb API supports `&type=movie` and `&type=series` but the UI provides no filter control. Power users searching specifically for movies or shows have a frustrating experience.
**Fix:** Add a simple filter row below the search bar with "All | Movies | TV Shows" buttons. Pass the selected type to `api.fetchMoviesBySearch`.
**Affected files:** `index.html`, `app.js`, `style.css`

---

**ISS-007**
**Title:** Popular TV shows section never renders on initial page load
**Category:** Functionality / Bug
**Priority:** High
**Description:** `init()` calls `ui.renderPopularMovies()` and `ui.renderNews()` but NOT `ui.renderPopularTvShows()`. The TV shows grid on the home page remains empty (shows skeleton cards that never resolve) until the user clicks "TV Shows" in the nav or uses "Load More."
**Fix:** Add `ui.renderPopularTvShows()` to `init()`.
**Affected files:** `app.js`

---

### 🟡 MEDIUM

---

**ISS-008**
**Title:** Search results section has no contextual heading showing what was searched
**Category:** UI/UX
**Priority:** Medium
**Description:** When search results appear, there is no visible "Results for: [query]" heading. The user loses context of what they searched, especially after scrolling.
**Fix:** Add a dynamic `<h2>` above the results grid that shows `Search results for "[query]"` and is updated by `renderSearchResults`.
**Affected files:** `index.html`, `app.js`, `style.css`

---

**ISS-009**
**Title:** Actor links open a Google popup — popup blocker frequently blocks them
**Category:** UX / Usability
**Priority:** Medium
**Description:** `searchActorFilmography` uses `window.open()` to open a Google search. Browser popup blockers intercept this ~50% of the time (not triggered by direct click due to async gap in some cases), then show a confusing `alert()` as fallback. This is jarring.
**Fix:** Change actor links to be actual `<a href="...google.com/search..." target="_blank">` anchor elements so the browser treats them as legitimate navigation, avoiding popup blocking. Remove the `window.open` + `alert` pattern.
**Affected files:** `app.js`

---

**ISS-010**
**Title:** `closeVideoModal` is not bound — `homeButton` nav also calls ui methods unboundly
**Category:** Code Quality / Bug
**Priority:** Medium
**Description:** Several event listeners pass `ui.*` methods without binding: `closeButton.addEventListener('click', ui.closeVideoModal)`. This is an existing pattern risk. While modern browsers pass undefined for `this` on plain-function invocations, destructured methods lose context. Defensive arrow wrappers are safer and consistent.
**Fix:** Convert all `ui.*` method references in event listeners to arrow wrapper patterns: `() => ui.methodName()`.
**Affected files:** `app.js`

---

**ISS-011**
**Title:** `showHomeView` resets `popularMoviesPage` but does not re-render TV shows, leaving it stale
**Category:** Functionality
**Priority:** Medium
**Description:** When a user navigates Home after browsing TV shows, `showHomeView` renders movies and news but does not call `renderPopularTvShows()`. The TV shows section on the home page will be missing or stale.
**Fix:** `showHomeView` should render popular TV shows as well, or hide the TV shows section and let the user navigate to it explicitly. Consistent with the page design, render all home sections.
**Affected files:** `app.js`

---

**ISS-012**
**Title:** The "Brave Browser" notification modal has no auto-trigger logic in code
**Category:** Missing Feature / UX
**Priority:** Medium
**Description:** The notification modal (`#notification-modal`) exists in HTML and there is a close button listener, but there is no code that shows the modal on first visit. The `notificationButton` (bell) has no click listener connected to opening the modal. Users never see the browser recommendation. Similarly, the `notificationButton` itself doesn't do anything functional.
**Fix:** Add a click listener on `notificationButton` to toggle the notification modal. Add first-visit auto-show logic using `localStorage.getItem('hasSeenBraveNotification')`.
**Affected files:** `app.js`

---

**ISS-013**
**Title:** Video modal's `<span>` close button is not keyboard-accessible
**Category:** Accessibility
**Priority:** Medium
**Description:** The close button (`<span class="close-button">&times;</span>`) is a `<span>`, not a `<button>`. It doesn't receive focus by default and can't be activated via keyboard.
**Fix:** Change to `<button class="close-button" aria-label="Close">×</button>` in `index.html`.
**Affected files:** `index.html`, `style.css`

---

**ISS-014**
**Title:** Missing `alt` text on the modal movie poster initially set to empty string
**Category:** Accessibility
**Priority:** Medium
**Description:** `<img id="modal-movie-poster" src="" alt="Movie Poster">` — generic "Movie Poster" alt doesn't convey the actual title. The code does update `alt` in `openVideoModal`, but the initial empty `src` triggers an error state before the update.
**Fix:** The code already updates `alt` properly. The initial state just needs `src` to be the fallback poster initially rather than empty string, or the `<img>` should be hidden until data is loaded.
**Affected files:** `app.js`, `index.html`

---

**ISS-015**
**Title:** `loadMorePopularButton` visibility logic in `showHomeView` is inconsistent
**Category:** UI/UX
**Priority:** Medium
**Description:** `showHomeView` sets `loadMorePopularButton.style.display = 'block'` unconditionally, even if all popular titles have already been loaded (no more to show). This can display a non-functional button.
**Fix:** Let `renderMovieGrid`'s existing logic control button visibility. Remove the forced `display: block` from `showHomeView`.
**Affected files:** `app.js`

---

### 🟢 LOW

---

**ISS-016**
**Title:** `console.log` statements scattered throughout production code
**Category:** Code Quality
**Priority:** Low
**Description:** Extensive `console.log` calls remain in production builds (e.g., `Fetching movie by title`, `Switching to source`, etc.). These leak implementation details to users and add noise.
**Fix:** Remove or replace with conditional debug logging behind a `DEBUG` flag.
**Affected files:** `app.js`, `api/omdb-proxy.js`, `api/fetch-news.js`

---

**ISS-017**
**Title:** `news-grid` shows error in a `<p>` tag that doesn't match grid layout
**Category:** UI/UX
**Priority:** Low
**Description:** When news fails to load, `newsGrid.innerHTML = '<p class="error-message">...'` — the paragraph inside a CSS grid may not span full width without `grid-column: 1 / -1`.
**Fix:** Add `style="grid-column: 1 / -1"` to the error paragraph, or use a wrapper div.
**Affected files:** `app.js`

---

**ISS-018**
**Title:** Hardcoded popular titles list is very small and non-diverse
**Category:** Feature Completeness
**Priority:** Low
**Description:** 15 movies and 12 TV shows are hardcoded. The selection skews heavily Western/English and doesn't feel curated. Users who've seen all these films get no new content.
**Fix:** Expand the lists to 30+ titles each, including recent releases and international hits. This is a content/data change, not a code architecture issue.
**Affected files:** `app.js`

---

**ISS-019**
**Title:** Service worker cache name `nowshowing-v4` is hardcoded — cache busting requires manual update
**Category:** Performance / Maintenance
**Priority:** Low
**Description:** `service-worker.js` caches under `nowshowing-v4`. When `app.js` or `style.css` change, users may get stale cached versions unless the cache name is manually bumped.
**Fix:** Consider using a build-time hash in the cache key, or document that the SW cache name must be bumped on every deployment.
**Affected files:** `service-worker.js`

---

**ISS-020**
**Title:** `modal-movie-website` field displays raw URL string with no link
**Category:** UI/UX
**Priority:** Low
**Description:** The movie website field in the modal shows the URL as plain text. It should be a clickable `<a>` tag.
**Fix:** In `openVideoModal`, create an anchor element for the website field instead of setting `textContent`.
**Affected files:** `app.js`

---

## Feature Gap Checklist (Phase 2 Work Items)

- [ ] ISS-001: Remove Ctrl+R keyboard shortcut override
- [ ] ISS-002: Fix `closeVideoModal` unbound method
- [ ] ISS-003: Fix news load more / hide permanently
- [ ] ISS-004: Remove Force Refresh and Cleanup buttons from navbar
- [ ] ISS-005: Remove dead code (`getImageStats`, `showImageStatus`, dblclick listener)
- [ ] ISS-006: Add Movie/TV Show type filter to search
- [ ] ISS-007: Add `renderPopularTvShows()` to `init()`
- [ ] ISS-008: Add "Search results for [query]" heading
- [ ] ISS-009: Fix actor links to use `<a>` tags instead of `window.open`
- [ ] ISS-010: Wrap all unbound ui.* method references in arrow functions
- [ ] ISS-011: Fix `showHomeView` to include TV shows rendering
- [ ] ISS-012: Add notification modal open logic + bell button listener
- [ ] ISS-013: Change close button `<span>` to `<button>` in HTML
- [ ] ISS-014: Set initial modal poster to fallback instead of empty src
- [ ] ISS-015: Remove forced `loadMorePopularButton.style.display = 'block'` from showHomeView
- [ ] ISS-016: Remove production console.log calls
- [ ] ISS-017: Fix news error paragraph grid-column
- [ ] ISS-018: Expand popular titles list
- [ ] ISS-019: Document SW cache busting
- [ ] ISS-020: Make movie website field a clickable link

---

## Improvement Plan (Ordered by Priority)

**Phase 2A — Critical Fixes (do first, unblock core UX):**
1. ISS-002: Fix closeVideoModal binding
2. ISS-001: Remove Ctrl+R override
3. ISS-007: Add TV show init render

**Phase 2B — High Priority (polish and missing features):**
4. ISS-003: Fix news load more
5. ISS-004: Remove developer utility buttons from navbar
6. ISS-005: Remove dead code
7. ISS-006: Add search type filter
8. ISS-012: Wire up notification bell

**Phase 2C — Medium Priority (UX and accessibility):**
9. ISS-008: Add search results heading
10. ISS-009: Fix actor links
11. ISS-010: Fix unbound method references
12. ISS-011: Fix showHomeView TV shows
13. ISS-013: Fix close button accessibility
14. ISS-015: Fix load more button logic

**Phase 2D — Low Priority (polish):**
15. ISS-016: Remove console.log
16. ISS-017: Fix news error layout
17. ISS-018: Expand popular titles
18. ISS-020: Make website field a link
