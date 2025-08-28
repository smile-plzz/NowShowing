/**
 * Video Sources Configuration - Defines all available video streaming sources
 * Extracted from app.js to improve maintainability
 */

export const videoSources = [
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
    { name: 'AutoEmbed', url: 'https://autoembed.cc/embed/', tvUrl: 'https://autoembed.cc/embed/' },
    { name: 'MultiEmbed', url: 'https://multiembed.mov/?video_id=', tvUrl: 'https://multiembed.mov/?video_id=' },
];

// Merge custom sources from localStorage (optional): [{ name, url, tvUrl }]
export function getCustomVideoSources() {
    try {
        const custom = JSON.parse(localStorage.getItem('ns_custom_sources') || '[]');
        if (Array.isArray(custom)) {
            return custom.filter(src => src && src.name && (src.url || src.tvUrl))
                .map(src => ({ 
                    name: String(src.name), 
                    url: src.url || null, 
                    tvUrl: src.tvUrl || null 
                }));
        }
    } catch { /* ignore */ }
    return [];
}

// Get all video sources including custom ones
export function getAllVideoSources() {
    const customSources = getCustomVideoSources();
    return [...videoSources, ...customSources];
}

// Find source by name
export function findSourceByName(name) {
    return getAllVideoSources().find(s => s.name === name);
}

// Get default source
export function getDefaultSource() {
    return findSourceByName('VidSrc.to') || getAllVideoSources()[0];
}
