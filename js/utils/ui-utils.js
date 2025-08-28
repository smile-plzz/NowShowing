/**
 * UI Utilities - Common UI helper functions
 * Extracted from app.js to improve maintainability
 */

import { imageLoader, FALLBACK_POSTER } from './image-loader.js';

export class UIUtils {
    constructor() {
        this.currentSeasonChangeListener = null;
        this.currentEpisodeChangeListener = null;
    }

    displayError(message, container) {
        container.innerHTML = '';
        const h2 = document.createElement('h2');
        h2.className = 'error-message';
        h2.textContent = message;
        container.appendChild(h2);
        return h2;
    }

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
    }

    renderSkeletons(container, count) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createSkeletonCard());
        }
    }

    createMovieCard(movie) {
        if (!movie) return null;

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'movie-card-image-container';

        // Use robust image loader with retry logic
        const img = imageLoader.createSimpleImage(
            movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : FALLBACK_POSTER, 
            movie.Title, 
            { loading: 'lazy' }
        );

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

        const body = document.createElement('div');
        body.className = 'movie-card-body';

        const title = document.createElement('h3');
        title.className = 'movie-card-title';
        title.textContent = movie.Title;

        body.appendChild(title);

        movieCard.appendChild(imageContainer);
        movieCard.appendChild(body);

        return movieCard;
    }

    renderMovieGrid(container, movies, append, loadMoreButton, currentPage, totalResults) {
        if (!append) {
            container.innerHTML = '';
        }
        movies.forEach(movie => {
            const movieCard = this.createMovieCard(movie);
            if (movieCard) {
                container.appendChild(movieCard);
            }
        });

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
    }

    renderListSection(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            const card = this.createMovieCard({
                Poster: item.poster,
                Title: item.title,
                imdbID: item.imdbID,
            });
            if (card) container.appendChild(card);
        });
    }

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
    }

    removeModalTabKeyListener() {
        if (this.handleModalTabKey) {
            document.removeEventListener('keydown', this.handleModalTabKey);
            this.handleModalTabKey = null;
        }
    }
}

// Export singleton instance
export const uiUtils = new UIUtils();
