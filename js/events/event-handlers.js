/**
 * Event Handlers - Centralized event handling for the NowShowing application
 * Extracted from app.js to improve maintainability
 */

import { mainUI } from '../ui/main-ui.js';
import { videoPlayer } from '../ui/video-player.js';
import { storage } from '../utils/storage.js';
import { imageLoader } from '../utils/image-loader.js';
import { uiUtils } from '../utils/ui-utils.js';

export class EventHandlers {
    constructor() {
        this.searchDebounce = null;
        this.clickCount = 0;
        this.clickTimer = null;
        this.hasSeenNotification = localStorage.getItem('hasSeenBraveNotification');
    }

    // Initialize all event handlers
    init() {
        this.setupSearchHandlers();
        this.setupNavigationHandlers();
        this.setupVideoModalHandlers();
        this.setupThemeAndUIHandlers();
        this.setupNotificationHandlers();
        this.setupImageRefreshHandlers();
        this.setupWatchlistHandlers();
        this.setupKeyboardShortcuts();
        this.setupPageVisibilityHandlers();
    }

    // Setup search functionality
    setupSearchHandlers() {
        const searchButton = document.getElementById('search-button');
        const searchInput = document.getElementById('search-input');

        const triggerSearch = () => mainUI.renderSearchResults(searchInput.value.trim());
        
        searchButton.addEventListener('click', triggerSearch);
        searchInput.addEventListener('input', () => {
            if (this.searchDebounce) clearTimeout(this.searchDebounce);
            this.searchDebounce = setTimeout(triggerSearch, 400);
        });
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') triggerSearch();
        });
    }

    // Setup navigation handlers
    setupNavigationHandlers() {
        const homeButton = document.querySelector('.navbar-nav a[href="#"]');
        const moviesNavLink = document.getElementById('movies-nav-link');
        const tvShowsNavLink = document.getElementById('tv-shows-nav-link');
        const watchlistNavLink = document.getElementById('watchlist-nav-link');
        const continueNavLink = document.getElementById('continue-nav-link');
        const mobileMoviesNavLink = document.getElementById('mobile-movies-nav-link');
        const mobileTvShowsNavLink = document.getElementById('mobile-tv-shows-nav-link');
        const mobileWatchlistNavLink = document.getElementById('mobile-watchlist-nav-link');
        const mobileContinueNavLink = document.getElementById('mobile-continue-nav-link');
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        const mobileNavLinks = document.querySelector('.mobile-nav-links');

        homeButton.addEventListener('click', (e) => {
            e.preventDefault();
            mainUI.showHomeView();
        });

        moviesNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showMoviesView();
        });

        tvShowsNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTvShowsView();
        });

        watchlistNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showWatchlistView();
        });

        continueNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showContinueWatchingView();
        });

        // Mobile navigation
        mobileMoviesNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            mobileNavOverlay.classList.remove('active');
            this.showMoviesView();
        });

        mobileTvShowsNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            mobileNavOverlay.classList.remove('active');
            this.showTvShowsView();
        });

        mobileWatchlistNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            mobileNavOverlay.classList.remove('active');
            this.showWatchlistView();
        });

        mobileContinueNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            mobileNavOverlay.classList.remove('active');
            this.showContinueWatchingView();
        });

        hamburgerMenu.addEventListener('click', () => {
            mobileNavOverlay.classList.toggle('active');
        });

        if (mobileNavLinks) {
            mobileNavLinks.addEventListener('click', () => {
                mobileNavOverlay.classList.remove('active');
            });
        }
    }

    // Show movies view
    showMoviesView() {
        document.body.classList.remove('home-page');
        
        const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
        const searchResultsSection = document.querySelector('#search-results').parentElement;
        const popularTvShowsSection = document.querySelector('#popular-tv-shows').parentElement;
        const continueWatchingSection = document.getElementById('continue-watching-section');
        const watchlistSection = document.getElementById('watchlist-section');
        
        popularMoviesSection.style.display = 'block';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        
        mainUI.popularMoviesPage = 1;
        mainUI.popularTvShowsPage = 1;
        mainUI.renderPopularMovies();
    }

    // Show TV shows view
    showTvShowsView() {
        document.body.classList.remove('home-page');
        
        const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
        const searchResultsSection = document.querySelector('#search-results').parentElement;
        const popularTvShowsSection = document.querySelector('#popular-tv-shows').parentElement;
        const continueWatchingSection = document.getElementById('continue-watching-section');
        const watchlistSection = document.getElementById('watchlist-section');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'block';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        
        mainUI.popularMoviesPage = 1;
        mainUI.popularTvShowsPage = 1;
        mainUI.renderPopularTvShows();
    }

    // Show watchlist view
    showWatchlistView() {
        document.body.classList.remove('home-page');
        
        const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
        const searchResultsSection = document.querySelector('#search-results').parentElement;
        const popularTvShowsSection = document.querySelector('#popular-tv-shows').parentElement;
        const continueWatchingSection = document.getElementById('continue-watching-section');
        const watchlistSection = document.getElementById('watchlist-section');
        const watchlistGrid = document.getElementById('watchlist-grid');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'block';
        
        uiUtils.renderListSection(watchlistGrid, storage.getWatchlist());
    }

    // Show continue watching view
    showContinueWatchingView() {
        document.body.classList.remove('home-page');
        
        const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
        const searchResultsSection = document.querySelector('#search-results').parentElement;
        const popularTvShowsSection = document.querySelector('#popular-tv-shows').parentElement;
        const watchlistSection = document.getElementById('watchlist-section');
        const continueWatchingSection = document.getElementById('continue-watching-section');
        const continueWatchingGrid = document.getElementById('continue-watching-grid');
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        continueWatchingSection.style.display = 'block';
        
        uiUtils.renderListSection(continueWatchingGrid, storage.getContinueWatching());
    }

    // Setup video modal handlers
    setupVideoModalHandlers() {
        const closeButton = document.querySelector('.close-button');
        const videoModal = document.getElementById('video-modal');
        const videoPlayOverlay = document.getElementById('video-play-overlay');
        const videoPlayer = document.getElementById('video-player');

        closeButton.addEventListener('click', () => videoPlayer.closeVideoModal());
        
        window.addEventListener('click', (event) => {
            if (event.target === videoModal) {
                videoPlayer.closeVideoModal();
            }
        });

        // Video play overlay click handler
        videoPlayOverlay.addEventListener('click', () => {
            videoPlayOverlay.style.display = 'none';
            videoPlayer.focus();
            
            // Some embedded players need a moment to load
            setTimeout(() => {
                try {
                    if (videoPlayer.contentWindow) {
                        videoPlayer.contentWindow.postMessage('play', '*');
                    }
                } catch (e) {
                    // Could not send play message to iframe
                }
            }, 1000);
        });
    }

    // Setup theme and UI handlers
    setupThemeAndUIHandlers() {
        const themeToggle = document.getElementById('theme-toggle');
        
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });
    }

    // Setup notification handlers
    setupNotificationHandlers() {
        const notificationButton = document.getElementById('notification-button');
        const notificationModal = document.getElementById('notification-modal');
        const closeNotificationModal = document.getElementById('close-notification-modal');
        const switchSourceNotificationModal = document.getElementById('switch-source-notification-modal');
        const closeSwitchSourceNotification = document.getElementById('close-switch-source-notification');
        const developerMessageButton = document.getElementById('developer-message-button');
        const developerMessageModal = document.getElementById('developer-message-modal');
        const closeDeveloperMessageModal = document.getElementById('close-developer-message-modal');

        // Show notification modal if user hasn't seen it
        if (!this.hasSeenNotification) {
            notificationModal.style.display = 'flex';
            uiUtils.trapFocus(notificationModal);
        }

        notificationButton.addEventListener('click', () => {
            notificationModal.style.display = 'flex';
            uiUtils.trapFocus(notificationModal);
        });

        closeNotificationModal.addEventListener('click', () => {
            notificationModal.style.display = 'none';
            localStorage.setItem('hasSeenBraveNotification', 'true');
            uiUtils.removeModalTabKeyListener();
        });

        window.addEventListener('click', (event) => {
            if (event.target === notificationModal) {
                notificationModal.style.display = 'none';
                localStorage.setItem('hasSeenBraveNotification', 'true');
                uiUtils.removeModalTabKeyListener();
            }
        });

        // Switch source notification
        closeSwitchSourceNotification.addEventListener('click', () => {
            switchSourceNotificationModal.style.display = 'none';
            uiUtils.removeModalTabKeyListener();
        });

        // Developer message modal
        developerMessageButton.addEventListener('click', () => {
            developerMessageModal.style.display = 'flex';
            uiUtils.trapFocus(developerMessageModal);
        });

        closeDeveloperMessageModal.addEventListener('click', () => {
            developerMessageModal.style.display = 'none';
            uiUtils.removeModalTabKeyListener();
        });

        window.addEventListener('click', (event) => {
            if (event.target === developerMessageModal) {
                developerMessageModal.style.display = 'none';
                uiUtils.removeModalTabKeyListener();
            }
        });
    }

    // Setup image refresh handlers
    setupImageRefreshHandlers() {
        const refreshImagesButton = document.getElementById('refresh-images-button');

        // Refresh images button click
        refreshImagesButton.addEventListener('click', () => {
            const icon = refreshImagesButton.querySelector('i');
            icon.classList.add('fa-spin');
            
            // Regular refresh
            imageLoader.refreshImages();
            
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 2000);
        });

        // Double-click refresh button to show image status
        refreshImagesButton.addEventListener('dblclick', (e) => {
            e.preventDefault();
            mainUI.showImageStatus();
        });

        // Triple-click for nuclear refresh
        refreshImagesButton.addEventListener('click', () => {
            this.clickCount++;
            if (this.clickTimer) clearTimeout(this.clickTimer);
            
            this.clickTimer = setTimeout(() => {
                if (this.clickCount === 3) {
                    // Triple-click detected - initiating nuclear refresh
                    imageLoader.nuclearImageRefresh();
                    this.clickCount = 0;
                } else if (this.clickCount === 1) {
                    // Single click handled by separate listener
                    this.clickCount = 0;
                }
            }, 300);
        });
    }

    // Setup watchlist handlers
    setupWatchlistHandlers() {
        const watchlistToggle = document.getElementById('watchlist-toggle');
        const watchlistGrid = document.getElementById('watchlist-grid');
        const watchlistSection = document.getElementById('watchlist-section');

        watchlistToggle.addEventListener('click', () => {
            if (!videoPlayer.currentOpenImdbId) return;
            
            const title = document.getElementById('modal-movie-title').textContent;
            const poster = document.getElementById('modal-movie-poster').src;
            const list = storage.getWatchlist();
            const idx = list.findIndex(i => i.imdbID === videoPlayer.currentOpenImdbId);
            
            if (idx >= 0) {
                list.splice(idx, 1);
                storage.setWatchlist(list);
                watchlistToggle.setAttribute('aria-pressed', 'false');
                watchlistToggle.classList.remove('active');
                watchlistToggle.querySelector('.watchlist-toggle-text').textContent = 'Add to Watchlist';
            } else {
                list.unshift({ imdbID: videoPlayer.currentOpenImdbId, title, poster });
                storage.setWatchlist(list.slice(0, 100));
                watchlistToggle.setAttribute('aria-pressed', 'true');
                watchlistToggle.classList.add('active');
                watchlistToggle.querySelector('.watchlist-toggle-text').textContent = 'Remove from Watchlist';
            }
            
            // Refresh watchlist section if visible
            uiUtils.renderListSection(watchlistGrid, storage.getWatchlist());
            watchlistSection.style.display = storage.getWatchlist().length ? 'block' : 'none';
        });
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.handleEscapeKey();
            }
            
            // Ctrl+R or Cmd+R to refresh images
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault(); // Prevent browser refresh
                imageLoader.refreshImages();
            }
        });
    }

    // Handle escape key
    handleEscapeKey() {
        const videoModal = document.getElementById('video-modal');
        const notificationModal = document.getElementById('notification-modal');
        const switchSourceNotificationModal = document.getElementById('switch-source-notification-modal');
        const developerMessageModal = document.getElementById('developer-message-modal');

        if (videoModal.style.display === 'flex') {
            videoPlayer.closeVideoModal();
        } else if (notificationModal.style.display === 'flex') {
            notificationModal.style.display = 'none';
            localStorage.setItem('hasSeenBraveNotification', 'true');
        } else if (switchSourceNotificationModal.style.display === 'flex') {
            switchSourceNotificationModal.style.display = 'none';
            uiUtils.removeModalTabKeyListener();
        } else if (developerMessageModal.style.display === 'flex') {
            developerMessageModal.style.display = 'none';
            uiUtils.removeModalTabKeyListener();
        }
    }

    // Setup page visibility handlers
    setupPageVisibilityHandlers() {
        // Refresh images when page becomes visible again (e.g., after tab switch)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page is visible again, check if we need to refresh images
                const errorImages = document.querySelectorAll('.image-error');
                if (errorImages.length > 0) {
                    // Small delay to ensure page is fully loaded
                    setTimeout(() => {
                        imageLoader.refreshImages();
                    }, 500);
                }
            }
        });

        // Refresh images when network comes back online
        window.addEventListener('online', () => {
            // Network is back online, refreshing images
            setTimeout(() => {
                imageLoader.refreshImages();
            }, 1000);
        });
    }

    // Setup load more handlers
    setupLoadMoreHandlers() {
        const loadMorePopularButton = document.getElementById('load-more-popular');
        const loadMoreSearchButton = document.getElementById('load-more-search');
        const loadMorePopularTvButton = document.getElementById('load-more-popular-tv');
        const loadMoreNewsButton = document.getElementById('load-more-news');

        loadMorePopularButton.addEventListener('click', () => {
            mainUI.popularMoviesPage++;
            mainUI.renderPopularMovies(true);
        });

        loadMoreSearchButton.addEventListener('click', () => {
            mainUI.searchResultsPage++;
            mainUI.renderSearchResults(mainUI.currentSearchQuery, true);
        });

        loadMorePopularTvButton.addEventListener('click', () => {
            mainUI.popularTvShowsPage++;
            mainUI.renderPopularTvShows(true);
        });

        loadMoreNewsButton.addEventListener('click', () => {
            mainUI.newsPage++;
            mainUI.renderNews(true);
        });
    }
}

// Export singleton instance
export const eventHandlers = new EventHandlers();
