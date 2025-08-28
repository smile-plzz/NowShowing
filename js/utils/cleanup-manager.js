/**
 * Cleanup Manager - Handles memory management and resource cleanup
 * Extracted from app.js to improve maintainability
 */

export class CleanupManager {
    constructor() {
        this.timeouts = new Set();
        this.eventListeners = new Map();
        this.intervals = new Set();
    }
    
    // Track timeouts for cleanup
    setTimeout(callback, delay) {
        const timeoutId = setTimeout(callback, delay);
        this.timeouts.add(timeoutId);
        return timeoutId;
    }
    
    // Track intervals for cleanup
    setInterval(callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.intervals.add(intervalId);
        return intervalId;
    }
    
    // Clean up all timeouts
    clearAllTimeouts() {
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts.clear();
    }
    
    // Clean up all intervals
    clearAllIntervals() {
        this.intervals.forEach(id => clearInterval(id));
        this.intervals.clear();
    }
    
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
    }
    
    // Remove specific event listener
    removeEventListenerWithTracking(element, event, listener) {
        const elementListeners = this.eventListeners.get(element);
        if (elementListeners && elementListeners.has(event)) {
            elementListeners.get(event).delete(listener);
            element.removeEventListener(event, listener);
        }
    }
    
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
    }
    
    // Full cleanup
    cleanup() {
        this.clearAllTimeouts();
        this.clearAllIntervals();
        this.clearAllEventListeners();
    }
}

// Export singleton instance
export const cleanupManager = new CleanupManager();
