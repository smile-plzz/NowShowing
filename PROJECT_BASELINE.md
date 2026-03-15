# PROJECT_BASELINE.md
**NowShowing — Baseline State (Pre-Phase-1)**
_Last updated: Phase 2 completion_

---

## Project Overview

NowShowing is a client-side movie and TV show streaming aggregator. It uses the OMDb API to fetch metadata (titles, posters, ratings, plot, cast) and embeds third-party iframe streaming sources (VidSrc, SuperEmbed, 2Embed, etc.) for playback. Users can search titles, browse curated popular lists, manage a watchlist and continue-watching list (both localStorage), and read entertainment news via GNews.

**Target audience:** General public looking to quickly find and stream movies/TV shows without paying a subscription.

---

## Tech Stack Inventory

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥18.0.0 |
| Server | Express | ^5.1.0 |
| HTTP Client (server) | node-fetch | ^3.3.2 |
| Body parsing | body-parser | ^2.2.0 |
| Frontend JS | Vanilla JS (ES2020) | — |
| Frontend CSS | Plain CSS3 with custom properties | — |
| Icons | Font Awesome | 6.2.0 (CDN) |
| Deployment | Vercel (Serverless + Static) | v2 |
| Testing | Jest + babel-jest | ^29.7.0 |
| PWA | Service Worker + Web App Manifest | — |
| External APIs | OMDb API, GNews API | free tier |

---

## File & Folder Structure

```
NowShowing-master/
├── index.html             # Single-page shell — all UI declared here
├── app.js                 # All client-side logic (~2022 lines)
├── style.css              # All styles (~1900 lines)
├── server.js              # Local dev Express server (103 lines)
├── service-worker.js      # PWA service worker (caching)
├── manifest.webmanifest   # PWA manifest
├── vercel.json            # Vercel routing, headers, function config
├── package.json           # Dependencies and scripts
├── babel.config.cjs       # Babel config for Jest
├── jest.config.cjs        # Jest config
├── api/
│   ├── omdb-proxy.js      # Vercel function: proxies OMDb API requests
│   ├── fetch-news.js      # Vercel function: proxies GNews API requests
│   ├── check-video.js     # Vercel function: HEAD/GET probe for video URLs
│   ├── test.js            # Vercel function: health check endpoint
│   ├── API.md             # API documentation
│   └── check-video.test.js
├── test.js                # Root-level test file
└── docs/                  # Documentation (added Phase 1+)
```

---

## Component Inventory

All logic is in a single `app.js` with the following internal modules:

| Module | Purpose | Dependencies |
|---|---|---|
| `cleanupManager` | Tracks timeouts/intervals/listeners for leak prevention | — |
| `imageLoader` | Creates `<img>` elements with fallback, lazy load, load/error classes | FALLBACK_POSTER const |
| `api` | Wraps all fetch calls to `/api/*` endpoints | — |
| `storage` | localStorage CRUD for watchlist and continue-watching | — |
| `ui` | All DOM rendering: cards, grids, modal, skeletons, news | api, storage, imageLoader |

**Key HTML elements referenced:**
- `#popular-movies` / `#popular-tv-shows` / `#search-results` — content grids
- `#video-modal` — detail/playback modal
- `#video-player` — iframe for third-party embed
- `#source-buttons` — container for streaming source buttons
- `#season-episode-selector` — TV show episode picker
- `#continue-watching-section` / `#watchlist-section` — localStorage-backed lists
- `#news-grid` — entertainment news articles
- `#notification-modal` / `#switch-source-notification-modal` / `#developer-message-modal` — informational modals

---

## Data Flow

```
User Action → app.js event handler
    → api.fetchMoviesBySearch / fetchMovieDetails / etc.
        → /api/omdb-proxy (Vercel function)
            → OMDb API (external)
        ← JSON response
    ← data returned to ui.*
        → DOM manipulation (create cards, populate modal)

News flow:
User scroll / load-more → api → /api/fetch-news → GNews API → adapted articles → news cards

Video check:
ui.loadVideoForMovie → for each source → api.checkVideoAvailability
    → POST /api/check-video → HEAD/GET probe to streaming URL
    ← { available: bool } → button class (is-available / is-unavailable)
```

---

## Feature Inventory

| Feature | Status |
|---|---|
| Popular movies list (hardcoded titles) | ✅ Working |
| Popular TV shows list (hardcoded titles) | ✅ Working |
| Title search via OMDb | ✅ Working |
| Movie detail modal | ✅ Working |
| Multiple streaming source buttons | ✅ Working |
| Video source switching | ✅ Working |
| TV show season/episode selector | ✅ Working |
| Watchlist (localStorage) | ✅ Working |
| Continue Watching (localStorage) | ✅ Working |
| Remove items from Watchlist/Continue | ✅ Working |
| Entertainment news feed | ✅ Working (GNews) |
| Load More for popular lists | ✅ Working |
| Load More for search results | ✅ Working |
| Load More for news | ⚠️ Broken (pagination math wrong for GNews free tier) |
| Dark/light theme toggle | ✅ Working |
| Mobile nav hamburger menu | ✅ Working |
| Recommendations in modal | ✅ Working (genre search) |
| Clickable actors (Google search) | ✅ Working |
| PWA / offline support | ⚠️ Partial (SW exists, not fully tested) |
| Video availability check | ⚠️ Unreliable (iframe onload unreliable) |
| Notification modal (Brave recommendation) | ✅ Working (auto-shown once) |
| Force Refresh Images button | ⚠️ Clutters UI; triple-click behavior confusing |
| Cleanup button (emergency) | ⚠️ Clutter |
| Developer message modal | ✅ Working |
| Keyboard shortcut (Ctrl+R) | ⚠️ Overrides browser refresh unexpectedly |
| Search with Enter key | ✅ Working |
| Debounced search input | ✅ Working |
| Dead code (getImageStats, showImageStatus) | ❌ Stale code |
| Filtering search by type (Movie/Series) | ❌ Missing |
| Search results title/section header | ❌ Missing contextual heading |

---

## Known Entry Points

| Route | Destination |
|---|---|
| `/` | index.html (SPA) |
| `/api/omdb-proxy` | Vercel function |
| `/api/fetch-news` | Vercel function |
| `/api/check-video` | Vercel function |
| `/api/test` | Health check |

---

## External Dependencies & Integrations

| Service | Purpose | Key Required |
|---|---|---|
| OMDb API | Movie/TV metadata, search, season data | `OMDB_API_KEY` env var |
| GNews API | Entertainment news | `GNEWS_API_KEY` env var |
| Third-party embeds | Streaming (VidSrc, SuperEmbed, etc.) | None (publicly embeddable) |
| Font Awesome 6 CDN | Icons | None |
| Unsplash (hero image) | Hero background photo | None |

---

## Environment Variables & Config

| Variable | Used In | Purpose |
|---|---|---|
| `OMDB_API_KEY` | `api/omdb-proxy.js` | OMDb API authentication |
| `GNEWS_API_KEY` | `api/fetch-news.js` | GNews API authentication |
| `NODE_ENV` | vercel.json | Set to `production` on Vercel |

---
_Updated after Phase 2 to reflect all changes made._
