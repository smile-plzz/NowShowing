/**
 * Storage Manager - Handles localStorage operations for watchlist and continue watching
 * Extracted from app.js to improve maintainability
 */

export class StorageManager {
    constructor() {
        this.WATCHLIST_KEY = 'ns_watchlist';
        this.CONTINUE_KEY = 'ns_continue';
    }

    getWatchlist() {
        try { 
            return JSON.parse(localStorage.getItem(this.WATCHLIST_KEY)) || []; 
        } catch { 
            return []; 
        }
    }

    setWatchlist(list) {
        localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(list));
    }

    getContinueWatching() {
        try { 
            return JSON.parse(localStorage.getItem(this.CONTINUE_KEY)) || []; 
        } catch { 
            return []; 
        }
    }

    setContinueWatching(list) {
        localStorage.setItem(this.CONTINUE_KEY, JSON.stringify(list));
    }

    upsertContinue(entry) {
        const list = this.getContinueWatching();
        const filtered = list.filter(e => e.imdbID !== entry.imdbID);
        filtered.unshift({ ...entry, updatedAt: Date.now() });
        this.setContinueWatching(filtered.slice(0, 20));
    }

    addToWatchlist(item) {
        const list = this.getWatchlist();
        const exists = list.some(i => i.imdbID === item.imdbID);
        if (!exists) {
            list.unshift(item);
            this.setWatchlist(list.slice(0, 100));
        }
        return true;
    }

    removeFromWatchlist(imdbID) {
        const list = this.getWatchlist();
        const filtered = list.filter(i => i.imdbID !== imdbID);
        this.setWatchlist(filtered);
        return true;
    }

    isInWatchlist(imdbID) {
        const list = this.getWatchlist();
        return list.some(item => item.imdbID === imdbID);
    }

    clearAll() {
        localStorage.removeItem(this.WATCHLIST_KEY);
        localStorage.removeItem(this.CONTINUE_KEY);
    }
}

// Export singleton instance
export const storage = new StorageManager();
