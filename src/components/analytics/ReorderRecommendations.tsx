"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyticsService, ReorderRecommendation } from "@/services/analyticsService";
import { AlertTriangle, ShoppingCart, Package, Clock, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReorderRecommendationsProps {
    className?: string;
    maxItems?: number;
    days?: number;
}

const priorityConfig = {
    critical: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Critical" },
    high: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", label: "High" },
    medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Medium" },
    low: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Low" },
};

export function ReorderRecommendations({ className, maxItems = 10, days = 30 }: ReorderRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadData();
    }, [days]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await analyticsService.getReorderRecommendations(days);
            setRecommendations(data);
        } catch (error) {
            console.error("Failed to load reorder recommendations:", error);
        } finally {
            setLoading(false);
        }
    };

    const visibleItems = showAll ? recommendations : recommendations.slice(0, maxItems);
    const totalEstimatedCost = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
    const criticalCount = recommendations.filter((r) => r.priority === "critical").length;
    const highCount = recommendations.filter((r) => r.priority === "high").length;

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-muted rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Reorder Recommendations
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-4">
                    <span>{recommendations.length} items need attention</span>
                    {criticalCount > 0 && (
                        <span className="text-red-600 font-medium">{criticalCount} critical</span>
                    )}
                    {highCount > 0 && (
                        <span className="text-orange-600 font-medium">{highCount} high priority</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Package className="h-4 w-4" />
                            <span className="text-xs">Total Items</span>
                        </div>
                        <p className="text-lg font-bold">{recommendations.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs">Critical</span>
                        </div>
                        <p className="text-lg font-bold text-red-600">{criticalCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs">Est. Cost</span>
                        </div>
                        <p className="text-lg font-bold">${totalEstimatedCost.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">Avg Days Left</span>
                        </div>
                        <p className="text-lg font-bold">
                            {recommendations.length > 0
                                ? Math.round(
                                    recommendations.reduce((sum, r) => sum + r.daysUntilStockout, 0) /
                                    recommendations.length
                                )
                                : "-"}
                        </p>
                    </div>
                </div>

                {/* Recommendations List */}
                <div className="space-y-2">
                    {visibleItems.map((item) => (
                        <div
                            key={item.itemId}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                item.priority === "critical"
                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                    : item.priority === "high"
                                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                                        : "bg-muted/30"
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm truncate">{item.itemName}</p>
                                    <Badge className={cn("text-xs", priorityConfig[item.priority].color)}>
                                        {priorityConfig[item.priority].label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>{item.category}</span>
                                    <span className="flex items-center gap-1">
                                        <span className="text-foreground font-medium">{item.currentQuantity}</span>
                                        <ArrowRight className="h-3 w-3" />
                                        <span className="text-green-600 font-medium">
                                            +{item.suggestedOrderQuantity}
                                        </span>
                                    </span>
                                    <span>~{item.daysUntilStockout} days left</span>
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                <p className="font-bold text-sm">${item.estimatedCost}</p>
                                <p className="text-xs text-muted-foreground">est. cost</p>
                            </div>
                        </div>
                    ))}
                </div>

                {recommendations.length > maxItems && (
                    <Button
                        variant="ghost"
                        onClick={() => setShowAll(!showAll)}
                        className="w-full"
                    >
                        {showAll ? "Show Less" : `Show All (${recommendations.length})`}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
