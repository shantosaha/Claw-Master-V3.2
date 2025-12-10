"use client";

import { LucideIcon, Package, FileQuestion, Users, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: "default" | "secondary" | "outline";
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    variant?: "default" | "muted" | "destructive";
    className?: string;
}

/**
 * Reusable empty state component for pages and sections with no data
 */
export function EmptyState({
    icon: Icon = Package,
    title,
    description,
    action,
    secondaryAction,
    variant = "default",
    className,
}: EmptyStateProps) {
    const variantStyles = {
        default: {
            container: "bg-muted/20",
            icon: "text-muted-foreground",
            title: "text-foreground",
            description: "text-muted-foreground",
        },
        muted: {
            container: "bg-transparent",
            icon: "text-muted-foreground/50",
            title: "text-muted-foreground",
            description: "text-muted-foreground/80",
        },
        destructive: {
            container: "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900",
            icon: "text-red-500",
            title: "text-red-700 dark:text-red-400",
            description: "text-red-600/80 dark:text-red-400/80",
        },
    };

    const styles = variantStyles[variant];

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-6 rounded-lg text-center",
                styles.container,
                className
            )}
        >
            <div className={cn("p-4 rounded-full bg-background/50 mb-4", styles.icon)}>
                <Icon className="h-10 w-10" />
            </div>
            <h3 className={cn("text-lg font-semibold mb-1", styles.title)}>{title}</h3>
            {description && (
                <p className={cn("text-sm max-w-sm mb-4", styles.description)}>
                    {description}
                </p>
            )}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant={action.variant || "default"}
                            size="sm"
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="ghost"
                            size="sm"
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// Pre-configured empty states for common use cases
export function NoItemsFound({
    onAdd,
    itemType = "items"
}: {
    onAdd?: () => void;
    itemType?: string;
}) {
    return (
        <EmptyState
            icon={Package}
            title={`No ${itemType} found`}
            description={`There are no ${itemType} matching your criteria. Try adjusting your filters or add a new one.`}
            action={onAdd ? {
                label: `Add ${itemType.slice(0, -1)}`,
                onClick: onAdd,
            } : undefined}
        />
    );
}

export function NoSearchResults({
    query,
    onClear
}: {
    query?: string;
    onClear?: () => void;
}) {
    return (
        <EmptyState
            icon={FileQuestion}
            title="No results found"
            description={query ? `No results for "${query}". Try a different search term.` : "No results match your search criteria."}
            action={onClear ? {
                label: "Clear search",
                onClick: onClear,
                variant: "outline",
            } : undefined}
            variant="muted"
        />
    );
}

export function NoTeamMembers({ onInvite }: { onInvite?: () => void }) {
    return (
        <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite team members to collaborate on managing your arcade operations."
            action={onInvite ? {
                label: "Invite members",
                onClick: onInvite,
            } : undefined}
        />
    );
}

export function ErrorState({
    error,
    onRetry
}: {
    error?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon={AlertCircle}
            title="Something went wrong"
            description={error || "An error occurred while loading. Please try again."}
            action={onRetry ? {
                label: "Try again",
                onClick: onRetry,
            } : undefined}
            variant="destructive"
        />
    );
}

export function NoDataAvailable({
    feature = "data"
}: {
    feature?: string;
}) {
    return (
        <EmptyState
            icon={Settings}
            title={`No ${feature} available`}
            description={`${feature.charAt(0).toUpperCase() + feature.slice(1)} will appear here once data is collected.`}
            variant="muted"
        />
    );
}

export default EmptyState;
