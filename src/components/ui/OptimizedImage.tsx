"use client";

import { useState, CSSProperties } from "react";
import { getThumbnailUrl, getLightboxUrl, getOptimizedUrl } from "@/lib/utils/imageUtils";
import { cn } from "@/lib/utils";

export interface OptimizedImageProps {
    /** Raw source URL (will be transformed via proxy) */
    src: string | null | undefined;
    /** Alt text for accessibility */
    alt: string;
    /** Target width for optimization (default: 400) */
    width?: number;
    /** Aspect ratio for the container (default: "16/9") */
    aspectRatio?: string;
    /** Additional CSS classes for the wrapper */
    className?: string;
    /** Additional CSS classes for the image element */
    imageClassName?: string;
    /** Click handler */
    onClick?: () => void;
    /** Use thumbnail optimization (smaller size, lower quality) */
    thumbnail?: boolean;
    /** Use lightbox optimization (larger size, higher quality) */
    lightbox?: boolean;
    /** Object fit style (default: "cover") */
    objectFit?: "cover" | "contain" | "fill" | "none";
    /** Placeholder background color */
    placeholderColor?: string;
}

/**
 * High-performance image component using wsrv.nl proxy
 * Features:
 * - Automatic WebP conversion
 * - Progressive/interlaced loading
 * - Lazy loading with native browser support
 * - Aspect ratio box to prevent CLS
 * - Graceful error handling with fallback
 */
export function OptimizedImage({
    src,
    alt,
    width = 400,
    aspectRatio = "16/9",
    className,
    imageClassName,
    onClick,
    thumbnail = false,
    lightbox = false,
    objectFit = "cover",
    placeholderColor = "#e5e7eb", // Tailwind gray-200
}: OptimizedImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Determine the optimized URL based on usage context
    let optimizedSrc: string;
    if (thumbnail) {
        optimizedSrc = getThumbnailUrl(src, width);
    } else if (lightbox) {
        optimizedSrc = getLightboxUrl(src, width);
    } else {
        optimizedSrc = getOptimizedUrl(src, { width });
    }

    const wrapperStyle: CSSProperties = {
        aspectRatio,
        backgroundColor: placeholderColor,
        overflow: "hidden",
        position: "relative",
    };

    const imageStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit,
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
    };

    const handleError = () => {
        setHasError(true);
    };

    const handleLoad = () => {
        setIsLoaded(true);
    };

    // If there's an error or no valid source, show placeholder
    if (hasError || !src) {
        return (
            <div
                className={cn("rounded-md", className)}
                style={wrapperStyle}
                onClick={onClick}
            >
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("rounded-md", className)}
            style={wrapperStyle}
            onClick={onClick}
        >
            <img
                src={optimizedSrc}
                alt={alt}
                loading="lazy"
                decoding="async"
                style={imageStyle}
                className={imageClassName}
                onError={handleError}
                onLoad={handleLoad}
            />
        </div>
    );
}

/**
 * Thumbnail variant with square aspect ratio and lightbox prefetch on hover
 */
export function OptimizedThumbnail({
    src,
    alt,
    size = 48,
    className,
    onClick,
    prefetchLightbox = true,
}: {
    src: string | null | undefined;
    alt: string;
    size?: number;
    className?: string;
    onClick?: () => void;
    /** Prefetch full-size image on hover for instant lightbox (default: true) */
    prefetchLightbox?: boolean;
}) {
    const handleMouseEnter = () => {
        if (prefetchLightbox && src) {
            // Prefetch the lightbox URL in the background
            const lightboxUrl = getLightboxUrl(src, 1200);
            const img = new (window as any).Image();
            img.src = lightboxUrl;
        }
    };

    return (
        <div onMouseEnter={handleMouseEnter}>
            <OptimizedImage
                src={src}
                alt={alt}
                width={size}
                aspectRatio="1/1"
                thumbnail
                className={cn("cursor-pointer hover:opacity-80 transition-opacity", className)}
                onClick={onClick}
            />
        </div>
    );
}
