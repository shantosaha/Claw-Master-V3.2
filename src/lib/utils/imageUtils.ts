/**
 * Image optimization utilities using wsrv.nl proxy
 * Provides WebP conversion, compression, and caching for external images
 */

const PLACEHOLDER_IMAGE = "/placeholder.png";
const PROXY_BASE = "https://wsrv.nl/?url=";

export interface OptimizedImageOptions {
    /** Target width in pixels (default: 800) */
    width?: number;
    /** Compression quality 1-100 (default: 80) */
    quality?: number;
    /** Cache version number for busting (default: 1) */
    version?: number;
}

/**
 * Transforms a raw image URL into an optimized wsrv.nl proxy URL
 * - Converts to WebP format
 * - Compresses to specified quality
 * - Enables progressive/interlaced loading
 * - Adds cache-control headers
 * 
 * @param rawUrl - The original image URL (e.g., from JotForm)
 * @param options - Optimization options
 * @returns Optimized proxy URL or placeholder if invalid
 */
export function getOptimizedUrl(
    rawUrl: string | null | undefined,
    options: OptimizedImageOptions = {}
): string {
    // Validate input
    if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
        return PLACEHOLDER_IMAGE;
    }

    const trimmedUrl = rawUrl.trim();

    // Skip optimization for local/blob URLs
    if (
        trimmedUrl.startsWith("blob:") ||
        trimmedUrl.startsWith("data:") ||
        trimmedUrl.startsWith("/")
    ) {
        return trimmedUrl;
    }

    const {
        width = 800,
        quality = 80,
        version = 1,
    } = options;

    // Encode the full URL to handle special characters
    const encodedUrl = encodeURIComponent(trimmedUrl);

    // Build the proxy URL with optimization parameters
    const params = new URLSearchParams({
        url: trimmedUrl, // wsrv.nl handles encoding internally
        w: String(width),
        q: String(quality),
        output: "webp",
        il: "", // Interlace/Progressive loading (flag, no value)
        we: "", // Force cache-control headers (flag, no value)
        v: String(version),
    });

    // Reconstruct to handle flag parameters correctly
    return `${PROXY_BASE}${encodedUrl}&w=${width}&q=${quality}&output=webp&il&we&v=${version}`;
}

/**
 * Generates thumbnail URL with small dimensions
 */
export function getThumbnailUrl(
    rawUrl: string | null | undefined,
    size: number = 80
): string {
    return getOptimizedUrl(rawUrl, { width: size, quality: 70 });
}

/**
 * Generates lightbox/preview URL with larger dimensions
 */
export function getLightboxUrl(
    rawUrl: string | null | undefined,
    maxWidth: number = 1200
): string {
    return getOptimizedUrl(rawUrl, { width: maxWidth, quality: 85 });
}
