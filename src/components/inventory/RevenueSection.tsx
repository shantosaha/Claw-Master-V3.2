"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StockItem, ArcadeMachine, RevenueEntry, AttributedRevenue } from "@/types";
import { revenueService, machineRevenueService } from "@/services";
import { LogRevenueDialog } from "./LogRevenueDialog";
import { DollarSign, TrendingUp, Hash, Plus, Calendar, Building2, Zap, ArrowRight, RefreshCw, Calculator, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SingleDatePicker } from "@/components/analytics/SingleDatePicker";

interface RevenueSectionProps {
    item: StockItem;
    machines?: ArcadeMachine[];
    userId?: string;
}

export function RevenueSection({ item, machines = [], userId }: RevenueSectionProps) {
    const [entries, setEntries] = useState<RevenueEntry[]>([]);
    const [attributed, setAttributed] = useState<AttributedRevenue | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const [aggregates, setAggregates] = useState({ totalRevenue: 0, totalPlays: 0, entryCount: 0 });
    const [view, setView] = useState("manual");
    const [isSimulating, setIsSimulating] = useState(false);

    // Filters
    const [filterMachine, setFilterMachine] = useState<string>("all");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Identify machines the item has history with (for filter dropdown)
    // We could parse this from audit logs or just use the passed machines list. 
    // For simplicity, we filter the passed `machines` list to only those relevant if possible, 
    // but showing all is also fine. Let's show all.

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const filters = {
                machineId: filterMachine === "all" ? undefined : filterMachine,
                startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
                endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
            };

            const [fetchedEntries, fetchedAggregates, fetchedAttributed] = await Promise.all([
                revenueService.getByItem(item.id, filters),
                revenueService.getAggregates(item.id, filters),
                revenueService.calculateAttributedRevenue(item, filters)
            ]);
            setEntries(fetchedEntries.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ));
            setAggregates(fetchedAggregates);
            setAttributed(fetchedAttributed);
        } catch (error) {
            console.error("Failed to fetch revenue data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id, filterMachine, startDate, endDate]);

    const handleSimulate = async () => {
        if (!item.assignedMachineId) {
            toast.error("Item must be assigned to a machine to simulate data");
            return;
        }

        setIsSimulating(true);
        try {
            // Simulate for last 30 days
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);

            await machineRevenueService.generateSimulatedReadings(item.assignedMachineId, start, end);
            toast.success("Simulated API data generated");
            await fetchData();
        } catch (error) {
            toast.error("Failed to simulate data");
        } finally {
            setIsSimulating(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD"
        }).format(amount);
    };

    // Data for dropdown sorting
    const usedMachineIds = new Set<string>();
    if (item.assignedMachineId) usedMachineIds.add(item.assignedMachineId);
    entries.forEach(e => { if (e.machineId) usedMachineIds.add(e.machineId); });
    attributed?.breakdown.forEach(b => usedMachineIds.add(b.machineId));

    const usedMachines = machines.filter(m => usedMachineIds.has(m.id));
    const otherMachines = machines.filter(m => !usedMachineIds.has(m.id));

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Revenue Tracking
                            </CardTitle>
                            <CardDescription>
                                Track earnings via manual logs or API attribution
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {view === "api" && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSimulate}
                                    disabled={isSimulating}
                                >
                                    {isSimulating ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                                    Simulate Data
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={() => setIsLogDialogOpen(true)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Log Revenue
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>

                        <div className="w-[200px]">
                            <Select value={filterMachine} onValueChange={setFilterMachine}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Machines" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Machines</SelectItem>

                                    {usedMachines.length > 0 && (
                                        <>
                                            <SelectSeparator />
                                            <SelectGroup>
                                                <SelectLabel className="text-xs font-semibold text-muted-foreground">Used with this Item</SelectLabel>
                                                {usedMachines.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.name}
                                                        {m.id === item.assignedMachineId && " (Current)"}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </>
                                    )}

                                    {otherMachines.length > 0 && (
                                        <>
                                            <SelectSeparator />
                                            <SelectGroup>
                                                <SelectLabel className="text-xs font-semibold text-muted-foreground">Other Machines</SelectLabel>
                                                {otherMachines.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <SingleDatePicker
                                date={startDate}
                                onDateChange={setStartDate}
                                placeholder="Start Date"
                                className="h-8 w-auto min-w-[130px]"
                            />
                            <span className="text-muted-foreground">-</span>
                            <SingleDatePicker
                                date={endDate}
                                onDateChange={setEndDate}
                                placeholder="End Date"
                                className="h-8 w-auto min-w-[130px]"
                            />
                        </div>

                        {(filterMachine !== "all" || startDate || endDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 ml-auto text-xs"
                                onClick={() => {
                                    setFilterMachine("all");
                                    setStartDate(undefined);
                                    setEndDate(undefined);
                                }}
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    <Tabs value={view} onValueChange={setView} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual Logs</TabsTrigger>
                            <TabsTrigger value="api">API Attribution</TabsTrigger>
                        </TabsList>

                        {/* MANUAL LOGS VIEW */}
                        <TabsContent value="manual" className="space-y-4 mt-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <DollarSign className="h-4 w-4" />
                                        Total Revenue
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                        {formatCurrency(aggregates.totalRevenue)}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Hash className="h-4 w-4" />
                                        Total Plays
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                        {aggregates.totalPlays.toLocaleString()}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Avg per Play
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                        {aggregates.totalPlays > 0
                                            ? formatCurrency(aggregates.totalRevenue / aggregates.totalPlays)
                                            : "—"
                                        }
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Recent Entries */}
                            <div>
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Recent Entries ({aggregates.entryCount})
                                </h4>

                                {isLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading revenue data...
                                    </div>
                                ) : entries.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                                        <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>No revenue entries found</p>
                                        <p className="text-xs mt-1">Try adjusting filters or log a new entry</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[220px]">
                                        <div className="space-y-2 pr-4">
                                            {entries.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                                {formatCurrency(entry.amount)}
                                                            </span>
                                                            {entry.playCount && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {entry.playCount} plays
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(entry.date), "MMM d, yyyy")}
                                                            {entry.machineName && (
                                                                <>
                                                                    <Building2 className="h-3 w-3 ml-2" />
                                                                    {entry.machineName}
                                                                </>
                                                            )}
                                                        </div>
                                                        {entry.notes && (
                                                            <div className="text-xs text-muted-foreground mt-1 italic">
                                                                {entry.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </TabsContent>

                        {/* API ATTRIBUTION VIEW */}
                        <TabsContent value="api" className="space-y-4 mt-4">
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                                <div className="flex items-start gap-3">
                                    <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 dark:text-blue-300">Automated Attribution</h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                            Revenue calculated based on machine assignment history and daily API readings.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Attributed Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground mb-1">Attributed Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(attributed?.totalRevenue || 0)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground mb-1">Attributed Plays</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {(attributed?.totalPlays || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Attributed Breakdown */}
                            <div>
                                <h4 className="text-sm font-medium mb-3">Assignment Breakdown</h4>
                                {attributed?.breakdown.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                                        <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>No attribution data available</p>
                                        <p className="text-xs mt-1">Try adjusting filters or simulate API data.</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[200px]">
                                        <div className="space-y-3 pr-4">
                                            {attributed?.breakdown.map((period, idx) => (
                                                <div key={idx} className="p-3 rounded-lg border bg-card/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{period.machineName}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {period.days} days
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{format(new Date(period.periodStart), "MMM d, yyyy")}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span>{format(new Date(period.periodEnd), "MMM d, yyyy")}</span>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div>
                                                            <span className="text-xs text-muted-foreground block">Revenue</span>
                                                            <span className="font-semibold text-green-600">{formatCurrency(period.revenue)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-muted-foreground block">Plays</span>
                                                            <span className="font-semibold text-blue-600">{period.plays.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <LogRevenueDialog
                isOpen={isLogDialogOpen}
                onOpenChange={setIsLogDialogOpen}
                item={item}
                machines={machines}
                userId={userId}
                onSuccess={fetchData}
            />
        </>
    );
}
