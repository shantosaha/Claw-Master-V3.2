"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    RefreshCw,
    Activity,
    Wifi,
    WifiOff,
    AlertTriangle,
    AlertCircle,
    Search,
    LayoutGrid,
    Filter,
    Zap,
    PlayCircle,
    Percent,
    Settings,
    Eye,
    Bell,
    Check,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Info,
    View,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileBarChart,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Users,
    Target,
    ShieldAlert,
    Loader2,
    Trophy,
    Calendar,
    Sun,
    Cloud,
    CloudRain,
    Crown,
    Dumbbell,
    XCircle,
    HelpCircle,
    Award,
    ClipboardCheck
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    LineChart,
    Line
} from "recharts";
import { format, subDays, subMonths, subYears, parseISO, isSameDay, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ArcadeMachine, ServiceReport } from "@/types";
import { monitoringService, MachineStatus, MonitoringAlert, MonitoringReportItem } from "@/services/monitoringService";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import { GlobalServiceHistoryTable } from "@/components/machines/GlobalServiceHistoryTable";
import { ServiceReportForm } from "@/components/machines/ServiceReportForm";
import { MachineComparisonTable } from "@/components/machines/MachineComparisonTable";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { NonCraneMachineCard } from "@/components/machines/NonCraneMachineCard";
import { NonCraneQuickViewDialog } from "@/components/machines/NonCraneQuickViewDialog";
import { NonCraneReportTable } from "@/components/machines/NonCraneReportTable";
import { isCraneMachine } from "@/utils/machineTypeUtils";
import { useData } from "@/context/DataProvider";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";

// Custom hook for monitoring data
function useMonitoring() {
    const [machines, setMachines] = useState<MachineStatus[]>([]);
    const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const { refreshApis } = useData();

    useEffect(() => {
        const id = 'monitoring-hook-' + Date.now();

        const unsubscribeMachines = monitoringService.subscribe(id, (data) => {
            setMachines(data);
            setLastUpdate(new Date());
            setIsLoading(false);
            setError(null);
        });

        const unsubscribeAlerts = monitoringService.subscribeToAlerts(id + '-alerts', (alertData) => {
            setAlerts(alertData);
        });

        monitoringService.startPolling(300000);

        return () => {
            unsubscribeMachines();
            unsubscribeAlerts();
        };
    }, []);

    const acknowledgeAlert = useCallback((alertId: string) => {
        monitoringService.acknowledgeAlert(alertId);
    }, []);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            // First refresh the global APIs (JotForm, Revenue, etc.)
            await refreshApis();
            // Then fetch machine statuses
            const data = await monitoringService.fetchMachineStatuses();
            setMachines(data);
            setLastUpdate(new Date());
            setError(null);
        } catch {
            setError('Failed to refresh data');
        }
        setIsLoading(false);
    }, [refreshApis]);

    // Computed values
    const onlineCount = machines.filter(m => m.status === 'online').length;
    const offlineCount = machines.filter(m => m.status === 'offline').length;
    const errorCount = machines.filter(m => m.status === 'error').length;
    const maintenanceCount = machines.filter(m => m.status === 'maintenance').length;
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

    return {
        machines,
        alerts,
        unacknowledgedAlerts,
        isLoading,
        error,
        lastUpdate,
        onlineCount,
        offlineCount,
        errorCount,
        maintenanceCount,
        acknowledgeAlert,
        refresh,
    };
}

// Extended type for UI
type ExtendedMachineStatus = MachineStatus & Partial<MonitoringReportItem>;

// New Component: Machine Quick View Dialog
function MachineQuickViewDialog({
    machine,
    allMachines,
    dateRange,
    open,
    onOpenChange
}: {
    machine: ExtendedMachineStatus | null;
    allMachines: ExtendedMachineStatus[];
    dateRange?: DateRange;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { getReportsByMachineTag, serviceReportsLoading } = useData();
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
    // Memoized history from global context
    const settingsHistory = useMemo(() => {
        if (!machine) return [];
        const machineTag = String(machine.tag || '').trim();
        const reports = getReportsByMachineTag(machineTag);

        return reports
            .sort((a: ServiceReport, b: ServiceReport) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3)
            .map((report: ServiceReport) => ({
                date: report.timestamp
                    ? new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                    : 'Unknown',
                c1: report.c1 ?? 0,
                c2: report.c2 ?? 0,
                c3: report.c3 ?? 0,
                c4: report.c4 ?? 0,
                targetWin: report.playPerWin ?? 0,
                staff: report.staffName || 'Unknown',
            }));
    }, [machine?.assetTag, machine?.tag, getReportsByMachineTag]);

    const loadingHistory = serviceReportsLoading;

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
                const myAssetTag = machine.assetTag ? String(machine.assetTag).trim().toLowerCase() : null;

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
                        fullDate: date,
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

    // Fetch "All Time" (1 Year) data for Hall of Fame
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

                // Chunked fetching to be polite to the browser (30 days at a time)
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
                const myAssetTag = machine.assetTag ? String(machine.assetTag).trim().toLowerCase() : null;

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
            '7d': {
                points: 7,
                labelFn: (i: number) => format(subDays(now, 6 - i), 'MMM dd'),
                multiplier: 5
            },
            '14d': {
                points: 14,
                labelFn: (i: number) => format(subDays(now, 13 - i), 'MMM dd'),
                multiplier: 4
            },
            '30d': {
                points: 15,
                labelFn: (i: number) => format(subDays(now, (14 - i) * 2), 'MMM dd'),
                multiplier: 8
            },
            '6m': {
                points: 12,
                labelFn: (i: number) => format(subMonths(now, 6 - i / 2), 'MMM yy'),
                multiplier: 20
            }
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
                revenue: customer * (machine.group?.includes('Crane') ? 3.6 : 1.8) // Simulated revenue
            };
        });
    }, [machine?.id, machine?.telemetry?.playCountToday, trendRange, realTrendData, machine?.group]);

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
        // Today's total plays
        const todayPlays = machine.telemetry?.playCountToday ?? 0;
        // Get yesterday's plays from trend data (second to last item if last is today)
        // Or find the item that is exactly -1 day from today
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
    }, [machine?.telemetry?.playCountToday, realTrendData, machine?.group]);

    // 3. Hall of Fame (Best Day - All Time)
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

    // 4. The Heavy Lifter (Contribution with scope support)
    const heavyLifter = useMemo(() => {
        if (!machine || !allMachines.length) return { percent: 0, class: 'Featherweight', color: 'text-muted-foreground', icon: Activity, contributors: [], scopeLabel: 'Store', totalRev: 0, myRev: 0 };

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

        if (totalRev === 0) return { percent: 0, class: 'Featherweight', color: 'text-muted-foreground', icon: Activity, contributors: [], scopeLabel, totalRev, myRev };

        const percent = (myRev / totalRev) * 100;

        // Contributors list for Dialog
        const contributors = filtered.map(m => ({
            ...m,
            percent: ((m.revenue || 0) / totalRev) * 100
        })).sort((a, b) => b.percent - a.percent);

        if (percent >= 10) return { percent, class: 'Boss Level', color: 'text-purple-600', icon: Trophy, contributors, scopeLabel, totalRev, myRev };
        if (percent >= 5) return { percent, class: 'Heavyweight', color: 'text-amber-600', icon: Target, contributors, scopeLabel, totalRev, myRev };
        return { percent, class: 'Featherweight', color: 'text-muted-foreground', icon: Activity, contributors, scopeLabel, totalRev, myRev };
    }, [machine, allMachines, contributionScope]);

    // 5. Weekend Forecast (renamed to Machine Forecast)
    const forecast = useMemo(() => {
        if (!machine) return { prediction: 'Cloudy', label: 'Moderate Traffic', color: 'text-blue-400' };

        const baseTraffic = machine.telemetry?.playCountToday ?? 0;
        let prediction = 'Cloudy';
        let label = 'Moderate Traffic';
        // Need Cloud, Sun, CloudRain icons. Assuming they are not imported yet. 
        // I will return strings for icons and handle them in JSX or add imports.
        // The previous file had Lucide icons. I'll stick to text descriptions or simple logic if icons missing.
        // Actually, let's use the momentum to define color/text.
        let color = 'text-blue-400';

        if (momentum?.isPositive && momentum.percent > 20) {
            prediction = 'Sunny';
            label = 'High Traffic Expected';
            color = 'text-amber-500';
        } else if (momentum?.isPositive === false && Math.abs(momentum.percent) > 20) {
            prediction = 'Rainy';
            label = 'Low Turnout Likely';
            color = 'text-slate-400';
        }

        return { prediction, label, color };
    }, [machine, momentum]);

    if (!machine) return null;

    const isToday = !dateRange || (
        dateRange.from && dateRange.to &&
        format(dateRange.from, 'yyyyMMdd') === format(new Date(), 'yyyyMMdd') &&
        format(dateRange.to, 'yyyyMMdd') === format(new Date(), 'yyyyMMdd')
    );

    const periodCustomer = machine.customerPlays ?? machine.telemetry?.playCountToday ?? 0;
    const periodStaff = machine.staffPlays ?? machine.telemetry?.staffPlaysToday ?? 0;
    const periodTotal = periodCustomer + periodStaff;
    const periodPayouts = machine.payouts ?? machine.telemetry?.payoutsToday ?? 0;

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
                                {forecast.label === 'High Traffic Expected' && <Sun className="w-3 h-3 mr-1.5 inline-block" />}
                                {forecast.label === 'Low Turnout Likely' && <CloudRain className="w-3 h-3 mr-1.5 inline-block" />}
                                {forecast.label === 'Moderate Traffic' && <Cloud className="w-3 h-3 mr-1.5 inline-block" />}
                                {forecast.label}
                            </Badge>
                        </div>
                    </div>
                    <DialogDescription>
                        {isToday ? 'Real-time staff and performance metrics' : 'Aggregated performance data for the selected period'} for {machine.location}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Visuals & Status */}
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

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-3 bg-muted/30">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Accuracy</p>
                                <div className="flex items-end gap-1">
                                    <p className="text-xl font-bold">{machine.payoutAccuracy ?? 0}%</p>
                                    <p className={cn(
                                        "text-[10px] mb-1 font-medium",
                                        machine.payoutAccuracy && machine.payoutAccuracy > 100 ? "text-red-500" : "text-green-500"
                                    )}>
                                        {machine.payoutStatus || 'N/A'}
                                    </p>
                                </div>
                            </Card>
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

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Performance & Settings</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t pt-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[11px]">Payouts:</span>
                                        <span className="font-mono font-bold text-amber-600">{periodPayouts}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[11px]">Plays/Win:</span>
                                        <span className="font-mono font-bold">{machine.playsPerPayout?.toFixed(1) ?? '0.0'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[11px]">Target P/W:</span>
                                        <span className="font-mono font-bold text-muted-foreground">{machine.payoutSettings ?? 0}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground">C1</span>
                                        <span className="font-bold text-xs">{machine.c1 ?? 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground">C2</span>
                                        <span className="font-bold text-xs">{machine.c2 ?? 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground">C3</span>
                                        <span className="font-bold text-xs">{machine.c3 ?? 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground">C4</span>
                                        <span className="font-bold text-xs font-mono text-blue-600">{machine.c4 ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Live Insights & Financials */}
                            <div className="space-y-4 pt-4 border-t border-dashed">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <DollarSign className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-blue-600/70 dark:text-blue-400/70">Total Revenue</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                                ${(machine.revenue || 0).toFixed(2)}
                                            </span>
                                            {isToday && momentum && (
                                                <div className="flex flex-col ml-2 border-l pl-2 border-blue-200/50">
                                                    <span className={cn(
                                                        "text-[10px] font-bold leading-none",
                                                        momentum.isPositive ? "text-green-600" : "text-red-500"
                                                    )}>
                                                        {momentum.isPositive ? '↑' : '↓'}{Math.abs(momentum.percent)}%
                                                    </span>
                                                    <span className="text-[9px] text-blue-600/40 font-medium whitespace-nowrap">
                                                        vs ${momentum.yesterdayRevenue.toFixed(0)} (yest)
                                                    </span>
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

                                    <Dialog open={storeRankOpen} onOpenChange={setStoreRankOpen}>
                                        <DialogTrigger asChild>
                                            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 cursor-pointer hover:bg-emerald-100/30 transition-all group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                            <Target className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase text-emerald-600/70 dark:text-emerald-400/70">
                                                            {rankScope === 'store' ? 'Store Rank' : (rankScope === 'location' ? 'Level Rank' : 'Group Rank')}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="h-3 w-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                                        #{storeStats.rank}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600/50 font-medium">of {storeStats.total} units</span>
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Trophy className="h-5 w-5 text-amber-500" />
                                                    Machine Leaderboard
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
                                            <div className="flex items-center justify-between gap-1 mt-4 p-1 bg-muted rounded-lg">
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
                                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Breakdown</span>
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
                                                    <div className={cn(showRevenueBreakdown ? "col-span-4" : "col-span-5")}>Machine</div>
                                                    <div className={cn("text-right", showRevenueBreakdown ? "col-span-1" : "col-span-2")}>Plays</div>
                                                    <div className="col-span-1 text-right">Win</div>
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
                                                            <div className={cn("flex flex-col min-w-0", showRevenueBreakdown ? "col-span-4" : "col-span-5")}>
                                                                <span className="font-bold truncate">{m.name}</span>
                                                                <span className="text-[10px] text-muted-foreground font-mono">#{m.assetTag || m.tag}</span>
                                                            </div>
                                                            <div className={cn("text-right font-medium", showRevenueBreakdown ? "col-span-1" : "col-span-2")}>
                                                                {m.customerPlays || 0}
                                                            </div>
                                                            <div className="col-span-1 text-right text-amber-600 font-bold">
                                                                {m.payouts || 0}
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
                                            <div className="flex items-center justify-between gap-1 mt-4 p-1 bg-muted rounded-lg">
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
                                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Breakdown</span>
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
                        </div>
                    </div>

                    {/* Chart & Control */}
                    <div className="space-y-4">
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
                            <div className="flex gap-1">
                                {(['7d', '14d', '30d', '6m'] as const).map((range) => (
                                    <Button
                                        key={range}
                                        variant={trendRange === range ? "default" : "outline"}
                                        size="sm"
                                        className="h-6 px-2 text-[10px]"
                                        onClick={() => setTrendRange(range)}
                                    >
                                        {range === '6m' ? '6 Months' : range.replace('d', ' Days')}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Show:</span>
                            <div className="flex gap-1">
                                {trendType === 'plays' ? (
                                    [
                                        { id: 'plays', label: 'Total', color: 'bg-blue-500' },
                                        { id: 'customer', label: 'Customer', color: 'bg-amber-500' },
                                        { id: 'staff', label: 'Staff', color: 'bg-emerald-500' },
                                        { id: 'wins', label: 'Wins', color: 'bg-rose-500' }
                                    ].map(field => (
                                        <Badge
                                            key={field.id}
                                            variant={visibleFields.has(field.id) ? "secondary" : "outline"}
                                            className={cn(
                                                "cursor-pointer text-[9px] px-2 py-0 h-5 border-none",
                                                visibleFields.has(field.id) ? "bg-muted font-bold" : "text-muted-foreground opacity-50"
                                            )}
                                            onClick={() => {
                                                const next = new Set(visibleFields);
                                                if (next.has(field.id)) {
                                                    if (next.size > 1) next.delete(field.id);
                                                } else {
                                                    next.add(field.id);
                                                }
                                                setVisibleFields(next);
                                            }}
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", field.color)} />
                                            {field.label}
                                        </Badge>
                                    ))
                                ) : (
                                    [
                                        { id: 'revenue', label: 'Total Rev', color: 'bg-blue-600' },
                                        { id: 'cashRev', label: 'Cash', color: 'bg-emerald-600' },
                                        { id: 'bonusRev', label: 'Bonus', color: 'bg-purple-600' }
                                    ].map(field => {
                                        const isVisible = visibleFields.has(field.id);
                                        return (
                                            <Badge
                                                key={field.id}
                                                variant={isVisible ? "secondary" : "outline"}
                                                className={cn(
                                                    "cursor-pointer text-[9px] px-2 py-0 h-5 border-none",
                                                    isVisible ? "bg-muted font-bold" : "text-muted-foreground opacity-50"
                                                )}
                                                onClick={() => {
                                                    const next = new Set(visibleFields);
                                                    if (next.has(field.id)) {
                                                        if (next.size > 1) next.delete(field.id);
                                                    } else {
                                                        next.add(field.id);
                                                    }
                                                    setVisibleFields(next);
                                                }}
                                            >
                                                <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", field.color)} />
                                                {field.label}
                                            </Badge>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="relative h-[230px] w-full">
                            {loadingTrend && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCustomer" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBonus" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                    <YAxis hide />
                                    <RechartsTooltip
                                        labelStyle={{ color: 'black' }}
                                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: number, name: string) => [
                                            trendType === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                                            name === 'plays' ? 'Total Plays' :
                                                name === 'customer' ? 'Customer' :
                                                    name === 'staff' ? 'Staff' :
                                                        name === 'wins' ? 'Wins' :
                                                            name === 'revenue' ? 'Total Rev' :
                                                                name === 'cashRev' ? 'Cash' :
                                                                    name === 'bonusRev' ? 'Bonus' : name
                                        ]}
                                    />
                                    {trendType === 'plays' ? (
                                        <>
                                            {visibleFields.has('plays') && (
                                                <Area type="monotone" dataKey="plays" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPlays)" name="plays" />
                                            )}
                                            {visibleFields.has('customer') && (
                                                <Area type="monotone" dataKey="customer" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorCustomer)" name="customer" />
                                            )}
                                            {visibleFields.has('staff') && (
                                                <Area type="monotone" dataKey="staff" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorStaff)" name="staff" />
                                            )}
                                            {visibleFields.has('wins') && (
                                                <Area type="monotone" dataKey="wins" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorWins)" name="wins" />
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {visibleFields.has('revenue') && (
                                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="revenue" />
                                            )}
                                            {visibleFields.has('cashRev') && (
                                                <Area type="monotone" dataKey="cashRev" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorCash)" name="cashRev" />
                                            )}
                                            {visibleFields.has('bonusRev') && (
                                                <Area type="monotone" dataKey="bonusRev" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorBonus)" name="bonusRev" />
                                            )}
                                        </>
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-[2px]">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                Claw Settings History
                                <span className="text-[9px] font-normal text-muted-foreground">(From JotForm)</span>
                            </h4>
                            <div className="space-y-1">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading history...
                                    </div>
                                ) : settingsHistory.length > 0 ? (
                                    settingsHistory.map((h, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-muted/30 rounded">
                                            <span className="font-medium text-muted-foreground w-16">{h.date}</span>
                                            <div className="flex gap-1 items-center">
                                                <span className="font-mono">{h.c1}-{h.c2}-{h.c3}</span>
                                                <span className="text-[9px] text-muted-foreground">C4:</span>
                                                <span className="font-mono text-blue-600">{h.c4}</span>
                                                <span className="text-[9px] text-muted-foreground ml-1">TW:</span>
                                                <span className="font-mono text-amber-600">{h.targetWin}</span>
                                            </div>
                                            <span className="text-blue-500 font-medium">{h.staff}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-[11px]">
                                        No settings history found for this machine
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                            <Button className="flex-1" asChild>
                                <Link href={`/machines/${machine.id}`}>Go to Page</Link>
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </div>
                    </div >
                </div >
            </DialogContent >
        </Dialog >
    );
}

// Machine Status Card Component
function MachineStatusCard({ machine, onAction }: { machine: ExtendedMachineStatus, onAction?: (action: string, machine: ExtendedMachineStatus) => void }) {
    const statusColors = {
        online: "bg-green-500",
        offline: "bg-gray-400",
        error: "bg-red-500",
        maintenance: "bg-yellow-500",
    };

    const statusBadgeVariants = {
        online: "bg-green-100 text-green-800 border-green-200",
        offline: "bg-gray-100 text-gray-800 border-gray-200",
        error: "bg-red-100 text-red-800 border-red-200",
        maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
            machine.status === 'error' && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
            machine.status === 'offline' && "opacity-60",
            machine.payoutStatus === 'Very High' && "border-2 border-red-600 dark:border-red-500 animate-pulse shadow-red-200/50 dark:shadow-red-900/50"
        )}>
            {/* Status indicator pulse */}
            <div className="absolute top-3 right-3">
                <div className="relative">
                    {machine.status === 'online' && (
                        <div className={cn(
                            "absolute inset-0 rounded-full animate-ping opacity-75",
                            statusColors[machine.status]
                        )} />
                    )}
                    <div className={cn(
                        "relative h-3 w-3 rounded-full",
                        statusColors[machine.status]
                    )} />
                </div>
            </div>

            <CardContent className="p-3">
                <div className="space-y-3">
                    {/* Header with Image */}
                    <div className="flex gap-3">
                        {/* Machine Image (Small) - Click to Zoom */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className="h-16 w-16 bg-muted rounded-md flex-shrink-0 overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity">
                                    {machine.imageUrl ? (
                                        <img
                                            src={getThumbnailUrl(machine.imageUrl, 128)}
                                            alt={machine.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-secondary">
                                            <View className="h-6 w-6 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                <VisuallyHidden>
                                    <DialogTitle>{machine.name} Image</DialogTitle>
                                </VisuallyHidden>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {machine.imageUrl ? (
                                        <img
                                            src={getThumbnailUrl(machine.imageUrl, 1024)}
                                            alt={machine.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                        />
                                    ) : (
                                        <div className="w-64 h-64 bg-background rounded-lg flex items-center justify-center">
                                            <View className="h-16 w-16 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Name and Info */}
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/machines/${machine.id}`}
                                className="font-bold text-xs leading-none hover:underline hover:text-primary block mb-1 line-clamp-2"
                                title={machine.name}
                            >
                                {machine.name}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                                {machine.location}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <Badge
                                    variant="outline"
                                    className={cn("text-[10px] h-5 px-1 capitalize", statusBadgeVariants[machine.status])}
                                >
                                    {machine.status}
                                </Badge>
                                {machine.payoutStatus && (
                                    <Badge className={cn(
                                        "text-[10px] h-5 px-1",
                                        machine.payoutStatus === 'Very High' && "bg-red-700 hover:bg-red-800 text-white border-red-800",
                                        machine.payoutStatus === 'High' && "bg-red-400 hover:bg-red-500 text-white border-red-500",
                                        machine.payoutStatus === 'OK' && "bg-green-500 hover:bg-green-600 text-white border-green-600",
                                        machine.payoutStatus === 'Low' && "bg-yellow-200 hover:bg-yellow-300 text-yellow-800 border-yellow-300",
                                        machine.payoutStatus === 'Very Low' && "bg-orange-600 hover:bg-orange-700 text-white border-orange-700",
                                        machine.payoutStatus === 'N/A' && "bg-muted hover:bg-muted/80 text-muted-foreground border-muted-foreground/20"
                                    )}>
                                        {machine.payoutStatus}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Grid (5 requested metrics) */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs border-t pt-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cust. Plays:</span>
                            <span className="font-medium">{machine.customerPlays ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Staff Plays:</span>
                            <span className="font-medium">{machine.staffPlays ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payouts:</span>
                            <span className="font-medium">{machine.payouts ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Plays/Win:</span>
                            <span className="font-medium">{machine.playsPerPayout ?? '-'}</span>
                        </div>
                        <div className="flex justify-between col-span-2 border-t border-dashed pt-1 mt-1">
                            <span className="text-muted-foreground">Target Plays/Win:</span>
                            <span className="font-medium">{machine.payoutSettings ?? '-'}</span>
                        </div>
                    </div>

                    {/* Claw Strength Settings (C1-C3 + C4) */}
                    {(machine.c1 !== undefined) && (
                        <div className="grid grid-cols-4 gap-1 text-[10px] pt-1 border-t">
                            <div className="text-center bg-muted/40 rounded py-0.5">
                                <span className="text-muted-foreground block">C1</span>
                                <span className="font-medium">{machine.c1}</span>
                            </div>
                            <div className="text-center bg-muted/40 rounded py-0.5">
                                <span className="text-muted-foreground block">C2</span>
                                <span className="font-medium">{machine.c2}</span>
                            </div>
                            <div className="text-center bg-muted/40 rounded py-0.5">
                                <span className="text-muted-foreground block">C3</span>
                                <span className="font-medium">{machine.c3}</span>
                            </div>
                            <div className="text-center bg-muted/40 rounded py-0.5">
                                <span className="text-muted-foreground block">C4</span>
                                <span className="font-medium">{machine.c4}</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 h-7 text-xs shadow-sm hover:bg-primary/90"
                            onClick={(e) => {
                                if (onAction) {
                                    e.preventDefault();
                                    onAction('quick_view', machine);
                                }
                            }}
                        >
                            Quick Details
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs border-dashed"
                            onClick={(e) => {
                                if (onAction) {
                                    e.preventDefault();
                                    onAction('compare', machine);
                                }
                            }}
                            asChild={!onAction}
                        >
                            {!onAction ? (
                                <Link href={`/machines/${machine.id}`}>
                                    View Full
                                </Link>
                            ) : "Compare"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Alert Panel Component
function AlertPanel({
    alerts,
    onAcknowledge
}: {
    alerts: MonitoringAlert[];
    onAcknowledge: (alertId: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

    const alertIcons = {
        error: <AlertCircle className="h-4 w-4 text-red-500" />,
        warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        info: <Info className="h-4 w-4 text-blue-500" />,
    };

    const alertStyles = {
        error: "border-l-red-500 bg-red-50 dark:bg-red-950/30",
        warning: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
        info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
    };

    if (alerts.length === 0) {
        return null;
    }

    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
    if (unacknowledgedAlerts.length === 0) {
        return null;
    }

    return (
        <Card className={cn(
            "transition-all duration-200",
            unacknowledgedCount > 0 && "border-red-200 dark:border-red-800"
        )}>
            <CardHeader
                className="py-3 cursor-pointer flex flex-row items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Alerts
                    {unacknowledgedCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {unacknowledgedCount}
                        </Badge>
                    )}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {unacknowledgedCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                monitoringService.acknowledgeAllAlerts();
                            }}
                        >
                            Acknowledge All
                        </Button>
                    )}
                    <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="py-0 pb-3">
                    <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                            {unacknowledgedAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "flex items-start gap-3 p-2 rounded border-l-4",
                                        alertStyles[alert.type]
                                    )}
                                >
                                    {alertIcons[alert.type]}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{alert.machineName}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {alert.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatTimeAgo(alert.timestamp)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAcknowledge(alert.id);
                                        }}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            )}
        </Card>
    );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Sortable Table Component
function MonitoringReportTable({ data }: { data: MonitoringReportItem[] }) {
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof MonitoringReportItem; direction: 'asc' | 'desc' } | null>(null);
    const [pageSize, setPageSize] = useState(50);

    // Reset page when data changes (e.g. filtering)
    useEffect(() => {
        setPage(1);
    }, [data.length, data[0]?.machineId]); // Reset on count change or identity change

    const sortedData = useMemo(() => {
        const statusOrder = {
            'Very High': 6,
            'High': 5,
            'OK': 4,
            'Low': 3,
            'Very Low': 2,
            'N/A': 1
        };

        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'payoutStatus') {
                    aValue = statusOrder[aValue as keyof typeof statusOrder] || 0;
                    bValue = statusOrder[bValue as keyof typeof statusOrder] || 0;
                }

                if (aValue === undefined || bValue === undefined) return 0;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    const requestSort = (key: keyof MonitoringReportItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof MonitoringReportItem }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderSortableHeader = (label: string, key: keyof MonitoringReportItem, className?: string, tooltip?: string) => (
        <TableHead className={cn("whitespace-nowrap", className)}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("-ml-3 h-8 data-[state=open]:bg-accent w-full px-0 mx-0 font-bold", className?.includes('justify-center') ? 'justify-center ml-0' : '')}
                            onClick={() => requestSort(key)}
                        >
                            {label}
                            <SortIcon columnKey={key} />
                        </Button>
                    </TooltipTrigger>
                    {tooltip && (
                        <TooltipContent side="top">
                            <p className="max-w-[150px] text-center text-xs">{tooltip}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        </TableHead>
    );

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No data available for the selected period
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {renderSortableHeader("Status", "payoutStatus", "w-[85px] px-0.5 text-center", "Payout Health Status")}
                            {renderSortableHeader("Tag", "tag", "w-[45px] px-0.5 text-center", "Machine ID / Asset Tag")}
                            {renderSortableHeader("Description", "description", "min-w-[120px] px-0.5 text-center", "Machine Name & Identity")}
                            {renderSortableHeader("Plays", "customerPlays", "w-[55px] text-center justify-center px-0.5", "Recorded Customer Plays")}
                            {renderSortableHeader("Staff", "staffPlays", "w-[45px] text-center justify-center px-0.5", "Staff / Employee Plays")}
                            {renderSortableHeader("Wins", "payouts", "w-[45px] text-center justify-center px-0.5", "Total Merchandise Wins")}
                            {renderSortableHeader("P/W", "playsPerPayout", "w-[45px] text-center justify-center px-0.5", "Actual Plays Per Win Ratio")}
                            {renderSortableHeader("Tgt", "payoutSettings", "w-[40px] text-center justify-center px-0.5", "Target Plays Per Win setting")}
                            {renderSortableHeader("C1", "c1", "w-[30px] text-center justify-center px-0.5", "Claw Phase 1 Strength")}
                            {renderSortableHeader("C2", "c2", "w-[30px] text-center justify-center px-0.5", "Claw Phase 2 Strength")}
                            {renderSortableHeader("C3", "c3", "w-[30px] text-center justify-center px-0.5", "Claw Phase 3 Strength")}
                            {renderSortableHeader("C4", "c4", "w-[30px] text-center justify-center px-0.5", "Win/Drop Phase Strength")}
                            {renderSortableHeader("Str", "strongTime", "w-[35px] text-center justify-center px-0.5", "Strong Grip Duration")}
                            {renderSortableHeader("Wk", "weakTime", "w-[35px] text-center justify-center px-0.5", "Weak Grip Duration")}
                            {renderSortableHeader("Acc%", "payoutAccuracy", "w-[45px] text-center justify-center px-0.5", "Payout Accuracy (Target vs Actual)")}
                            {renderSortableHeader("Rev", "revenue", "w-[60px] text-center justify-center px-0.5", "Total Adjusted Revenue")}
                            {renderSortableHeader("Date", "settingsDate", "w-[75px] px-0.5 text-center", "Settings Modification Date")}
                            {renderSortableHeader("Staff", "staffName", "w-[80px] px-0.5 text-center", "Last Sync Action Performed By")}
                            <TableHead className="w-[50px] px-0.5 text-xs text-center font-bold">Img</TableHead>
                            {renderSortableHeader("Notes", "remarks", "min-w-[100px] px-0.5 text-center", "Sync Remarks and Notes")}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((item) => (
                            <TableRow
                                key={item.machineId}
                                className={cn(
                                    item.payoutStatus === 'Very High' && "border-2 border-red-600 bg-red-50/10 animate-pulse"
                                )}
                            >
                                <TableCell className="px-1 text-center">
                                    <Badge
                                        className={cn(
                                            "w-full justify-center text-[10px] px-1 py-0 h-5 text-white",
                                            item.payoutStatus === 'Very High' && "bg-red-700 hover:bg-red-800 border-red-800",
                                            item.payoutStatus === 'High' && "bg-red-400 hover:bg-red-500 border-red-500",
                                            item.payoutStatus === 'OK' && "bg-green-500 hover:bg-green-600 border-green-600",
                                            item.payoutStatus === 'Low' && "bg-yellow-200 hover:bg-yellow-300 text-yellow-800 border-yellow-300",
                                            item.payoutStatus === 'Very Low' && "bg-yellow-600 hover:bg-yellow-700 border-yellow-700"
                                        )}
                                    >
                                        {item.payoutStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-[10px] px-1 text-center">{item.tag}</TableCell>
                                <TableCell className="px-1 text-center">
                                    <Link href={`/machines/${item.machineId}`} className="hover:underline text-primary font-medium text-xs">
                                        {item.description}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center text-xs px-1">{item.customerPlays}</TableCell>
                                <TableCell className="text-center text-xs px-1">{item.staffPlays}</TableCell>
                                <TableCell className="text-center text-xs px-1">{item.payouts}</TableCell>
                                <TableCell className="text-center font-medium text-xs px-1">{item.playsPerPayout}</TableCell>
                                <TableCell className="text-center text-muted-foreground text-xs px-1">{item.payoutSettings}</TableCell>
                                <TableCell className="text-center text-[10px] px-1">{item.c1}</TableCell>
                                <TableCell className="text-center text-[10px] px-1">{item.c2}</TableCell>
                                <TableCell className="text-center text-[10px] px-1">{item.c3}</TableCell>
                                <TableCell className="text-center text-[10px] px-1">{item.c4}</TableCell>
                                <TableCell className="text-center text-[10px] px-1">{item.strongTime !== undefined && !isNaN(item.strongTime) ? item.strongTime : '-'}</TableCell>
                                <TableCell className="text-center text-[10px] px-1">{item.weakTime !== undefined && !isNaN(item.weakTime) ? item.weakTime : '-'}</TableCell>
                                <TableCell className="text-center font-medium text-[10px] px-1">
                                    {item.payoutSettings > 0 ? (
                                        <span className={cn(
                                            item.payoutAccuracy > 100 ? "text-red-500" : (item.payoutAccuracy < 50 ? "text-orange-500" : "text-green-500")
                                        )}>
                                            {item.payoutAccuracy}%
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-[10px]">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center font-bold text-green-600 text-xs px-1">
                                    ${(item.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground px-1 leading-tight text-center">
                                    {format(item.settingsDate, 'M/d/yy')}<br />
                                    {format(item.settingsDate, 'h:mm a')}
                                </TableCell>
                                <TableCell className="text-[10px] px-1 text-center">{item.staffName}</TableCell>
                                <TableCell className="px-1 text-center">
                                    {item.imageUrl ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="flex justify-center">
                                                    <img
                                                        src={getThumbnailUrl(item.imageUrl, 100)}
                                                        alt="Machine"
                                                        className="h-8 w-8 object-cover rounded border border-muted-foreground/20 cursor-pointer hover:opacity-80 transition-opacity"
                                                    />
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                <VisuallyHidden>
                                                    <DialogTitle>{item.description} Image</DialogTitle>
                                                </VisuallyHidden>
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={getThumbnailUrl(item.imageUrl, 1024)}
                                                        alt={item.description}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic text-center">No image</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground px-1 truncate max-w-[100px] text-center">{item.remarks}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div>
                        Page {page} of {totalPages} ({sortedData.length} total items)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Rows per page:</span>
                        <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(parseInt(val))}>
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="250">250</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

// New Component: Stat Detail Dialog
function StatDetailDialog({
    type,
    machines,
    onClose
}: {
    type: 'revenue' | 'activity' | 'accuracy' | 'uptime' | null;
    machines: ExtendedMachineStatus[];
    onClose: () => void;
}) {
    if (!type) return null;
    const [attentionTab, setAttentionTab] = useState<'high' | 'low'>('high');

    const titles = {
        revenue: "Estimated Revenue Drill-down",
        activity: "Activity Leaderboard",
        accuracy: "Claw Payout Attention",
        uptime: "Network Health Details"
    };

    const sortedData = useMemo(() => {
        let list = [...machines];

        if (type === 'revenue' || type === 'activity') {
            return list.sort((a, b) => (b.customerPlays || 0) - (a.customerPlays || 0));
        }

        if (type === 'accuracy') {
            // Filter only Claw Machines
            list = list.filter(m => {
                const group = m.group?.toLowerCase() || '';
                const type = m.type?.toLowerCase() || '';
                return group.includes('crane') || group.includes('group 4') || type.includes('crane') || isCraneMachine(m as any);
            });

            // Filter by selected attention tab
            if (attentionTab === 'high') {
                list = list.filter(m => m.payoutStatus === 'Very High' || m.payoutStatus === 'High');
                return list.sort((a, b) => (b.payoutAccuracy || 0) - (a.payoutAccuracy || 0));
            } else {
                list = list.filter(m => m.payoutStatus === 'Very Low' || m.payoutStatus === 'Low');
                return list.sort((a, b) => (a.payoutAccuracy || 0) - (b.payoutAccuracy || 0));
            }
        }

        if (type === 'uptime') {
            return list.filter(m => m.status !== 'online');
        }
        return list;
    }, [machines, type, attentionTab]);

    const chartData = useMemo(() => {
        return sortedData.slice(0, 10).map(m => ({
            name: m.name.substring(0, 12),
            value: type === 'revenue' ? (m.revenue || 0) :
                type === 'accuracy' ? (m.payoutAccuracy || 0) :
                    (m.customerPlays || 0)
        }));
    }, [sortedData, type]);

    return (
        <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{titles[type]}</DialogTitle>
                    <DialogDescription>
                        {type === 'accuracy'
                            ? "Analyzing payout deviations for Claw/Crane machines only."
                            : "Breakdown of the top metrics and status alerts for the current period."
                        }
                    </DialogDescription>
                </DialogHeader>

                {type === 'accuracy' && (
                    <Tabs value={attentionTab} onValueChange={(v: any) => setAttentionTab(v)} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="high" className="text-xs">
                                High Payout Alerts (Very High + High)
                            </TabsTrigger>
                            <TabsTrigger value="low" className="text-xs">
                                Low Payout Alerts (Very Low + Low)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    {/* List Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase text-muted-foreground">List Breakdown</h4>
                        <div className="rounded-md border bg-muted/20">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">Machine</TableHead>
                                        <TableHead className="text-xs text-right">
                                            {type === 'revenue' ? 'Revenue' : (type === 'accuracy' ? 'Accuracy' : 'Plays')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.slice(0, 15).map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="py-2">
                                                <div className="flex items-center gap-2">
                                                    {(m as any).imageUrl && (
                                                        <img
                                                            src={getThumbnailUrl((m as any).imageUrl, 80)}
                                                            alt="Machine"
                                                            className="w-6 h-6 rounded object-cover border border-muted-foreground/10"
                                                        />
                                                    )}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-[11px] truncate">{m.name}</span>
                                                        <span className="text-[9px] text-muted-foreground">{m.location}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2">
                                                {type === 'revenue' && <span className="font-mono text-xs">${(m.revenue || 0).toFixed(0)}</span>}
                                                {type === 'activity' && <span className="font-mono text-xs">{m.customerPlays}</span>}
                                                {type === 'accuracy' && (
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className={cn(
                                                            "font-mono text-[11px] font-bold",
                                                            (m.payoutAccuracy || 0) > 100 ? "text-red-500" : "text-green-600"
                                                        )}>
                                                            {m.payoutAccuracy !== undefined && !isNaN(m.payoutAccuracy) ? `${m.payoutAccuracy}%` : 'N/A'}
                                                        </span>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] h-3 px-1 leading-none border-none",
                                                            m.payoutStatus === 'Very High' ? "bg-red-500 text-white" :
                                                                (m.payoutStatus === 'Very Low' ? "bg-orange-600 text-white" :
                                                                    (m.payoutStatus === 'N/A' ? "bg-muted text-muted-foreground" : "bg-muted"))
                                                        )}>
                                                            {m.payoutStatus}
                                                        </Badge>
                                                    </div>
                                                )}
                                                {type === 'uptime' && (
                                                    <Badge variant="destructive" className="text-[10px] h-4 capitalize">
                                                        {m.status}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase text-muted-foreground">Visualization</h4>
                        <div className="h-[250px] w-full bg-muted/10 rounded-lg border p-4">
                            {(type === 'revenue' || type === 'activity' || type === 'accuracy') ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide />
                                        <RechartsTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white border shadow-sm rounded p-1 text-[10px]">
                                                            <p className="font-bold">{payload[0].payload.name}</p>
                                                            <p>{type === 'revenue' ? '$' : ''}{payload[0].value?.toLocaleString()}{type === 'accuracy' ? '%' : ''}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={type === 'revenue' ? '#22c55e' : (type === 'accuracy' ? (entry.value > 100 ? '#ef4444' : '#22c55e') : '#3b82f6')} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                                    <Activity className="h-10 w-10 opacity-20" />
                                    <p className="text-xs italic">Visualization for {type} is list-based</p>
                                </div>
                            )}
                        </div>
                        <div className="pt-4">
                            <Button className="w-full" variant="outline" onClick={onClose}>
                                Close Detailed View
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function MonitoringPage() {
    const {
        machines,
        alerts,
        unacknowledgedAlerts,
        isLoading,
        error,
        lastUpdate,
        onlineCount,
        offlineCount,
        errorCount,
        maintenanceCount,
        acknowledgeAlert,
        refresh,
    } = useMonitoring();

    const { todayGameReports } = useData();

    // Helper to format currency without rounding up
    const formatNoRound = (num: number) => {
        return (Math.floor(num * 100) / 100).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "report">("grid");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });

    const [sortOption, setSortOption] = useState<string>("default");

    // Report specific state
    const [reportData, setReportData] = useState<MonitoringReportItem[]>([]);
    const [yesterdayData, setYesterdayData] = useState<MonitoringReportItem[]>([]);

    // Trends chart state
    const [selectedTrendsFields, setSelectedTrendsFields] = useState<string[]>(['totalPlays', 'totalRevenue']);
    const [trendChartData, setTrendChartData] = useState<{
        name: string;
        totalPlays: number;
        revenue: number;
        cashRevenue: number;
        bonusRevenue: number;
        staff: number;
        payout: number;
    }[]>([]);
    const [trendLoading, setTrendLoading] = useState(false);

    // Aggregated stats from todayGameReports (same as Dashboard) 
    const stats = useMemo(() => {
        // Use raw Game Report data for accurate totals (matches Dashboard)
        let totalPlaysSum = 0;
        let staffPlaysSum = 0;
        let totalRevenueSum = 0;
        let cashRevenueSum = 0;
        let bonusRevenueSum = 0;

        for (const item of todayGameReports) {
            // Standardizing play counts
            const sPlays = Number(item.standardPlays) || 0;
            const ePlays = Number(item.empPlays) || 0;
            totalPlaysSum += sPlays + ePlays;
            staffPlaysSum += ePlays;

            // Standardizing revenue with fallbacks (Matches Dashboard logic)
            const cash = Number(item.cashDebit || item.cashRev || 0);
            const bonus = Number(item.cashDebitBonus || item.bonusRev || 0);

            cashRevenueSum += cash;
            bonusRevenueSum += bonus;

            // Per-machine totalRev can be zero in API even if components exist
            totalRevenueSum += (Number(item.totalRev) || (cash + bonus));
        }

        const totalPlays = totalPlaysSum;
        const staffPlays = staffPlaysSum;
        const totalRevenue = totalRevenueSum;
        const cashRevenue = cashRevenueSum;
        const bonusRevenue = bonusRevenueSum;

        // Filter claw machines for accurate payout/win aggregation
        const craneData = todayGameReports.filter(r =>
            r.group?.toLowerCase().includes('crane') ||
            r.group?.includes('Group 4')
        );

        // Total Payouts should ONLY count Crane Machines
        const totalPayouts = craneData.reduce((acc, curr) => acc + (Number(curr.points || curr.merchandise) || 0), 0);

        // Count for attention alerts (Group 4 / Crane) - use reportData for status
        const craneReportData = reportData.filter(r => {
            const machine = machines.find(m => m.id === r.machineId);
            return machine?.group?.toLowerCase().includes('crane') ||
                machine?.group?.includes('Group 4') ||
                machine?.type?.toLowerCase().includes('crane');
        });
        const veryHighCount = craneReportData.filter(r => r.payoutStatus === 'Very High').length;
        const highCount = craneReportData.filter(r => r.payoutStatus === 'High').length;
        const veryLowCount = craneReportData.filter(r => r.payoutStatus === 'Very Low').length;
        const lowCount = craneReportData.filter(r => r.payoutStatus === 'Low').length;
        const criticalCount = veryHighCount + highCount + veryLowCount + lowCount;

        const activeMachines = todayGameReports.filter(r => (Number(r.standardPlays) || 0) > 0).length;
        const avgRevenuePerUnit = activeMachines > 0 ? totalRevenue / activeMachines : 0;
        const avgAccuracy = craneReportData.length > 0
            ? Math.round(craneReportData.reduce((acc, curr) => acc + (Number(curr.payoutAccuracy) || 0), 0) / craneReportData.length)
            : 0;

        // Yesterday comparison for momentum
        const yesterdayRevenue = yesterdayData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        const revenueMomentum = yesterdayRevenue > 0
            ? Math.round(((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
            : 0;

        return {
            totalPlays, staffPlays, totalRevenue, cashRevenue, bonusRevenue, totalPayouts,
            criticalCount, veryHighCount, highCount, veryLowCount, lowCount,
            activeMachines, avgRevenuePerUnit, avgAccuracy,
            yesterdayRevenue, revenueMomentum
        };
    }, [todayGameReports, reportData, yesterdayData, machines]);



    const getFieldColor = (field: string) => {
        switch (field) {
            case 'totalPlays': return '#8b5cf6'; // Purple
            case 'standardPlays': return '#3b82f6'; // Blue
            case 'staffPlays': return '#10b981'; // Green
            case 'totalRevenue':
            case 'revenue': return '#f59e0b'; // Amber
            case 'cashRevenue': return '#059669'; // Emerald
            case 'bonusRevenue': return '#7c3aed'; // Violet
            case 'payouts':
            case 'payout': return '#f43f5e'; // Rose
            default: return '#a855f7';
        }
    };

    const getFieldLabel = (field: string) => {
        switch (field) {
            case 'totalPlays': return 'Total Plays';
            case 'standardPlays': return 'Customer Plays';
            case 'staffPlays': return 'Staff Plays';
            case 'totalRevenue':
            case 'revenue': return 'Total Revenue';
            case 'cashRevenue': return 'Cash Revenue';
            case 'bonusRevenue': return 'Bonus Revenue';
            case 'payouts':
            case 'payout': return 'Total Payouts';
            default: return field;
        }
    };

    useEffect(() => {
        const fetchReport = async () => {
            // Fetch current date range data
            const data = await monitoringService.fetchMonitoringReport(dateRange?.from || new Date(), dateRange?.to || new Date());
            setReportData(data);

            // Fetch yesterday's data for momentum comparison
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
            const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
            const yData = await monitoringService.fetchMonitoringReport(yesterdayStart, yesterdayEnd);
            setYesterdayData(yData);
        };
        fetchReport();
    }, [dateRange]);

    const locations = useMemo(() => {
        return Array.from(new Set(machines.map(m => m.location))).sort();
    }, [machines]);

    // Merge machines with report data for grid view
    const mergedMachines = useMemo(() => {
        return machines.map(machine => {
            const reportItem = reportData.find(r => r.machineId === machine.id);
            return {
                ...machine,
                ...reportItem,
                payoutStatus: reportItem?.payoutStatus
            };
        });
    }, [machines, reportData]);

    const filteredMachines = useMemo(() => {
        return mergedMachines.filter(machine => {
            const name = machine.name?.toLowerCase() || "";
            const tag = String(machine.tag || "").toLowerCase();
            const staff = machine.staffName?.toLowerCase() || "";
            const remarks = machine.remarks?.toLowerCase() || "";
            const payoutStatus = machine.payoutStatus?.toLowerCase() || "";
            const query = searchQuery.toLowerCase() || "";

            const matchesSearch = name.includes(query) ||
                tag.includes(query) ||
                staff.includes(query) ||
                remarks.includes(query) ||
                payoutStatus.includes(query);

            const matchesLocation = locationFilter === "all" || machine.location === locationFilter;
            const matchesPayoutStatus = payoutStatusFilter === "all" || machine.payoutStatus === payoutStatusFilter;
            const matchesStatus = statusFilter === "all" || machine.status === statusFilter;

            return matchesSearch && matchesLocation && matchesPayoutStatus && matchesStatus;
        });
    }, [mergedMachines, searchQuery, locationFilter, payoutStatusFilter, statusFilter]);

    // Fetch filtered trend chart data with debounce
    useEffect(() => {
        // Debounce to prevent excessive API calls during typing/filtering
        const timer = setTimeout(async () => {
            // If we have report data but no filtered machines, checking logic matters:
            // 1. Initial load (reportData empty) -> wait.
            // 2. Filter result is empty -> pass empty array (returns 0s).
            // 3. Filter matches all -> pass undefined (returns global stats optimization).

            if (reportData.length === 0) return; // Don't fetch if base data isn't loaded

            const isAllMachines = filteredMachines.length === reportData.length;
            const currentTags = isAllMachines ? undefined : filteredMachines.map(m => String(m.tag));

            setTrendLoading(true);
            try {
                const data = await monitoringService.fetchDailyTrend(7, currentTags);
                const chartData = data.map(d => ({
                    name: d.name,
                    totalPlays: d.totalPlays,
                    revenue: d.revenue,
                    cashRevenue: d.cashRevenue,
                    bonusRevenue: d.bonusRevenue,
                    staff: d.staffPlays,
                    payout: d.payouts,
                }));
                // Check if we got valid data, otherwise fallback to empty to avoid broken charts
                setTrendChartData(chartData.length > 0 ? chartData : []);
            } catch (err) {
                console.error('[MonitoringPage] Failed to fetch trend data:', err);
            } finally {
                setTrendLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filteredMachines, reportData.length]);

    const sortedMachines = useMemo(() => {
        const sorted = [...filteredMachines];
        switch (sortOption) {
            case 'payout-high':
                // High play/win = High Accuracy % = Paying more than target (Very High first)
                sorted.sort((a, b) => (b.payoutAccuracy || 0) - (a.payoutAccuracy || 0));
                break;
            case 'payout-low':
                // Low play/win = Low Accuracy % = Paying less than target (Very Low first)
                sorted.sort((a, b) => (a.payoutAccuracy || 0) - (b.payoutAccuracy || 0));
                break;
            case 'accuracy-high':
                sorted.sort((a, b) => (b.payoutAccuracy || 0) - (a.payoutAccuracy || 0));
                break;
            case 'accuracy-low':
                sorted.sort((a, b) => (a.payoutAccuracy || 0) - (b.payoutAccuracy || 0));
                break;
            case 'plays-high':
                sorted.sort((a, b) => (b.customerPlays || 0) - (a.customerPlays || 0));
                break;
            case 'plays-low':
                sorted.sort((a, b) => (a.customerPlays || 0) - (b.customerPlays || 0));
                break;
            case 'payouts-high':
                sorted.sort((a, b) => (b.payouts || 0) - (a.payouts || 0));
                break;
            case 'payouts-low':
                sorted.sort((a, b) => (a.payouts || 0) - (b.payouts || 0));
                break;
            case 'c4-high':
                sorted.sort((a, b) => (b.c4 || 0) - (a.c4 || 0));
                break;
            case 'c4-low':
                sorted.sort((a, b) => (a.c4 || 0) - (b.c4 || 0));
                break;
            default:
                break;
        }
        return sorted;
    }, [filteredMachines, sortOption]);

    const [selectedTab, setSelectedTab] = useState("monitor");
    const [selectedMachineForAction, setSelectedMachineForAction] = useState<ExtendedMachineStatus | null>(null);
    const [activeStatDetail, setActiveStatDetail] = useState<'revenue' | 'activity' | 'accuracy' | 'uptime' | null>(null);
    const [quickViewMachine, setQuickViewMachine] = useState<ExtendedMachineStatus | null>(null);
    const [quickViewNonCraneMachine, setQuickViewNonCraneMachine] = useState<ExtendedMachineStatus | null>(null);
    const [machineTypeTab, setMachineTypeTab] = useState<"cranes" | "other">("cranes");

    // Split machines into crane and non-crane categories
    const craneMachines = useMemo(() =>
        sortedMachines.filter(m => isCraneMachine(m as any)),
        [sortedMachines]
    );

    const otherMachines = useMemo(() =>
        sortedMachines.filter(m => !isCraneMachine(m as any)),
        [sortedMachines]
    );

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-red-600">Error Loading Monitoring Dashboard</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={() => refresh()} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    if (isLoading && machines.length === 0) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <LoadingSkeleton className="h-8 w-48" />
                    <LoadingSkeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} className="h-32" />)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <LoadingSkeleton key={i} className="h-64" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Monitoring Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Real-time status and performance telemetry across all locations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdate && (
                        <div className="hidden md:flex flex-col items-end text-[10px] text-muted-foreground">
                            <span>Last updated</span>
                            <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refresh()}
                        disabled={isLoading}
                        className="h-9 gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        {isLoading ? "Refreshing..." : "Refresh Data"}
                    </Button>
                </div>
            </div>

            {/* Top Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card
                    className="shadow-sm border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('revenue')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-1.5">
                            <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px]">
                                        <p className="text-xs"><strong>How it's calculated:</strong> Sum of totalRev from Game Report API. Compared with yesterday's same timeframe.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">
                                ${formatNoRound(stats.totalRevenue)}
                            </div>
                            {stats.revenueMomentum !== 0 && (
                                <div className={cn(
                                    "flex items-center text-xs font-bold",
                                    stats.revenueMomentum > 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {stats.revenueMomentum > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                                    {Math.abs(stats.revenueMomentum)}%
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-[10px] text-muted-foreground">
                                vs ${stats.yesterdayRevenue.toLocaleString()} (yest)
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                <span className="text-green-600 font-medium">${formatNoRound(stats.cashRevenue)}</span> cash + <span className="text-blue-600 font-medium">${formatNoRound(stats.bonusRevenue)}</span> bonus
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="shadow-sm border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('activity')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-1.5">
                            <CardTitle className="text-sm font-medium">Customer Activity</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px]">
                                        <p className="text-xs"><strong>How it's calculated:</strong> Sum of standardPlays (customer) and empPlays (staff) from the Game Report API. This represents total registered machine activity.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalPlays.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Plays</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{(stats.totalPlays / Math.max(1, machines.length)).toFixed(1)}</span> avg per machine
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-purple-500 overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-col space-y-2 pb-1 pt-3 px-3">
                        <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Last 7 Days
                            </span>
                            <FileBarChart className="h-3.5 w-3.5 text-purple-500" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {[
                                { id: 'totalPlays', label: 'Plays' },
                                { id: 'totalRevenue', label: 'Rev' },
                                { id: 'cashRevenue', label: 'Cash' },
                                { id: 'bonusRevenue', label: 'Bonus' },
                                { id: 'payouts', label: 'Wins' }
                            ].map(field => (
                                <TooltipProvider key={field.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant={selectedTrendsFields.includes(field.id) ? "secondary" : "outline"}
                                                className={cn(
                                                    "cursor-pointer text-[9px] px-1.5 py-0 h-4 border-none transition-all",
                                                    selectedTrendsFields.includes(field.id)
                                                        ? "bg-purple-100 text-purple-700 font-bold"
                                                        : "text-muted-foreground opacity-50 hover:opacity-100"
                                                )}
                                                onClick={() => {
                                                    if (selectedTrendsFields.includes(field.id)) {
                                                        if (selectedTrendsFields.length > 1) {
                                                            setSelectedTrendsFields(selectedTrendsFields.filter(f => f !== field.id));
                                                        }
                                                    } else {
                                                        setSelectedTrendsFields([...selectedTrendsFields, field.id]);
                                                    }
                                                }}
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full mr-1"
                                                    style={{ backgroundColor: getFieldColor(field.id) }}
                                                />
                                                {field.label}
                                            </Badge>
                                        </TooltipTrigger>
                                        {field.id === 'payouts' && (
                                            <TooltipContent className="text-[10px] max-w-[150px]">
                                                Wins/Payout tracking is highly relevant for Claw/Crane machines (Group 4).
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 min-h-[100px] mt-2 relative">
                        {trendLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded">
                                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide domain={['auto', 'auto']} />
                                <RechartsTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/95 backdrop-blur-sm border shadow-xl rounded-lg p-2 text-[10px] min-w-[100px]">
                                                    <p className="font-bold border-b pb-1 mb-1">{payload[0].payload.name}</p>
                                                    {payload.map((entry: any) => (
                                                        <div key={entry.dataKey} className="flex justify-between items-center gap-4 py-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                {getFieldLabel(entry.dataKey)}:
                                                            </span>
                                                            <span className="font-bold">
                                                                {(entry.dataKey === 'totalRevenue' || entry.dataKey === 'revenue' || entry.dataKey === 'cashRevenue' || entry.dataKey === 'bonusRevenue') ? '$' : ''}{entry.value?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {selectedTrendsFields.includes('totalPlays') && (
                                    <Line
                                        type="monotone"
                                        dataKey="totalPlays"
                                        name="totalPlays"
                                        stroke={getFieldColor('totalPlays')}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                )}
                                {selectedTrendsFields.includes('totalRevenue') && (
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="totalRevenue"
                                        stroke={getFieldColor('totalRevenue')}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                )}
                                {selectedTrendsFields.includes('cashRevenue') && (
                                    <Line
                                        type="monotone"
                                        dataKey="cashRevenue"
                                        name="cashRevenue"
                                        stroke={getFieldColor('cashRevenue')}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                )}
                                {selectedTrendsFields.includes('bonusRevenue') && (
                                    <Line
                                        type="monotone"
                                        dataKey="bonusRevenue"
                                        name="bonusRevenue"
                                        stroke={getFieldColor('bonusRevenue')}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                )}
                                {selectedTrendsFields.includes('payouts') && (
                                    <Line
                                        type="monotone"
                                        dataKey="payout"
                                        name="payouts"
                                        stroke={getFieldColor('payouts')}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card
                    className="shadow-sm border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('accuracy')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-1.5">
                            <CardTitle className="text-sm font-medium">Claw Attention</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px]">
                                        <p className="text-xs"><strong>Alert Scope:</strong> Showing Claw/Crane machines only based on payout status.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">
                                {stats.criticalCount}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="text-[9px] h-4 bg-rose-50 border-rose-200 text-rose-600 px-1">
                                    {stats.veryHighCount + stats.highCount} High
                                </Badge>
                                <Badge variant="outline" className="text-[9px] h-4 bg-orange-50 border-orange-200 text-orange-600 px-1">
                                    {stats.veryLowCount + stats.lowCount} Low
                                </Badge>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Review payout settings
                        </p>
                    </CardContent>
                </Card>
            </div>

            <StatDetailDialog
                type={activeStatDetail}
                machines={mergedMachines as any}
                onClose={() => setActiveStatDetail(null)}
            />

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="monitor">Monitoring</TabsTrigger>
                        <TabsTrigger value="history">Service History</TabsTrigger>
                        <TabsTrigger value="submit">Submit Report</TabsTrigger>
                        <TabsTrigger value="comparison" className="hidden sm:inline-flex">Comparison</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="monitor" className="space-y-4">
                    {/* Alert Panel */}
                    <AlertPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />

                    {/* Toolbar */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-1 gap-8 w-full sm:w-auto items-center overflow-x-auto pb-2 sm:pb-0">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search machines, staff, or remarks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>
                                <DatePickerWithRange
                                    date={dateRange}
                                    onDateChange={setDateRange}
                                    className="w-[280px]"
                                />

                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                                        <SelectTrigger className="w-[130px] h-9">
                                            <SelectValue placeholder="Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Locations</SelectItem>
                                            {locations.map(loc => (
                                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[120px] h-9">
                                            <SelectValue placeholder="Machine Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                            <SelectItem value="error">Error</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                                        <SelectTrigger className="w-[120px] h-9">
                                            <SelectValue placeholder="Payout Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Payouts</SelectItem>
                                            <SelectItem value="Very High">Very High</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="OK">OK</SelectItem>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Very Low">Very Low</SelectItem>
                                            <SelectItem value="N/A">N/A</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={sortOption} onValueChange={setSortOption}>
                                        <SelectTrigger className="w-[150px] h-9">
                                            <ArrowUpDown className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Sort By" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Default</SelectItem>
                                            <SelectItem value="payout-high">High Payout Ratio</SelectItem>
                                            <SelectItem value="payout-low">Low Payout Ratio</SelectItem>
                                            <SelectItem value="plays-high">Plays: Most To Less</SelectItem>
                                            <SelectItem value="plays-low">Plays: Less to Most</SelectItem>
                                            <SelectItem value="payouts-high">Most payout</SelectItem>
                                            <SelectItem value="payouts-low">Lowest payout</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-1 border rounded-md p-1">
                                <Button
                                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "report" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("report")}
                                >
                                    <FileBarChart className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Machine Type Sub-Tabs */}
                        <Tabs value={machineTypeTab} onValueChange={(v) => setMachineTypeTab(v as "cranes" | "other")} className="space-y-4">
                            <TabsList className="grid w-full grid-cols-2 max-w-md">
                                <TabsTrigger value="cranes" className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Claw Machines
                                    <Badge variant="secondary" className="text-[10px] ml-1">
                                        {craneMachines.length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="other" className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Other Machines
                                    <Badge variant="secondary" className="text-[10px] ml-1">
                                        {otherMachines.length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            {/* CRANE MACHINES TAB */}
                            <TabsContent value="cranes" className="space-y-4 mt-4">
                                {craneMachines.length > 0 ? (
                                    viewMode === "grid" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                            {craneMachines.map((machine) => (
                                                <MachineStatusCard
                                                    key={machine.id}
                                                    machine={machine}
                                                    onAction={(action, machine) => {
                                                        setSelectedMachineForAction(machine);
                                                        if (action === 'submit_report') {
                                                            setSelectedTab("submit");
                                                        } else if (action === 'compare') {
                                                            setSelectedTab("comparison");
                                                        } else if (action === 'quick_view') {
                                                            setQuickViewMachine(machine);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <MonitoringReportTable data={craneMachines as any} />
                                    )
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No claw machines found matching your filters</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* OTHER ARCADE MACHINES TAB */}
                            <TabsContent value="other" className="space-y-4 mt-4">
                                {otherMachines.length > 0 ? (
                                    viewMode === "grid" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                            {otherMachines.map((machine) => (
                                                <NonCraneMachineCard
                                                    key={machine.id}
                                                    machine={machine as any}
                                                    onAction={(action, machine) => {
                                                        if (action === 'quick_view') {
                                                            setQuickViewNonCraneMachine(machine as any);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <NonCraneReportTable data={otherMachines as any} />
                                    )
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No other arcade machines found matching your filters</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    <MachineQuickViewDialog
                        machine={quickViewMachine}
                        allMachines={mergedMachines as any}
                        dateRange={dateRange}
                        open={!!quickViewMachine}
                        onOpenChange={(open) => !open && setQuickViewMachine(null)}
                    />

                    <NonCraneQuickViewDialog
                        machine={quickViewNonCraneMachine as any}
                        allMachines={mergedMachines as any}
                        dateRange={dateRange}
                        open={!!quickViewNonCraneMachine}
                        onOpenChange={(open) => !open && setQuickViewNonCraneMachine(null)}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <GlobalServiceHistoryTable />
                </TabsContent>

                <TabsContent value="submit">
                    <div className="max-w-4xl mx-auto">
                        <ServiceReportForm
                            machine={(selectedMachineForAction as unknown as ArcadeMachine) || undefined}
                            onSuccess={() => {
                                setSelectedMachineForAction(null);
                                setSelectedTab("monitor");
                            }}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="comparison">
                    <MachineComparisonTable
                        machines={machines}
                        initialMachineId={selectedMachineForAction?.id}
                    />
                </TabsContent>
            </Tabs>
        </div >
    );
}
