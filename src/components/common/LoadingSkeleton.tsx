"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    variant?: "card" | "table" | "list" | "detail" | "stats";
    count?: number;
    className?: string;
}

/**
 * Reusable loading skeleton component for various layouts
 */
export function LoadingSkeleton({
    variant = "card",
    count = 1,
    className
}: LoadingSkeletonProps) {
    const items = Array.from({ length: count }, (_, i) => i);

    if (variant === "card") {
        return (
            <div className={cn("grid gap-4", className)}>
                {items.map((i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "table") {
        return (
            <div className={cn("space-y-2", className)}>
                {/* Header */}
                <div className="flex gap-4 p-2 border-b">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
                {/* Rows */}
                {items.map((i) => (
                    <div key={i} className="flex gap-4 p-2 border-b">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "list") {
        return (
            <div className={cn("space-y-3", className)}>
                {items.map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "detail") {
        return (
            <div className={cn("space-y-6", className)}>
                {/* Header */}
                <div className="flex items-start gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
                {/* Content sections */}
                <div className="space-y-4">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (variant === "stats") {
        return (
            <div className={cn("grid gap-4 grid-cols-2 md:grid-cols-4", className)}>
                {items.map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-7 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                ))}
            </div>
        );
    }

    return null;
}

export default LoadingSkeleton;
