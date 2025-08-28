/**
 * Movie API - Handles all movie and TV show API calls
 * Extracted from app.js to improve maintainability
 */

export class MovieAPI {
    constructor() {
        this.baseUrl = '/api';
    }

    async checkVideoAvailability(url) {
        console.log(`[checkVideoAvailability] Checking URL: ${url}`);
        try {
            const response = await fetch(`${this.baseUrl}/check-video`, {
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
    }

    async fetchMovieByTitle(title, type = '') {
        try {
            let url = `${this.baseUrl}/omdb-proxy?title=${encodeURIComponent(title)}`;
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
    }

    async fetchMovieDetails(imdbID) {
        try {
            const url = `${this.baseUrl}/omdb-proxy?imdbID=${imdbID}&plot=full`;
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
    }

    async fetchMoviesBySearch(query, page = 1, type = '') {
        try {
            let url = `${this.baseUrl}/omdb-proxy?s=${encodeURIComponent(query)}&page=${page}`;
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
    }

    async fetchTvShowSeason(imdbID, seasonNumber) {
        try {
            const url = `${this.baseUrl}/omdb-proxy?imdbID=${imdbID}&seasonNumber=${seasonNumber}`;
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
    }
}

// Export singleton instance
export const movieAPI = new MovieAPI();
