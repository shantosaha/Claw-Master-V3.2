"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    History,
    ArrowRightLeft,
    Calendar,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Play,
    Clock,
    TrendingUp
} from "lucide-react";
import { ItemAssignmentHistory, StockItem, RevenueEntry } from "@/types";
import { assignmentHistoryService } from "@/services";
import { format, differenceInDays, parseISO } from "date-fns";
import Link from "next/link";

interface AssignmentHistoryPanelProps {
    item: StockItem;
    revenueEntries?: RevenueEntry[];
    className?: string;
}

interface AssignmentWithRevenue extends ItemAssignmentHistory {
    calculatedRevenue: number;
    calculatedPlays: number;
    daysDuration: number;
}

export function AssignmentHistoryPanel({
    item,
    revenueEntries = [],
    className
}: AssignmentHistoryPanelProps) {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<AssignmentWithRevenue[]>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadAssignmentHistory();
    }, [item.id]);

    const loadAssignmentHistory = async () => {
        setLoading(true);
        try {
            // Get all assignment history for this item
            const allHistory = await assignmentHistoryService.getAll();
            const itemHistory = allHistory
                .filter(h => h.itemId === item.id)
                .sort((a, b) => {
                    const dateA = typeof a.assignedAt === 'string' ? parseISO(a.assignedAt) : a.assignedAt;
                    const dateB = typeof b.assignedAt === 'string' ? parseISO(b.assignedAt) : b.assignedAt;
                    return dateB.getTime() - dateA.getTime(); // Newest first
                });

            // Calculate revenue for each period
            const withRevenue: AssignmentWithRevenue[] = itemHistory.map(assignment => {
                const startDate = typeof assignment.assignedAt === 'string'
                    ? parseISO(assignment.assignedAt)
                    : assignment.assignedAt;
                const endDate = assignment.removedAt
                    ? (typeof assignment.removedAt === 'string' ? parseISO(assignment.removedAt) : assignment.removedAt)
                    : new Date();

                // Filter revenue entries for this period and machine
                const periodRevenue = revenueEntries.filter(entry => {
                    const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date;
                    return (
                        entry.machineId === assignment.machineId &&
                        entryDate >= startDate &&
                        entryDate <= endDate
                    );
                });

                const calculatedRevenue = periodRevenue.reduce((sum, e) => sum + e.amount, 0);
                const calculatedPlays = periodRevenue.reduce((sum, e) => sum + (e.playCount || 0), 0);
                const daysDuration = differenceInDays(endDate, startDate) || 1;

                return {
                    ...assignment,
                    calculatedRevenue,
                    calculatedPlays,
                    daysDuration,
                };
            });

            setAssignments(withRevenue);
        } catch (error) {
            console.error("Failed to load assignment history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "Present";
        const d = typeof date === 'string' ? parseISO(date) : date;
        return format(d, "MMM d, yyyy");
    };

    const totalRevenue = assignments.reduce((sum, a) => sum + a.calculatedRevenue, 0);
    const totalPlays = assignments.reduce((sum, a) => sum + a.calculatedPlays, 0);
    const displayCount = expanded ? assignments.length : Math.min(3, assignments.length);

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5" />
                        Assignment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (assignments.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5" />
                        Assignment History
                    </CardTitle>
                    <CardDescription>
                        Track machine assignments and revenue per period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No assignment history yet</p>
                        <p className="text-sm">Assign this item to a machine to start tracking</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5" />
                    Assignment History
                </CardTitle>
                <CardDescription>
                    {assignments.length} assignment period{assignments.length !== 1 ? 's' : ''} tracked
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{totalPlays}</div>
                        <div className="text-xs text-muted-foreground">Total Plays</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">{assignments.length}</div>
                        <div className="text-xs text-muted-foreground">Periods</div>
                    </div>
                </div>

                {/* Assignment Timeline */}
                <ScrollArea className="max-h-80">
                    <div className="space-y-3">
                        {assignments.slice(0, displayCount).map((assignment, index) => (
                            <div
                                key={assignment.id}
                                className="relative border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                            >
                                {/* Active indicator */}
                                {!assignment.removedAt && (
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="default" className="bg-green-600">
                                            Active
                                        </Badge>
                                    </div>
                                )}

                                {/* Machine info */}
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/machines/${assignment.machineId}`}
                                                className="font-medium hover:underline"
                                            >
                                                {assignment.machineName}
                                            </Link>
                                            <Badge variant="outline" className="text-xs">
                                                {assignment.status}
                                            </Badge>
                                            {assignment.queuePosition > 1 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Queue #{assignment.queuePosition}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Date range */}
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(assignment.assignedAt)}</span>
                                            <span>→</span>
                                            <span>{formatDate(assignment.removedAt)}</span>
                                            <span className="text-xs">({assignment.daysDuration} days)</span>
                                        </div>

                                        {/* Revenue stats for this period */}
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3 text-green-600" />
                                                <span className="font-medium">${assignment.calculatedRevenue.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Play className="h-3 w-3 text-blue-600" />
                                                <span>{assignment.calculatedPlays} plays</span>
                                            </div>
                                            {assignment.daysDuration > 0 && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span>${(assignment.calculatedRevenue / assignment.daysDuration).toFixed(2)}/day</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Removal reason */}
                                        {assignment.removalReason && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Removed: {assignment.removalReason.replace(/_/g, ' ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Expand/Collapse */}
                {assignments.length > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="w-full"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Show All ({assignments.length})
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
