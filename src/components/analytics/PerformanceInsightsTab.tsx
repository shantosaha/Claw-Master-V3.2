"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import {
    Trophy,
    Target,
    DollarSign,
    Activity,
    ChevronRight,
    Calendar,
    Loader2,
    TrendingUp,
    TrendingDown,
    Dumbbell,
    Search,
    ArrowUpRight,
    Users,
    Zap,
    Percent,
    X,
    Filter,
    Layers,
    LayoutGrid,
    Tag,
    Info,
    Coins,
    Wallet,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    AnalyticsOverview,
    MachinePerformance,
    TimeSeriesData,
    RevenueSource
} from "@/services/analyticsService";
import { DateRange } from "react-day-picker";

interface PerformanceInsightsTabProps {
    overview: AnalyticsOverview | null;
    machines: MachinePerformance[];
    revenueData: TimeSeriesData[];
    dateRange?: DateRange;
    onDateRangeChange?: (date: DateRange | undefined) => void;
    revenueSource?: RevenueSource;
}

export function PerformanceInsightsTab({
    overview,
    machines,
    revenueData,
    dateRange,
    onDateRangeChange,
    revenueSource = 'sales'
}: PerformanceInsightsTabProps) {

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"leaderboard" | "contribution">("leaderboard");

    // New Feature States
    const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
    const [rankingMetric, setRankingMetric] = useState<"revenue" | "cashRevenue" | "bonusRevenue">("revenue");
    const [sortConfig, setSortConfig] = useState<{ key: keyof MachinePerformance | 'yield' | 'contributionAndShare' | 'globalRank'; direction: 'asc' | 'desc' } | null>(null);

    // Updated Multiple Filters State
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [groupFilter, setGroupFilter] = useState<string>("all");
    const [subGroupFilter, setSubGroupFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    // Dynamic Options for Filters
    const uniqueLocations = useMemo(() =>
        ["all", ...Array.from(new Set(machines.map(m => m.location).filter(Boolean)))].sort()
        , [machines]);

    const uniqueGroups = useMemo(() =>
        ["all", ...Array.from(new Set(machines.map(m => m.group).filter(Boolean)))].sort()
        , [machines]);

    // Cascading Filter: Sub Group depends on Group
    const uniqueSubGroups = useMemo(() => {
        const filteredByGroup = groupFilter === "all"
            ? machines
            : machines.filter(m => m.group === groupFilter);
        return ["all", ...Array.from(new Set(filteredByGroup.map(m => m.subGroup).filter(Boolean)))].sort();
    }, [machines, groupFilter]);

    // Cascading Filter: Type depends on Group/Sub Group for better UX
    const uniqueTypes = useMemo(() => {
        let filtered = machines;
        if (groupFilter !== "all") filtered = filtered.filter(m => m.group === groupFilter);
        if (subGroupFilter !== "all") filtered = filtered.filter(m => m.subGroup === subGroupFilter);

        return ["all", ...Array.from(new Set(filtered.map(m => m.type).filter(Boolean)))].sort();
    }, [machines, groupFilter, subGroupFilter]);

    // Hall of Fame State
    const [hallOfFameOpen, setHallOfFameOpen] = useState(false);
    const [hallOfFameEnabled, setHallOfFameEnabled] = useState(false);
    const [hallOfFameRange, setHallOfFameRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all' | null>(null);
    const [loadingHallOfFame, setLoadingHallOfFame] = useState(false);
    const [allTimeBestDays, setAllTimeBestDays] = useState<{ date: string; revenue: number }[]>([]);
    const [selectedMachineForHallOfFame, setSelectedMachineForHallOfFame] = useState<MachinePerformance | null>(null);

    // Fetch "All Time" (1 Year) data for Hall of Fame
    useEffect(() => {
        if (!selectedMachineForHallOfFame || !hallOfFameOpen || !hallOfFameEnabled || !hallOfFameRange) return;

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
                            groups: selectedMachineForHallOfFame.group ? [selectedMachineForHallOfFame.group] : undefined
                        }))
                    );
                    allReports = allReports.concat(chunkReports);
                }

                // Filter for THIS machine across all days
                const myTag = selectedMachineForHallOfFame.tag ? String(selectedMachineForHallOfFame.tag).trim() : null;

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
                }).filter((d: { revenue: number }) => d.revenue > 0);

                // Find top 5 days
                const sorted = dailyBests
                    .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
                    .slice(0, 5);

                setAllTimeBestDays(sorted);
            } catch (err) {
                console.warn("Failed to fetch Hall of Fame data", err);
            } finally {
                setLoadingHallOfFame(false);
            }
        };

        fetchAllTime();
    }, [selectedMachineForHallOfFame, hallOfFameOpen, hallOfFameEnabled, hallOfFameRange]);

    const hallOfFameData = useMemo(() => {
        if (!allTimeBestDays.length) return null;

        const best = allTimeBestDays[0];
        const topDays = allTimeBestDays.map(d => ({
            time: format(new Date(d.date), 'MMM dd, yyyy'),
            revenue: d.revenue
        }));

        return {
            maxRev: best.revenue,
            bestDate: format(new Date(best.date), 'MMM dd, yyyy'),
            topDays
        };
    }, [allTimeBestDays]);

    // 1. Momentum Calculation
    const momentum = useMemo(() => {
        if (!overview) return null;
        return {
            percent: Math.round(overview.revenueChange),
            isPositive: overview.revenueChange >= 0
        };
    }, [overview]);

    // 2. Ranking & Contribution Data
    const processedMachines = useMemo(() => {
        if (!machines.length) return [];

        const totalRev = overview?.totalRevenue || machines.reduce((sum, m) => sum + (m.revenue || 0), 1);

        return [...machines]
            .map(m => ({
                ...m,
                contributionPercent: ((m.revenue || 0) / Math.max(1, totalRev)) * 100
            }))
            .sort((a, b) => (b[rankingMetric] || 0) - (a[rankingMetric] || 0)) // Sort by selected ranking metric
            .map((m, idx) => ({ ...m, globalRank: idx + 1 })); // Store rank based on selected metric
    }, [machines, overview, rankingMetric]);

    const filteredMachines = useMemo(() => {
        let result = processedMachines.filter(m => {
            // Text Search (Name, Location, or Tag)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesText =
                    m.name.toLowerCase().includes(term) ||
                    m.location.toLowerCase().includes(term) ||
                    (m.tag && m.tag.toLowerCase().includes(term));
                if (!matchesText) return false;
            }

            // High-Res Filters
            if (locationFilter !== "all" && m.location !== locationFilter) return false;
            if (groupFilter !== "all" && m.group !== groupFilter) return false;
            if (subGroupFilter !== "all" && m.subGroup !== subGroupFilter) return false;
            if (typeFilter !== "all" && m.type !== typeFilter) return false;

            return true;
        });

        // Apply Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof typeof a];
                let bValue: any = b[sortConfig.key as keyof typeof b];

                // Special handling for calculated fields
                if (sortConfig.key === 'yield') {
                    aValue = (a.revenue || 0) / Math.max(1, a.plays || 1);
                    bValue = (b.revenue || 0) / Math.max(1, b.plays || 1);
                } else if (sortConfig.key === 'contributionAndShare') {
                    aValue = a.contributionPercent;
                    bValue = b.contributionPercent;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [processedMachines, searchTerm, locationFilter, groupFilter, subGroupFilter, typeFilter, sortConfig]);

    const handleSort = (key: keyof MachinePerformance | 'yield' | 'contributionAndShare' | 'globalRank') => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' }; // Default to desc for new sort
        });
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 text-blue-500" />
            : <ArrowDown className="h-3 w-3 ml-1 text-blue-500" />;
    };





    const clearFilters = () => {
        setSearchTerm("");
        setLocationFilter("all");
        setGroupFilter("all");
        setSubGroupFilter("all");
        setTypeFilter("all");
    };

    const hasActiveFilters = searchTerm !== "" || locationFilter !== "all" || groupFilter !== "all" || subGroupFilter !== "all" || typeFilter !== "all";

    return (
        <div className="space-y-6">


            {/* Sub-Header with Dynamic Filters */}
            <div className="flex flex-col xl:flex-row gap-4 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-background p-1 px-2 rounded-lg border border-input shadow-sm min-w-[200px]">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <DatePickerWithRange
                                date={dateRange}
                                onDateChange={onDateRangeChange}
                                className="border-none shadow-none focus-visible:ring-0 p-0 h-8"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 h-10 px-3 bg-background rounded-lg border border-input shadow-sm min-w-[200px] flex-1 md:flex-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Name, Site, Tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Location Filter */}
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-[140px] h-10 bg-background">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {uniqueLocations.filter(l => l !== "all").map(loc => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Group Filter */}
                        <Select value={groupFilter} onValueChange={(v) => {
                            setGroupFilter(v);
                            setSubGroupFilter("all"); // Reset subgroup when group changes
                            setTypeFilter("all"); // Reset type when group changes
                        }}>
                            <SelectTrigger className="w-[140px] h-10 bg-background">
                                <Layers className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Groups</SelectItem>
                                {uniqueGroups.filter(g => g !== "all").map(group => (
                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sub Group Filter */}
                        <Select value={subGroupFilter} onValueChange={(v) => {
                            setSubGroupFilter(v);
                            setTypeFilter("all"); // Reset type when subgroup changes
                        }}>
                            <SelectTrigger className="w-[140px] h-10 bg-background">
                                <LayoutGrid className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Sub Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sub Groups</SelectItem>
                                {uniqueSubGroups.filter(sg => sg !== "all").map(subGroup => (
                                    <SelectItem key={subGroup} value={subGroup}>{subGroup}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Type Filter - Shown specifically when group starts with '4' or contains 'crane' */}
                        {(groupFilter.toLowerCase().includes("crane") || groupFilter.toLowerCase().includes("4-")) && (
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-background">
                                    <Tag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {uniqueTypes.filter(t => t !== "all").map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Tables */}
            <Card className="border-muted/20 shadow-xl overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-bold">Deep Performance Analysis</CardTitle>
                                <Badge variant="secondary" className="bg-blue-500 text-white border-none animate-pulse">Live</Badge>
                            </div>
                            <CardDescription>Comprehensive machine-level performance breakdown</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Revenue Ranking Filter */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Rank By</span>
                                <Select value={rankingMetric} onValueChange={(v: any) => setRankingMetric(v)}>
                                    <SelectTrigger className="h-8 w-[120px] bg-background text-[11px] font-bold border-muted-foreground/20">
                                        <SelectValue placeholder="Rank By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="revenue" className="text-[11px]">Total Revenue</SelectItem>
                                        <SelectItem value="cashRevenue" className="text-[11px]">Cash Revenue</SelectItem>
                                        <SelectItem value="bonusRevenue" className="text-[11px]">Bonus Revenue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Revenue Breakdown Toggle */}
                            <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-lg h-10 shadow-sm">
                                <Checkbox
                                    id="show-breakdown"
                                    checked={showRevenueBreakdown}
                                    onCheckedChange={(v) => setShowRevenueBreakdown(!!v)}
                                />
                                <Label htmlFor="show-breakdown" className="text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                                    <Coins className="h-3 w-3 text-emerald-600" />
                                    Show Cash/Bonus Split
                                </Label>
                            </div>

                            <div className="flex bg-muted p-1 rounded-lg border h-10 items-center">
                                <button
                                    onClick={() => setActiveTab("leaderboard")}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                        activeTab === "leaderboard" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Leaderboard
                                </button>
                                <button
                                    onClick={() => setActiveTab("contribution")}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                        activeTab === "contribution" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Contribution
                                </button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('globalRank')}>
                                        <div className="flex items-center">
                                            Rank <SortIcon column="globalRank" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">
                                            Machine Name <SortIcon column="name" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('location')}>
                                        <div className="flex items-center">
                                            Categorization <SortIcon column="location" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('revenue')}>
                                        <div className="flex flex-col items-end group">
                                            <div className="flex items-center">
                                                Revenue <SortIcon column="revenue" />
                                            </div>
                                            <span className="text-[8px] opacity-40">({rankingMetric.replace('Revenue', '') || 'Total'})</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('plays')}>
                                        <div className="flex items-center justify-end">
                                            Plays <SortIcon column="plays" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('winRate')}>
                                        <div className="flex items-center justify-end gap-1">
                                            Win Rate <SortIcon column="winRate" />
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 text-white border-slate-800 max-w-xs">
                                                        <p className="font-bold mb-1 underline mt-1">Win Rate Definition</p>
                                                        <p className="text-[10px] leading-relaxed">
                                                            The percentage of successful prize payouts relative to total traffic flow.
                                                            <br /><br />
                                                            <span className="font-mono bg-white/10 px-1 rounded">Calculation: (Wins / Total Plays) × 100</span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </th>
                                    {activeTab === "contribution" && <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('contributionAndShare')}>
                                        <div className="flex items-center justify-end">
                                            Share <SortIcon column="contributionAndShare" />
                                        </div>
                                    </th>}
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('yield')}>
                                        <div className="flex items-center justify-end gap-1">
                                            Yield <SortIcon column="yield" />
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 text-white border-slate-800 max-w-xs">
                                                        <p className="font-bold mb-1 underline mt-1">Yield Definition</p>
                                                        <p className="text-[10px] leading-relaxed">
                                                            Average Revenue Per Play (RPP). Measures the economic density of each session.
                                                            <br /><br />
                                                            <span className="font-mono bg-white/10 px-1 rounded">Calculation: Total Revenue / Total Plays</span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredMachines.length > 0 ? filteredMachines.map((m) => (
                                    <tr key={m.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold",
                                                m.globalRank === 1 ? "bg-yellow-500 text-white" :
                                                    m.globalRank === 2 ? "bg-slate-300 text-slate-700" :
                                                        m.globalRank === 3 ? "bg-amber-600/70 text-white" :
                                                            "bg-muted text-muted-foreground"
                                            )}>
                                                {m.globalRank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
                                            setSelectedMachineForHallOfFame(m);
                                            setHallOfFameOpen(true);
                                            setHallOfFameEnabled(true);
                                            setHallOfFameRange('1m');
                                        }}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="underline underline-offset-4 decoration-muted-foreground/30">{m.name}</span>
                                                    {m.tag && <Badge variant="secondary" className="h-4 px-1 text-[9px] font-mono bg-indigo-50 text-indigo-700 border-indigo-100">Tag {m.tag}</Badge>}
                                                </div>
                                                <Badge variant="outline" className="w-fit text-[9px] px-1 py-0 h-4 mt-1 opacity-50 font-mono">#{m.id.substring(0, 8)}</Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-muted-foreground font-medium">{m.location}</span>
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    {m.group && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-muted/50 uppercase border-none">{m.group}</Badge>}
                                                    {m.subGroup && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-muted/50 uppercase border-none">{m.subGroup}</Badge>}
                                                    {m.type && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-muted/50 uppercase border-none">{m.type}</Badge>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!showRevenueBreakdown ? (
                                                <span className="font-bold text-blue-600 text-base tabular-nums">
                                                    ${(m[rankingMetric] || 0).toLocaleString()}
                                                </span>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-blue-600 text-sm">${(m.revenue || 0).toLocaleString()}</span>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Total</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-[10px] font-bold text-emerald-700">${(m.cashRevenue || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                            <span className="text-[10px] font-bold text-indigo-700">${(m.bonusRevenue || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-foreground">{(m.plays || 0).toLocaleString()}</span>
                                                <span className="text-[9px] text-muted-foreground">plays total</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {m.group?.toLowerCase().includes("crane") ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={cn(
                                                        "font-bold",
                                                        m.winRate > 15 ? "text-red-500" : m.winRate < 5 ? "text-blue-500" : "text-emerald-500"
                                                    )}>
                                                        {(m.winRate || 0).toFixed(1)}%
                                                    </span>
                                                    <div className="w-12 h-1 bg-muted rounded-full hidden sm:block">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full",
                                                                m.winRate > 15 ? "bg-red-500" : m.winRate < 5 ? "bg-blue-500" : "bg-emerald-500"
                                                            )}
                                                            style={{ width: `${Math.min(100, (m.winRate || 0) * 3)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end pr-4 text-muted-foreground/30 text-xs font-mono">-</div>
                                            )}
                                        </td>
                                        {activeTab === "contribution" && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{(m.contributionPercent || 0).toFixed(1)}%</span>
                                                    <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-slate-500 rounded-full"
                                                            style={{ width: `${m.contributionPercent || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold">
                                                <ArrowUpRight className="h-3 w-3" />
                                                ${((m.revenue || 0) / Math.max(1, m.plays || 1)).toFixed(2)}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No machines found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border-purple-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-purple-700/70 tracking-widest">Active Fleet</p>
                            <h3 className="text-xl font-bold">{overview?.activeMachines || 0} / {(overview?.activeMachines || 0) + (overview?.offlineMachines || 0)} Units</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-blue-700/70 tracking-widest">Global Payout</p>
                            <h3 className="text-xl font-bold">{overview?.winRate}% Avg Rate</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Percent className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-700/70 tracking-widest">Profit Margin</p>
                            <h3 className="text-xl font-bold">22.4% Est. Net</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hall of Fame Dialog */}
            <Dialog open={hallOfFameOpen} onOpenChange={setHallOfFameOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Hall of Fame
                            </div>
                            {selectedMachineForHallOfFame && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    {selectedMachineForHallOfFame.name}
                                </Badge>
                            )}
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
                        ) : hallOfFameData?.topDays.length === 0 || !hallOfFameData ? (
                            <div className="py-8 text-center">
                                <p className="text-xs text-muted-foreground italic">No revenue days found for this range</p>
                            </div>
                        ) : (
                            hallOfFameData?.topDays.map((day, i) => (
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
        </div>
    );
}
