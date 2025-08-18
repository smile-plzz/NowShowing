document.addEventListener('DOMContentLoaded', () => {
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
    ];

    // --- API CALLS ---
    const FALLBACK_POSTER = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">\
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%230f0f14"/><stop offset="1" stop-color="%231a1a22"/></linearGradient></defs>\
<rect width="400" height="600" fill="url(%23g)"/>\
<g fill="%23777" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">\
<text x="200" y="300" font-size="28">No Image</text>\
</g></svg>';
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
        createMovieCard(movie) {
            if (!movie || !movie.Poster || movie.Poster === 'N/A') return null;

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';

            const imageContainer = document.createElement('div');
            imageContainer.className = 'movie-card-image-container';

            const img = document.createElement('img');
            img.src = movie.Poster;
            img.alt = movie.Title;
            img.loading = 'lazy';
            img.referrerPolicy = 'no-referrer';
            img.onerror = () => { img.onerror = null; img.src = FALLBACK_POSTER; };

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
                resumeBadge.textContent = 'Continue';
                imageContainer.appendChild(resumeBadge);
            }

            const body = document.createElement('div');
            body.className = 'movie-card-body';

            const title = document.createElement('h3');
            title.className = 'movie-card-title';
            title.textContent = movie.Title;

            body.appendChild(title);

            movieCard.appendChild(imageContainer);
            movieCard.appendChild(body);

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
            const valid = movies.filter(m => m && m.Response !== 'False' && m.Poster && m.Poster !== 'N/A');
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
            const valid = shows.filter(s => s && s.Response !== 'False' && s.Poster && s.Poster !== 'N/A');
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

                        const img = document.createElement('img');
                        img.src = article.urlToImage || '';
                        img.alt = article.title;
                        img.loading = 'lazy';
                        img.referrerPolicy = 'no-referrer';
                        img.onerror = () => { img.onerror = null; img.src = FALLBACK_POSTER; };

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
                console.error('Error fetching news:', error);
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
            popularMoviesSection.style.display = 'block';
            searchResultsSection.style.display = 'none';
            popularTvShowsSection.style.display = 'none';
            searchInput.value = '';
            loadMorePopularButton.style.display = 'block'; // Ensure it's visible on home view
            popularMoviesPage = 1; // Reset popular movies page
            this.renderPopularMovies(); // Re-render popular movies from start
            // Render continue and watchlist if present
            const cw = storage.getContinueWatching();
            continueWatchingSection.style.display = cw.length ? 'block' : 'none';
            if (cw.length) this.renderListSection(continueWatchingGrid, cw);
            const wl = storage.getWatchlist();
            watchlistSection.style.display = wl.length ? 'block' : 'none';
            if (wl.length) this.renderListSection(watchlistGrid, wl);
        },
        showSearchView() {
            popularMoviesSection.style.display = 'none';
            searchResultsSection.style.display = 'block';
            popularTvShowsSection.style.display = 'none';
        },
        async openVideoModal(imdbID) {
            sourceButtonsContainer.innerHTML = '';
            videoPlayer.src = ''; // Clear previous video
            videoAvailabilityStatus.textContent = 'Loading video sources...';
            videoAvailabilityStatus.style.display = 'block';
            seasonEpisodeSelector.style.display = 'none'; // Hide by default
            currentOpenImdbId = imdbID;

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
                document.getElementById('modal-movie-actors').textContent = details.Actors;
                document.getElementById('modal-movie-awards').textContent = details.Awards;
                document.getElementById('modal-movie-runtime').textContent = details.Runtime;
                document.getElementById('modal-movie-language').textContent = details.Language;
                document.getElementById('modal-movie-country').textContent = details.Country;
                document.getElementById('modal-movie-metascore').textContent = details.Metascore;
                document.getElementById('modal-movie-boxoffice').textContent = details.BoxOffice;
                document.getElementById('modal-movie-production').textContent = details.Production;
                document.getElementById('modal-movie-website').textContent = details.Website;

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
            videoPlayOverlay.style.display = 'flex'; // Show play overlay initially
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
                    videoPlayer.src = activeUrl;
                    videoAvailabilityStatus.textContent = `Attempting to load from ${activeSource.name}...`;
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
                    videoPlayer.src = fullUrl;
                    document.querySelectorAll('.source-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    videoAvailabilityStatus.textContent = `Loading from ${source.name}...`;
                    // Save continue-watching entry
                    storage.upsertContinue({ imdbID, title: document.getElementById('modal-movie-title').textContent, poster: document.getElementById('modal-movie-poster').src, type: 'movie' });
                };

                api.checkVideoAvailability(fullUrl).then(isAvailable => {
                    if (isAvailable) {
                        button.classList.add('is-available');
                    } else {
                        button.classList.add('is-unavailable');
                        const isActive = button.classList.contains('active');
                        if (isActive) {
                            const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.isSameNode(button) && !b.classList.contains('is-unavailable'));
                            if (next) next.click();
                        }
                    }
                });
            }

            setTimeout(() => {
                const activeBtn = document.querySelector('.source-button.active');
                if (activeBtn && activeBtn.classList.contains('is-unavailable')) {
                    const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.classList.contains('is-unavailable'));
                    if (next) next.click();
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
                    videoPlayer.src = activeUrl;
                    videoAvailabilityStatus.textContent = `Attempting to load from ${activeSource.name} (S${season}E${episode})...`;
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

                if (source.name === activeSource.name) {
                    button.classList.add('active');
                }

                button.onclick = () => {
                    videoPlayer.src = fullUrl;
                    document.querySelectorAll('.source-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    videoAvailabilityStatus.textContent = `Loading from ${source.name} (S${season}E${episode})...`;
                    // Save continue-watching entry for series
                    storage.upsertContinue({ imdbID, title: document.getElementById('modal-movie-title').textContent, poster: document.getElementById('modal-movie-poster').src, type: 'series', season, episode });
                };

                api.checkVideoAvailability(fullUrl).then(isAvailable => {
                    if (isAvailable) {
                        button.classList.add('is-available');
                    } else {
                        button.classList.add('is-unavailable');
                        const isActive = button.classList.contains('active');
                        if (isActive) {
                            const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.isSameNode(button) && !b.classList.contains('is-unavailable'));
                            if (next) next.click();
                        }
                    }
                });
            }

            setTimeout(() => {
                const activeBtn = document.querySelector('.source-button.active');
                if (activeBtn && activeBtn.classList.contains('is-unavailable')) {
                    const next = Array.from(document.querySelectorAll('.source-button')).find(b => !b.classList.contains('is-unavailable'));
                    if (next) next.click();
                }
            }, 6000);
        },

        closeVideoModal() {
            videoPlayer.src = 'about:blank'; // Clear iframe content to stop playback and release resources
            videoModal.style.display = 'none';
            videoAvailabilityStatus.style.display = 'none'; // Hide status when modal is closed
            videoPlayOverlay.style.display = 'none'; // Hide play overlay when modal is closed

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
                lastFocusedElement.focus(); // Return focus to the element that opened the modal
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
                } else {
                    // Generic fallback for other TV show sources
                    url = `${baseUrl}${imdbID}-S${season}E${episode}`;
                }
            }
            return url;
        },

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

    // Debounced search
    let searchDebounce;
    const triggerSearch = () => ui.renderSearchResults(searchInput.value.trim());
    searchButton.addEventListener('click', triggerSearch);
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(triggerSearch, 400);
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
                    lastFocusedElement.focus();
                }
                document.removeEventListener('keydown', ui.handleModalTabKey);
            }
        }
    });

    videoPlayOverlay.addEventListener('click', () => {
        videoPlayOverlay.style.display = 'none';
        // The iframe src is already set in openVideoModal, so just ensure it's loaded/playing
        // For some embeds, simply setting display to none might not trigger play, 
        // but for most iframe embeds, the content loads when the iframe is visible.
        // If issues persist, consider re-setting videoPlayer.src here or adding a specific play method if the embed API allows.
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
        popularMoviesSection.style.display = 'block';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = storage.getContinueWatching().length ? 'block' : 'none';
        watchlistSection.style.display = storage.getWatchlist().length ? 'block' : 'none';
        popularMoviesPage = 1;
        popularTvShowsPage = 1;
        ui.renderPopularMovies();
    });

    tvShowsNavLink.addEventListener('click', (e) => {
        e.preventDefault();
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
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'block';
        ui.renderListSection(watchlistGrid, storage.getWatchlist());
    });

    continueNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        continueWatchingSection.style.display = 'block';
        ui.renderListSection(continueWatchingGrid, storage.getContinueWatching());
    });

    mobileMoviesNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
        popularMoviesSection.style.display = 'block';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = storage.getContinueWatching().length ? 'block' : 'none';
        watchlistSection.style.display = storage.getWatchlist().length ? 'block' : 'none';
        popularMoviesPage = 1;
        popularTvShowsPage = 1;
        ui.renderPopularMovies();
    });

    mobileTvShowsNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
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
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        continueWatchingSection.style.display = 'none';
        watchlistSection.style.display = 'block';
        ui.renderListSection(watchlistGrid, storage.getWatchlist());
    });

    mobileContinueNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNavOverlay.classList.remove('active');
        popularMoviesSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        popularTvShowsSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        continueWatchingSection.style.display = 'block';
        ui.renderListSection(continueWatchingGrid, storage.getContinueWatching());
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
    // Watchlist toggle click
    watchlistToggle.addEventListener('click', () => {
        if (!currentOpenImdbId) return;
        const title = document.getElementById('modal-movie-title').textContent;
        const poster = document.getElementById('modal-movie-poster').src;
        const list = storage.getWatchlist();
        const idx = list.findIndex(i => i.imdbID === currentOpenImdbId);
        if (idx >= 0) {
            list.splice(idx, 1);
            storage.setWatchlist(list);
            watchlistToggle.setAttribute('aria-pressed', 'false');
            watchlistToggle.classList.remove('active');
            watchlistToggle.querySelector('.watchlist-toggle-text').textContent = 'Add to Watchlist';
        } else {
            list.unshift({ imdbID: currentOpenImdbId, title, poster });
            storage.setWatchlist(list.slice(0, 100));
            watchlistToggle.setAttribute('aria-pressed', 'true');
            watchlistToggle.classList.add('active');
            watchlistToggle.querySelector('.watchlist-toggle-text').textContent = 'Remove from Watchlist';
        }
        // Refresh watchlist section if visible
        ui.renderListSection(watchlistGrid, storage.getWatchlist());
        watchlistSection.style.display = storage.getWatchlist().length ? 'block' : 'none';
    });


    closeDeveloperMessageModal.addEventListener('click', () => {
        developerMessageModal.style.display = 'none';
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
        document.removeEventListener('keydown', ui.handleModalTabKey);
    });

    window.addEventListener('click', (event) => {
        if (event.target === developerMessageModal) {
            developerMessageModal.style.display = 'none';
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
            document.removeEventListener('keydown', ui.handleModalTabKey);
        }
    });

    // --- INITIAL LOAD ---
    const init = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        }

        // Continue watching and watchlist
        const continueList = storage.getContinueWatching();
        if (continueList.length) {
            continueWatchingSection.style.display = 'block';
            ui.renderListSection(continueWatchingGrid, continueList);
        }
        const watchList = storage.getWatchlist();
        if (watchList.length) {
            watchlistSection.style.display = 'block';
            ui.renderListSection(watchlistGrid, watchList);
        }

        ui.renderPopularMovies();
        ui.renderNews();
    };

    init();
});