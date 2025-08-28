/**
 * Video Player - Handles video modal, source switching, and video loading
 * Extracted from app.js to improve maintainability
 */

import { movieAPI } from '../api/movie-api.js';
import { storage } from '../utils/storage.js';
import { getAllVideoSources, getDefaultSource } from '../config/video-sources.js';
import { uiUtils } from '../utils/ui-utils.js';

export class VideoPlayer {
    constructor() {
        this.currentOpenImdbId = null;
        this.currentSeasonChangeListener = null;
        this.currentEpisodeChangeListener = null;
        this.lastFocusedElement = null;
    }

    // Open video modal
    async openVideoModal(imdbID) {
        const sourceButtonsContainer = document.getElementById('source-buttons');
        const videoPlayer = document.getElementById('video-player');
        const videoAvailabilityStatus = document.getElementById('video-availability-status');
        const seasonEpisodeSelector = document.getElementById('season-episode-selector');
        const videoPlayOverlay = document.getElementById('video-play-overlay');
        const videoModal = document.getElementById('video-modal');
        const watchlistToggle = document.getElementById('watchlist-toggle');

        sourceButtonsContainer.innerHTML = '';
        videoPlayer.src = ''; // Clear previous video
        videoAvailabilityStatus.textContent = 'Loading video sources...';
        videoAvailabilityStatus.style.display = 'block';
        seasonEpisodeSelector.style.display = 'none'; // Hide by default
        this.currentOpenImdbId = imdbID;

        // Reset video player state
        videoPlayer.onload = null;
        videoPlayer.onerror = null;
        
        // Ensure play overlay is visible initially
        videoPlayOverlay.style.display = 'flex';

        const details = await movieAPI.fetchMovieDetails(imdbID);

        if (details && details.Response === 'True') {
            this.populateModalDetails(details);
            this.setupWatchlistToggle(details);

            if (details.Type === 'series') {
                seasonEpisodeSelector.style.display = 'block';
                await this.setupTvShowSeasonEpisode(imdbID);
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
        this.lastFocusedElement = document.activeElement; // Save the element that had focus
        videoModal.focus(); // Set focus to the modal
        uiUtils.trapFocus(videoModal);
    }

    // Populate modal with movie details
    populateModalDetails(details) {
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
        modalPoster.src = details.Poster && details.Poster !== 'N/A' ? details.Poster : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%2317171f"/><stop offset="1" stop-color="%232a2d36"/></linearGradient></defs><rect width="400" height="600" fill="url(%23g)"/><g fill="%23b7bac1" font-family="Arial,Helvetica,sans-serif" text-anchor="middle"><text x="200" y="280" font-size="24" font-weight="bold">Movie</text><text x="200" y="320" font-size="16">Poster</text><text x="200" y="350" font-size="14">Unavailable</text></g></svg>';
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
    }

    // Setup watchlist toggle
    setupWatchlistToggle(details) {
        const watchlistToggle = document.getElementById('watchlist-toggle');
        const watchlist = storage.getWatchlist();
        const isInWatchlist = watchlist.some(item => item.imdbID === details.imdbID);
        
        watchlistToggle.setAttribute('aria-pressed', isInWatchlist ? 'true' : 'false');
        watchlistToggle.classList.toggle('active', isInWatchlist);
        const toggleText = watchlistToggle.querySelector('.watchlist-toggle-text');
        toggleText.textContent = isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';
    }

    // Setup TV show season and episode selectors
    async setupTvShowSeasonEpisode(imdbID) {
        const seasonSelect = document.getElementById('season-select');
        const episodeSelect = document.getElementById('episode-select');
        const details = await movieAPI.fetchMovieDetails(imdbID);

        if (details && details.Response === 'True') {
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

            // Setup event listeners
            this.currentSeasonChangeListener = async (event) => {
                await this.populateEpisodes(imdbID, event.target.value);
            };
            seasonSelect.addEventListener('change', this.currentSeasonChangeListener);
            
            this.currentEpisodeChangeListener = () => this.loadVideoForSelectedEpisode(imdbID);
            episodeSelect.addEventListener('change', this.currentEpisodeChangeListener);
        }
    }

    // Populate episodes for a season
    async populateEpisodes(imdbID, seasonNumber) {
        const episodeSelect = document.getElementById('episode-select');
        const videoAvailabilityStatus = document.getElementById('video-availability-status');
        
        episodeSelect.innerHTML = '';
        const seasonData = await movieAPI.fetchTvShowSeason(imdbID, seasonNumber);
        
        if (seasonData && seasonData.Response === 'True' && seasonData.Episodes) {
            seasonData.Episodes.forEach(episode => {
                const option = document.createElement('option');
                option.value = episode.Episode;
                option.textContent = `Episode ${episode.Episode}: ${episode.Title}`;
                episodeSelect.appendChild(option);
            });
            this.loadVideoForSelectedEpisode(imdbID); // Load video for the first episode
        } else {
            videoAvailabilityStatus.textContent = 'No episodes found for this season.';
            videoAvailabilityStatus.style.display = 'block';
        }
    }

    // Load video for movie
    async loadVideoForMovie(imdbID) {
        const videoPlayer = document.getElementById('video-player');
        const sourceButtonsContainer = document.getElementById('source-buttons');
        const videoAvailabilityStatus = document.getElementById('video-availability-status');

        videoPlayer.src = '';
        sourceButtonsContainer.innerHTML = ''; // Clear buttons
        videoAvailabilityStatus.textContent = 'Loading video sources...';
        videoAvailabilityStatus.style.display = 'block';

        const activeSource = getDefaultSource();

        if (activeSource) {
            const activeUrl = this.constructVideoUrl(activeSource, imdbID, null, null, 'movie');
            if (activeUrl) {
                videoPlayer.src = activeUrl;
                videoAvailabilityStatus.textContent = `Attempting to load from ${activeSource.name}...`;
                
                // Add load event listener to check if iframe loads successfully
                videoPlayer.onload = () => {
                    videoAvailabilityStatus.textContent = `Video loaded from ${activeSource.name}`;
                };
                
                videoPlayer.onerror = () => {
                    videoAvailabilityStatus.textContent = `Failed to load from ${activeSource.name}`;
                };
            }
        } else {
            videoAvailabilityStatus.textContent = 'No video sources available.';
            return;
        }

        // Create buttons for all sources
        const allSources = getAllVideoSources();
        for (const source of allSources) {
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
                this.switchVideoSource(videoPlayer, fullUrl, source, videoAvailabilityStatus);
                this.saveContinueWatching(imdbID, 'movie');
            };

            // Check availability and update button styling
            this.checkSourceAvailability(button, fullUrl, videoPlayer, videoAvailabilityStatus);
        }
    }

    // Load video for selected episode
    async loadVideoForSelectedEpisode(imdbID) {
        const season = document.getElementById('season-select').value;
        const episode = document.getElementById('episode-select').value;
        if (!season || !episode) return;

        const videoPlayer = document.getElementById('video-player');
        const sourceButtonsContainer = document.getElementById('source-buttons');
        const videoAvailabilityStatus = document.getElementById('video-availability-status');

        videoPlayer.src = '';
        sourceButtonsContainer.innerHTML = ''; // Clear old source buttons
        videoAvailabilityStatus.textContent = `Loading video sources for S${season}E${episode}...`;
        videoAvailabilityStatus.style.display = 'block';

        const activeSource = getDefaultSource();

        if (activeSource) {
            const activeUrl = this.constructVideoUrl(activeSource, imdbID, season, episode, 'series');
            if (activeUrl) {
                videoPlayer.src = activeUrl;
                videoAvailabilityStatus.textContent = `Attempting to load from ${activeSource.name} (S${season}E${episode})...`;
                
                // Add load event listener to check if iframe loads successfully
                videoPlayer.onload = () => {
                    videoAvailabilityStatus.textContent = `Episode loaded from ${activeSource.name}`;
                };
                
                videoPlayer.onerror = () => {
                    videoAvailabilityStatus.textContent = `Failed to load episode from ${activeSource.name}`;
                };
            }
        } else {
            videoAvailabilityStatus.textContent = 'No TV show sources available.';
            return;
        }

        const allSources = getAllVideoSources();
        for (const source of allSources) {
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
                this.switchVideoSource(videoPlayer, fullUrl, source, videoAvailabilityStatus, season, episode);
                this.saveContinueWatching(imdbID, 'series', season, episode);
            };

            // Check availability and update button styling
            this.checkSourceAvailability(button, fullUrl, videoPlayer, videoAvailabilityStatus);
        }
    }

    // Switch video source
    switchVideoSource(videoPlayer, url, source, statusElement, season = null, episode = null) {
        videoPlayer.src = url;
        document.querySelectorAll('.source-button').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const episodeInfo = season && episode ? ` (S${season}E${episode})` : '';
        statusElement.textContent = `Loading from ${source.name}${episodeInfo}...`;
        
        // Clear previous event listeners
        videoPlayer.onload = null;
        videoPlayer.onerror = null;
        
        // Add new event listeners
        videoPlayer.onload = () => {
            statusElement.textContent = `Video loaded from ${source.name}${episodeInfo}`;
        };
        
        videoPlayer.onerror = () => {
            statusElement.textContent = `Failed to load from ${source.name}${episodeInfo}`;
        };
    }

    // Check source availability
    async checkSourceAvailability(button, url, videoPlayer, statusElement) {
        try {
            const isAvailable = await movieAPI.checkVideoAvailability(url);
            if (isAvailable) {
                button.classList.add('is-available');
            } else {
                button.classList.add('is-unavailable');
                const isActive = button.classList.contains('active');
                if (isActive) {
                    const next = Array.from(document.querySelectorAll('.source-button')).find(b => 
                        !b.isSameNode(button) && !b.classList.contains('is-unavailable')
                    );
                    if (next) next.click();
                }
            }
        } catch (error) {
            button.classList.add('is-unavailable');
        }
    }

    // Save continue watching entry
    saveContinueWatching(imdbID, type, season = null, episode = null) {
        const title = document.getElementById('modal-movie-title').textContent;
        const poster = document.getElementById('modal-movie-poster').src;
        
        const entry = { 
            imdbID, 
            title, 
            poster, 
            type 
        };
        
        if (season && episode) {
            entry.season = season;
            entry.episode = episode;
        }
        
        storage.upsertContinue(entry);
    }

    // Construct video URL
    constructVideoUrl(source, imdbID, season = null, episode = null, mediaType) {
        if (mediaType === 'series' && !source.tvUrl) return null;

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
                url = `${baseUrl}${imdbID}&s=${season}&e=${episode}`;
            } else {
                // Generic fallback for other TV show sources
                url = `${baseUrl}${imdbID}-S${season}E${episode}`;
            }
        }
        return url;
    }

    // Close video modal
    closeVideoModal() {
        const videoPlayer = document.getElementById('video-player');
        const videoModal = document.getElementById('video-modal');
        const videoAvailabilityStatus = document.getElementById('video-availability-status');
        const videoPlayOverlay = document.getElementById('video-play-overlay');
        const seasonSelect = document.getElementById('season-select');
        const episodeSelect = document.getElementById('episode-select');

        videoPlayer.src = 'about:blank'; // Clear iframe content to stop playback and release resources
        videoModal.style.display = 'none';
        videoAvailabilityStatus.style.display = 'none';
        videoPlayOverlay.style.display = 'none';

        // Remove event listeners to prevent memory leaks
        if (seasonSelect && this.currentSeasonChangeListener) {
            seasonSelect.removeEventListener('change', this.currentSeasonChangeListener);
            this.currentSeasonChangeListener = null;
        }
        if (episodeSelect && this.currentEpisodeChangeListener) {
            episodeSelect.removeEventListener('change', this.currentEpisodeChangeListener);
            this.currentEpisodeChangeListener = null;
        }

        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus(); // Return focus to the element that opened the modal
            this.lastFocusedElement = null;
        }
        
        uiUtils.removeModalTabKeyListener();
    }
}

// Export singleton instance
export const videoPlayer = new VideoPlayer();
