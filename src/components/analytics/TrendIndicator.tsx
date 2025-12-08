"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
    value: number;
    previousValue?: number;
    percentage?: number;
    direction?: 'up' | 'down' | 'stable';
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    className?: string;
}

export function TrendIndicator({
    value,
    previousValue,
    percentage,
    direction,
    label,
    size = 'md',
    showValue = true,
    className,
}: TrendIndicatorProps) {
    // Calculate direction and percentage if not provided
    const calculatedPercentage = percentage ?? (previousValue !== undefined && previousValue !== 0
        ? +((value - previousValue) / previousValue * 100).toFixed(1)
        : 0);

    const calculatedDirection = direction ?? (
        calculatedPercentage > 2 ? 'up' :
            calculatedPercentage < -2 ? 'down' : 'stable'
    );

    const sizeClasses = {
        sm: { icon: 'h-3 w-3', text: 'text-xs', container: 'gap-1' },
        md: { icon: 'h-4 w-4', text: 'text-sm', container: 'gap-1.5' },
        lg: { icon: 'h-5 w-5', text: 'text-base', container: 'gap-2' },
    };

    const colorClasses = {
        up: 'text-green-600 dark:text-green-400',
        down: 'text-red-600 dark:text-red-400',
        stable: 'text-gray-500 dark:text-gray-400',
    };

    const bgClasses = {
        up: 'bg-green-100 dark:bg-green-900/30',
        down: 'bg-red-100 dark:bg-red-900/30',
        stable: 'bg-gray-100 dark:bg-gray-800/50',
    };

    const Icon = calculatedDirection === 'up' ? TrendingUp :
        calculatedDirection === 'down' ? TrendingDown : Minus;

    return (
        <div className={cn(
            "inline-flex items-center rounded-full px-2 py-1",
            sizeClasses[size].container,
            bgClasses[calculatedDirection],
            className
        )}>
            <Icon className={cn(sizeClasses[size].icon, colorClasses[calculatedDirection])} />
            {showValue && (
                <span className={cn(sizeClasses[size].text, colorClasses[calculatedDirection], "font-medium")}>
                    {calculatedDirection === 'up' ? '+' : ''}{calculatedPercentage}%
                </span>
            )}
            {label && (
                <span className={cn(sizeClasses[size].text, "text-muted-foreground ml-1")}>
                    {label}
                </span>
            )}
        </div>
    );
}
