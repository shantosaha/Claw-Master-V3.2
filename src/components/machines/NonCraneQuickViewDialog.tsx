"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { View, TrendingUp, DollarSign, Target, ChevronRight, Trophy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import { MachineStatus, MonitoringReportItem } from "@/services/monitoringService";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { DateRange } from "react-day-picker";

type ExtendedMachineStatus = MachineStatus & Partial<MonitoringReportItem> & { group?: string };

interface NonCraneQuickViewDialogProps {
    machine: ExtendedMachineStatus | null;
    allMachines?: ExtendedMachineStatus[];
    dateRange?: DateRange;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Enhanced quick view dialog for non-crane machines.
 * Features: Live trend, Revenue, Store Rank, Momentum.
 */
export function NonCraneQuickViewDialog({
    machine,
    allMachines = [],
    dateRange,
    open,
    onOpenChange
}: NonCraneQuickViewDialogProps) {
    const [trendRange, setTrendRange] = useState<'7d' | '14d' | '30d' | '6m'>('7d');
    const [realTrendData, setRealTrendData] = useState<any[]>([]);
    const [loadingTrend, setLoadingTrend] = useState(false);
    const [storeRankOpen, setStoreRankOpen] = useState(false);
    const [rankScope, setRankScope] = useState<'store' | 'location' | 'group'>('store');
    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set(['plays', 'customer', 'staff']));

    // Fetch real historical data for trend graph
    useEffect(() => {
        if (!machine || !open) return;

        const fetchTrend = async () => {
            setLoadingTrend(true);
            try {
                const { gameReportApiService } = await import('@/services/gameReportApiService');
                const endDate = new Date();
                const daysMap = { '7d': 7, '14d': 14, '30d': 30, '6m': 180 };
                const startDate = trendRange === '6m'
                    ? subMonths(endDate, 6)
                    : subDays(endDate, daysMap[trendRange as keyof typeof daysMap] - 1);

                const tag = Number(machine.assetTag || machine.tag);
                if (isNaN(tag)) throw new Error("Invalid tag");

                const reports = await gameReportApiService.fetchGameReport({
                    tag,
                    startDate,
                    endDate,
                    aggregate: false
                });

                // Map to trend data format
                const mappedData = reports.map(r => {
                    const customer = r.standardPlays || 0;
                    const staff = r.empPlays || 0;
                    return {
                        time: r.date ? format(new Date(r.date), 'MMM dd') : 'Unknown',
                        plays: customer + staff,
                        customer,
                        staff,
                        revenue: r.totalRev || 0
                    };
                });

                setRealTrendData(mappedData);
            } catch (error) {
                console.warn('Failed to fetch real trend data:', error);
                setRealTrendData([]);
            } finally {
                setLoadingTrend(false);
            }
        };

        fetchTrend();
    }, [machine?.assetTag, machine?.tag, open, trendRange]);

    // Use simulated data ONLY when API fails
    const simulatedTrendData = useMemo(() => {
        if (!machine || realTrendData.length > 0) return [];

        const seed = machine.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const random = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const now = new Date();
        const ranges = {
            '7d': { points: 7, labelFn: (i: number) => format(subDays(now, 6 - i), 'MMM dd'), multiplier: 5 },
            '14d': { points: 14, labelFn: (i: number) => format(subDays(now, 13 - i), 'MMM dd'), multiplier: 4 },
            '30d': { points: 15, labelFn: (i: number) => format(subDays(now, (14 - i) * 2), 'MMM dd'), multiplier: 8 },
            '6m': { points: 12, labelFn: (i: number) => format(subMonths(now, 6 - i / 2), 'MMM yy'), multiplier: 20 }
        };

        const config = ranges[trendRange];
        const baseValue = (machine.telemetry?.playCountToday ?? 0) / (config.points * config.multiplier);

        return Array.from({ length: config.points }, (_, i) => {
            const customer = Math.floor((baseValue + random(i + 100) * 25) * config.multiplier);
            const staff = Math.floor(random(i + 200) * 5 * config.multiplier);
            return {
                time: config.labelFn(i),
                plays: customer + staff,
                customer,
                staff,
                revenue: customer * 1.8 // Simulated revenue for non-crane
            };
        });
    }, [machine?.id, machine?.telemetry?.playCountToday, trendRange, realTrendData]);

    const chartData = realTrendData.length > 0 ? realTrendData : simulatedTrendData;

    // 1. Store Rank Calculation
    const storeStats = useMemo(() => {
        if (!machine || !allMachines.length) return { rank: 1, total: 1, list: [] };

        let filtered = [...allMachines];
        if (rankScope === 'location') {
            filtered = allMachines.filter(m => m.location === machine.location);
        } else if (rankScope === 'group') {
            filtered = allMachines.filter(m => m.group === machine.group);
        }

        const sorted = filtered.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
        const rank = sorted.findIndex(m => m.id === machine.id) + 1;
        return { rank, total: sorted.length, list: sorted };
    }, [machine?.id, machine?.location, machine?.group, allMachines, rankScope]);

    // 2. Momentum Calculation (Growth vs Yesterday)
    const momentum = useMemo(() => {
        if (!machine || !realTrendData.length) return null;
        const todayPlays = machine.telemetry?.playCountToday ?? 0;
        const yesterday = subDays(new Date(), 1);
        const yesterdayStr = format(yesterday, 'MMM dd');
        const yesterdayData = realTrendData.find(d => d.time === yesterdayStr);

        if (!yesterdayData || yesterdayData.plays === 0) return null;

        const growth = ((todayPlays - yesterdayData.plays) / yesterdayData.plays) * 100;
        return {
            percent: Math.round(growth),
            isPositive: growth >= 0,
            yesterdayRevenue: yesterdayData.revenue || 0
        };
    }, [machine?.telemetry?.playCountToday, realTrendData]);

    if (!machine) return null;

    const isToday = !dateRange || (
        dateRange.from && dateRange.to &&
        format(dateRange.from, 'yyyyMMdd') === format(new Date(), 'yyyyMMdd') &&
        format(dateRange.to, 'yyyyMMdd') === format(new Date(), 'yyyyMMdd')
    );

    const periodCustomer = machine.customerPlays ?? machine.telemetry?.playCountToday ?? 0;
    const periodStaff = machine.staffPlays ?? machine.telemetry?.staffPlaysToday ?? 0;
    const periodTotal = periodCustomer + periodStaff;

    const statusColors = {
        online: "bg-green-500",
        offline: "bg-gray-400",
        error: "bg-red-500",
        maintenance: "bg-yellow-500",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full", statusColors[machine.status || 'online'])} />
                        <DialogTitle className="text-xl flex items-center gap-2">
                            Live Performance Monitor
                            <div className="flex items-center gap-1.5 ml-2">
                                <span className="text-sm font-medium text-muted-foreground">{machine.name}</span>
                                <Badge variant="outline" className="font-mono text-[9px] h-4 px-1.5 bg-muted/50">
                                    #{machine.assetTag || machine.tag}
                                </Badge>
                            </div>
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {isToday ? 'Real-time staff and performance metrics' : 'Aggregated performance data for the selected period'} for {machine.location}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Left Column: Visuals & Key Stats */}
                    <div className="space-y-4">
                        <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                            {machine.imageUrl ? (
                                <img
                                    src={getThumbnailUrl(machine.imageUrl, 600)}
                                    alt={machine.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <View className="h-12 w-12 text-muted-foreground opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Stats Cards */}
                        <div className="space-y-3">
                            {/* Plays Card */}
                            <Card className="p-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">{isToday ? 'Plays Today' : 'Plays in Period'}</p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                                                <Info className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-xs">
                                            <DialogHeader>
                                                <DialogTitle className="text-sm">Play Breakdown</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Customer Plays:</span>
                                                    <span className="font-bold text-green-600">{periodCustomer}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Staff Plays:</span>
                                                    <span className="font-bold text-blue-600">{periodStaff}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-t pt-2 font-semibold">
                                                    <span>Total:</span>
                                                    <span>{periodTotal}</span>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-xl font-bold">{periodTotal}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        ({periodCustomer} + <span className="text-blue-500">{periodStaff}</span>)
                                    </p>
                                </div>
                            </Card>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Revenue Card */}
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <DollarSign className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-blue-600/70 dark:text-blue-400/70">Revenue</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                            ${(machine.revenue || 0).toFixed(0)}
                                        </span>
                                        {isToday && momentum && (
                                            <div className="flex items-center gap-1">
                                                <span className={cn(
                                                    "text-[10px] font-bold",
                                                    momentum.isPositive ? "text-green-600" : "text-red-500"
                                                )}>
                                                    {momentum.isPositive ? '↑' : '↓'}{Math.abs(momentum.percent)}%
                                                </span>
                                                <span className="text-[9px] text-blue-600/40">vs ${momentum.yesterdayRevenue.toFixed(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Rank Card */}
                                <Dialog open={storeRankOpen} onOpenChange={setStoreRankOpen}>
                                    <DialogTrigger asChild>
                                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 cursor-pointer hover:bg-emerald-100/30 transition-all group">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                        <Target className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase text-emerald-600/70 dark:text-emerald-400/70">
                                                        {rankScope === 'store' ? 'Store' : (rankScope === 'location' ? 'Level' : 'Group')} Rank
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                                    #{storeStats.rank}
                                                </span>
                                                <span className="text-[10px] text-emerald-600/50 font-medium">/ {storeStats.total}</span>
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Trophy className="h-5 w-5 text-amber-500" />
                                                Leaderboard
                                            </DialogTitle>
                                            <DialogDescription>
                                                Ranking by revenue.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex gap-1 mt-4 p-1 bg-muted rounded-lg">
                                            {(['store', 'location', 'group'] as const).map((s) => (
                                                <Button
                                                    key={s}
                                                    variant={rankScope === s ? "default" : "ghost"}
                                                    size="sm"
                                                    className="flex-1 h-7 text-[10px] capitalize"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRankScope(s);
                                                    }}
                                                >
                                                    {s}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <div className="grid grid-cols-12 px-2 text-[10px] font-bold uppercase text-muted-foreground pb-1 border-b">
                                                <div className="col-span-1">#</div>
                                                <div className="col-span-6">Machine</div>
                                                <div className="col-span-2 text-right">Plays</div>
                                                <div className="col-span-3 text-right">Revenue</div>
                                            </div>
                                            {storeStats.list.map((m, idx) => (
                                                <div
                                                    key={m.id}
                                                    className={cn(
                                                        "grid grid-cols-12 items-center p-2 rounded-lg text-xs transition-colors",
                                                        m.id === machine.id ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500/30 shadow-sm" : "hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className="col-span-1 font-mono font-bold text-muted-foreground">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="col-span-6 flex flex-col min-w-0">
                                                        <span className="font-bold truncate">{m.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">#{m.assetTag || m.tag}</span>
                                                    </div>
                                                    <div className="col-span-2 text-right font-medium">
                                                        {m.customerPlays || 0}
                                                    </div>
                                                    <div className="col-span-3 text-right font-bold text-blue-600 dark:text-blue-400">
                                                        ${(m.revenue || 0).toFixed(0)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Chart */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                PLAY TREND
                            </h4>
                            <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
                                {['7d', '14d', '30d', '6m'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setTrendRange(r as any)}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded-md transition-all font-medium",
                                            trendRange === r
                                                ? "bg-white dark:bg-black shadow-sm text-foreground"
                                                : "text-muted-foreground hover:bg-background/50"
                                        )}
                                    >
                                        {r === '6m' ? '6 Months' : `${r.replace('d', ' Days')}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="font-bold text-muted-foreground">SHOW:</span>
                                {[
                                    { id: 'plays', label: 'Total', color: '#f59e0b' },
                                    { id: 'customer', label: 'Customer', color: '#f59e0b' },
                                    { id: 'staff', label: 'Staff', color: '#10b981' }
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => {
                                            const next = new Set(visibleFields);
                                            if (next.has(filter.id)) next.delete(filter.id);
                                            else next.add(filter.id);
                                            setVisibleFields(next);
                                        }}
                                        className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                                    >
                                        <div
                                            className={cn("w-2 h-2 rounded-full transition-all", visibleFields.has(filter.id) ? "" : "opacity-20")}
                                            style={{ backgroundColor: filter.color }}
                                        />
                                        <span className={cn(visibleFields.has(filter.id) ? "font-bold" : "text-muted-foreground")}>{filter.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-b from-transparent to-muted/20 rounded-xl border border-muted/50 p-4 h-[300px]">
                            {loadingTrend ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground animate-pulse">Loading trend data...</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#888' }}
                                            dy={10}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#888' }}
                                        />
                                        <RechartsTooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background/95 backdrop-blur border rounded-lg shadow-xl p-3 text-xs">
                                                            <p className="font-bold mb-2">{label}</p>
                                                            {visibleFields.has('customer') && (
                                                                <div className="flex items-center gap-2 mb-1 text-amber-600">
                                                                    <span>Customer :</span>
                                                                    <span className="font-bold">{data.customer}</span>
                                                                </div>
                                                            )}
                                                            {visibleFields.has('plays') && (
                                                                <div className="flex items-center gap-2 mb-1 text-blue-500">
                                                                    <span>Total :</span>
                                                                    <span className="font-bold">{data.plays}</span>
                                                                </div>
                                                            )}
                                                            {visibleFields.has('staff') && (
                                                                <div className="flex items-center gap-2 text-emerald-600">
                                                                    <span>Staff :</span>
                                                                    <span className="font-bold">{data.staff}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        {visibleFields.has('plays') && (
                                            <Area
                                                type="monotone"
                                                dataKey="plays"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="url(#colorTotal)"
                                            />
                                        )}
                                        {visibleFields.has('customer') && (
                                            <Area
                                                type="monotone"
                                                dataKey="customer"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                fill="none"
                                            />
                                        )}
                                        {visibleFields.has('staff') && (
                                            <Area
                                                type="monotone"
                                                dataKey="staff"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                fill="none"
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
