"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendIndicator } from "./TrendIndicator";
import { analyticsService, PeriodComparison } from "@/services/analyticsService";
import { ArrowRight, Calendar, TrendingUp, TrendingDown, PlayCircle, DollarSign, Trophy } from "lucide-react";

interface PeriodComparisonCardProps {
    days?: number;
    className?: string;
}

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Revenue: DollarSign,
    Plays: PlayCircle,
    Wins: Trophy,
};

const metricColors: Record<string, string> = {
    Revenue: "text-purple-600",
    Plays: "text-cyan-600",
    Wins: "text-green-600",
};

export function PeriodComparisonCard({ days = 30, className }: PeriodComparisonCardProps) {
    const [comparisons, setComparisons] = useState<PeriodComparison[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [days]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await analyticsService.compareTimePeriods(days);
            setComparisons(data);
        } catch (error) {
            console.error("Failed to load period comparison:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Period Comparison
                </CardTitle>
                <CardDescription>
                    Comparing last {days} days vs previous {days} days
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {comparisons.map((comparison) => {
                    const Icon = metricIcons[comparison.metricName] || TrendingUp;
                    const colorClass = metricColors[comparison.metricName] || "text-primary";

                    return (
                        <div
                            key={comparison.metricName}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full bg-background ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-medium">{comparison.metricName}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{comparison.previousPeriod.value.toLocaleString()}</span>
                                        <ArrowRight className="h-3 w-3" />
                                        <span className="font-medium text-foreground">
                                            {comparison.currentPeriod.value.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <TrendIndicator
                                value={comparison.currentPeriod.value}
                                previousValue={comparison.previousPeriod.value}
                                direction={comparison.trend}
                                size="md"
                            />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
