# DEVELOPMENT_LOG.md
**NowShowing — Phase 2: Developer Execution Log**
_Every change made, in order, with full context_

---

## Entry DEV-001
**Issue Addressed:** ISS-002 — `closeVideoModal` unbound method reference
**Files Modified:** `app.js`
**Change Summary:**
The close button (`×`) listener passed `ui.closeVideoModal` as a plain function reference, causing `this` to be undefined when invoked. Changed to an arrow wrapper so `ui` context is preserved.
```js
// Before
closeButton.addEventListener('click', ui.closeVideoModal);
// After
closeButton.addEventListener('click', () => ui.closeVideoModal());
```
**Edge Cases Handled:** All code paths inside `closeVideoModal` that reference `this` (focus restoration, event listener cleanup) now work correctly.
**Status:** ✅ Complete

---

## Entry DEV-002
**Issue Addressed:** ISS-001 — Ctrl+R keyboard shortcut overrides browser reload
**Files Modified:** `app.js`
**Change Summary:**
Removed the `keydown` listener that called `e.preventDefault()` on Ctrl+R/Cmd+R and invoked `ui.refreshImages()`. Users can now use the browser's native reload shortcut freely. Image refresh is still accessible via the network/visibility event hooks.
**Edge Cases Handled:** No regression — image refresh still fires on page visibility change and network reconnect.
**Status:** ✅ Complete

---

## Entry DEV-003
**Issue Addressed:** ISS-007 — TV shows never rendered on initial page load
**Files Modified:** `app.js`
**Change Summary:**
`init()` called `ui.renderPopularMovies()` and `ui.renderNews()` but omitted `ui.renderPopularTvShows()`. The TV shows section remained in permanent skeleton state. Added the missing call.
**Edge Cases Handled:** `popularTvShowsPage` is already initialised to `1` before `init()` runs.
**Status:** ✅ Complete

---

## Entry DEV-004
**Issue Addressed:** ISS-003 — News "Load More" button broken (pagination maths wrong)
**Files Modified:** `app.js`
**Change Summary:**
The condition `newsPage * 6 < data.totalResults` used the wrong multiplier. GNews free tier returns a single batch (max 10 articles) and does not support pagination. The Load More button is now unconditionally hidden after the initial fetch.
**Edge Cases Handled:** If GNews ever returns no articles, the button remains hidden. If the API is upgraded to support pagination, the constant can be restored.
**Status:** ✅ Complete

---

## Entry DEV-005
**Issue Addressed:** ISS-005 — Dead code: `getImageStats` and `showImageStatus`
**Files Modified:** `app.js`
**Change Summary:**
Both methods contained self-comments stating they were "no longer relevant." `showImageStatus` was still connected via a `dblclick` listener. Removed both methods and all three event listeners (single-click, double-click, triple-click) from the refresh-images button block.
**Edge Cases Handled:** No other code in the file called either method.
**Status:** ✅ Complete

---

## Entry DEV-006
**Issue Addressed:** ISS-004 — Developer utility buttons (Force Refresh, Emergency Cleanup) cluttering navbar
**Files Modified:** `index.html`, `app.js`, `style.css`
**Change Summary:**
Removed the `#refresh-images-button` and `#cleanup-button` elements from the navbar HTML. Removed their associated event listener block from `app.js`. Cleaned the following CSS blocks: `.refresh-images-button`, `.cleanup-button`, their hover/active states, responsive overrides, and the `.refresh-images-button .refresh-text` rule. Also removed the now-unused `searchActorFilmography` method from `app.js`.
**Edge Cases Handled:** The underlying image refresh logic (`ui.refreshImages`, `ui.nuclearImageRefresh`) remains in place and is still triggered automatically on network reconnect and page visibility change. Only the manual UI trigger is removed.
**Status:** ✅ Complete

---

## Entry DEV-007
**Issue Addressed:** ISS-006 — No search type filter (Movie vs TV Show)
**Files Modified:** `index.html`, `app.js`, `style.css`
**Change Summary:**
Added a `<div class="search-type-filter">` with three pill buttons (All / Movies / TV Shows) below the search bar in `index.html`. Added `currentSearchType` state variable to `app.js`. Wired up click listeners that set `currentSearchType` and re-trigger search if a query is active. Updated `renderSearchResults` signature to accept a `type` parameter, defaulting to `currentSearchType`. Wrote full CSS block for `.search-type-filter` and `.type-filter-btn` including active, hover, and mobile responsive states.
**Edge Cases Handled:** If the search field is empty when a filter button is clicked, no search is triggered (prevents a spurious empty query). Active button has `aria-pressed` attribute toggled for accessibility.
**Status:** ✅ Complete

---

## Entry DEV-008
**Issue Addressed:** ISS-008 — No contextual heading for search results
**Files Modified:** `index.html`, `app.js`
**Change Summary:**
Changed the static `<h2>Search Results</h2>` to `<h2 id="search-results-heading">Search Results</h2>`. In `renderSearchResults`, the heading is now updated to `Results for "[query]"` on every search. Resets to "Search Results" when query is empty.
**Edge Cases Handled:** Heading updates on append (load more) only if it was already set from the initial search call.
**Status:** ✅ Complete

---

## Entry DEV-009
**Issue Addressed:** ISS-009 — Actor links used `window.open()` which is frequently popup-blocked
**Files Modified:** `app.js`
**Change Summary:**
`createClickableActorsList` previously created `<a href="#">` elements with a click handler that called `window.open()`. The `window.open` + `alert` fallback was jarring. Replaced with real `<a href="https://google.com/search?q=..." target="_blank" rel="noopener noreferrer">` anchor elements. The browser treats native navigation as a trusted user gesture and never blocks it.
**Edge Cases Handled:** `encodeURIComponent` used for actor names with special characters. `rel="noopener noreferrer"` prevents tab-napping.
**Status:** ✅ Complete

---

## Entry DEV-010
**Issue Addressed:** ISS-011 — `showHomeView` didn't render TV shows, left section stale
**Files Modified:** `app.js`
**Change Summary:**
`showHomeView` previously hid `popularTvShowsSection` and did not call `renderPopularTvShows()`. Changed to show the section, reset `popularTvShowsPage` to `1`, and call `renderPopularTvShows()`. Also removed the forced `loadMorePopularButton.style.display = 'block'` (ISS-015) — button visibility is now managed by `renderMovieGrid` logic alone.
**Edge Cases Handled:** Both page counters reset on Home navigation so users see fresh first-page content.
**Status:** ✅ Complete

---

## Entry DEV-011
**Issue Addressed:** ISS-013 — Modal close buttons were `<span>` elements (not keyboard-navigable)
**Files Modified:** `index.html`
**Change Summary:**
Changed all four close button `<span class="close-button">` elements to `<button class="close-button" aria-label="Close">`. This makes them focusable via Tab and activatable via Enter/Space without any JS changes. Existing CSS already targets `.close-button` by class and renders identically.
**Edge Cases Handled:** All four modals updated: video modal, notification modal, switch-source modal, developer message modal.
**Status:** ✅ Complete

---

## Entry DEV-012
**Issue Addressed:** ISS-014 — Modal movie poster had no `onerror` fallback
**Files Modified:** `app.js`
**Change Summary:**
Added `modalPoster.onerror = () => { modalPoster.src = FALLBACK_POSTER; }` after setting the modal poster `src`. Prevents a broken image icon if OMDb returns an unreachable poster URL.
**Edge Cases Handled:** Handler fires once; subsequent src changes (e.g., setting fallback) do not trigger a loop because `FALLBACK_POSTER` is a data URI that never fails.
**Status:** ✅ Complete

---

## Entry DEV-013
**Issue Addressed:** ISS-016 — Verbose `console.log` calls in production code
**Files Modified:** `app.js`
**Change Summary:**
Removed all verbose `console.log` calls that leaked internal API URL construction, response data, and source-switching messages. Retained two meaningful `console.warn` calls: one for image load failure (helps diagnose poster issues) and one for focus restoration failure (helps debug accessibility edge cases). Also removed the dead `console.warn` inside the now-deleted `searchActorFilmography` method.
**Edge Cases Handled:** `console.error` calls in error handlers are kept — they are valuable for debugging production issues.
**Status:** ✅ Complete

---

## Entry DEV-014
**Issue Addressed:** ISS-017 — News error message didn't span full grid width
**Files Modified:** `app.js`
**Change Summary:**
Added `style="grid-column: 1 / -1"` inline to the error `<p>` inserted into `newsGrid` on fetch failure. Prevents the paragraph from collapsing to a single narrow grid cell.
**Edge Cases Handled:** Only applies to the initial load error, not the append path (which is now unreachable since load more is hidden).
**Status:** ✅ Complete

---

## Entry DEV-015
**Issue Addressed:** ISS-018 — Popular titles lists were very small and non-diverse
**Files Modified:** `app.js`
**Change Summary:**
Expanded the popular movies list from 15 to 32 titles, adding recent critically-acclaimed films (Oppenheimer, Parasite, Everything Everywhere All at Once, Barbie, Dune, etc.) and international/diverse titles. Expanded the popular TV shows list from 12 to 28 titles, adding recent prestige TV (Succession, The Last of Us, Severance, The Bear, Squid Game, Dark, Money Heist, etc.).
**Edge Cases Handled:** All titles use their exact OMDb-searchable names. "Load More" pagination still works correctly since `totalResults` is derived from array length.
**Status:** ✅ Complete

---

## Entry DEV-016
**Issue Addressed:** ISS-020 — Movie website field displayed as plain unclickable text
**Files Modified:** `app.js`
**Change Summary:**
Replaced `document.getElementById('modal-movie-website').textContent = details.Website` with logic that creates a proper `<a href="..." target="_blank" rel="noopener noreferrer">` anchor element when a valid website URL is present, or falls back to the text "N/A".
**Edge Cases Handled:** Checks for `details.Website !== 'N/A'` before creating a link. `rel="noopener noreferrer"` prevents tab-napping on external links.
**Status:** ✅ Complete

---

## Entry DEV-017
**Issue Addressed:** ISS-010 — Remaining unbound method references / code quality
**Files Modified:** `app.js`
**Change Summary:**
Audited all remaining event listener registrations. The only remaining `ui.*` pattern is `ui.currentSeasonChangeListener` and `ui.currentEpisodeChangeListener` which are intentionally stored references (required for explicit removal in `closeVideoModal`). These are already arrow functions bound to `imdbID` — correct pattern. Also removed the now fully-unused `searchActorFilmography` method.
**Edge Cases Handled:** Verified no other plain method references remain in event listener calls.
**Status:** ✅ Complete

---

## Files Modified in Phase 2

| File | Type | Changes |
|---|---|---|
| `app.js` | Modified | ISS-001,002,003,005,006,007,008,009,010,011,013,014,015,016,017,018,020 |
| `index.html` | Modified | ISS-004,006,008,013 |
| `style.css` | Modified | ISS-004,006 + responsive |

## Files Created in Phase 2
- `docs/PROJECT_BASELINE.md`
- `docs/AUDIT_REPORT.md`
- `docs/DEVELOPMENT_LOG.md` (this file)

## Files Deleted in Phase 2
- None (backup files `app.js.bak`, `index.html.bak`, `style.css.bak` are temporary)

---

## Phase 3 QA Bug Fixes

---

## Entry DEV-018
**Issue Addressed:** BUG-001 — Stale `refreshImagesButton` DOM reference crashed app on load
**Files Modified:** `app.js`
**Change Summary:**
After removing the Force Refresh button from the HTML (ISS-004/DEV-006), the `const refreshImagesButton = document.getElementById('refresh-images-button')` declaration was not removed. The element no longer exists in the DOM, so `getElementById` returned `null`. The entire `DOMContentLoaded` handler was crashing with a TypeError before any content rendered. Replaced the declaration with a comment.
**Edge Cases Handled:** Null-checked via the DOM ID cross-reference audit that caught this.
**Status:** ✅ Complete

---

## Entry DEV-019
**Issue Addressed:** BUG-002 — Close `<button>` rendered with browser-default focus ring
**Files Modified:** `style.css`
**Change Summary:**
The `<span>→<button>` change (ISS-013) introduced a focusable element without suppressing `appearance` defaults. Added `appearance: none`, `outline: none`, `line-height: 1`, and `font-family: inherit` to `.close-button`. Added `.close-button:focus-visible` with a branded red outline for accessible keyboard navigation.
**Edge Cases Handled:** Uses `:focus-visible` (not `:focus`) so mouse clicks don't show the ring.
**Status:** ✅ Complete

---

## Entry DEV-020
**Issue Addressed:** BUG-003 — Light-mode CSS selector typo for type-filter buttons
**Files Modified:** `style.css`
**Change Summary:**
CSS selector was `.body.light-mode .type-filter-btn` (invalid — targets an element with class `body` which doesn't exist) instead of `body.light-mode .type-filter-btn`. Corrected the selector.
**Status:** ✅ Complete

---

## Entry DEV-021
**Issue Addressed:** ISS-012 — Notification bell button not wired to modal
**Files Modified:** None (pre-existing implementation verified)
**Change Summary:**
During Phase 2 review, the notification bell code was found to be already fully implemented in `app.js` (lines 1764–1800). The bell button opens the notification modal; first-visit auto-show uses `localStorage.getItem('hasSeenBraveNotification')`; close button and backdrop click both dismiss and set the seen flag; Escape key is handled in the global keydown listener. No code changes required.
**Status:** ✅ Complete (pre-existing)

---

## Entry DEV-022
**Issue Addressed:** ISS-019 — Service worker cache name requires manual bump on deploy
**Files Modified:** `service-worker.js` (documentation comment added)
**Change Summary:**
Documentation-only item. The cache name `nowshowing-v4` in `service-worker.js` is hardcoded. Added a comment at the top of the file reminding maintainers to increment the version on every deployment that changes `app.js` or `style.css`. No logic change needed at this time.
**Status:** ✅ Complete
