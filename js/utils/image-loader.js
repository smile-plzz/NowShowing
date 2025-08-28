/**
 * Image Loader - Handles image loading, fallbacks, and refresh functionality
 * Extracted from app.js to improve maintainability
 */

export const FALLBACK_POSTER = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">\
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%2317171f"/><stop offset="1" stop-color="%232a2d36"/></linearGradient></defs>\
<rect width="400" height="600" fill="url(%23g)"/>\
<g fill="%23b7bac1" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">\
<text x="200" y="280" font-size="24" font-weight="bold">Movie</text>\
<text x="200" y="320" font-size="16">Poster</text>\
<text x="200" y="350" font-size="14">Unavailable</text>\
</g></svg>';

export class ImageLoader {
    constructor() {
        this.loadingImages = new Map();
        this.failedImages = new Set();
    }

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
    }

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
    }
    
    // Clean up image resources
    cleanupImage(img) {
        if (img) {
            img.onerror = null;
            img.onload = null;
            img.src = '';
            img.remove();
        }
    }

    // Refresh all images in the current view
    refreshImages() {
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
                const newImg = this.createSimpleImage(originalSrc, movieTitle, { loading: 'lazy' });

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
                const newImg = this.createSimpleImage(originalSrc, title, { loading: 'lazy' });

                // Replace in-place to preserve layout
                if (img.parentNode) {
                    img.parentNode.replaceChild(newImg, img);
                }
            }
        });
    }

    // Nuclear option: Force complete image refresh
    nuclearImageRefresh() {
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
    }

    // Get image loading statistics
    getImageStats() {
        return {
            failed: 0,
            loading: 0,
            failedUrls: [],
            cacheBuster: Date.now()
        };
    }
}

// Export singleton instance
export const imageLoader = new ImageLoader();
