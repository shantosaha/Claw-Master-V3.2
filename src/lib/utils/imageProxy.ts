const FALLBACK_PLACEHOLDER = "/placeholder.png";
const PROXY_BASE_URL = "https://wsrv.nl/";
const CACHE_VERSION = 1;

export interface OptimizedUrlOptions {
    width?: number;
    quality?: number;
    aspectRatio?: string;
}

/**
 * Transforms a raw image URL into a wsrv.nl proxied URL with WebP output, resizing, and caching.
 * @param rawUrl - The original image URL (e.g., from JotForm).
 * @param options - Optional configuration for width, quality, etc.
 * @returns A proxied, optimized URL string.
 */
export function getOptimizedUrl(
    rawUrl: string | null | undefined,
    options: OptimizedUrlOptions = {}
): string {
    const { width = 800, quality = 80 } = options;

    // Handle empty/null URLs
    if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
        return FALLBACK_PLACEHOLDER;
    }

    const trimmedUrl = rawUrl.trim();

    // Don't proxy local URLs or blob URLs
    if (
        trimmedUrl.startsWith("/") ||
        trimmedUrl.startsWith("blob:") ||
        trimmedUrl.startsWith("data:")
    ) {
        return trimmedUrl;
    }

    try {
        // Encode the full URL to prevent breaks from special characters
        const encodedUrl = encodeURIComponent(trimmedUrl);

        // Build the proxied URL with optimization parameters
        const proxyUrl = new URL(PROXY_BASE_URL);
        proxyUrl.searchParams.set("url", trimmedUrl);
        proxyUrl.searchParams.set("w", String(width));
        proxyUrl.searchParams.set("q", String(quality));
        proxyUrl.searchParams.set("output", "webp");
        proxyUrl.searchParams.set("il", ""); // Interlace/Progressive
        proxyUrl.searchParams.set("we", ""); // Force cache-control headers
        proxyUrl.searchParams.set("v", String(CACHE_VERSION));

        return proxyUrl.toString();
    } catch (error) {
        console.error("[imageProxy] Failed to build optimized URL:", error);
        return FALLBACK_PLACEHOLDER;
    }
}

/**
 * Returns only the cache-bust version parameter for URL comparison.
 */
export function getCacheVersion(): number {
    return CACHE_VERSION;
}
