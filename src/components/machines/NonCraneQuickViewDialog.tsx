"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { View, TrendingUp, DollarSign, Target, ChevronRight, Trophy, Info, Crown, Sun, CloudRain, Cloud, Dumbbell, Calendar, Medal, Loader2, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { format, subDays, subMonths, subYears, parseISO, isSameDay } from "date-fns";
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
    const [trendType, setTrendType] = useState<'plays' | 'revenue'>('plays');
    const [loadingTrend, setLoadingTrend] = useState(false);
    const [storeRankOpen, setStoreRankOpen] = useState(false);
    const [rankScope, setRankScope] = useState<'store' | 'location' | 'group'>('store');
    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set(['plays', 'customer', 'staff']));
    const [hallOfFameOpen, setHallOfFameOpen] = useState(false);
    const [hallOfFameEnabled, setHallOfFameEnabled] = useState(false);
    const [hallOfFameRange, setHallOfFameRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all' | null>(null);
    const [loadingHallOfFame, setLoadingHallOfFame] = useState(false);
    const [contributionOpen, setContributionOpen] = useState(false);
    const [contributionScope, setContributionScope] = useState<'store' | 'location' | 'group'>('store');
    const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [allTimeBestDays, setAllTimeBestDays] = useState<{ date: string; revenue: number }[]>([]);

    // Fetch real historical data for trend graph
    // Fetch real historical data for trend graph
    useEffect(() => {
        if (!machine || !open) return;

        const fetchTrend = async () => {
            setLoadingTrend(true);
            try {
                const { gameReportApiService } = await import('@/services/gameReportApiService');
                const endDate = new Date();
                const daysMap = { '7d': 7, '14d': 14, '30d': 30, '6m': 180 };
                const daysToFetch = daysMap[trendRange as keyof typeof daysMap];

                // For Production API compliance, we must fetch daily data to avoid aggregation
                // Limit massive parallel requests for longer ranges if needed, but 7-14 is fine
                const dates: Date[] = [];
                for (let i = daysToFetch - 1; i >= 0; i--) {
                    dates.push(subDays(endDate, i));
                }

                // Fetch all days in parallel
                const dailyReports = await Promise.all(
                    dates.map(date => gameReportApiService.fetchDailyReport(date, {
                        groups: machine.group ? [machine.group] : undefined
                    }))
                );

                // Filter for THIS machine and map to trend format
                const myTag = machine.tag ? String(machine.tag).trim() : null;

                const mappedData = dailyReports.map((daysReport, index) => {
                    const date = dates[index];
                    const report = daysReport.find(r => {
                        const rTag = r.tag ? String(r.tag).trim() : null;
                        return (myTag && rTag === myTag);
                    });

                    const customer = report?.standardPlays || 0;
                    const staff = report?.empPlays || 0;
                    const wins = report?.points || 0;

                    return {
                        time: format(date, 'MMM dd'),
                        fullDate: date, // For accurate sorting/comparison
                        plays: customer + staff,
                        customer,
                        staff,
                        wins,
                        revenue: report?.totalRev || 0,
                        cashRev: report?.cashDebit || 0,
                        bonusRev: report?.cashDebitBonus || 0
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

    // Fetch data for Hall of Fame
    useEffect(() => {
        if (!machine || !open || !hallOfFameEnabled || !hallOfFameRange) return;

        const fetchAllTime = async () => {
            setLoadingHallOfFame(true);
            try {
                const { gameReportApiService } = await import('@/services/gameReportApiService');
                const endDate = new Date();

                // Calculate days to fetch based on range
                const rangeMap = { '1m': 30, '3m': 90, '6m': 180, '1y': 365, 'all': 365 };
                const daysToFetch = rangeMap[hallOfFameRange] || 365;

                const dates: Date[] = [];
                for (let i = 0; i < daysToFetch; i++) {
                    dates.push(subDays(endDate, i));
                }

                // Chunked fetching (30 days at a time)
                const chunkSize = 30;
                let allReports: any[] = [];

                for (let i = 0; i < dates.length; i += chunkSize) {
                    const chunk = dates.slice(i, i + chunkSize);
                    const chunkReports = await Promise.all(
                        chunk.map(date => gameReportApiService.fetchDailyReport(date, {
                            groups: machine.group ? [machine.group] : undefined
                        }))
                    );
                    allReports = allReports.concat(chunkReports);
                }

                // Filter for THIS machine across all days
                const myTag = machine.tag ? String(machine.tag).trim() : null;

                const dailyBests = allReports.map((daysReport, index) => {
                    const date = dates[index];
                    const report = daysReport.find((r: any) => {
                        const rTag = r.tag ? String(r.tag).trim() : null;
                        return (myTag && rTag === myTag);
                    });

                    return {
                        date: format(date, 'yyyy-MM-dd'),
                        revenue: report?.totalRev || 0
                    };
                }).filter(d => d.revenue > 0);

                // Find top 5 days
                const sorted = dailyBests
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5);

                setAllTimeBestDays(sorted);
            } catch (err) {
                console.warn("Failed to fetch Hall of Fame data", err);
            } finally {
                setLoadingHallOfFame(false);
            }
        };

        fetchAllTime();
    }, [machine?.assetTag, machine?.tag, machine?.group, open, hallOfFameEnabled, hallOfFameRange]);

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



    const isToday = !dateRange || (
        dateRange.from && dateRange.to &&
        format(dateRange.from, 'yyyyMMdd') === format(new Date(), 'yyyyMMdd') &&
        format(dateRange.to, 'yyyyMMdd') === format(new Date(), 'yyyyMMdd')
    );

    const periodCustomer = machine?.customerPlays ?? machine?.telemetry?.playCountToday ?? 0;
    const periodStaff = machine?.staffPlays ?? machine?.telemetry?.staffPlaysToday ?? 0;
    const periodTotal = periodCustomer + periodStaff;

    // --- NEW INSIGHTS CALCULATIONS ---

    // 1. Hall of Fame (Best Day - All Time)
    const hallOfFame = useMemo(() => {
        if (!allTimeBestDays.length) return null;

        const best = allTimeBestDays[0];
        // Format date fully: "Jan 12, 2024"
        const bestDateFormatted = best.date ? format(new Date(best.date), 'MMM dd, yyyy') : 'Unknown';

        return {
            maxRev: best.revenue,
            bestDate: bestDateFormatted,
            topDays: allTimeBestDays.map(d => ({
                ...d,
                time: d.date ? format(new Date(d.date), 'MMM dd, yyyy') : 'Unknown'
            }))
        };
    }, [allTimeBestDays]);

    // 2. The Heavy Lifter (Contribution with scope support)
    const heavyLifter = useMemo(() => {
        if (!machine || !allMachines.length) return { percent: 0, class: 'Featherweight', color: 'text-muted-foreground', icon: Dumbbell, contributors: [], scopeLabel: 'Store', totalRev: 0, myRev: 0 };

        // Filter machines based on scope
        let filtered = [...allMachines];
        let scopeLabel = 'Store';
        if (contributionScope === 'location') {
            filtered = allMachines.filter(m => m.location === machine.location);
            scopeLabel = machine.location || 'Location';
        } else if (contributionScope === 'group') {
            filtered = allMachines.filter(m => m.group === machine.group);
            scopeLabel = machine.group || 'Group';
        }

        const totalRev = filtered.reduce((sum, m) => sum + (m.revenue || 0), 0);
        const myRev = machine.revenue || 0;

        if (totalRev === 0) return { percent: 0, class: 'Featherweight', color: 'text-muted-foreground', icon: Dumbbell, contributors: [], scopeLabel, totalRev, myRev };

        const percent = (myRev / totalRev) * 100;

        // Contributors list for Dialog
        const contributors = filtered.map(m => ({
            ...m,
            percent: ((m.revenue || 0) / totalRev) * 100
        })).sort((a, b) => b.percent - a.percent);

        if (percent >= 10) return { percent, class: 'Boss Level', color: 'text-purple-600', icon: Crown, contributors, scopeLabel, totalRev, myRev };
        if (percent >= 5) return { percent, class: 'Heavyweight', color: 'text-amber-600', icon: Dumbbell, contributors, scopeLabel, totalRev, myRev };
        return { percent, class: 'Featherweight', color: 'text-muted-foreground', icon: Dumbbell, contributors, scopeLabel, totalRev, myRev };
    }, [machine, allMachines, contributionScope]);

    // 3. Weekend Forecast
    const forecast = useMemo(() => {
        // Simple heuristic: based on recent momentum
        const baseTraffic = machine?.telemetry?.playCountToday ?? 0;
        let prediction = 'Cloudy';
        let label = 'Moderate Traffic';
        let Icon = Cloud;
        let color = 'text-blue-400';

        if (momentum?.isPositive && momentum.percent > 20) {
            prediction = 'Sunny';
            label = 'High Traffic Expected';
            Icon = Sun;
            color = 'text-amber-500';
        } else if (momentum?.isPositive === false && Math.abs(momentum.percent) > 20) {
            prediction = 'Rainy';
            label = 'Low Turnout Likely';
            Icon = CloudRain;
            color = 'text-slate-400';
        }

        return { prediction, label, Icon, color };
    }, [machine, momentum]);

    // Early return AFTER all hooks to comply with Rules of Hooks
    if (!machine) return null;

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
                            Live Monitor
                            <div className="flex items-center gap-1.5 ml-2">
                                <span className="text-sm font-medium text-muted-foreground">{machine.name}</span>
                                <Badge variant="outline" className="font-mono text-[9px] h-4 px-1.5 bg-muted/50">
                                    #{machine.tag}
                                </Badge>
                            </div>
                        </DialogTitle>

                        {/* Date Range Badge */}
                        <div className="flex items-center gap-2 ml-4">
                            {dateRange?.from && (
                                <Badge variant="secondary" className="text-[10px] font-normal px-2 h-5 bg-muted text-muted-foreground hover:bg-muted">
                                    <Calendar className="w-3 h-3 mr-1.5 opacity-70" />
                                    {(() => {
                                        const now = new Date();
                                        const from = dateRange.from!;
                                        const to = dateRange.to || from;
                                        const isSingleDay = isSameDay(from, to);
                                        const isTodayDate = isSameDay(from, now);
                                        const isYesterdayDate = isSameDay(from, subDays(now, 1));

                                        if (isSingleDay) {
                                            if (isTodayDate) return `Today (${format(from, 'd MMMM yyyy')})`;
                                            if (isYesterdayDate) return `Yesterday (${format(from, 'd MMMM yyyy')})`;
                                            return format(from, 'd MMMM yyyy');
                                        }
                                        return `${format(from, 'd MMMM yyyy')} - ${format(to, 'd MMMM yyyy')}`;
                                    })()}
                                </Badge>
                            )}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <Badge variant="outline" className={cn("py-0.5 px-2 bg-background", forecast.color)}>
                                <forecast.Icon className="w-3 h-3 mr-1.5 inline-block" />
                                {forecast.label}
                            </Badge>
                        </div>
                    </div>
                    <DialogDescription>
                        {isToday ? 'Real-time staff and performance metrics' : 'Aggregated performance data for the selected period'} for {machine.location}
                    </DialogDescription>
                </DialogHeader>



                <div className="flex flex-col gap-6 pt-4">
                    {/* Top Row: Visuals & Chart */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* LEFT: Image & Plays (1/3) */}
                        <div className="md:col-span-1 space-y-4">
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
                        </div>

                        {/* RIGHT: Trend Chart (2/3) */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg border border-muted-foreground/10">
                                    <Button
                                        variant={trendType === 'plays' ? "secondary" : "ghost"}
                                        size="sm"
                                        className={cn("h-6 px-3 text-[10px] font-bold uppercase transition-all", trendType === 'plays' && "bg-background shadow-sm")}
                                        onClick={() => setTrendType('plays')}
                                    >
                                        Plays Trend
                                    </Button>
                                    <Button
                                        variant={trendType === 'revenue' ? "secondary" : "ghost"}
                                        size="sm"
                                        className={cn("h-6 px-3 text-[10px] font-bold uppercase transition-all", trendType === 'revenue' && "bg-background shadow-sm")}
                                        onClick={() => setTrendType('revenue')}
                                    >
                                        Revenue Trend
                                    </Button>
                                </div>
                                <div className="flex gap-1 bg-muted/30 p-0.5 rounded-lg">
                                    {(['7d', '14d', '30d', '6m'] as const).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setTrendRange(r)}
                                            className={cn(
                                                "text-[9px] px-2 py-1 rounded-md transition-all font-bold uppercase",
                                                trendRange === r
                                                    ? "bg-white dark:bg-black shadow-sm text-foreground"
                                                    : "text-muted-foreground/60 hover:text-muted-foreground"
                                            )}
                                        >
                                            {r === '6m' ? '6M' : r.replace('d', 'D')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gradient-to-b from-transparent to-muted/20 rounded-xl border border-muted/50 p-4 h-[200px] sm:h-[220px]">
                                {loadingTrend ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground animate-pulse">Loading trend data...</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorCustomer" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorBonus" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="time"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 9, fill: '#888' }}
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
                                                            <div className="bg-background/95 backdrop-blur border rounded-lg shadow-xl p-3 text-[10px]">
                                                                <p className="font-bold mb-2 border-b pb-1">{label}</p>
                                                                {trendType === 'plays' ? (
                                                                    <>
                                                                        {visibleFields.has('plays') && (
                                                                            <div className="flex items-center justify-between gap-4 mb-1 text-blue-500">
                                                                                <span>Total Plays:</span>
                                                                                <span className="font-bold">{data.plays}</span>
                                                                            </div>
                                                                        )}
                                                                        {visibleFields.has('customer') && (
                                                                            <div className="flex items-center justify-between gap-4 mb-1 text-amber-600">
                                                                                <span>Customer:</span>
                                                                                <span className="font-bold">{data.customer}</span>
                                                                            </div>
                                                                        )}
                                                                        {visibleFields.has('staff') && (
                                                                            <div className="flex items-center justify-between gap-4 mb-1 text-emerald-600">
                                                                                <span>Staff:</span>
                                                                                <span className="font-bold">{data.staff}</span>
                                                                            </div>
                                                                        )}
                                                                        {visibleFields.has('wins') && (
                                                                            <div className="flex items-center justify-between gap-4 text-rose-500">
                                                                                <span>Wins:</span>
                                                                                <span className="font-bold">{data.wins}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {visibleFields.has('revenue') && (
                                                                            <div className="flex items-center justify-between gap-4 mb-1 text-blue-600">
                                                                                <span>Total Rev:</span>
                                                                                <span className="font-bold">${data.revenue.toFixed(2)}</span>
                                                                            </div>
                                                                        )}
                                                                        {visibleFields.has('cashRev') && (
                                                                            <div className="flex items-center justify-between gap-4 mb-1 text-emerald-600">
                                                                                <span>Cash Rev:</span>
                                                                                <span className="font-bold">${data.cashRev.toFixed(2)}</span>
                                                                            </div>
                                                                        )}
                                                                        {visibleFields.has('bonusRev') && (
                                                                            <div className="flex items-center justify-between gap-4 text-purple-600">
                                                                                <span>Bonus Rev:</span>
                                                                                <span className="font-bold">${data.bonusRev.toFixed(2)}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            {trendType === 'plays' ? (
                                                <>
                                                    {visibleFields.has('plays') && (
                                                        <Area type="monotone" dataKey="plays" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTotal)" name="plays" />
                                                    )}
                                                    {visibleFields.has('customer') && (
                                                        <Area type="monotone" dataKey="customer" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorCustomer)" name="customer" />
                                                    )}
                                                    {visibleFields.has('staff') && (
                                                        <Area type="monotone" dataKey="staff" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorStaff)" name="staff" />
                                                    )}
                                                    {visibleFields.has('wins') && (
                                                        <Area type="monotone" dataKey="wins" stroke="#f43f5e" strokeWidth={2} fill="url(#colorWins)" name="wins" />
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {visibleFields.has('revenue') && (
                                                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#colorRevenue)" name="revenue" />
                                                    )}
                                                    {visibleFields.has('cashRev') && (
                                                        <Area type="monotone" dataKey="cashRev" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorCash)" name="cashRev" />
                                                    )}
                                                    {visibleFields.has('bonusRev') && (
                                                        <Area type="monotone" dataKey="bonusRev" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorBonus)" name="bonusRev" />
                                                    )}
                                                </>
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="flex gap-4 justify-end">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="font-bold text-muted-foreground uppercase">Show:</span>
                                    {trendType === 'plays' ? (
                                        [
                                            { id: 'plays', label: 'Total', color: '#3b82f6' },
                                            { id: 'customer', label: 'Customer', color: '#f59e0b' },
                                            { id: 'staff', label: 'Staff', color: '#10b981' },
                                            { id: 'wins', label: 'Wins', color: '#f43f5e' }
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
                                        ))
                                    ) : (
                                        [
                                            { id: 'revenue', label: 'Total Rev', color: '#2563eb' },
                                            { id: 'cashRev', label: 'Cash', color: '#059669' },
                                            { id: 'bonusRev', label: 'Bonus', color: '#7c3aed' }
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
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: The "One Row" Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        {/* 1. Revenue Card */}
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
                            {/* Revenue Breakdown: Cash + Bonus */}
                            <div className="mt-2 pt-2 border-t border-blue-200/30 dark:border-blue-800/30">
                                <div className="flex items-center gap-1 text-[10px]">
                                    <span className="text-blue-600/60 dark:text-blue-400/60">
                                        <span className="font-semibold text-blue-700 dark:text-blue-300">${(machine.cashRevenue || 0).toFixed(2)}</span>
                                        <span className="text-blue-500/50 mx-1">cash</span>
                                    </span>
                                    <span className="text-blue-400/50">+</span>
                                    <span className="text-blue-600/60 dark:text-blue-400/60">
                                        <span className="font-semibold text-blue-700 dark:text-blue-300">${(machine.bonusRevenue || 0).toFixed(2)}</span>
                                        <span className="text-blue-500/50 mx-1">bonus</span>
                                    </span>
                                </div>
                            </div>
                        </div>


                        {/* 2. Store Rank Card */}
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
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        Leaderboard
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-2">
                                        <span>Ranking by revenue</span>
                                        <Badge variant="secondary" className="text-[10px] font-normal">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {isToday ? 'Today' : dateRange?.from && dateRange?.to
                                                ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                                                : 'Today'}
                                        </Badge>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center justify-between gap-1 mt-4 p-1 bg-muted rounded-lg transition-all">
                                    <div className="flex gap-1 flex-1">
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
                                    <div className="flex items-center gap-2 px-2 border-l border-muted-foreground/20">
                                        <span className="text-[9px] font-bold uppercase text-muted-foreground tabular-nums">Breakdown</span>
                                        <Switch
                                            checked={showRevenueBreakdown}
                                            onCheckedChange={setShowRevenueBreakdown}
                                            className="h-3 w-6 scale-75 data-[state=checked]:bg-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="relative mt-4">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or tag..."
                                        className="pl-9 h-9 text-xs"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1 h-7 w-7 p-0"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            <XCircle className="h-3 w-3" />
                                            <span className="sr-only">Clear</span>
                                        </Button>
                                    )}
                                </div>
                                {/* Sticky Table Header */}
                                <div className="mt-4">
                                    <div className="grid grid-cols-12 px-2 text-[10px] font-bold uppercase text-muted-foreground pb-2 border-b bg-background sticky top-0 z-10 transition-all">
                                        <div className="col-span-1">#</div>
                                        <div className={cn(showRevenueBreakdown ? "col-span-5" : "col-span-6")}>Machine</div>
                                        <div className={cn("text-right", showRevenueBreakdown ? "col-span-1" : "col-span-2")}>Plays</div>
                                        {showRevenueBreakdown ? (
                                            <>
                                                <div className="col-span-2 text-right text-blue-500/80">Cash</div>
                                                <div className="col-span-3 text-right text-emerald-500/80">Bonus</div>
                                            </>
                                        ) : (
                                            <div className="col-span-3 text-right">Revenue</div>
                                        )}
                                    </div>
                                    {/* Scrollable Table Body */}
                                    <div className="max-h-[50vh] overflow-y-auto space-y-1 pt-1">
                                        {storeStats.list.filter(m => {
                                            if (!searchTerm) return true;
                                            const term = searchTerm.toLowerCase();
                                            return (
                                                m.name?.toLowerCase().includes(term) ||
                                                m.tag?.toLowerCase().includes(term) ||
                                                m.assetTag?.toLowerCase().includes(term) ||
                                                String(m.tag).includes(term) ||
                                                String(m.assetTag).includes(term)
                                            );
                                        }).map((m, idx) => (
                                            <div
                                                key={m.id}
                                                ref={m.id === machine.id ? (el) => {
                                                    if (el && storeRankOpen) {
                                                        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                                                    }
                                                } : undefined}
                                                className={cn(
                                                    "grid grid-cols-12 items-center p-2 rounded-lg text-xs transition-colors",
                                                    m.id === machine.id ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500/30 shadow-sm" : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="col-span-1 font-mono font-bold text-muted-foreground">
                                                    {idx + 1}
                                                </div>
                                                <div className={cn("flex flex-col min-w-0", showRevenueBreakdown ? "col-span-5" : "col-span-6")}>
                                                    <span className="font-bold truncate">{m.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">#{m.assetTag || m.tag}</span>
                                                </div>
                                                <div className={cn("text-right font-medium", showRevenueBreakdown ? "col-span-1" : "col-span-2")}>
                                                    {m.customerPlays || 0}
                                                </div>
                                                {showRevenueBreakdown ? (
                                                    <>
                                                        <div className="col-span-2 text-right font-bold text-blue-600 dark:text-blue-400">
                                                            ${(m.cashRevenue || 0).toFixed(0)}
                                                        </div>
                                                        <div className="col-span-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                            ${(m.bonusRevenue || 0).toFixed(0)}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="col-span-3 text-right font-bold text-blue-600 dark:text-blue-400">
                                                        ${(m.revenue || 0).toFixed(0)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* 3. Hall of Fame */}
                        <Dialog open={hallOfFameOpen} onOpenChange={setHallOfFameOpen}>
                            <DialogTrigger asChild>
                                <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30 cursor-pointer hover:bg-yellow-100/30 transition-all group">
                                    <div className="flex items-center justify-between gap-1.5 mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                                <Trophy className="h-3 w-3 text-yellow-600" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-yellow-700/70">Hall of Fame</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hallOfFameEnabled && !loadingHallOfFame && (
                                                <span className="text-[8px] font-bold text-yellow-600/40 uppercase tabular-nums">
                                                    {hallOfFameRange === 'all' ? 'All' : hallOfFameRange}
                                                </span>
                                            )}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Switch
                                                    checked={hallOfFameEnabled}
                                                    onCheckedChange={setHallOfFameEnabled}
                                                    className="h-3.5 w-7 scale-[0.6] data-[state=checked]:bg-yellow-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Range Selector when enabled */}
                                    {hallOfFameEnabled && (
                                        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex p-0.5 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-md border border-yellow-200/50">
                                                {(['1m', '3m', '6m', '1y', 'all'] as const).map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setHallOfFameRange(r)}
                                                        className={cn(
                                                            "flex-1 text-[8px] font-bold uppercase py-0.5 rounded-sm transition-all",
                                                            hallOfFameRange === r
                                                                ? "bg-yellow-500 text-white shadow-sm"
                                                                : "text-yellow-700/50 hover:text-yellow-700 hover:bg-yellow-500/10"
                                                        )}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-0.5">
                                        {!hallOfFameEnabled ? (
                                            <span className="text-xs text-muted-foreground italic">Disabled</span>
                                        ) : !hallOfFameRange ? (
                                            <span className="text-[10px] text-yellow-600 font-medium animate-pulse">Select Range Above</span>
                                        ) : loadingHallOfFame ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-yellow-600/50" />
                                                <span className="text-[9px] text-yellow-600/50 font-medium">Fetching...</span>
                                            </div>
                                        ) : hallOfFame ? (
                                            <>
                                                <span className="font-bold text-xl text-yellow-700 dark:text-yellow-400">${hallOfFame.maxRev.toFixed(0)}</span>
                                                <span className="text-[9px] text-yellow-600/50">Top: {hallOfFame.bestDate}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No data yet</span>
                                        )}
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-xs sm:max-w-sm">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-5 w-5 text-amber-500" />
                                            Hall of Fame
                                        </div>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Top 5 Highest Revenue Days.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex gap-1 p-1 bg-muted rounded-lg mt-2">
                                    {(['1m', '3m', '6m', '1y', 'all'] as const).map((r) => (
                                        <Button
                                            key={r}
                                            variant={hallOfFameRange === r ? "default" : "ghost"}
                                            size="sm"
                                            className="flex-1 h-7 text-[10px] uppercase"
                                            onClick={() => setHallOfFameRange(r)}
                                            disabled={loadingHallOfFame}
                                        >
                                            {r === 'all' ? 'All' : r}
                                        </Button>
                                    ))}
                                </div>

                                <div className="space-y-2 mt-4 relative min-h-[100px]">
                                    {loadingHallOfFame ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
                                            <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
                                            <p className="text-xs text-muted-foreground">Fetching records...</p>
                                        </div>
                                    ) : null}

                                    {!hallOfFameEnabled ? (
                                        <div className="py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                            <p className="text-xs text-muted-foreground italic">Please enable Hall of Fame to see records</p>
                                        </div>
                                    ) : hallOfFame?.topDays.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-xs text-muted-foreground italic">No revenue days found for this range</p>
                                        </div>
                                    ) : (
                                        hallOfFame?.topDays.map((day, i) => (
                                            <div key={`${i}-${day.time}`} className={cn("flex items-center justify-between p-2 rounded-lg text-sm", i === 0 ? "bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200" : "hover:bg-muted")}>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("font-bold font-mono w-4", i === 0 ? "text-amber-600" : "text-muted-foreground")}>{i + 1}</span>
                                                    <span className="font-medium">{day.time}</span>
                                                </div>
                                                <span className="font-bold text-amber-700 dark:text-amber-500">${day.revenue.toFixed(0)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* 4. Contribution */}
                        <Dialog open={contributionOpen} onOpenChange={setContributionOpen}>
                            <DialogTrigger asChild>
                                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-100/30 transition-all group">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className={cn("p-1 rounded-lg bg-slate-200/50 dark:bg-slate-800/50")}>
                                            <heavyLifter.icon className={cn("h-3 w-3", heavyLifter.color)} />
                                        </div>
                                        <span className={cn("text-[9px] font-bold uppercase", heavyLifter.color)}>Contribution</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className={cn("font-bold text-xl", heavyLifter.color)}>{heavyLifter.percent.toFixed(1)}%</span>
                                        <span className="text-[9px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                            {isToday ? 'Today' : 'of Selected Period'}
                                        </span>
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Dumbbell className="h-5 w-5 text-slate-500" />
                                        Revenue Contribution
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-2">
                                        <span>Contribution by machine</span>
                                        <Badge variant="secondary" className="text-[10px] font-normal">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {isToday ? 'Today' : dateRange?.from && dateRange?.to
                                                ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                                                : 'Today'}
                                        </Badge>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center justify-between gap-1 mt-4 p-1 bg-muted rounded-lg transition-all">
                                    <div className="flex gap-1 flex-1">
                                        {(['store', 'location', 'group'] as const).map((s) => (
                                            <Button
                                                key={s}
                                                variant={contributionScope === s ? "default" : "ghost"}
                                                size="sm"
                                                className="flex-1 h-7 text-[10px] capitalize"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContributionScope(s);
                                                }}
                                            >
                                                {s}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 px-2 border-l border-muted-foreground/20">
                                        <span className="text-[9px] font-bold uppercase text-muted-foreground tabular-nums">Breakdown</span>
                                        <Switch
                                            checked={showRevenueBreakdown}
                                            onCheckedChange={setShowRevenueBreakdown}
                                            className="h-3 w-6 scale-75 data-[state=checked]:bg-blue-500"
                                        />
                                    </div>
                                </div>
                                {/* Summary Section */}
                                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
                                                {contributionScope === 'store' ? 'Store' : contributionScope === 'location' ? 'Location' : 'Group'} Total
                                            </p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">${heavyLifter.totalRev.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">This Machine</p>
                                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${heavyLifter.myRev.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">Contribution</p>
                                            <p className={cn("text-lg font-bold", heavyLifter.color)}>{heavyLifter.percent.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative mt-4">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or tag..."
                                        className="pl-9 h-9 text-xs"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1 h-7 w-7 p-0"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            <XCircle className="h-3 w-3" />
                                            <span className="sr-only">Clear</span>
                                        </Button>
                                    )}
                                </div>
                                {/* Sticky Table Header */}
                                <div className="mt-4">
                                    <div className="grid grid-cols-12 px-2 text-[10px] font-bold uppercase text-muted-foreground pb-2 border-b bg-background sticky top-0 z-10 transition-all">
                                        <div className="col-span-1">#</div>
                                        <div className={cn(showRevenueBreakdown ? "col-span-4" : "col-span-5")}>Machine</div>
                                        {showRevenueBreakdown ? (
                                            <>
                                                <div className="col-span-2 text-right text-blue-500/80">Cash</div>
                                                <div className="col-span-2 text-right text-emerald-500/80">Bonus</div>
                                            </>
                                        ) : (
                                            <div className="col-span-3 text-right">Revenue</div>
                                        )}
                                        <div className="col-span-3 text-right">Share</div>
                                    </div>
                                    {/* Scrollable Table Body */}
                                    <div className="max-h-[50vh] overflow-y-auto space-y-1 pt-1">
                                        {heavyLifter.contributors.filter(m => {
                                            if (!searchTerm) return true;
                                            const term = searchTerm.toLowerCase();
                                            return (
                                                m.name?.toLowerCase().includes(term) ||
                                                m.tag?.toLowerCase().includes(term) ||
                                                m.assetTag?.toLowerCase().includes(term) ||
                                                String(m.tag).includes(term) ||
                                                String(m.assetTag).includes(term)
                                            );
                                        }).map((m, idx) => (
                                            <div
                                                key={m.id}
                                                ref={m.id === machine.id ? (el) => {
                                                    if (el && contributionOpen) {
                                                        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                                                    }
                                                } : undefined}
                                                className={cn(
                                                    "grid grid-cols-12 items-center p-2 rounded-lg text-xs transition-colors",
                                                    m.id === machine.id ? "bg-slate-100 dark:bg-slate-800/40 ring-1 ring-slate-400/30" : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="col-span-1 font-mono text-muted-foreground">{idx + 1}</div>
                                                <div className={cn("flex flex-col min-w-0", showRevenueBreakdown ? "col-span-4" : "col-span-5")}>
                                                    <span className="font-bold truncate">{m.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">#{m.assetTag || m.tag}</span>
                                                </div>
                                                {showRevenueBreakdown ? (
                                                    <>
                                                        <div className="col-span-2 text-right font-bold text-blue-600 dark:text-blue-400">
                                                            ${(m.cashRevenue || 0).toFixed(0)}
                                                        </div>
                                                        <div className="col-span-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                            ${(m.bonusRevenue || 0).toFixed(0)}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="col-span-3 text-right font-medium text-blue-600 dark:text-blue-400">
                                                        ${(m.revenue || 0).toFixed(0)}
                                                    </div>
                                                )}
                                                <div className="col-span-3 text-right">
                                                    <span className={cn("font-bold", m.id === machine.id ? heavyLifter.color : "text-slate-600 dark:text-slate-400")}>
                                                        {m.percent.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="pt-6 flex justify-end border-t mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
