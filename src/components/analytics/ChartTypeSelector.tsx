"use client";

import { useState } from "react";
import { BarChart3, LineChart, PieChart, AreaChart, Activity } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'radar';

interface ChartTypeSelectorProps {
    value: ChartType;
    onChange: (type: ChartType) => void;
    options?: ChartType[];
    size?: 'sm' | 'md';
    className?: string;
}

const chartIcons: Record<ChartType, React.ComponentType<{ className?: string }>> = {
    bar: BarChart3,
    line: LineChart,
    area: AreaChart,
    pie: PieChart,
    radar: Activity,
};

const chartLabels: Record<ChartType, string> = {
    bar: 'Bar',
    line: 'Line',
    area: 'Area',
    pie: 'Pie',
    radar: 'Radar',
};

export function ChartTypeSelector({
    value,
    onChange,
    options = ['bar', 'line', 'area'],
    size = 'md',
    className,
}: ChartTypeSelectorProps) {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(newValue) => newValue && onChange(newValue as ChartType)}
            className={cn("border rounded-lg p-1 bg-muted/50", className)}
        >
            {options.map((type) => {
                const Icon = chartIcons[type];
                return (
                    <ToggleGroupItem
                        key={type}
                        value={type}
                        aria-label={`${chartLabels[type]} chart`}
                        className={cn(
                            "gap-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm",
                            size === 'sm' ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
                        )}
                    >
                        <Icon className={iconSize} />
                        <span className="hidden sm:inline">{chartLabels[type]}</span>
                    </ToggleGroupItem>
                );
            })}
        </ToggleGroup>
    );
}
