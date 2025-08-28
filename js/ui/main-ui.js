/**
 * Main UI - Core UI functionality for the NowShowing application
 * Extracted from app.js to improve maintainability
 */

import { movieAPI } from '../api/movie-api.js';
import { storage } from '../utils/storage.js';
import { uiUtils } from '../utils/ui-utils.js';
import { getAllVideoSources, getDefaultSource } from '../config/video-sources.js';
import { cleanupManager } from '../utils/cleanup-manager.js';
import { imageLoader } from '../utils/image-loader.js';

export class MainUI {
    constructor() {
        this.popularMoviesPage = 1;
        this.popularTvShowsPage = 1;
        this.newsPage = 1;
        this.searchResultsPage = 1;
        this.currentSearchQuery = '';
        this.lastFocusedElement = null;
        this.currentOpenImdbId = null;
    }

    // Show home view
    showHomeView() {
        document.body.classList.add('home-page');
        
        const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
        const searchResultsSection = document.querySelector('#search-results').parentElement;
        const continueWatchingSection = document.getElementById('continue-watching-section');
        const watchlistSection = document.getElementById('watchlist-section');
        const continueWatchingGrid = document.getElementById('continue-watching-grid');
        const watchlistGrid = document.getElementById('watchlist-grid');
        const loadMorePopularButton = document.getElementById('load-more-popular');
        
        popularMoviesSection.style.display = 'block';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        document.getElementById('search-input').value = '';
        loadMorePopularButton.style.display = 'block';
        this.popularMoviesPage = 1;
        this.renderPopularMovies();
        
        // Render continue and watchlist if present
        const cw = storage.getContinueWatching();
        continueWatchingSection.style.display = cw.length ? 'block' : 'none';
        if (cw.length) uiUtils.renderListSection(continueWatchingGrid, cw);
        
        const wl = storage.getWatchlist();
        watchlistSection.style.display = wl.length ? 'block' : 'none';
        if (wl.length) uiUtils.renderListSection(watchlistGrid, wl);
    }

    // Show search view
    showSearchView() {
        document.body.classList.remove('home-page');
        
        const popularMoviesSection = document.querySelector('#popular-movies').parentElement;
        const searchResultsSection = document.querySelector('#search-results').parentElement;
        const popularTvShowsSection = document.querySelector('#popular-tv-shows').parentElement;
        
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'block';
        popularTvShowsSection.style.display = 'none';
    }

    // Render popular movies
    async renderPopularMovies(append = false) {
        const popularTitles = ['Inception', 'The Matrix', 'Interstellar', 'The Avengers', 'Avatar', 'Titanic', 'Jurassic Park', 'Forrest Gump', 'The Lion King', 'Gladiator', 'Pulp Fiction', 'Fight Club', 'The Lord of the Rings', 'Star Wars', 'Dune'];
        const moviesPerPage = 4;
        const startIndex = (this.popularMoviesPage - 1) * moviesPerPage;
        const endIndex = startIndex + moviesPerPage;
        const titlesToLoad = popularTitles.slice(startIndex, endIndex);

        const popularMoviesGrid = document.getElementById('popular-movies');
        const loadMorePopularButton = document.getElementById('load-more-popular');

        if (titlesToLoad.length === 0 && append) {
            loadMorePopularButton.style.display = 'none';
            return;
        }

        if (!append) {
            popularMoviesGrid.innerHTML = '';
            uiUtils.renderSkeletons(popularMoviesGrid, moviesPerPage);
        }

        const moviePromises = titlesToLoad.map(title => movieAPI.fetchMovieByTitle(title, 'movie'));
        const movies = await Promise.all(moviePromises);
        
        const valid = movies.filter(m => m && m.Response !== 'False');
        
        if (valid.length === 0 && !append) {
            popularMoviesGrid.innerHTML = '<p class="error-message">Unable to load movies right now. Please try again shortly.</p>';
            loadMorePopularButton.style.display = 'none';
            return;
        }
        
        uiUtils.renderMovieGrid(popularMoviesGrid, valid, append, loadMorePopularButton, this.popularMoviesPage, popularTitles.length);
    }

    // Render popular TV shows
    async renderPopularTvShows(append = false) {
        const popularTitles = ['Breaking Bad', 'Game of Thrones', 'The Office', 'Friends', 'The Simpsons', 'Stranger Things', 'The Mandalorian', 'The Crown', 'Westworld', 'Chernobyl', 'The Witcher', 'Black Mirror'];
        const showsPerPage = 4;
        const startIndex = (this.popularTvShowsPage - 1) * showsPerPage;
        const endIndex = startIndex + showsPerPage;
        const titlesToLoad = popularTitles.slice(startIndex, endIndex);

        const popularTvShowsGrid = document.getElementById('popular-tv-shows');
        const loadMorePopularTvButton = document.getElementById('load-more-popular-tv');

        if (titlesToLoad.length === 0 && append) {
            loadMorePopularTvButton.style.display = 'none';
            return;
        }

        if (!append) {
            popularTvShowsGrid.innerHTML = '';
            uiUtils.renderSkeletons(popularTvShowsGrid, showsPerPage);
        }

        const showPromises = titlesToLoad.map(title => movieAPI.fetchMovieByTitle(title, 'series'));
        const shows = await Promise.all(showPromises);
        const valid = shows.filter(s => s && s.Response !== 'False');
        
        if (valid.length === 0 && !append) {
            popularTvShowsGrid.innerHTML = '<p class="error-message">Unable to load TV shows right now. Please try again shortly.</p>';
            loadMorePopularTvButton.style.display = 'none';
            return;
        }
        
        uiUtils.renderMovieGrid(popularTvShowsGrid, valid, append, loadMorePopularTvButton, this.popularTvShowsPage, popularTitles.length);
    }

    // Render news
    async renderNews(append = false) {
        const url = `/api/fetch-news?page=${this.newsPage}`;
        const newsGrid = document.getElementById('news-grid');
        const loadMoreNewsButton = document.getElementById('load-more-news');

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
                if (this.newsPage * 6 < data.totalResults) {
                    loadMoreNewsButton.style.display = 'block';
                } else {
                    loadMoreNewsButton.style.display = 'none';
                }
            }
        } catch (error) {
            if (!append) {
                newsGrid.innerHTML = `<p class="error-message">Could not load news: ${error.message}. Please try again later.</p>`;
            }
            loadMoreNewsButton.style.display = 'none';
        }
    }

    // Render search results
    async renderSearchResults(query, append = false) {
        this.currentSearchQuery = query;
        if (!query || query.length < 2) {
            this.showSearchView();
            uiUtils.displayError('Please enter at least 2 characters to search.', document.getElementById('search-results'));
            return;
        }
        
        if (!append) {
            this.searchResultsPage = 1;
            this.showSearchView();
            const searchResultsGrid = document.getElementById('search-results');
            searchResultsGrid.innerHTML = '';
            uiUtils.renderSkeletons(searchResultsGrid, 8);
        }

        const results = await movieAPI.fetchMoviesBySearch(query, this.searchResultsPage);

        if (results && results.Response === 'True' && results.Search) {
            const searchResultsGrid = document.getElementById('search-results');
            const loadMoreSearchButton = document.getElementById('load-more-search');
            uiUtils.renderMovieGrid(searchResultsGrid, results.Search, append, loadMoreSearchButton, this.searchResultsPage, results.totalResults);
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
            uiUtils.displayError(errorMessage, document.getElementById('search-results'));
        }
    }

    // Show image status
    showImageStatus() {
        const stats = imageLoader.getImageStats();
        const message = `Images: ${stats.loading} loading, ${stats.failed} failed`;
        
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
    }
}

// Export singleton instance
export const mainUI = new MainUI();
