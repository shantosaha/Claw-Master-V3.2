"use client";

import React, { useState } from "react";
import { getOptimizedUrl } from "@/lib/utils/imageProxy";
import { cn } from "@/lib/utils";

export interface OptimizedImageProps {
    src: string | null | undefined;
    alt: string;
    width?: number;
    quality?: number;
    aspectRatio?: string;
    className?: string;
    containerClassName?: string;
    onClick?: () => void;
}

const FALLBACK_PLACEHOLDER = "/placeholder.png";

/**
 * A high-performance image component that:
 * - Uses wsrv.nl as a CDN proxy for resizing & WebP conversion.
 * - Implements native lazy loading.
 * - Uses aspect-ratio boxes with placeholder backgrounds to prevent CLS.
 */
export function OptimizedImage({
    src,
    alt,
    width = 800,
    quality = 80,
    aspectRatio = "16 / 9",
    className,
    containerClassName,
    onClick,
}: OptimizedImageProps) {
    const [hasError, setHasError] = useState(false);

    const optimizedSrc = hasError
        ? FALLBACK_PLACEHOLDER
        : getOptimizedUrl(src, { width, quality });

    const handleError = () => {
        console.warn("[OptimizedImage] Failed to load:", src);
        setHasError(true);
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-muted",
                containerClassName
            )}
            style={{ aspectRatio }}
            onClick={onClick}
        >
            <img
                src={optimizedSrc}
                alt={alt}
                loading="lazy"
                decoding="async"
                onError={handleError}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    className
                )}
            />
        </div>
    );
}
