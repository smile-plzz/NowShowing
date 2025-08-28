/**
 * NowShowing - Main Application Module
 * Modular architecture with clean separation of concerns
 * 
 * This module serves as the entry point and orchestrates all application functionality
 * through well-defined, maintainable modules.
 */

import { mainUI } from './ui/main-ui.js';
import { videoPlayer } from './ui/video-player.js';
import { eventHandlers } from './events/event-handlers.js';
import { storage } from './utils/storage.js';
import { uiUtils } from './utils/ui-utils.js';

/**
 * Main Application Class
 * Handles initialization and coordination between modules
 */
class NowShowingApp {
    constructor() {
        this.isInitialized = false;
        this.currentTheme = localStorage.getItem('theme') || 'dark';
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) {
            console.warn('NowShowing app already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing NowShowing application...');
            
            // Setup theme
            this.setupTheme();
            
            // Initialize UI components
            await this.initializeUI();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Setup movie card click handlers
            this.setupMovieCardHandlers();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ NowShowing application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize NowShowing application:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Setup theme system
     */
    setupTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        
        if (this.currentTheme === 'light') {
            document.body.classList.add('light-mode');
            if (themeToggle) themeToggle.checked = true;
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUI() {
        // Add home-page class to body for initial load
        document.body.classList.add('home-page');
        
        // Initialize continue watching and watchlist sections
        this.initializeUserSections();
        
        // Render initial content
        await Promise.all([
            mainUI.renderPopularMovies(),
            mainUI.renderNews()
        ]);
    }

    /**
     * Initialize user-specific sections (continue watching, watchlist)
     */
    initializeUserSections() {
        const continueWatchingSection = document.getElementById('continue-watching-section');
        const continueWatchingGrid = document.getElementById('continue-watching-grid');
        const watchlistSection = document.getElementById('watchlist-section');
        const watchlistGrid = document.getElementById('watchlist-grid');

        // Continue watching section
        const continueList = storage.getContinueWatching();
        if (continueList.length) {
            continueWatchingSection.style.display = 'block';
            uiUtils.renderListSection(continueWatchingGrid, continueList);
        } else {
            // Show continue watching section even if empty for better UX
            continueWatchingSection.style.display = 'block';
            continueWatchingGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No shows in your continue watching list yet. Start watching something to see it here!</p>';
        }
        
        // Watchlist section
        const watchList = storage.getWatchlist();
        if (watchList.length) {
            watchlistSection.style.display = 'block';
            uiUtils.renderListSection(watchlistGrid, watchList);
        } else {
            // Show watchlist section even if empty for better UX
            watchlistSection.style.display = 'block';
            watchlistGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Your watchlist is empty. Add movies and shows to see them here!</p>';
        }
    }

    /**
     * Setup all event handlers
     */
    setupEventHandlers() {
        // Initialize event handlers
        eventHandlers.init();
        
        // Setup load more handlers separately
        eventHandlers.setupLoadMoreHandlers();
    }

    /**
     * Setup movie card click handlers
     * This needs to be done after the UI is rendered
     */
    setupMovieCardHandlers() {
        // Use event delegation for movie card clicks
        document.addEventListener('click', (event) => {
            const movieCard = event.target.closest('.movie-card');
            if (movieCard) {
                // Find the movie card that was clicked
                const movieCardElement = movieCard;
                
                // Add click handler if not already added
                if (!movieCardElement.hasAttribute('data-handler-attached')) {
                    movieCardElement.setAttribute('data-handler-attached', 'true');
                    
                    // Find the movie ID from the card
                    const titleElement = movieCardElement.querySelector('.movie-card-title');
                    if (titleElement) {
                        const title = titleElement.textContent;
                        
                        // Search for the movie to get its IMDB ID
                        this.searchAndOpenMovie(title);
                    }
                }
            }
        });
    }

    /**
     * Search for a movie and open it in the video modal
     */
    async searchAndOpenMovie(title) {
        try {
            const movieData = await fetch(`/api/omdb-proxy?title=${encodeURIComponent(title)}`);
            const movie = await movieData.json();
            
            if (movie && movie.Response === 'True' && movie.imdbID) {
                videoPlayer.openVideoModal(movie.imdbID);
            }
        } catch (error) {
            console.error('Failed to open movie:', error);
        }
    }

    /**
     * Show initialization error to user
     */
    showInitializationError(error) {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-color);">
                    <h2>⚠️ Application Error</h2>
                    <p>Failed to initialize NowShowing. Please refresh the page and try again.</p>
                    <p><small>Error: ${error.message}</small></p>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            theme: this.currentTheme,
            modules: {
                mainUI: !!mainUI,
                videoPlayer: !!videoPlayer,
                eventHandlers: !!eventHandlers,
                storage: !!storage,
                uiUtils: !!uiUtils
            }
        };
    }
}

// Create and export the main application instance
const app = new NowShowingApp();

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(error => {
        console.error('Critical error during app initialization:', error);
    });
});

// Export for potential external use
export { app, NowShowingApp };

// Make app available globally for debugging (development only)
if (process.env.NODE_ENV === 'development') {
    window.NowShowingApp = app;
}
