document.addEventListener('DOMContentLoaded', () => {
    // --- MEMORY MANAGEMENT & CLEANUP ---
    const cleanupManager = {
        timeouts: new Set(),
        eventListeners: new Map(),
        intervals: new Set(),
        
        // Track timeouts for cleanup
        setTimeout(callback, delay) {
            const timeoutId = setTimeout(callback, delay);
            this.timeouts.add(timeoutId);
            return timeoutId;
        },
        
        // Track intervals for cleanup
        setInterval(callback, delay) {
            const intervalId = setInterval(callback, delay);
            this.intervals.add(intervalId);
            return intervalId;
        },
        
        // Clean up all timeouts
        clearAllTimeouts() {
            this.timeouts.forEach(id => clearTimeout(id));
            this.timeouts.clear();
        },
        
        // Clean up all intervals
        clearAllIntervals() {
            this.intervals.forEach(id => clearInterval(id));
            this.intervals.clear();
        },
        
        // Track event listeners for cleanup
        addEventListenerWithTracking(element, event, listener, options) {
            if (!this.eventListeners.has(element)) {
                this.eventListeners.set(element, new Map());
            }
            const elementListeners = this.eventListeners.get(element);
            if (!elementListeners.has(event)) {
                elementListeners.set(event, new Set());
            }
            elementListeners.get(event).add(listener);
            element.addEventListener(event, listener, options);
        },
        
        // Remove specific event listener
        removeEventListenerWithTracking(element, event, listener) {
            const elementListeners = this.eventListeners.get(element);
            if (elementListeners && elementListeners.has(event)) {
                elementListeners.get(event).delete(listener);
                element.removeEventListener(event, listener);
            }
        },
        
        // Clean up all event listeners
        clearAllEventListeners() {
            this.eventListeners.forEach((elementListeners, element) => {
                elementListeners.forEach((listeners, event) => {
                    listeners.forEach(listener => {
                        element.removeEventListener(event, listener);
                    });
                });
            });
            this.eventListeners.clear();
        },
        
        // Full cleanup
        cleanup() {
            this.clearAllTimeouts();
            this.clearAllIntervals();
            this.clearAllEventListeners();
        }
    };

    // --- DOM ELEMENTS ---
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
    const searchResultsSection = document.querySelector('#search-results').parentElement;
    const popularTvShowsSection = document.querySelector('#popular-tv-shows').parentElement;
    const popularMoviesGrid = document.getElementById('popular-movies');
    const searchResultsGrid = document.getElementById('search-results');
    const popularTvShowsGrid = document.getElementById('popular-tv-shows');
    const continueWatchingSection = document.getElementById('continue-watching-section');
    const continueWatchingGrid = document.getElementById('continue-watching-grid');
    const watchlistSection = document.getElementById('watchlist-section');
    const watchlistGrid = document.getElementById('watchlist-grid');
    const newsGrid = document.getElementById('news-grid');
    const loadMoreNewsButton = document.getElementById('load-more-news');
    const videoModal = document.getElementById('video-modal');
    const videoPlayer = document.getElementById('video-player');
    const videoPlayOverlay = document.getElementById('video-play-overlay');
    const sourceButtonsContainer = document.getElementById('source-buttons');
    const videoAvailabilityStatus = document.getElementById('video-availability-status');
    const seasonEpisodeSelector = document.getElementById('season-episode-selector');
    const seasonSelect = document.getElementById('season-select');
    const episodeSelect = document.getElementById('episode-select');
    const closeButton = document.querySelector('.close-button');
    const homeButton = document.querySelector('.navbar-nav a[href="#"]');
    const themeToggle = document.getElementById('theme-toggle');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavLinks = document.querySelector('.mobile-nav-links');
    const loadMorePopularButton = document.getElementById('load-more-popular');
    const loadMoreSearchButton = document.getElementById('load-more-search');
    const loadMorePopularTvButton = document.getElementById('load-more-popular-tv');
    const watchlistToggle = document.getElementById('watchlist-toggle');

    const moviesNavLink = document.getElementById('movies-nav-link');
    const tvShowsNavLink = document.getElementById('tv-shows-nav-link');
    const watchlistNavLink = document.getElementById('watchlist-nav-link');
    const continueNavLink = document.getElementById('continue-nav-link');
    const mobileMoviesNavLink = document.getElementById('mobile-movies-nav-link');
    const mobileTvShowsNavLink = document.getElementById('mobile-tv-shows-nav-link');
    const mobileWatchlistNavLink = document.getElementById('mobile-watchlist-nav-link');
    const mobileContinueNavLink = document.getElementById('mobile-continue-nav-link');

    // --- Notification Elements ---
    const notificationButton = document.getElementById('notification-button');
    const notificationModal = document.getElementById('notification-modal');
    const closeNotificationModal = document.getElementById('close-notification-modal');

    const switchSourceNotificationModal = document.getElementById('switch-source-notification-modal');
    const closeSwitchSourceNotification = document.getElementById('close-switch-source-notification');

    const developerMessageButton = document.getElementById('developer-message-button');
    const developerMessageModal = document.getElementById('developer-message-modal');
    const closeDeveloperMessageModal = document.getElementById('close-developer-message-modal');
    const refreshImagesButton = document.getElementById('refresh-images-button');

    // Note: The opening mechanism for switchSourceNotificationModal (setting display: 'flex')
    // is not explicitly found in app.js. Ensure that wherever this modal is opened,
    // ui.trapFocus(switchSourceNotificationModal) is called to enable focus trapping.
    closeSwitchSourceNotification.addEventListener('click', () => {
        switchSourceNotificationModal.style.display = 'none';
        document.removeEventListener('keydown', ui.handleModalTabKey);
    });

    // --- API & CONFIG ---
    
    let popularMoviesPage = 1;
    let popularTvShowsPage = 1;
    let newsPage = 1;
    let searchResultsPage = 1;
    let currentSearchQuery = '';
    let lastFocusedElement = null; // To store the element that had focus before modal opened
    let currentOpenImdbId = null;

    // Global cache for recommendation generation (used for static fallback recommendations)
    let globalMovieCache = []; 

    const videoSources = [
        { name: 'VidCloud', url: 'https://vidcloud.stream/', tvUrl: 'https://vidcloud.stream/' },
        { name: 'fsapi.xyz', url: 'https://fsapi.xyz/movie/', tvUrl: 'https://fsapi.xyz/tv-imdb/' },
        { name: 'CurtStream', url: 'https://curtstream.com/movies/imdb/', tvUrl: null },
        { name: 'VidSrc.to', url: 'https://vidsrc.to/embed/movie/', tvUrl: 'https://vidsrc.to/embed/tv/' },
        { name: 'VidSrc.xyz', url: 'https://vidsrc.xyz/embed/movie/', tvUrl: 'https://vidsrc.xyz/embed/tv/' },
        { name: 'VidSrc.in', url: 'https://vidsrc.in/embed/movie/', tvUrl: 'https://vidsrc.in/embed/tv/' },
        { name: 'SuperEmbed', url: 'https://superembed.stream/movie/', tvUrl: 'https://superembed.stream/tv/' },
        { name: 'MoviesAPI', url: 'https://moviesapi.club/movie/', tvUrl: 'https://moviesapi.club/tv/' },
        { name: '2Embed', url: 'https://2embed.cc/embed/', tvUrl: 'https://2embed.cc/embed/' },
        { name: 'Fmovies', url: 'https://fmovies.to/embed/', tvUrl: 'https://fmovies.to/embed/' },
        { name: 'LookMovie', url: 'https://lookmovie.io/player/', tvUrl: 'https://lookmovie.io/player/' },
        { name: 'AutoEmbed', url: 'https://autoembed.cc/embed/', tvUrl: 'https://autoembed.cc/embed/' },
        // Extended Sources
        { name: 'MultiEmbed', url: 'https://multiembed.mov/?video_id=', tvUrl: 'https://multiembed.mov/?video_id=' },
        { name: 'EmbedStream', url: 'https://embed.stream/movie/', tvUrl: 'https://embed.stream/tv/' },
        { name: 'DopeBox', url: 'https://dopebox.to/movie/', tvUrl: 'https://dopebox.to/tv/' },
        { name: 'Vidplay', url: 'https://vidplay.online/embed/movie/', tvUrl: 'https://vidplay.online/embed/tv/' },
        { name: 'StreamSB', url: 'https://streamsb.net/e/', tvUrl: 'https://streamsb.net/e/' }, 
        { name: 'MovieHut', url: 'https://moviehut.tv/embed/movie/', tvUrl: 'https://moviehut.tv/embed/tv/' },
        { name: 'VidsHub', url: 'https://vidshub.xyz/embed/movie/', tvUrl: 'https://vidshub.xyz/embed/tv/' },
    ];

    // Merge custom sources from localStorage (optional): [{ name, url, tvUrl }]
    try {
        const custom = JSON.parse(localStorage.getItem('ns_custom_sources') || '[]');
        if (Array.isArray(custom)) {
            custom.forEach(src => {
                if (src && src.name && (src.url || src.tvUrl)) {
                    videoSources.push({ name: String(src.name), url: src.url || null, tvUrl: src.tvUrl || null });
                }
            });
        }
    } catch { /* ignore */ }

    // --- API CALLS ---
    const FALLBACK_POSTER = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">\
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%2317171f"/><stop offset="1" stop-color="%232a2d36"/></linearGradient></defs>\
<rect width="400" height="600" fill="url(%23g)"/>\
<g fill="%23b7bac1" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">\
<text x="200" y="280" font-size="24" font-weight="bold">Movie</text>\
<text x="200" y="320" font-size="16">Poster</text>\
<text x="200" y="350" font-size="14">Unavailable</text>\
</g></svg>';

    // --- IMAGE LOADING UTILITY ---
    const imageLoader = {
        // Simple image creation without complex retry logic
        createSimpleImage(src, alt, options = {}) {
            const img = document.createElement('img');
            img.alt = alt;
            img.loading = options.loading || 'lazy';
            img.referrerPolicy = 'no-referrer';
            // Provide intrinsic dimensions to stabilize layout before image loads
            img.width = 400; // maintains 2:3 ratio with height below
            img.height = 600;
            img.decoding = 'async';
            
            // Add loading class for visual feedback
            img.classList.add('image-loading');
            
            // Simple error handling
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                img.classList.remove('image-loading');
                img.classList.add('image-error');
                // Use fallback immediately on error
                img.src = FALLBACK_POSTER;
                img.classList.remove('image-error');
                img.classList.add('image-fallback');
            };
            
            // Handle successful load
            img.onload = () => {
                img.classList.remove('image-loading');
                img.classList.add('image-loaded');
            };
            
            // Set source and start loading
            img.src = src;
            
            return img;
        },

        // Simple image refresh - just recreate the image element
        refreshImage(img, originalSrc) {
            if (!img || !originalSrc || originalSrc === FALLBACK_POSTER) return;
            
            // Clean up old image event listeners before replacement
            if (img.onerror) img.onerror = null;
            if (img.onload) img.onload = null;
            
            // Create new image element
            const newImg = this.createSimpleImage(originalSrc, img.alt, {
                loading: img.loading
            });
            
            // Replace old image
            img.parentNode.replaceChild(newImg, img);
        },
        
        // Clean up image resources
        cleanupImage(img) {
            if (img) {
                img.onerror = null;
                img.onload = null;
                img.src = '';
                img.remove();
            }
        }
    };
    const api = {
        async checkVideoAvailability(url) {
            console.log(`[checkVideoAvailability] Checking URL: ${url}`);
            try {
                const response = await fetch('/api/check-video', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                });
                let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error(`[checkVideoAvailability] Failed to parse JSON response for ${url}:`, jsonError);
                    const textResponse = await response.text();
                    console.error(`[checkVideoAvailability] Non-JSON response for ${url}:`, textResponse);
                    return false; // Treat as unavailable if response is not valid JSON
                }
                console.log(`[checkVideoAvailability] Response for ${url}:`, data);
                return data.available;
            } catch (error) {
                console.error(`[checkVideoAvailability] Error checking video availability for ${url}:`, error);
                return false;
            }
        },
        async fetchMovieByTitle(title, type = '') {
            try {
                let url = `/api/omdb-proxy?title=${encodeURIComponent(title)}`;
                if (type) {
                    url += `&type=${type}`;
                }
                console.log(`Fetching movie by title: ${title}, URL: ${url}`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`Response for ${title}:`, data);
                return data;
            } catch (error) {
                console.error(`Error fetching movie by title (${title}):`, error);
                return { Response: 'False', Error: error.message };
            }
        },
        async fetchMovieDetails(imdbID) {
            try {
                const url = `/api/omdb-proxy?imdbID=${imdbID}&plot=full`;
                console.log(`Fetching movie details for IMDB ID: ${imdbID}, URL: ${url}`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`Details response for ${imdbID}:`, data);
                return data;
            } catch (error) {
                console.error(`Error fetching movie details (${imdbID}):`, error);
                return { Response: 'False', Error: error.message };
            }
        },
        async fetchMoviesBySearch(query, page = 1, type = '') {
            try {
                let url = `/api/omdb-proxy?s=${encodeURIComponent(query)}&page=${page}`;
                if (type) {
                    url += `&type=${type}`;
                }
                console.log(`Searching movies: ${query}, Page: ${page}, Type: ${type}, URL: ${url}`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`Search response for ${query}:`, data);
                return data;
            } catch (error) {
                console.error(`Error fetching search results (${query}):`, error);
                return { Response: 'False', Error: error.message };
            }
        },
        async fetchTvShowSeason(imdbID, seasonNumber) {
            try {
                const url = `/api/omdb-proxy?imdbID=${imdbID}&seasonNumber=${seasonNumber}`;
                console.log(`Fetching season ${seasonNumber} for IMDB ID: ${imdbID}, URL: ${url}`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`Season ${seasonNumber} response for ${imdbID}:`, data);
                return data;
            } catch (error) {
                console.error(`Error fetching season ${seasonNumber} for ${imdbID}:`, error);
                return { Response: 'False', Error: error.message };
            }
        },
    };

    // --- UI RENDERING ---
    // --- Storage helpers (localStorage) ---
    const storage = {
        WATCHLIST_KEY: 'ns_watchlist',
        CONTINUE_KEY: 'ns_continue',
        getWatchlist() {
            try { return JSON.parse(localStorage.getItem(this.WATCHLIST_KEY)) || []; } catch { return []; }
        },
        setWatchlist(list) {
            localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(list));
        },
        getContinueWatching() {
            try { return JSON.parse(localStorage.getItem(this.CONTINUE_KEY)) || []; } catch { return []; }
        },
        setContinueWatching(list) {
            localStorage.setItem(this.CONTINUE_KEY, JSON.stringify(list));
        },
        upsertContinue(entry) {
            const list = this.getContinueWatching();
            const filtered = list.filter(e => e.imdbID !== entry.imdbID);
            filtered.unshift({ ...entry, updatedAt: Date.now() });
            this.setContinueWatching(filtered.slice(0, 20));
        },
        
        // --- NEW: Remove from Watchlist ---
        removeFromWatchlist(imdbID) {
            const list = this.getWatchlist();
            const filtered = list.filter(e => e.imdbID !== imdbID);
            this.setWatchlist(filtered);
        },
        
        // --- NEW: Remove from Continue Watching ---
        removeFromContinue(imdbID) {
            const list = this.getContinueWatching();
            const filtered = list.filter(e => e.imdbID !== imdbID);
            this.setContinueWatching(filtered);
        }
    };

    // Best practice: For dynamically added elements or elements whose event listeners
    // might change, store references to the listener functions and explicitly remove them
    // when the element is no longer needed or its behavior changes, to prevent memory leaks.
    const ui = {
        displayError(message, container = searchResultsGrid) {
            container.innerHTML = '';
            const h2 = document.createElement('h2');
            h2.className = 'error-message';
            h2.textContent = message;
            container.appendChild(h2);
            if (container === searchResultsGrid) {
                searchResultsSection.style.display = 'block';
                popularMoviesSection.style.display = 'none';
            }
            loadMorePopularButton.style.display = 'none';
            loadMoreSearchButton.style.display = 'none';
        },

        // Refresh all images in the current view
        refreshImages() {
            // Refresh images
            
            // Force service worker to clear any cached image responses
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_IMAGE_CACHE'
                });
            }
            
            // Simple refresh: recreate all movie card images without breaking layout
            const allMovieCards = document.querySelectorAll('.movie-card');
            allMovieCards.forEach(card => {
                const container = card.querySelector('.movie-card-image-container');
                const img = container ? container.querySelector('img') : null;
                if (container && img && img.src !== FALLBACK_POSTER) {
                    const titleNode = card.querySelector('.movie-card-title');
                    const movieTitle = titleNode ? titleNode.textContent : 'Poster';
                    const originalSrc = img.src.replace(/[?&]_cb=[^&]*/g, ''); // Remove any cache busters

                    // Clean up old image listeners but do not remove container
                    if (img.onerror) img.onerror = null;
                    if (img.onload) img.onload = null;

                    // Create new simple image with intrinsic size
                    const newImg = imageLoader.createSimpleImage(originalSrc, movieTitle, { loading: 'lazy' });

                    // Replace old image within the image container to preserve structure
                    container.replaceChild(newImg, img);
                }
            });

            // Simple refresh: recreate all news images without changing DOM order
            const allNewsImages = document.querySelectorAll('.news-card img');
            allNewsImages.forEach(img => {
                if (img.src !== FALLBACK_POSTER) {
                    const newsCard = img.closest('.news-card');
                    const titleNode = newsCard ? newsCard.querySelector('.news-card-title') : null;
                    const title = titleNode ? titleNode.textContent : 'News Image';
                    const originalSrc = img.src.replace(/[?&]_cb=[^&]*/g, ''); // Remove any cache busters

                    // Create replacement image
                    const newImg = imageLoader.createSimpleImage(originalSrc, title, { loading: 'lazy' });

                    // Replace in-place to preserve layout
                    if (img.parentNode) {
                        img.parentNode.replaceChild(newImg, img);
                    }
                }
            });

            // Image refresh completed
        },

        // Force refresh images on page load/visibility change
        forceImageRefresh() {
            // Force image refresh on page load
            
            // Small delay to ensure DOM is ready
            cleanupManager.setTimeout(() => {
                this.refreshImages();
            }, 100);
        },

        // Check if images are stuck in loading state
        checkStuckImages() {
            // Simplified: just refresh all images if any are in error state
            const errorImages = document.querySelectorAll('.image-error');
            if (errorImages.length > 0) {
                // Found error images, refreshing
                this.refreshImages();
            }
        },

        // Handle CSP violations by trying alternative approaches
        handleCSPViolation(img, src) {
            // Possible CSP violation, trying alternative approach
            
            // Try without cache buster
            if (img.src.includes('_cb=')) {
                const cleanSrc = src.replace(/[?&]_cb=[^&]*/g, '');
                img.src = cleanSrc;
                return true;
            }
            
            // Try with different referrer policy
            if (img.referrerPolicy === 'no-referrer') {
                img.referrerPolicy = 'no-referrer-when-downgrade';
                img.src = src;
                return true;
            }
            
            return false;
        },

        // Nuclear option: Force complete image refresh
        nuclearImageRefresh() {
            // Nuclear image refresh initiated
            
            // Force service worker to clear everything
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_IMAGE_CACHE'
                });
            }
            
            // Clear browser caches
            if ('caches' in window) {
                caches.keys().then(keys => {
                    keys.forEach(key => {
                        if (key !== 'nowshowing-v4') {
                            // Deleting cache key
                            caches.delete(key);
                        }
                    });
                });
            }
            
            // Force reload all images
            const allImages = document.querySelectorAll('img');
            allImages.forEach(img => {
                if (img.src && img.src !== FALLBACK_POSTER) {
                    // Clean the URL first, then add single cache buster
                    let cleanSrc = img.src.replace(/[?&]_cb=[^&]*/g, '');
                    cleanSrc = cleanSrc.replace(/\?&/, '?');
                    cleanSrc = cleanSrc.replace(/&&/, '&');
                    if (cleanSrc.endsWith('?') || cleanSrc.endsWith('&')) {
                        cleanSrc = cleanSrc.slice(0, -1);
                    }
                    
                    // Add single timestamp cache buster
                    const separator = cleanSrc.includes('?') ? '&' : '?';
                    const newSrc = `${cleanSrc}${separator}_cb=${Date.now()}`;
                    img.src = newSrc;
                    
                    // Force browser to not use cache
                    img.style.setProperty('--force-refresh', Date.now());
                }
            });
            
            // Force page reload after a short delay if still having issues
            setTimeout(() => {
                const errorImages = document.querySelectorAll('.image-error');
                if (errorImages.length > 0) {
                    // Nuclear refresh completed but images still failing, suggest reload
                    if (confirm('Images still not loading. Would you like to reload the page?')) {
                        window.location.reload(true);
                    }
                }
            }, 3000);
            
            // Nuclear image refresh completed
        },

        // Get image loading statistics
        getImageStats() {
            // This function is no longer relevant as imageLoader.loadingImages is removed.
            // Keeping it for now as it might be used elsewhere or removed later.
            return {
                failed: 0, // No failed images tracking
                loading: 0, // No loading images tracking
                failedUrls: [], // No failed URLs tracking
                cacheBuster: Date.now() // Placeholder, as cache busting is removed
            };
        },

        // Show image loading status to user
        showImageStatus() {
            // This function is no longer relevant as imageLoader.loadingImages is removed.
            // Keeping it for now as it might be used elsewhere or removed later.
            const stats = this.getImageStats();
            const message = `Images: ${stats.loading} loading, ${stats.failed} failed`;
            // Image status: message
            
            // Show a temporary notification
            const notification = document.createElement('div');
            notification.className = 'image-status-notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 10000;
                font-size: 14px;
                transition: opacity 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },
        
        /**
         * Creates a clickable movie card element.
         * @param {Object} movie - Movie/Show data.
         * @param {boolean} isRemovable - Whether to include a remove button (for watchlist/continue).
         * @returns {HTMLElement} The movie card div.
         */
        createMovieCard(movie, isRemovable = false) { 
            if (!movie) return null;

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            // Set data attributes for easy identification
            movieCard.dataset.imdbId = movie.imdbID; 
            movieCard.dataset.type = movie.Type;

            const imageContainer = document.createElement('div');
            imageContainer.className = 'movie-card-image-container';

            // Use robust image loader with retry logic
            const img = imageLoader.createSimpleImage(movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : FALLBACK_POSTER, movie.Title, {
                loading: 'lazy'
            });

            const playIcon = document.createElement('i');
            playIcon.className = 'fas fa-play play-icon';
            playIcon.setAttribute('aria-hidden', 'true');

            imageContainer.appendChild(img);
            imageContainer.appendChild(playIcon);

            // Optional badges: type and resume (if exists)
            if (movie.Type) {
                const typeBadge = document.createElement('div');
                typeBadge.className = 'movie-badge';
                typeBadge.textContent = movie.Type === 'series' ? 'Series' : 'Movie';
                imageContainer.appendChild(typeBadge);
            }

            const resumeEntry = storage.getContinueWatching().find(e => e.imdbID === movie.imdbID);
            if (resumeEntry) {
                const resumeBadge = document.createElement('div');
                resumeBadge.className = 'resume-badge';
                // Show S/E info for TV shows
                if (resumeEntry.type === 'series' && resumeEntry.season && resumeEntry.episode) {
                    resumeBadge.textContent = `Continue S${resumeEntry.season} E${resumeEntry.episode}`;
                } else {
                    resumeBadge.textContent = 'Continue Watching';
                }
                imageContainer.appendChild(resumeBadge);
            }
            
            // --- NEW: Direct Remove Button ---
            if (isRemovable) {
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-button fas fa-times-circle'; // Use Font Awesome icon
                removeButton.setAttribute('aria-label', `Remove ${movie.Title} from list`);
                removeButton.title = `Remove ${movie.Title}`;
                imageContainer.appendChild(removeButton);

                // IMPORTANT: Add listener to remove only on button click, NOT on card click
                removeButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent modal from opening
                    
                    // Determine which list to remove from based on the container ID
                    const grid = movieCard.parentElement.id;
                    if (grid === 'watchlist-grid') {
                        storage.removeFromWatchlist(movie.imdbID);
                        this.renderListSection(watchlistGrid, storage.getWatchlist(), 'Your watchlist is empty. Add movies and shows to see them here!');
                    } else if (grid === 'continue-watching-grid') {
                        storage.removeFromContinue(movie.imdbID);
                        this.renderListSection(continueWatchingGrid, storage.getContinueWatching(), 'No shows in your continue watching list yet. Start watching something to see it here!');
                    }
                });
            }
            // --- END NEW REMOVE BUTTON ---

            const body = document.createElement('div');
            body.className = 'movie-card-body';

            const title = document.createElement('h3');
            title.className = 'movie-card-title';
            title.textContent = movie.Title;

            body.appendChild(title);

            movieCard.appendChild(imageContainer);
            movieCard.appendChild(body);

            // Open modal only on card click, excluding the remove button
            movieCard.addEventListener('click', () => this.openVideoModal(movie.imdbID));
            return movieCard;
        },
        createSkeletonCard() {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-img"></div>
                <div class="skeleton-body">
                    <div class="skeleton-title"></div>
                </div>
            `;
            return skeletonCard;
        },
        renderSkeletons(container, count) {
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                container.appendChild(this.createSkeletonCard());
            }
        },
        
        async renderMovieGrid(container, movies, append, loadMoreButton, currentPage, totalResults) {
            if (!append) {
                container.innerHTML = '';
            }
            movies.forEach(movie => {
                const movieCard = this.createMovieCard(movie);
                if (movieCard) {
                    container.appendChild(movieCard);
                }
            });

            // --- NEW/MODIFIED: Populate Global Cache for Home Views Only ---
            if (container.id === 'popular-movies' && !append) {
                // Clear and rebuild cache only on initial load, not load more
                globalMovieCache = []; 
            }
            if (container.id === 'popular-movies' || container.id === 'popular-tv-shows') {
                // Add valid movies to the global cache (only non-fallback, non-search results)
                // We keep the cache populated from the home page for a potential fallback, 
                // but we prioritize the new dynamic search in renderRecommendations.
                movies.filter(m => !m.Title.startsWith('Movie ') && m.Response !== 'False').forEach(m => {
                    if (!globalMovieCache.some(c => c.imdbID === m.imdbID)) {
                        globalMovieCache.push(m);
                    }
                });
            }
            // --- END NEW CACHE LOGIC ---

            if (loadMoreButton) {
                let hasMore = false;
                if (container.id === 'search-results') {
                    // OMDb API search returns 10 per page
                    hasMore = currentPage * 10 < totalResults;
                } else {
                    // Popular lists are hardcoded with 4 per page
                    const itemsPerPage = 4;
                    hasMore = currentPage * itemsPerPage < totalResults;
                }

                if (hasMore) {
                    loadMoreButton.style.display = 'block';
                } else {
                    loadMoreButton.style.display = 'none';
                }
            }
        },

        async renderPopularMovies(append = false) {
            // Popular titles are hardcoded as the OMDb API does not provide a direct endpoint for trending or popular movies.
            // For dynamic popular lists, consider integrating a different API like TMDb.
            const popularTitles = ['Inception', 'The Matrix', 'Interstellar', 'The Avengers', 'Avatar', 'Titanic', 'Jurassic Park', 'Forrest Gump', 'The Lion King', 'Gladiator', 'Pulp Fiction', 'Fight Club', 'The Lord of the Rings', 'Star Wars', 'Dune'];
            const moviesPerPage = 4;
            const startIndex = (popularMoviesPage - 1) * moviesPerPage;
            const endIndex = startIndex + moviesPerPage;
            const titlesToLoad = popularTitles.slice(startIndex, endIndex);

            if (titlesToLoad.length === 0 && append) {
                loadMorePopularButton.style.display = 'none';
                return;
            }

            if (!append) {
                popularMoviesGrid.innerHTML = '';
                this.renderSkeletons(popularMoviesGrid, moviesPerPage);
            }

            const moviePromises = titlesToLoad.map(title => api.fetchMovieByTitle(title, 'movie'));
            const movies = await Promise.all(moviePromises);
            
            // Debug: Log which movies failed to load
            movies.forEach((movie, index) => {
                if (!movie || movie.Response === 'False') {
                    // Failed to load movie
                }
            });
            
            const valid = movies.filter(m => m && m.Response !== 'False');
            
            // If we have some valid movies but not enough, create fallback cards for missing ones
            if (valid.length > 0 && valid.length < titlesToLoad.length && !append) {
                const missingCount = titlesToLoad.length - valid.length;
                for (let i = 0; i < missingCount; i++) {
                    const fallbackMovie = {
                        Title: `Movie ${i + 1}`,
                        Poster: FALLBACK_POSTER,
                        imdbID: `fallback-${Date.now()}-${i}`,
                        Type: 'movie'
                    };
                    valid.push(fallbackMovie);
                }
            }
            
            if (valid.length === 0 && !append) {
                popularMoviesGrid.innerHTML = '<p class="error-message">Unable to load movies right now. Please try again shortly.</p>';
                loadMorePopularButton.style.display = 'none';
                return;
            }
            this.renderMovieGrid(popularMoviesGrid, valid, append, loadMorePopularButton, popularMoviesPage, popularTitles.length);
        },

        async renderPopularTvShows(append = false) {
            // Popular TV show titles are hardcoded as the OMDb API does not provide a direct endpoint for trending or popular TV shows.
            // For dynamic popular lists, consider integrating a different API like TMDb.
            const popularTitles = ['Breaking Bad', 'Game of Thrones', 'The Office', 'Friends', 'The Simpsons', 'Stranger Things', 'The Mandalorian', 'The Crown', 'Westworld', 'Chernobyl', 'The Witcher', 'Black Mirror'];
            const showsPerPage = 4;
            const startIndex = (popularTvShowsPage - 1) * showsPerPage;
            const endIndex = startIndex + showsPerPage;
            const titlesToLoad = popularTitles.slice(startIndex, endIndex);

            if (titlesToLoad.length === 0 && append) {
                loadMorePopularTvButton.style.display = 'none';
                return;
            }

            if (!append) {
                popularTvShowsGrid.innerHTML = '';
                this.renderSkeletons(popularTvShowsGrid, showsPerPage);
            }

            const showPromises = titlesToLoad.map(title => api.fetchMovieByTitle(title, 'series'));
            const shows = await Promise.all(showPromises);
            const valid = shows.filter(s => s && s.Response !== 'False');
            if (valid.length === 0 && !append) {
                popularTvShowsGrid.innerHTML = '<p class="error-message">Unable to load TV shows right now. Please try again shortly.</p>';
                loadMorePopularTvButton.style.display = 'none';
                return;
            }
            this.renderMovieGrid(popularTvShowsGrid, valid, append, loadMorePopularTvButton, popularTvShowsPage, popularTitles.length);
        },

        async renderNews(append = false) {
            const url = `/api/fetch-news?page=${newsPage}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                if (data.articles) {
                    if (!append) {
                        newsGrid.innerHTML = '';
                    }
                    data.articles.forEach(article => {
                        const newsCard = document.createElement('a');
                        newsCard.className = 'news-card';
                        newsCard.href = article.url;
                        newsCard.target = '_blank';
                        newsCard.rel = 'noopener noreferrer';

                        const img = imageLoader.createSimpleImage(article.urlToImage || '', article.title, {
                            loading: 'lazy'
                        });

                        const body = document.createElement('div');
                        body.className = 'news-card-body';

                        const title = document.createElement('h3');
                        title.className = 'news-card-title';
                        title.textContent = article.title;

                        const source = document.createElement('p');
                        source.className = 'news-card-source';
                        source.textContent = article.source.name;

                        body.appendChild(title);
                        body.appendChild(source);

                        newsCard.appendChild(img);
                        newsCard.appendChild(body);

                        newsGrid.appendChild(newsCard);
                    });

                    // Show/hide load more button
                    if (newsPage * 6 < data.totalResults) {
                        loadMoreNewsButton.style.display = 'block';
                    } else {
                        loadMoreNewsButton.style.display = 'none';
                    }

                }
            } catch (error) {
                // Error fetching news
                if (!append) { // Only show the error message on the initial load
                    newsGrid.innerHTML = `<p class="error-message">Could not load news: ${error.message}. Please try again later.</p>`;
                }
                loadMoreNewsButton.style.display = 'none';
            }
        },

        async renderSearchResults(query, append = false) {
            currentSearchQuery = query;
            if (!query || query.length < 2) {
                this.showSearchView();
                this.displayError('Please enter at least 2 characters to search.', searchResultsGrid);
                return;
            }
            if (!append) {
                searchResultsPage = 1;
                this.showSearchView();
                searchResultsGrid.innerHTML = '';
                this.renderSkeletons(searchResultsGrid, 8);
            }

            const results = await api.fetchMoviesBySearch(query, searchResultsPage);

            if (results && results.Response === 'True' && results.Search) {
                this.renderMovieGrid(searchResultsGrid, results.Search, append, loadMoreSearchButton, searchResultsPage, results.totalResults);
            } else {
                let errorMessage = 'No movies or TV shows found. Please try another search.';
                if (results.Error) {
                    if (results.Error === 'Movie not found!') {
                        errorMessage = 'No movies or TV shows found matching your search. Please try a different query.';
                    } else if (results.Error.includes('limit')) {
                        errorMessage = 'API request limit reached. Please try again later.';
                    } else {
                        errorMessage = `Error searching: ${results.Error}. Please try again.`;
                    }
                }
                this.displayError(errorMessage, searchResultsGrid);
            }
        },
        showHomeView() {
            // Add home-page class to body
            document.body.classList.add('home-page');
            
            popularMoviesSection.style.display = 'block';
            searchResultsSection.style.display = 'none';
            popularTvShowsSection.style.display = 'none';
            searchInput.value = '';
            loadMorePopularButton.style.display = 'block'; // Ensure it's visible on home view
            popularMoviesPage = 1; // Reset popular movies page
            this.renderPopularMovies(); // Re-render popular movies from start
            // Render continue and watchlist 
            const cw = storage.getContinueWatching();
            this.renderListSection(continueWatchingGrid, cw, 'No shows in your continue watching list yet. Start watching something to see it here!');
            
            const wl = storage.getWatchlist();
            this.renderListSection(watchlistGrid, wl, 'Your watchlist is empty. Add movies and shows to see them here!');
        },
        showSearchView() {
            // Remove home-page class from body
            document.body.classList.remove('home-page');
            
            popularMoviesSection.style.display = 'none';
            searchResultsSection.style.display = 'block';
            popularTvShowsSection.style.display = 'none';
        },
        
        /**
         * Converts the comma-separated actor string into a list of clickable <a> tags.
         * @param {string} actorsString - The raw string of actors (e.g., "Tom Hanks, Leonardo DiCaprio").
         * @returns {HTMLElement} A <span> element containing the clickable actor links.
         */
        createClickableActorsList(actorsString) {
            const container = document.createElement('span');
            container.className = 'actor-list-container';
            
            if (!actorsString || actorsString === 'N/A') {
                container.textContent = 'N/A';
                return container;
            }

            const actorsArray = actorsString.split(',').map(name => name.trim()).filter(name => name.length > 0);
            
            actorsArray.forEach((actorName, index) => {
                const actorLink = document.createElement('a');
                actorLink.href = '#'; // Use '#' since the actual action is in the click handler
                actorLink.className = 'actor-link';
                actorLink.textContent = actorName;
                actorLink.setAttribute('aria-label', `Search for movies starring ${actorName}`);

                // The Core Logic: Open a Google Search on click
                actorLink.addEventListener('click', (e) => {
                    e.preventDefault(); // Stop the default anchor link behavior
                    this.searchActorFilmography(actorName);
                });

                container.appendChild(actorLink);

                // Add a comma and space separator if it's not the last actor
                if (index < actorsArray.length - 1) {
                    container.appendChild(document.createTextNode(', '));
                }
            });

            return container;
        },

        /**
         * Opens a new window/tab to perform a Google search for the actor's filmography.
         * @param {string} actorName - The name of the actor to search for.
         */
        searchActorFilmography(actorName) {
            // Updated search query to directly match the desired format: "[Actor Name] movies"
            const searchQuery = `${actorName} movies`;
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            
            // Open the search in a new tab. 
            const newWindow = window.open(googleUrl, '_blank');

            if (newWindow === null) {
                console.warn(`[ActorSearch] Popup blocked for: ${actorName}. Prompting user.`);
                alert(`Your browser blocked the pop-up for "${actorName}" search. Please allow pop-ups for this site, or try searching manually: ${searchQuery}`);
            }

            console.log(`[ActorSearch] Triggered Google search for: ${actorName}`);
        },

        /**
         * Fetches a list of new movies based on a search query (e.g., a Genre).
         * @param {string} query - The search query (e.g., "Action").
         * @returns {Promise<Array<Object>>} A promise resolving to a list of up to 4 movies/shows.
         */
        async fetchDynamicSearchRecommendations(query) {
            if (!query) return [];
            
            // Use API search to find relevant content based on the primary genre
            const results = await api.fetchMoviesBySearch(query, 1);
            
            if (results && results.Response === 'True' && results.Search) {
                // Filter out non-movie/series types and take only the first 4 results
                return results.Search
                    .filter(item => item.Type === 'movie' || item.Type === 'series')
                    .slice(0, 4); 
            }
            return [];
        },
        
        /**
         * Renders the recommendation section in the modal using a dynamic search based on genre.
         * @param {string} imdbID - The IMDB ID of the currently open title.
         * @param {string} genres - The genre string of the currently open title.
         */
        async renderRecommendations(imdbID, genres) {
            const container = document.getElementById('recommendations-grid');
            const section = document.getElementById('recommendations-section');
            if (!container || !section) return;

            container.innerHTML = '<h4>Loading related content...</h4>'; // Show loading state
            section.style.display = 'block';

            let recommendations = [];
            
            if (genres && genres !== 'N/A') {
                // Extract the primary genre (the first one listed)
                const primaryGenre = genres.split(',')[0].trim();
                
                // --- DYNAMIC CALL: Search OMDb by primary genre ---
                recommendations = await this.fetchDynamicSearchRecommendations(primaryGenre);
                // --------------------------------------------------
            }
            
            if (recommendations.length > 0) {
                container.innerHTML = ''; // Clear loading message
                recommendations.forEach(movie => {
                    // Create card for the newly searched recommendation
                    const card = this.createMovieCard(movie, false); 
                    if (card) {
                        container.appendChild(card);
                    }
                });
            } else {
                // Fallback if no dynamic search results are found
                container.innerHTML = '<h4>No related content found based on genre.</h4>';
            }
        },

        async openVideoModal(imdbID) {
            sourceButtonsContainer.innerHTML = '';
            videoPlayer.src = ''; // Clear previous video
            videoAvailabilityStatus.textContent = 'Loading video sources...';
            videoAvailabilityStatus.style.display = 'block';
            seasonEpisodeSelector.style.display = 'none'; // Hide by default
            currentOpenImdbId = imdbID;

            // Reset video player state
            videoPlayer.onload = null;
            videoPlayer.onerror = null;
            
            // Ensure play overlay is visible initially
            videoPlayOverlay.style.display = 'flex';

            const details = await api.fetchMovieDetails(imdbID);

            if (details && details.Response === 'True') {
                document.getElementById('modal-movie-title').textContent = details.Title;
                document.getElementById('modal-movie-plot').textContent = details.Plot;
                document.getElementById('modal-movie-genre').textContent = details.Genre;
                document.getElementById('modal-movie-released').textContent = details.Released;
                document.getElementById('modal-movie-rating').textContent = details.imdbRating;
                document.getElementById('modal-movie-rated').textContent = details.Rated;

                const otherRatingsContainer = document.getElementById('modal-movie-other-ratings');
                otherRatingsContainer.innerHTML = ''; // Clear previous ratings
                if (details.Ratings && details.Ratings.length > 0) {
                    details.Ratings.forEach(rating => {
                        const p = document.createElement('p');
                        const strong = document.createElement('strong');
                        strong.textContent = `${rating.Source}:`;
                        p.appendChild(strong);
                        p.appendChild(document.createTextNode(` ${rating.Value}`));
                        otherRatingsContainer.appendChild(p);
                    });
                }
                const modalPoster = document.getElementById('modal-movie-poster');
                modalPoster.src = details.Poster && details.Poster !== 'N/A' ? details.Poster : FALLBACK_POSTER;
                modalPoster.alt = `${details.Title} Poster`;
                document.getElementById('modal-movie-director').textContent = details.Director;
                document.getElementById('modal-movie-writer').textContent = details.Writer;
                
                // --- MODIFIED SECTION FOR CLICKABLE ACTORS ---
                const actorsElement = document.getElementById('modal-movie-actors');
                actorsElement.innerHTML = ''; // Clear existing content
                // Now append the list of clickable actor names
                actorsElement.appendChild(this.createClickableActorsList(details.Actors));
                // ---------------------------------------------
                
                document.getElementById('modal-movie-awards').textContent = details.Awards;
                document.getElementById('modal-movie-runtime').textContent = details.Runtime;
                document.getElementById('modal-movie-language').textContent = details.Language;
                document.getElementById('modal-movie-country').textContent = details.Country;
                document.getElementById('modal-movie-metascore').textContent = details.Metascore;
                document.getElementById('modal-movie-boxoffice').textContent = details.BoxOffice;
                document.getElementById('modal-movie-production').textContent = details.Production;
                document.getElementById('modal-movie-website').textContent = details.Website;
                
                // --- DYNAMIC RECOMMENDATIONS CALL ---
                await this.renderRecommendations(details.imdbID, details.Genre); // ADDED 'await'
                // -----------------------------------

                // Setup watchlist toggle state
                const watchlist = storage.getWatchlist();
                const isInWatchlist = watchlist.some(item => item.imdbID === details.imdbID);
                watchlistToggle.setAttribute('aria-pressed', isInWatchlist ? 'true' : 'false');
                watchlistToggle.classList.toggle('active', isInWatchlist);
                const toggleText = watchlistToggle.querySelector('.watchlist-toggle-text');
                toggleText.textContent = isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';

                if (details.Type === 'series') {
                    seasonEpisodeSelector.style.display = 'block';
                    // Populate seasons
                    seasonSelect.innerHTML = '';
                    for (let i = 1; i <= parseInt(details.totalSeasons); i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = `Season ${i}`;
                        seasonSelect.appendChild(option);
                    }
                    // Load episodes for the first season by default
                    await this.populateEpisodes(imdbID, 1);

                    ui.currentSeasonChangeListener = async (event) => {
                        await this.populateEpisodes(imdbID, event.target.value);
                    };
                    seasonSelect.addEventListener('change', ui.currentSeasonChangeListener);
                    ui.currentEpisodeChangeListener = () => this.loadVideoForSelectedEpisode(imdbID);
                    episodeSelect.addEventListener('change', ui.currentEpisodeChangeListener);

                } else { // It's a movie
                    seasonEpisodeSelector.style.display = 'none';
                    this.loadVideoForMovie(imdbID);
                }
            } else {
                videoAvailabilityStatus.textContent = `Could not fetch details for this title: ${details.Error || 'Unknown error.'}`;
                videoAvailabilityStatus.style.display = 'block';
                return;
            }

            videoModal.style.display = 'flex';
            lastFocusedElement = document.activeElement; // Save the element that had focus
            videoModal.focus(); // Set focus to the modal
            this.trapFocus(videoModal);
        },

        async populateEpisodes(imdbID, seasonNumber) {
            episodeSelect.innerHTML = '';
            const seasonData = await api.fetchTvShowSeason(imdbID, seasonNumber);
            if (seasonData && seasonData.Response === 'True' && seasonData.Episodes) {
                seasonData.Episodes.forEach(episode => {
                    const option = document.createElement('option');
                    option.value = episode.Episode;
                    option.textContent = `Episode ${episode.Episode}: ${episode.Title}`;
                    episodeSelect.appendChild(option);
                });
                this.loadVideoForSelectedEpisode(imdbID); // Load video for the first episode of the selected season
            } else {
                videoAvailabilityStatus.textContent = 'No episodes found for this season.';
                videoAvailabilityStatus.style.display = 'block';
            }
        },

        async loadVideoForMovie(imdbID) {
            videoPlayer.src = '';
            sourceButtonsContainer.innerHTML = ''; // Clear buttons
            videoAvailabilityStatus.textContent = 'Loading video sources...';
            videoAvailabilityStatus.style.display = 'block';

            const defaultSource = videoSources.find(s => s.name === 'VidSrc.to');
            const activeSource = defaultSource || videoSources[0];

            if (activeSource) {
                const activeUrl = this.constructVideoUrl(activeSource, imdbID, null, null, 'movie');
                if (activeUrl) {
                    // Loading video from
                    videoPlayer.src = activeUrl;
                    videoAvailabilityStatus.textContent = `Attempting to load from ${activeSource.name}...`;
                    
                    // Add load event listener to check if iframe loads successfully
                    videoPlayer.onload = () => {
                        // Video iframe loaded successfully
                        videoAvailabilityStatus.textContent = `Video loaded from ${activeSource.name}`;
                    };
                    
                    videoPlayer.onerror = () => {
                        // Video iframe failed to load
                        videoAvailabilityStatus.textContent = `Failed to load from ${activeSource.name}`;
                    };
                }
            } else {
                videoAvailabilityStatus.textContent = 'No video sources available.';
                switchSourceNotificationModal.style.display = 'flex'; // Show the switch source notification
                ui.trapFocus(switchSourceNotificationModal); // Trap focus within the notification modal
                return;
            }

            // Create buttons for all sources
            for (const source of videoSources) {
                const fullUrl = this.constructVideoUrl(source, imdbID, null, null, 'movie');
                if (!fullUrl) continue; // Skip sources that don't support this media type

                const button = document.createElement('button');
                button.className = 'source-button';
                button.textContent = source.name;
                sourceButtonsContainer.appendChild(button);

                // Set the active class on the default button
                if (source.name === activeSource.name) {
                    button.classList.add('active');
                }

                button.onclick = () => {
                    // Switching to source
                    videoPlayer.src = fullUrl;
                    document.querySelectorAll('.source-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    videoAvailabilityStatus.textContent = `Loading from ${source.name}...`;
                    
                    // Clear previous event listeners
                    videoPlayer.onload = null;
                    videoPlayer.onerror = null;
                    
                    // Add new event listeners
                    videoPlayer.onload = () => {
                        // Video iframe loaded successfully
                        videoAvailabilityStatus.textContent = `Video loaded from ${source.name}`;
                    };
                    
                    videoPlayer.onerror = () => {
                        // Video iframe failed to load
                        videoAvailabilityStatus.textContent = `Failed to load from ${source.name}`;
                    };
                    
                    // Save continue-watching entry
                    storage.upsertContinue({ imdbID, title: document.getElementById('modal-movie-title').textContent, poster: document.getElementById('modal-movie-poster').src, type: 'movie' });
                };

                // Check availability and update button styling
                api.checkVideoAvailability(fullUrl).then(isAvailable => {
                    if (isAvailable) {
                        button.classList.add('is-available');
                        // Source available
                    } else {
                        button.classList.add('is-unavailable');
                        // Source unavailable
                        const isActive = button.classList.contains('active');
                        if (isActive) {
                            const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.isSameNode(button) && !b.classList.contains('is-unavailable'));
                            if (next) next.click();
                        }
                    }
                }).catch(error => {
                    // Error checking availability
                    button.classList.add('is-unavailable');
                });
            }

            // Auto-switch to next available source if current fails
            cleanupManager.setTimeout(() => {
                const activeBtn = document.querySelector('.source-button.active');
                if (activeBtn && activeBtn.classList.contains('is-unavailable')) {
                    const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.classList.contains('is-unavailable'));
                    if (next) {
                        // Auto-switching to next available source
                        next.click();
                    }
                }
            }, 6000);
        },

        async loadVideoForSelectedEpisode(imdbID) {
            const season = seasonSelect.value;
            const episode = episodeSelect.value;
            if (!season || !episode) return;

            videoPlayer.src = '';
            sourceButtonsContainer.innerHTML = ''; // Clear old source buttons
            videoAvailabilityStatus.textContent = `Loading video sources for S${season}E${episode}...`;
            videoAvailabilityStatus.style.display = 'block';

            const defaultSource = videoSources.find(s => s.name === 'VidSrc.to');
            const activeSource = defaultSource || videoSources.find(s => s.tvUrl); // Find first source that supports TV

            if (activeSource) {
                const activeUrl = this.constructVideoUrl(activeSource, imdbID, season, episode, 'series');
                if (activeUrl) {
                    // Loading TV episode from
                    videoPlayer.src = activeUrl;
                    videoAvailabilityStatus.textContent = `Attempting to load from ${activeSource.name} (S${season}E${episode})...`;
                    
                    // Add load event listener to check if iframe loads successfully
                    videoPlayer.onload = () => {
                        // TV episode iframe loaded successfully
                        videoAvailabilityStatus.textContent = `Episode loaded from ${activeSource.name}`;
                    };
                    
                    videoPlayer.onerror = () => {
                        // TV episode iframe failed to load
                        videoAvailabilityStatus.textContent = `Failed to load episode from ${activeSource.name}`;
                    };
                }
            } else {
                videoAvailabilityStatus.textContent = 'No TV show sources available.';
                switchSourceNotificationModal.style.display = 'flex'; // Show the switch source notification
                ui.trapFocus(switchSourceNotificationModal); // Trap focus within the notification modal
                return;
            }

            for (const source of videoSources) {
                const fullUrl = this.constructVideoUrl(source, imdbID, season, episode, 'series');
                if (!fullUrl) continue; // Skip sources that don't support TV shows

                const button = document.createElement('button');
                button.className = 'source-button';
                button.textContent = source.name;
                sourceButtonsContainer.appendChild(button);

                // Set the active class on the default button
                if (source.name === activeSource.name) {
                    button.classList.add('active');
                }

                button.onclick = () => {
                    // Switching TV source to
                    videoPlayer.src = fullUrl;
                    document.querySelectorAll('.source-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    videoAvailabilityStatus.textContent = `Loading from ${source.name} (S${season}E${episode})...`;
                    
                    // Clear previous event listeners
                    videoPlayer.onload = null;
                    videoPlayer.onerror = null;
                    
                    // Add new event listeners
                    videoPlayer.onload = () => {
                        // TV episode iframe loaded successfully
                        videoAvailabilityStatus.textContent = `Episode loaded from ${source.name}`;
                    };
                    
                    videoPlayer.onerror = () => {
                        // TV episode iframe failed to load
                        videoAvailabilityStatus.textContent = `Failed to load episode from ${source.name}`;
                    };
                    
                    // Save continue-watching entry
                    storage.upsertContinue({ imdbID, title: document.getElementById('modal-movie-title').textContent, poster: document.getElementById('modal-movie-poster').src, type: 'series', season, episode });
                };

                // Check availability and update button styling
                api.checkVideoAvailability(fullUrl).then(isAvailable => {
                    if (isAvailable) {
                        button.classList.add('is-available');
                        // TV source available
                    } else {
                        button.classList.add('is-unavailable');
                        // TV source unavailable
                        const isActive = button.classList.contains('active');
                        if (isActive) {
                            const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.isSameNode(button) && !b.classList.contains('is-unavailable'));
                            if (next) next.click();
                        }
                    }
                }).catch(error => {
                    // Error checking TV source availability
                    button.classList.add('is-unavailable');
                });
            }

            // Auto-switch to next available source if current fails
            cleanupManager.setTimeout(() => {
                const activeBtn = document.querySelector('.source-button.active');
                if (activeBtn && activeBtn.classList.contains('is-unavailable')) {
                    const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.classList.contains('is-unavailable'));
                    if (next) {
                        // Auto-switching TV source to next available
                        next.click();
                    }
                }
            }, 6000);
        },

        closeVideoModal() {
            videoPlayer.src = 'about:blank'; // Clear iframe content to stop playback and release resources
            videoModal.style.display = 'none';
            videoAvailabilityStatus.style.display = 'none'; // Hide status when modal is closed
            videoPlayOverlay.style.display = 'none'; // Hide play overlay when modal is closed

            // Hide recommendation section
            const section = document.getElementById('recommendations-section');
            if (section) section.style.display = 'none';

            // Remove event listeners to prevent memory leaks
            if (seasonSelect && ui.currentSeasonChangeListener) {
                seasonSelect.removeEventListener('change', ui.currentSeasonChangeListener);
                ui.currentSeasonChangeListener = null; // Clear reference
            }
            if (episodeSelect && ui.currentEpisodeChangeListener) {
                episodeSelect.removeEventListener('change', ui.currentEpisodeChangeListener);
                ui.currentEpisodeChangeListener = null; // Clear reference
            }

            if (lastFocusedElement) {
                if (typeof lastFocusedElement.focus === 'function') { // Added defensive check
                    try {
                        lastFocusedElement.focus(); // Return focus to the element that opened the modal
                    } catch (e) {
                        console.warn("Could not restore focus to element.", e);
                    }
                }
                lastFocusedElement = null;
            }
            document.removeEventListener('keydown', this.handleModalTabKey);
        },
        handleModalTabKey: null, // To store the function reference for removal
        trapFocus(modalElement) {
            const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement = focusableElements[focusableElements.length - 1];

            this.handleModalTabKey = (event) => {
                const isTabPressed = (event.key === 'Tab' || event.keyCode === 9);

                if (!isTabPressed) {
                    return;
                }

                if (event.shiftKey) { // if shift key pressed for shift + tab combination
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus(); // add focus to the last focusable element
                        event.preventDefault();
                    }
                } else { // if tab key is pressed
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus(); // add focus to the first focusable element
                        event.preventDefault();
                    }
                }
            };

            document.addEventListener('keydown', this.handleModalTabKey);
        },
        constructVideoUrl(source, imdbID, season = null, episode = null, mediaType) {
            if (mediaType === 'series' && !source.tvUrl) return null; // Don't construct a URL if the source doesn't support TV shows

            let baseUrl = mediaType === 'series' && source.tvUrl ? source.tvUrl : source.url;
            let url = `${baseUrl}${imdbID}`;

            if (mediaType === 'series' && season && episode) {
                // Specific handling for VidSrc sources
                if (source.name.includes('VidSrc')) {
                    url = `${baseUrl}${imdbID}/${season}/${episode}`;
                } else if (source.name === 'VidCloud') {
                    url = `${baseUrl}${imdbID}-S${season}-E${episode}.html`;
                } else if (source.name === 'fsapi.xyz') {
                    url = `${baseUrl}${imdbID}-${season}-${episode}`;
                } else if (source.name === '2Embed') {
                    url = `${baseUrl}tv?id=${imdbID}&s=${season}&e=${episode}`;
                } else if (source.name === 'SuperEmbed') {
                    url = `${baseUrl}${imdbID}-${season}-${episode}`;
                } else if (source.name === 'MoviesAPI') {
                    url = `${baseUrl}${imdbID}/season/${season}/episode/${episode}`;
                } else if (source.name === 'Fmovies') {
                    url = `${baseUrl}tv/${imdbID}/season/${season}/episode/${episode}`;
                } else if (source.name === 'LookMovie') {
                    url = `${baseUrl}tv/${imdbID}/season/${season}/episode/${episode}`;
                } else if (source.name === 'AutoEmbed') {
                    url = `${baseUrl}imdb/tv?id=${imdbID}&s=${season}&e=${episode}`;
                } else if (source.name === 'MultiEmbed') {
                    // base already has ?video_id=
                    url = `${baseUrl}${imdbID}&s=${season}&e=${episode}`;
                } else {
                    // Generic fallback for other TV show sources
                    url = `${baseUrl}${imdbID}-S${season}E${episode}`;
                }
            }
            return url;
        },

        /**
         * Renders the Watchlist or Continue Watching grid.
         * @param {HTMLElement} container - The grid element (watchlistGrid or continueWatchingGrid).
         * @param {Array<Object>} items - The list of items from local storage.
         * @param {string} emptyMessage - The message to display if the list is empty.
         */
        renderListSection(container, items, emptyMessage = 'List is empty.') { 
            container.innerHTML = '';
            
            if (items.length === 0) {
                const p = document.createElement('p');
                p.style.cssText = 'text-align: center; color: var(--text-light); padding: 2rem; grid-column: 1 / -1;';
                p.textContent = emptyMessage;
                container.appendChild(p);
                
                // Set display to none for the parent section
                if (container.id === 'watchlist-grid') {
                    watchlistSection.style.display = 'none';
                } else if (container.id === 'continue-watching-grid') {
                    continueWatchingSection.style.display = 'none';
                }
                return;
            }

            // Set display to block for the parent section if it has content
            if (container.id === 'watchlist-grid') {
                watchlistSection.style.display = 'block';
            } else if (container.id === 'continue-watching-grid') {
                continueWatchingSection.style.display = 'block';
            }
            
            // Pass true to enable the remove button on the card
            items.forEach(item => {
                const card = this.createMovieCard({
                    Poster: item.poster,
                    Title: item.title,
                    imdbID: item.imdbID,
                    Type: item.type,
                    // Note: Cards for lists don't need full OMDb data, so we don't pass Genre here.
                }, true); // <--- Passed TRUE to enable REMOVE BUTTON

                if (card) container.appendChild(card);
            });
        },
    };

    // --- EVENT LISTENERS ---
    // Explicit load more handlers for correctness and clarity
    loadMorePopularButton.addEventListener('click', () => {
        popularMoviesPage++;
        ui.renderPopularMovies(true);
    });

    loadMoreSearchButton.addEventListener('click', () => {
        searchResultsPage++;
        ui.renderSearchResults(currentSearchQuery, true);
    });

    loadMorePopularTvButton.addEventListener('click', () => {
        popularTvShowsPage++;
        ui.renderPopularTvShows(true);
    });

    loadMoreNewsButton.addEventListener('click', () => {
        newsPage++;
        ui.renderNews(true);
    });

    // Video play overlay click handler
    videoPlayOverlay.addEventListener('click', () => {
        // Play overlay clicked, attempting to play video
        videoPlayOverlay.style.display = 'none';
        
        // Try to focus the iframe to ensure it's active
        videoPlayer.focus();
        
        // Some embedded players need a moment to load
        cleanupManager.setTimeout(() => {
            try {
                // Try to send a message to the iframe to play (if it supports it)
                if (videoPlayer.contentWindow) {
                    videoPlayer.contentWindow.postMessage('play', '*');
                }
            } catch (e) {
                // Could not send play message to iframe
            }
        }, 1000);
    });

    // Debounced search
    let searchDebounce;
    const triggerSearch = () => ui.renderSearchResults(searchInput.value.trim());
    searchButton.addEventListener('click', triggerSearch);
    searchInput.addEventListener('input', () => {
        if (searchDebounce) cleanupManager.timeouts.delete(searchDebounce);
        searchDebounce = cleanupManager.setTimeout(triggerSearch, 400);
    });
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') triggerSearch();
    });

    homeButton.addEventListener('click', (e) => {
        e.preventDefault();
        ui.showHomeView();
    });

    closeButton.addEventListener('click', ui.closeVideoModal);
    window.addEventListener('click', (event) => {
        if (event.target === videoModal) {
            ui.closeVideoModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (videoModal.style.display === 'flex') {
                ui.closeVideoModal();
            } else if (notificationModal.style.display === 'flex') {
                notificationModal.style.display = 'none';
                localStorage.setItem('hasSeenBraveNotification', 'true');
            } else if (switchSourceNotificationModal.style.display === 'flex') {
                switchSourceNotificationModal.style.display = 'none';
                document.removeEventListener('keydown', ui.handleModalTabKey);
            } else if (developerMessageModal.style.display === 'flex') {
                developerMessageModal.style.display = 'none';
                if (lastFocusedElement) {
                    if (typeof lastFocusedElement.focus === 'function') { // Added defensive check
                        lastFocusedElement.focus();
                    }
                }
                document.removeEventListener('keydown', ui.handleModalTabKey);
            }
        }
    });

    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    hamburgerMenu.addEventListener('click', () => {
        mobileNavOverlay.classList.toggle('active');
    });

    if (mobileNavLinks) {
        mobileNavLinks.addEventListener('click', () => {
            mobileNavOverlay.classList.remove('active');
        });
    }

    // Load more handlers are set above

    moviesNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'block';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        popularMoviesPage = 1;
        popularTvShowsPage = 1;
        ui.renderPopularMovies();
    });

    tvShowsNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'block';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        popularMoviesPage = 1;
        popularTvShowsPage = 1;
        ui.renderPopularTvShows();
    });

    watchlistNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        // Use new render function and only display section if it has content
        ui.renderListSection(watchlistGrid, storage.getWatchlist(), 'Your watchlist is empty. Add movies and shows to see them here!');
    });

    continueNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        // Use new render function and only display section if it has content
        ui.renderListSection(continueWatchingGrid, storage.getContinueWatching(), 'No shows in your continue watching list yet. Start watching something to see it here!');
    });

    mobileMoviesNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'block';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        popularMoviesPage = 1;
        popularTvShowsPage = 1;
        ui.renderPopularMovies();
    });

    mobileTvShowsNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'block';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        popularMoviesPage = 1;
        popularTvShowsPage = 1;
        ui.renderPopularTvShows();
    });

    mobileWatchlistNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        // Use new render function and only display section if it has content
        ui.renderListSection(watchlistGrid, storage.getWatchlist(), 'Your watchlist is empty. Add movies and shows to see them here!');
    });

    mobileContinueNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
        // Remove home-page class from body
        document.body.classList.remove('home-page');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        // Use new render function and only display section if it has content
        ui.renderListSection(continueWatchingGrid, storage.getContinueWatching(), 'No shows in your continue watching list yet. Start watching something to see it here!');
    });

    // --- Notification Logic ---
    const hasSeenNotification = localStorage.getItem('hasSeenBraveNotification');
    if (!hasSeenNotification) {
        notificationModal.style.display = 'flex';
        ui.trapFocus(notificationModal);
    }

    notificationButton.addEventListener('click', () => {
        notificationModal.style.display = 'flex';
        ui.trapFocus(notificationModal);
    });

    closeNotificationModal.addEventListener('click', () => {
        notificationModal.style.display = 'none';
        localStorage.setItem('hasSeenBraveNotification', 'true');
        document.removeEventListener('keydown', ui.handleModalTabKey);
    });

    window.addEventListener('click', (event) => {
        if (event.target === notificationModal) {
            notificationModal.style.display = 'none';
            localStorage.setItem('hasSeenBraveNotification', 'true');
            document.removeEventListener('keydown', ui.handleModalTabKey);
        }
    });

    developerMessageButton.addEventListener('click', () => {
        developerMessageModal.style.display = 'flex';
        ui.trapFocus(developerMessageModal);
    });

    // Refresh images button click
    refreshImagesButton.addEventListener('click', () => {
        const icon = refreshImagesButton.querySelector('i');
        icon.classList.add('fa-spin');
        
        // Regular refresh
        ui.refreshImages();
        
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 2000);
    });

    // Double-click refresh button to show image status
    refreshImagesButton.addEventListener('dblclick', (e) => {
        e.preventDefault();
        ui.showImageStatus();
    });

    // Triple-click for nuclear refresh
    let clickCount = 0;
    let clickTimer;
    refreshImagesButton.addEventListener('click', () => {
        clickCount++;
        if (clickTimer) cleanupManager.timeouts.delete(clickTimer);
        
        clickTimer = cleanupManager.setTimeout(() => {
            if (clickCount === 3) {
                // Triple-click detected - initiating nuclear refresh
                ui.nuclearImageRefresh();
                clickCount = 0;
            } else if (clickCount === 1) {
                // Single click handled by separate listener
                clickCount = 0;
            }
        }, 300);
    });
    // Watchlist toggle click
    watchlistToggle.addEventListener('click', () => {
        if (!currentOpenImdbId) return;
        const title = document.getElementById('modal-movie-title').textContent;
        const poster = document.getElementById('modal-movie-poster').src;
        // Determine the media type from the poster URL, or default to movie/series logic if possible
        // For simplicity, we assume if it's currently open, it must be either a 'movie' or 'series'
        const type = seasonEpisodeSelector.style.display === 'block' ? 'series' : 'movie'; 
        
        const list = storage.getWatchlist();
        const idx = list.findIndex(i => i.imdbID === currentOpenImdbId);
        if (idx >= 0) {
            list.splice(idx, 1);
            storage.setWatchlist(list);
            watchlistToggle.setAttribute('aria-pressed', 'false');
            watchlistToggle.classList.remove('active');
            watchlistToggle.querySelector('.watchlist-toggle-text').textContent = 'Add to Watchlist';
        } else {
            list.unshift({ imdbID: currentOpenImdbId, title, poster, type });
            storage.setWatchlist(list.slice(0, 100));
            watchlistToggle.setAttribute('aria-pressed', 'true');
            watchlistToggle.classList.add('active');
            watchlistToggle.querySelector('.watchlist-toggle-text').textContent = 'Remove from Watchlist';
        }
        // Refresh watchlist section if visible
        ui.renderListSection(watchlistGrid, storage.getWatchlist(), 'Your watchlist is empty. Add movies and shows to see them here!');
    });


    closeDeveloperMessageModal.addEventListener('click', () => {
        developerMessageModal.style.display = 'none';
        if (lastFocusedElement) {
            if (typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }
        document.removeEventListener('keydown', ui.handleModalTabKey);
    });

    window.addEventListener('click', (event) => {
        if (event.target === developerMessageModal) {
            developerMessageModal.style.display = 'none';
            if (lastFocusedElement) {
                if (typeof lastFocusedElement.focus === 'function') {
                    lastFocusedElement.focus();
                }
            }
            document.removeEventListener('keydown', ui.handleModalTabKey);
        }
    });

    // --- INITIAL LOAD ---
    const init = () => {
        // Add home-page class to body for initial load
        document.body.classList.add('home-page');
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        }

        // Continue watching and watchlist
        const continueList = storage.getContinueWatching();
        const watchList = storage.getWatchlist();

        // Continue watching list: Use new rendering function
        ui.renderListSection(
            continueWatchingGrid, 
            continueList, 
            'No shows in your continue watching list yet. Start watching something to see it here!'
        );
        
        // Watchlist: Use new rendering function
        ui.renderListSection(
            watchlistGrid, 
            watchList, 
            'Your watchlist is empty. Add movies and shows to see them here!'
        );

        ui.renderPopularMovies();
        ui.renderNews();
        
        // Avoid forced image refresh on initial load to prevent layout jank
    };

    // --- PAGE VISIBILITY HANDLING ---
    // Refresh images when page becomes visible again (e.g., after tab switch)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page is visible again, check if we need to refresh images
            const errorImages = document.querySelectorAll('.image-error');
            if (errorImages.length > 0) {
                // Page became visible with error images, refreshing
                // Small delay to ensure page is fully loaded
                cleanupManager.setTimeout(() => {
                    ui.refreshImages();
                }, 500);
            }
        }
    });

    // --- NETWORK STATUS HANDLING ---
    // Refresh images when network comes back online
    window.addEventListener('online', () => {
        // Network is back online, refreshing images
        cleanupManager.setTimeout(() => {
            ui.refreshImages();
        }, 1000);
    });

    // --- KEYBOARD SHORTCUTS ---
    // Ctrl+R or Cmd+R to refresh images
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault(); // Prevent browser refresh
            // Image refresh shortcut triggered
            ui.refreshImages();
        }
    });

    // Global error handler for CSP violations
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message && event.error.message.includes('CSP')) {
            // CSP violation detected
            // This will help us identify CSP issues
        }
    });

    // Global unhandled rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('CSP')) {
            // Unhandled CSP rejection detected
            event.preventDefault();
        }
    });

    init();
    
    // Log image loading system status
    // Image loading system initialized
    

});
