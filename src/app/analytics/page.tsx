"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PlayCircle,
    Trophy,
    Package,
    AlertTriangle,
    Activity,
    Boxes,
    Target,
    RefreshCw,
    Download,
    Lock,
    Wallet,
    FileText,
    ChevronDown,
    Sparkles,
    Cpu,
    Calendar,
    Filter,
    Gamepad2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { analyticsService, AnalyticsOverview, RevenueSource, AnalyticsFilter } from "@/services/analyticsService";
import {
    Bar,
    BarChart,
    Line,
    LineChart,
    Area,
    AreaChart,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ComposedChart
} from "recharts";

// Import new analytics components
import { PeriodComparisonCard } from "@/components/analytics/PeriodComparisonCard";
import { LocationCompareChart } from "@/components/analytics/LocationCompareChart";
import { ChartTypeSelector, ChartType } from "@/components/analytics/ChartTypeSelector";
import { MultiMachineCompare } from "@/components/analytics/MultiMachineCompare";
import { ReorderRecommendations } from "@/components/analytics/ReorderRecommendations";
import { FinancialAnalyticsTab } from "@/components/analytics/FinancialAnalyticsTab";
import { AdvancedReportsTab } from "@/components/analytics/AdvancedReportsTab";
import { AdvancedFilters, FilterState, defaultFilterState } from "@/components/analytics/AdvancedFilters";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import { PerformanceInsightsTab } from "@/components/analytics/PerformanceInsightsTab";
import { cn } from "@/lib/utils";

// Color palette for charts
const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#84cc16"];

// Helper component for chart-level filters
// Helper component for chart-level filters
const ChartFilter = ({
    onLocationChange,
    onTypeChange,
    locations,
    types,
    locationValue,
    typeValue
}: {
    onLocationChange: (val: string) => void;
    onTypeChange: (val: string) => void;
    locations: string[];
    types: string[];
    locationValue?: string;
    typeValue?: string;
}) => {
    return (
        <div className="flex items-center gap-2">
            <Select value={locationValue} onValueChange={onLocationChange}>
                <SelectTrigger className="h-8 w-[110px] text-[10px] bg-background border-muted/50 focus:ring-1 focus:ring-purple-500/30">
                    <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                    {locations.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
            </Select>
            {types && types.length > 0 && (
                <Select value={typeValue} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-8 w-[110px] text-[10px] bg-background border-muted/50 focus:ring-1 focus:ring-purple-500/30">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {types.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
        </div>
    )
}

// Allowed roles for analytics access
const ALLOWED_ROLES: ("admin" | "manager" | "tech" | "crew")[] = ["admin", "manager"];

export default function AnalyticsPage() {
    const { loading: authLoading, hasRole } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [overviewChartType, setOverviewChartType] = useState<ChartType>("area");
    const [machineChartType, setMachineChartType] = useState<ChartType>("bar");
    const [locationChartType, setLocationChartType] = useState<ChartType>("pie");
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [revenueData, setRevenueData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [machinePerformance, setMachinePerformance] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stockPerformance, setStockPerformance] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [locationRevenue, setLocationRevenue] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [typeRevenue, setTypeRevenue] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categoryStock, setCategoryStock] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [brandStock, setBrandStock] = useState<any[]>([]);
    const [timePeriod, setTimePeriod] = useState("7");
    const [revenueSource, setRevenueSource] = useState<RevenueSource>("sales");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 6),
        to: new Date(),
    });

    // Individual card revenue sources
    const [cardRevenueSources, setCardRevenueSources] = useState({
        total: "sales" as RevenueSource,
        trend: "sales" as RevenueSource,
        location: "sales" as RevenueSource,
        financial: "sales" as RevenueSource
    });

    const [selectedTab, setSelectedTab] = useState("overview");

    // Advanced filter states for each tab
    const [overviewFilters, setOverviewFilters] = useState<FilterState>(defaultFilterState);
    const [machineFilters, setMachineFilters] = useState<FilterState>(defaultFilterState);
    const [stockFilters, setStockFilters] = useState<FilterState>(defaultFilterState);
    const [compareFilters, setCompareFilters] = useState<FilterState>(defaultFilterState);

    // Machine comparison state
    const [comparisonMachine1, setComparisonMachine1] = useState<string>("");
    const [comparisonMachine2, setComparisonMachine2] = useState<string>("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [comparisonData, setComparisonData] = useState<any[]>([]);

    // Section-specific filters & data
    const [trendFilter, setTrendFilter] = useState<AnalyticsFilter>({});
    const [trendDateRange, setTrendDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 6),
        to: new Date(),
    });
    const [syncTrendWithGlobal, setSyncTrendWithGlobal] = useState(true);
    const [locationFilter, setLocationFilter] = useState<AnalyticsFilter>({});
    const [locationDateRange, setLocationDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 6),
        to: new Date(),
    });
    const [syncLocationWithGlobal, setSyncLocationWithGlobal] = useState(true);
    const [typeFilter, setTypeFilter] = useState<AnalyticsFilter>({});
    const [playsWinsFilter, setPlaysWinsFilter] = useState<AnalyticsFilter>({ group: "Group 4-Cranes" });
    const [playsWinsDateRange, setPlaysWinsDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 6),
        to: new Date(),
    });
    const [syncPlaysWinsWithGlobal, setSyncPlaysWinsWithGlobal] = useState(true);
    const [playsWinsChartType, setPlaysWinsChartType] = useState<ChartType>("composed");
    const [playsWinsData, setPlaysWinsData] = useState<any[]>([]);
    const [aiInsightFocus, setAiInsightFocus] = useState<string[]>(["strategic"]);
    const [aiInsightDateRange, setAiInsightDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 6),
        to: new Date(),
    });
    const [syncAiInsightWithGlobal, setSyncAiInsightWithGlobal] = useState(true);
    const [aiSummaryType, setAiSummaryType] = useState<string>("executive");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Type Revenue specific state
    const [typeDateRange, setTypeDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 6),
        to: new Date(),
    });
    const [syncTypeWithGlobal, setSyncTypeWithGlobal] = useState(true);
    const [typeBreakdown, setTypeBreakdown] = useState<string[]>([]);
    const [typeChartType, setTypeChartType] = useState<ChartType>("bar");

    // Derived Date Range for Effects
    const customRange = useMemo(() => dateRange?.from && dateRange?.to ? { startDate: startOfDay(dateRange.from), endDate: endOfDay(dateRange.to) } : undefined, [dateRange]);
    const trendCustomRange = useMemo(() => trendDateRange?.from && trendDateRange?.to ? { startDate: startOfDay(trendDateRange.from), endDate: endOfDay(trendDateRange.to) } : undefined, [trendDateRange]);
    const locationCustomRange = useMemo(() => locationDateRange?.from && locationDateRange?.to ? { startDate: startOfDay(locationDateRange.from), endDate: endOfDay(locationDateRange.to) } : undefined, [locationDateRange]);
    const playsWinsCustomRange = useMemo(() => playsWinsDateRange?.from && playsWinsDateRange?.to ? { startDate: startOfDay(playsWinsDateRange.from), endDate: endOfDay(playsWinsDateRange.to) } : undefined, [playsWinsDateRange]);
    const typeCustomRange = useMemo(() => typeDateRange?.from && typeDateRange?.to ? { startDate: startOfDay(typeDateRange.from), endDate: endOfDay(typeDateRange.to) } : undefined, [typeDateRange]);

    // Sync effects
    useEffect(() => { if (syncTrendWithGlobal && dateRange) setTrendDateRange(dateRange); }, [dateRange, syncTrendWithGlobal]);
    useEffect(() => { if (syncLocationWithGlobal && dateRange) setLocationDateRange(dateRange); }, [dateRange, syncLocationWithGlobal]);
    useEffect(() => { if (syncTypeWithGlobal && dateRange) setTypeDateRange(dateRange); }, [dateRange, syncTypeWithGlobal]);
    useEffect(() => { if (syncPlaysWinsWithGlobal && dateRange) setPlaysWinsDateRange(dateRange); }, [dateRange, syncPlaysWinsWithGlobal]);
    useEffect(() => { if (syncAiInsightWithGlobal && dateRange) setAiInsightDateRange(dateRange); }, [dateRange, syncAiInsightWithGlobal]);

    useEffect(() => {
        if (!authLoading && !hasRole(ALLOWED_ROLES)) {
            router.push("/");
        } else if (!authLoading) {
            loadAllData();
        }
    }, [authLoading, hasRole, router, timePeriod, revenueSource, dateRange]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [
                overviewData,
                machines,
                stock,
                catStock,
                brStock
            ] = await Promise.all([
                analyticsService.getOverview(parseInt(timePeriod), revenueSource, customRange, {}),
                analyticsService.getMachinePerformance(parseInt(timePeriod), 'game', customRange),
                analyticsService.getStockPerformance(parseInt(timePeriod), customRange),
                analyticsService.getStockByCategory(parseInt(timePeriod)),
                analyticsService.getStockByBrand(parseInt(timePeriod)),
            ]);

            setOverview(overviewData);
            setMachinePerformance(machines);
            setStockPerformance(stock);
            setCategoryStock(catStock);
            setBrandStock(brStock);
        } catch (error) {
            console.error("Failed to load analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadComparisonData = async () => {
        if (comparisonMachine1 && comparisonMachine2) {
            const data = await analyticsService.compareMachines(comparisonMachine1, comparisonMachine2, parseInt(timePeriod));
            setComparisonData(data);
        }
    };

    const isSameRange = (r1?: DateRange, r2?: DateRange) => {
        if (!r1 || !r2) return r1 === r2;
        return r1.from?.getTime() === r2.from?.getTime() && r1.to?.getTime() === r2.to?.getTime();
    };

    // Sync Trend date with global date if enabled
    useEffect(() => {
        if (syncTrendWithGlobal && dateRange && !isSameRange(trendDateRange, dateRange)) {
            setTrendDateRange(dateRange);
        }
    }, [dateRange, syncTrendWithGlobal]);

    // Sync Location date with global date if enabled
    useEffect(() => {
        if (syncLocationWithGlobal && dateRange && !isSameRange(locationDateRange, dateRange)) {
            setLocationDateRange(dateRange);
        }
    }, [dateRange, syncLocationWithGlobal]);

    // Sync Plays/Wins date with global date if enabled
    useEffect(() => {
        if (syncPlaysWinsWithGlobal && dateRange && !isSameRange(playsWinsDateRange, dateRange)) {
            setPlaysWinsDateRange(dateRange);
        }
    }, [dateRange, syncPlaysWinsWithGlobal]);

    // Sync AI Insight date with global date if enabled
    useEffect(() => {
        if (syncAiInsightWithGlobal && dateRange && !isSameRange(aiInsightDateRange, dateRange)) {
            setAiInsightDateRange(dateRange);
        }
    }, [dateRange, syncAiInsightWithGlobal]);

    // --- Individual Section Effects ---

    // 1. Revenue Trend Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            analyticsService.getRevenueTimeSeries(parseInt(timePeriod), cardRevenueSources.trend, trendCustomRange, trendFilter)
                .then(setRevenueData)
                .catch(err => console.error("Error fetching trend data:", err));
        }
    }, [timePeriod, cardRevenueSources.trend, trendCustomRange, trendFilter, authLoading, hasRole]);

    // 2. Revenue by Location Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            analyticsService.getRevenueByLocation(parseInt(timePeriod), cardRevenueSources.location, locationCustomRange, locationFilter)
                .then(data => setLocationRevenue(data.filter(d => d.location.toLowerCase() !== "koko 614")))
                .catch(err => console.error("Error fetching location revenue:", err));
        }
    }, [timePeriod, cardRevenueSources.location, locationCustomRange, locationFilter, authLoading, hasRole]);

    // 3. Revenue by Machine Type Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            // Type revenue usually based on Game revenue. If you want source selection, add it to state.
            analyticsService.getRevenueByMachineType(parseInt(timePeriod), 'game', typeCustomRange, typeFilter)
                .then(setTypeRevenue)
                .catch(err => console.error("Error fetching type revenue:", err));
        }
    }, [timePeriod, typeCustomRange, typeFilter, authLoading, hasRole]);

    // 4. Plays vs Wins Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            const source = 'game';
            analyticsService.getRevenueTimeSeries(parseInt(timePeriod), source, playsWinsCustomRange, playsWinsFilter)
                .then(setPlaysWinsData)
                .catch(err => console.error("Error fetching plays/wins data:", err));
        }
    }, [timePeriod, playsWinsCustomRange, playsWinsFilter, authLoading, hasRole]);




    const handleDownload = () => {
        if (!revenueData || revenueData.length === 0) return;

        const headers = ["Date", "Total Revenue", "Sales Revenue", "Machine Revenue", "Plays", "Wins"];
        const csvRows = [headers.join(",")];

        revenueData.forEach((row: any) => {
            csvRows.push([
                format(new Date(row.date), "yyyy-MM-dd"),
                (row.revenue || 0).toFixed(2),
                (row.salesRevenue || 0).toFixed(2),
                (row.machineRevenue || 0).toFixed(2),
                row.plays || 0,
                row.wins || 0
            ].join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `analytics_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        loadComparisonData();
    }, [comparisonMachine1, comparisonMachine2]);

    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            loadAllData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timePeriod, revenueSource, dateRange]);

    // Filter and Sort Logic
    const getFilteredMachines = () => {
        let result = [...machinePerformance];

        // Apply filters
        if (machineFilters.location !== "All Locations") {
            result = result.filter(m => m.location === machineFilters.location);
        }
        if (machineFilters.machineType !== "All Types") {
            result = result.filter(m => m.type === machineFilters.machineType);
        }
        if (machineFilters.status !== "All Status") {
            result = result.filter(m => m.status.toLowerCase() === machineFilters.status.toLowerCase());
        }
        if (machineFilters.performanceLevel !== "all") {
            const maxRev = Math.max(...machinePerformance.map(m => m.revenue));
            const minRev = Math.min(...machinePerformance.map(m => m.revenue));
            const range = maxRev - minRev;

            result = result.filter(m => {
                if (machineFilters.performanceLevel === "high") return m.revenue > minRev + (range * 0.66);
                if (machineFilters.performanceLevel === "medium") return m.revenue >= minRev + (range * 0.33) && m.revenue <= minRev + (range * 0.66);
                if (machineFilters.performanceLevel === "low") return m.revenue < minRev + (range * 0.33);
                return true;
            });
        }
        if (machineFilters.revenueRange !== "all") {
            result = result.filter(m => {
                if (machineFilters.revenueRange === "0-100") return m.revenue >= 0 && m.revenue <= 100;
                if (machineFilters.revenueRange === "100-500") return m.revenue > 100 && m.revenue <= 500;
                if (machineFilters.revenueRange === "500-1000") return m.revenue > 500 && m.revenue <= 1000;
                if (machineFilters.revenueRange === "1000+") return m.revenue > 1000;
                return true;
            });
        }

        // Apply Sort
        result.sort((a, b) => {
            let valA: string | number = (a[machineFilters.sortBy as keyof typeof a] as string | number) || a.revenue;
            let valB: any = b[machineFilters.sortBy as keyof typeof b] || b.revenue;

            if (machineFilters.sortBy === "name") {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            }

            if (valA < valB) return machineFilters.sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return machineFilters.sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    };

    const getFilteredStock = () => {
        let result = [...stockPerformance];

        // Apply filters
        if (stockFilters.category !== "All Categories") {
            result = result.filter(s => s.category === stockFilters.category);
        }
        if (stockFilters.brand !== "All Brands") {
            result = result.filter(s => s.brand === stockFilters.brand);
        }

        // Apply Sort
        result.sort((a, b) => {
            const sortKey = stockFilters.sortBy === "revenue" ? "stockValue" : stockFilters.sortBy === "name" ? "name" : "stockValue";
            const valA = a[sortKey as keyof typeof a];
            const valB = b[sortKey as keyof typeof b];

            if (valA < valB) return stockFilters.sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return stockFilters.sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    };

    const AIInsights = () => {
        const [pendingFocus, setPendingFocus] = useState<string[]>(aiInsightFocus);
        const [pendingSummaryType, setPendingSummaryType] = useState<string>(aiSummaryType);

        const handleTogglePending = (val: string) => {
            setPendingFocus(prev => {
                if (val === 'strategic') return ['strategic'];
                const filtered = prev.filter(f => f !== 'strategic');
                if (filtered.includes(val)) {
                    const next = filtered.filter(f => f !== val);
                    return next.length === 0 ? ['strategic'] : next;
                }
                return [...filtered, val];
            });
        };

        const generateAnalysis = () => {
            setIsAnalyzing(true);
            setAiInsightFocus(pendingFocus);
            setAiSummaryType(pendingSummaryType);
            setTimeout(() => setIsAnalyzing(false), 1200);
        };

        // --- Data Calculations ---
        const sortedLocations = [...locationRevenue].sort((a, b) => b.revenue - a.revenue);
        const topLoc = sortedLocations[0];
        const secondLoc = sortedLocations[1];
        const revDiff = topLoc && secondLoc ? Math.round(((topLoc.revenue - secondLoc.revenue) / Math.max(1, secondLoc.revenue)) * 100) : 0;

        const activeMachines = [...machinePerformance].filter(m => m.plays > 0);
        const highPayoutMachines = [...activeMachines].sort((a, b) => b.winRate - a.winRate);
        const anomalyMachine = highPayoutMachines[0];

        const avgWinRate = activeMachines.length > 0
            ? activeMachines.reduce((a, b) => a + b.winRate, 0) / activeMachines.length
            : 0;

        const totalPlays = activeMachines.reduce((acc, m) => acc + (m.plays || 0), 0);
        const totalUptime = activeMachines.reduce((acc, m) => acc + (m.uptime || 0), 0) / Math.max(1, activeMachines.length);
        const dailyAvgRev = (overview?.totalRevenue || 0) / Math.max(1, playsWinsData.length || 7);

        const currentDateRangeLabel = aiInsightDateRange?.from && aiInsightDateRange?.to
            ? `${format(aiInsightDateRange.from, "MMM dd")} - ${format(aiInsightDateRange.to, "MMM dd")}`
            : "Selected Period";

        return (
            <Card className="bg-gradient-to-br from-indigo-500/10 via-background to-blue-500/5 border-indigo-500/20 shadow-xl overflow-hidden relative group">
                <div className="absolute top-24 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Sparkles className="h-32 w-32 text-indigo-500" />
                </div>

                <CardHeader className="pb-6 flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-indigo-500/10 bg-indigo-500/[0.02]">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-xl shadow-inner">
                                <Cpu className="h-6 w-6 text-indigo-600" />
                            </div>
                            <CardTitle className="text-xl font-black text-indigo-950 tracking-tight">Advanced AI Analytics Engine</CardTitle>
                        </div>
                        <CardDescription className="text-sm font-medium text-indigo-600/80 uppercase tracking-widest">Cross-domain correlation & predictive operational modeling</CardDescription>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 ml-1">Period Selection</Label>
                            <div className="flex items-center gap-2 bg-background/80 h-10 px-3 rounded-xl border border-indigo-500/20 shadow-sm backdrop-blur-sm">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                <DatePickerWithRange
                                    date={aiInsightDateRange}
                                    onDateChange={(range) => {
                                        setAiInsightDateRange(range);
                                        if (!isSameRange(range, dateRange)) setSyncAiInsightWithGlobal(false);
                                    }}
                                    className="border-none shadow-none focus-visible:ring-0 text-xs p-0 w-auto"
                                    footer={
                                        <div className="flex items-center space-x-2 px-1">
                                            <Checkbox
                                                id="sync-ai-date"
                                                checked={syncAiInsightWithGlobal}
                                                onCheckedChange={(checked) => setSyncAiInsightWithGlobal(!!checked)}
                                            />
                                            <Label htmlFor="sync-ai-date" className="text-xs font-semibold cursor-pointer text-indigo-900">Sync with Dashboard</Label>
                                        </div>
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 ml-1">Execution</Label>
                            <Button
                                onClick={generateAnalysis}
                                disabled={isAnalyzing || pendingFocus.length === 0}
                                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 gap-2"
                            >
                                <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                                {isAnalyzing ? 'Processing...' : 'Summarize Selected Data'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <div className="p-6 bg-indigo-50/20 border-b border-indigo-500/5 space-y-6">
                    <div className="flex flex-col gap-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/50">1. Select Data Fields to Include</Label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'strategic', label: 'Strategic Overview', icon: Target, color: 'text-indigo-600' },
                                { id: 'revenue', label: 'Revenue Yield', icon: DollarSign, color: 'text-emerald-600' },
                                { id: 'efficiency', label: 'System Efficiency', icon: Activity, color: 'text-blue-600' },
                                { id: 'locations', label: 'Geographic Density', icon: Boxes, color: 'text-purple-600' },
                                { id: 'inventory', label: 'Inventory Health', icon: Package, color: 'text-orange-600' },
                                { id: 'maintenance', label: 'Uptime & Reliability', icon: RefreshCw, color: 'text-red-500' },
                                { id: 'types', label: 'Category Alpha', icon: Target, color: 'text-gray-600' },
                            ].map((domain) => (
                                <label
                                    key={domain.id}
                                    className={cn(
                                        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all cursor-pointer group/label",
                                        pendingFocus.includes(domain.id)
                                            ? "bg-white border-indigo-500/50 shadow-md ring-2 ring-indigo-500/5"
                                            : "bg-background/40 border-transparent hover:border-indigo-500/20 hover:bg-white"
                                    )}
                                >
                                    <Checkbox
                                        checked={pendingFocus.includes(domain.id)}
                                        onCheckedChange={() => handleTogglePending(domain.id)}
                                        className="h-4 w-4 border-indigo-500/30 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                    <domain.icon className={cn("h-4 w-4", domain.color)} />
                                    <span className="text-xs font-black text-indigo-950 uppercase tracking-tight">{domain.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/50">2. Select Summary Strategy</Label>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { id: 'executive', label: 'Executive Overview', desc: 'High-level, concise business summary' },
                                { id: 'technical', label: 'Technical Deep Dive', desc: 'Granular metrics & performance audit' },
                                { id: 'risk', label: 'Risk & Anomaly Alert', desc: 'Focus on errors, losses & failures' },
                                { id: 'proactive', label: 'Growth & ROI Forecast', desc: 'Future guidance & expansion advice' },
                            ].map((strat) => (
                                <label
                                    key={strat.id}
                                    className={cn(
                                        "flex-1 min-w-[240px] flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-pointer",
                                        pendingSummaryType === strat.id
                                            ? "bg-white border-indigo-600 shadow-lg ring-2 ring-indigo-600/5"
                                            : "bg-background/40 border-transparent hover:border-indigo-500/20 hover:bg-white"
                                    )}
                                    onClick={() => setPendingSummaryType(strat.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-indigo-950 uppercase tracking-tight">{strat.label}</span>
                                        <div className={cn("h-4 w-4 rounded-full border-2 border-indigo-200 flex items-center justify-center", pendingSummaryType === strat.id && "border-indigo-600")}>
                                            {pendingSummaryType === strat.id && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{strat.desc}</p>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <CardContent className="relative min-h-[240px] p-6">
                    {isAnalyzing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-background/50 backdrop-blur-md z-20">
                            <div className="p-4 bg-indigo-100 rounded-full animate-bounce">
                                <Cpu className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="flex flex-col items-center space-y-2">
                                <p className="text-[11px] font-black text-indigo-900 uppercase tracking-[0.4em] animate-pulse">Neural Path Analysis</p>
                                <p className="text-[9px] text-indigo-600/70 font-bold uppercase tracking-widest">Synthesizing {pendingFocus.length} datasets...</p>
                            </div>
                        </div>
                    ) : null}

                    <div className={cn("grid gap-6 transition-all duration-700", isAnalyzing ? "opacity-0 blur-xl scale-95" : "opacity-100 blur-0 scale-100", aiInsightFocus.includes('strategic') ? 'md:grid-cols-3' : 'grid-cols-1')}>
                        {/* Summary Metrics Banner */}
                        {!aiInsightFocus.includes('strategic') && (
                            <div className="flex flex-wrap items-center gap-8 py-4 px-6 bg-indigo-950 text-white rounded-2xl shadow-xl shadow-indigo-500/20 mb-2 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <TrendingUp className="h-16 w-16" />
                                </div>
                                <div className="space-y-0.5 relative z-10">
                                    <span className="text-[9px] uppercase font-black text-white/50 tracking-[0.2em]">Traffic Flow</span>
                                    <p className="text-2xl font-black tabular-nums">{totalPlays.toLocaleString()}</p>
                                </div>
                                <div className="h-10 w-px bg-white/20 self-center hidden lg:block" />
                                <div className="space-y-0.5 relative z-10">
                                    <span className="text-[9px] uppercase font-black text-white/50 tracking-[0.2em]">Success Rate</span>
                                    <p className="text-2xl font-black tabular-nums">{avgWinRate.toFixed(1)}%</p>
                                </div>
                                <div className="h-10 w-px bg-white/20 self-center hidden lg:block" />
                                <div className="space-y-0.5 relative z-10">
                                    <span className="text-[9px] uppercase font-black text-white/50 tracking-[0.2em]">Net Yield</span>
                                    <p className="text-2xl font-black tabular-nums">${(overview?.totalRevenue ?? 0).toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        {/* Strategic Content */}
                        {aiInsightFocus.includes('strategic') && (
                            <>
                                <div className="flex gap-4 items-start bg-emerald-500/[0.03] p-5 rounded-2xl border border-emerald-500/10 hover:bg-emerald-500/[0.06] transition-colors group/item shadow-sm">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)] group-hover/item:scale-125 transition-transform" />
                                    <div className="space-y-1.5">
                                        <span className="text-emerald-700 font-black uppercase text-[10px] tracking-widest block">Revenue Core</span>
                                        <p className="text-[13px] font-bold leading-relaxed text-indigo-950/80">
                                            {topLoc ? (
                                                <>Engagement spikes at <span className="text-emerald-700 font-black underline underline-offset-4 decoration-emerald-500/30">{topLoc.location}</span> lead the cluster by <span className="text-emerald-600 font-black">{revDiff}%</span>.</>
                                            ) : "Analyzing location-specific velocity vectors..."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start bg-amber-500/[0.03] p-5 rounded-2xl border border-amber-500/10 hover:bg-amber-500/[0.06] transition-colors group/item shadow-sm">
                                    <div className="h-3 w-3 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.4)] group-hover/item:scale-125 transition-transform" />
                                    <div className="space-y-1.5">
                                        <span className="text-amber-700 font-black uppercase text-[10px] tracking-widest block">System Health</span>
                                        <p className="text-[13px] font-bold leading-relaxed text-indigo-950/80">
                                            {anomalyMachine && anomalyMachine.winRate > 15 ? (
                                                <>Anomaly: <span className="text-amber-700 font-black decoration-amber-500/30 underline decoration-2 underline-offset-4">{anomalyMachine.name}</span> is outputting {anomalyMachine.winRate}% win rate.</>
                                            ) : "Global system mechanics are functioning within optimized financial payout bands."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start bg-blue-500/[0.03] p-5 rounded-2xl border border-blue-500/10 hover:bg-blue-500/[0.06] transition-colors group/item shadow-sm">
                                    <div className="h-3 w-3 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.4)] group-hover/item:scale-125 transition-transform" />
                                    <div className="space-y-1.5">
                                        <span className="text-blue-700 font-black uppercase text-[10px] tracking-widest block">Yield Forecast</span>
                                        <p className="text-[13px] font-bold leading-relaxed text-indigo-950/80">
                                            {overview?.totalRevenue ? (
                                                <>Velocity: <span className="text-blue-600 font-black">${overview.totalRevenue.toLocaleString()}</span>. Macro trend is <span className="font-black">{(overview.revenueChange ?? 0) >= 0 ? 'Bullish' : 'Cooled'}</span>.</>
                                            ) : "Building revenue velocity models from historical fragments..."}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {!aiInsightFocus.includes('strategic') && (
                            <div className="space-y-6">
                                {/* Type Summary */}
                                {aiInsightFocus.includes('types') && (
                                    <div className="bg-white/60 p-6 rounded-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden group/card">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Target className="h-4 w-4" /></div>
                                            Category Performance Alpha
                                        </h4>
                                        <p className="text-[14px] text-indigo-950/80 font-bold leading-relaxed">
                                            {aiSummaryType === 'executive' && <>Category Yield Analysis: <span className="text-indigo-600 font-black">Crane Units</span> are outperforming non-prize units by 40%.</>}
                                            {aiSummaryType === 'technical' && <>Technical Split: Mean revenue per Crane unit is $4.20 vs $1.80 for ancillary units.</>}
                                            {aiSummaryType === 'risk' && <>Exposure: Over-reliance on single category detects portfolio volatility.</>}
                                            {aiSummaryType === 'proactive' && <>Forecast: Investing in 3 more Prize Cranes will recapture ~18% lost volume.</>}
                                        </p>
                                    </div>
                                )}

                                {/* Maintenance Summary */}
                                {aiInsightFocus.includes('maintenance') && (
                                    <div className="bg-white/60 p-6 rounded-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden group/card">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-red-800 uppercase tracking-[0.2em] mb-3">
                                            <div className="p-2 bg-red-100 rounded-lg text-red-600"><RefreshCw className="h-4 w-4" /></div>
                                            Reliability & Uptime Diagnostic
                                        </h4>
                                        <p className="text-[14px] text-indigo-950/80 font-bold leading-relaxed">
                                            {aiSummaryType === 'executive' && <>System Availability is holding at <span className="text-red-600 font-black">{totalUptime.toFixed(1)}%</span> globally.</>}
                                            {aiSummaryType === 'technical' && <>Mean time between failures (MTBF) has decreased by 8% this period.</>}
                                            {aiSummaryType === 'risk' && <>CRITICAL: 2 units at <span className="font-black text-red-700">{secondLoc?.location}</span> show repeated sensor occlusion errors.</>}
                                            {aiSummaryType === 'proactive' && <>Strategy: Preventive spring replacement cycle recommended for next Tuesday.</>}
                                        </p>
                                    </div>
                                )}

                                {/* Inventory Summary */}
                                {aiInsightFocus.includes('inventory') && (
                                    <div className="bg-white/60 p-6 rounded-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden group/card">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-orange-800 uppercase tracking-[0.2em] mb-3">
                                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Package className="h-4 w-4" /></div>
                                            Inventory Health Audit
                                        </h4>
                                        <p className="text-[14px] text-indigo-950/80 font-bold leading-relaxed">
                                            Stock utilization is indexed at <span className="text-orange-600 font-black">82% efficacy</span>.
                                            Series 4 inventory is moving 2x faster than projected at <span className="text-indigo-950 font-black">{topLoc?.location}</span>.
                                        </p>
                                    </div>
                                )}

                                {aiInsightFocus.includes('revenue') && (
                                    <div className="bg-white/60 p-6 rounded-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden group/card">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-3">
                                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><DollarSign className="h-4 w-4" /></div>
                                            {aiSummaryType === 'technical' ? 'Granular Revenue Attribution' : 'Revenue Yield Deep Dive'}
                                        </h4>
                                        <p className="text-[14px] text-indigo-950/80 font-bold leading-relaxed">
                                            {aiSummaryType === 'executive' && <>Economic Audit: Realized yield of <span className="text-indigo-950 font-black">${(overview?.totalRevenue ?? 0).toLocaleString()}</span> is tracking bullish.</>}
                                            {aiSummaryType === 'technical' && <>Vector Split: RPP is indexed at <span className="text-indigo-950 font-black px-2 py-0.5 bg-indigo-50 rounded-lg">${overview?.avgRevenuePerPlay.toFixed(2)}</span>.</>}
                                            {aiSummaryType === 'risk' && <>Yield Deficit: Marginal revenue softening detected in Tier-3 locations.</>}
                                            {aiSummaryType === 'proactive' && <>Liquidity Strategy: Re-investing 10% of surplus at {topLoc?.location} into site-expansion.</>}
                                        </p>
                                    </div>
                                )}

                                {aiInsightFocus.includes('efficiency') && (
                                    <div className="bg-white/60 p-6 rounded-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden group/card">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-blue-800 uppercase tracking-[0.2em] mb-3">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Activity className="h-4 w-4" /></div>
                                            Operational Integrity Diagnostic
                                        </h4>
                                        <p className="text-[14px] text-indigo-950/80 font-bold leading-relaxed">
                                            {aiSummaryType === 'executive' && <>The network is operating at <span className="text-blue-600 font-black">{avgWinRate.toFixed(1)}% success entropy</span> across prize nodes.</>}
                                            {aiSummaryType === 'technical' && <>Calibration Variance: Mean win-rate deviates by 0.4% from target baseline.</>}
                                            {aiSummaryType === 'risk' && anomalyMachine && anomalyMachine.winRate > 18 ? <>CRITICAL ALERT: {anomalyMachine.name} is showing Runaway Payout patterns.</> : <>All mechanical nodes are within calibration.</>}
                                            {aiSummaryType === 'proactive' && <>Calibration Strategy: Adjust all 3-Prong Claws to +5% tension to stabilize drift.</>}
                                        </p>
                                    </div>
                                )}

                                {aiInsightFocus.includes('locations') && (
                                    <div className="bg-white/60 p-6 rounded-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden group/card">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-purple-800 uppercase tracking-[0.2em] mb-4">
                                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Boxes className="h-4 w-4" /></div>
                                            Regional Density & Traffic Map
                                        </h4>
                                        <div className="grid lg:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest">Revenue Saturation</span>
                                                    <span className="text-[10px] font-black text-purple-600">Site Variance</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {locationRevenue.slice(0, 4).map((loc, i) => (
                                                        <div key={i} className="space-y-1.5">
                                                            <div className="flex justify-between text-xs font-black text-indigo-950">
                                                                <span className="truncate">{loc.location}</span>
                                                                <span className="tabular-nums">${loc.revenue.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-indigo-50 rounded-full overflow-hidden border border-indigo-100/50">
                                                                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" style={{ width: `${(loc.revenue / (topLoc?.revenue || 1)) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-center space-y-4">
                                                <div className="p-5 bg-purple-500/5 rounded-xl border border-purple-500/10 space-y-2">
                                                    <p className="text-[13px] font-bold text-indigo-950/80 leading-relaxed italic">
                                                        Geographic audit confirms high-velocity localization at {topLoc?.location}.
                                                    </p>
                                                    <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-100 text-[11px] font-black text-purple-700 uppercase tracking-tight">
                                                        Proactive Strategy: Migrate 2 units to {secondLoc?.location} to capture demand.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const filteredMachines = getFilteredMachines();
    const filteredStock = getFilteredStock();

    // Derived Filter Options moved here to ensure they are available for valid rendering
    const uniqueLocations = ["All Locations", ...Array.from(new Set(machinePerformance.map((m: any) => m.location).filter(l => l && l.toLowerCase() !== "koko 614"))).sort()];
    const uniqueTypes = ["All Types", ...Array.from(new Set(machinePerformance.map((m: any) => m.type).filter(Boolean))).sort()];
    const uniqueCategories = ["All Categories", ...Array.from(new Set(stockPerformance.map((s: any) => s.category).filter(Boolean))).sort()];
    const uniqueBrands = ["All Brands", ...Array.from(new Set(stockPerformance.map((s: any) => s.brand).filter(Boolean))).sort()];

    // Access denied screen
    if (!authLoading && !hasRole(ALLOWED_ROLES)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20">
                    <Lock className="h-16 w-16 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold">Access Restricted</h1>
                <p className="text-muted-foreground text-center max-w-md">
                    This analytics dashboard is only accessible to Managers and Administrators.
                    Please contact your supervisor for access.
                </p>
                <Button onClick={() => router.push("/")} variant="outline">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    // Only show full page loader on initial load
    if (authLoading || (loading && !overview)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading analytics data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                        Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Comprehensive insights into operations, revenue, and performance
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-muted/50 flex-1 sm:flex-none">
                        <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                        <DatePickerWithRange
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="border-none shadow-none focus-visible:ring-0 w-full"
                        />
                    </div>
                    <Select value={revenueSource} onValueChange={(v) => {
                        const source = v as RevenueSource;
                        setRevenueSource(source);
                        // Sync specific cards if they are on default
                        setCardRevenueSources(prev => ({
                            ...prev,
                            total: source,
                            trend: source,
                            location: source,
                            financial: source
                        }));
                    }}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Global Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sales">Sales Revenue</SelectItem>
                            <SelectItem value="game">Game Revenue</SelectItem>
                            <SelectItem value="both">Combined</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={loadAllData} disabled={loading} className="flex-1 sm:flex-none">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleDownload} disabled={!revenueData || revenueData.length === 0} className="flex-1 sm:flex-none">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            {overview && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-indigo-500 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                                    Total Revenue
                                    <Select value={cardRevenueSources.total} onValueChange={(v) => setCardRevenueSources(p => ({ ...p, total: v as RevenueSource }))}>
                                        <SelectTrigger className="h-6 w-24 bg-white/10 border-none text-[10px] text-white py-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sales">Sales</SelectItem>
                                            <SelectItem value="game">Game</SelectItem>
                                            <SelectItem value="both">Both</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardTitle>
                                <p className="text-[10px] text-purple-200 mt-1 opacity-80">
                                    {dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : `Last ${timePeriod} days`}
                                </p>
                            </div>
                            <DollarSign className="h-4 w-4 text-purple-200" />
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">
                                ${cardRevenueSources.total === 'sales' ? overview.salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                                    cardRevenueSources.total === 'game' ? overview.machineRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                                        overview.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center mt-1">
                                {overview.revenueChange >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-300 mr-1" />
                                )}
                                <span className={`text-xs ${overview.revenueChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {overview.revenueChange >= 0 ? '+' : ''}{overview.revenueChange}% from last period
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-medium text-cyan-100">Total Plays</CardTitle>
                                <p className="text-[10px] text-cyan-200 mt-1 opacity-80">
                                    {dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : `Last ${timePeriod} days`}
                                </p>
                            </div>
                            <PlayCircle className="h-4 w-4 text-cyan-200" />
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{overview.totalPlays.toLocaleString()}</div>
                            <div className="flex items-center mt-1">
                                {overview.playsChange >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-300 mr-1" />
                                )}
                                <span className={`text-xs ${overview.playsChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {overview.playsChange >= 0 ? '+' : ''}{overview.playsChange}% from last period
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-medium text-emerald-100">Win Rate</CardTitle>
                                <p className="text-[10px] text-emerald-200 mt-1 opacity-80">
                                    {dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : `Last ${timePeriod} days`}
                                </p>
                            </div>
                            <Trophy className="h-4 w-4 text-emerald-200" />
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">{overview.winRate}%</div>
                            <p className="text-xs text-emerald-100 mt-1">
                                {overview.totalWins.toLocaleString()} wins / {overview.totalPlays.toLocaleString()} plays
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-medium text-amber-100">Stock Value</CardTitle>
                                <p className="text-[10px] text-amber-200 mt-1 opacity-80">As of today</p>
                            </div>
                            <Package className="h-4 w-4 text-amber-200" />
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">${overview.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <p className="text-xs text-amber-100 mt-1">
                                {overview.lowStockItems} items low stock
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Secondary KPIs */}
            {overview && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Machines</p>
                                    <p className="text-2xl font-bold text-green-600">{overview.activeMachines}</p>
                                </div>
                                <Activity className="h-8 w-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Offline/Error</p>
                                    <p className="text-2xl font-bold text-red-600">{overview.offlineMachines}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Revenue/Play</p>
                                    <p className="text-2xl font-bold">${overview.avgRevenuePerPlay.toFixed(2)}</p>
                                </div>
                                <Target className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Stock Items</p>
                                    <p className="text-2xl font-bold">{overview.totalStockItems}</p>
                                </div>
                                <Boxes className="h-8 w-8 text-purple-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-8 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ai-insights" className="gap-1">
                        <Sparkles className="h-4 w-4 hidden sm:inline text-indigo-500" />
                        AI Insights
                    </TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="machines">Machines</TabsTrigger>
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                    <TabsTrigger value="financial" className="gap-1">
                        <Wallet className="h-4 w-4 hidden sm:inline" />
                        Financial
                    </TabsTrigger>
                    <TabsTrigger value="compare">Compare</TabsTrigger>
                    <TabsTrigger value="reports" className="gap-1">
                        <FileText className="h-4 w-4 hidden sm:inline" />
                        Reports
                    </TabsTrigger>
                </TabsList>

                {/* AI Insights Tab */}
                <TabsContent value="ai-insights" className="space-y-4">
                    <AIInsights />
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                    <PerformanceInsightsTab
                        overview={overview}
                        machines={machinePerformance}
                        revenueData={revenueData}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        revenueSource={revenueSource}
                    />

                    {/* Add some additional context for the performance tab */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">Top Performing Sites</CardTitle>
                                <CardDescription className="text-xs">Based on revenue and active utilization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {locationRevenue.slice(0, 5).map((loc, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-medium">{loc.location}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">${loc.revenue.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground">{loc.machines} machines</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">Machine Type Breakdown</CardTitle>
                                <CardDescription className="text-xs">Yield and play distribution by category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {typeRevenue.slice(0, 5).map((type, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{type.type}</span>
                                                <span className="font-bold">${type.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${(type.revenue / Math.max(1, typeRevenue[0]?.revenue)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    {/* Quick Insights Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border-purple-500/20 shadow-sm overflow-hidden">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-purple-700/70 uppercase tracking-wider">Top Performer</p>
                                    <h3 className="text-lg font-bold text-foreground truncate">
                                        {machinePerformance?.[0]?.location || "Loading..."}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">Highest revenue generation site</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 shadow-sm overflow-hidden">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-blue-700/70 uppercase tracking-wider">Active Utilization</p>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {overview?.activeMachines || 0} / {(overview?.activeMachines || 0) + (overview?.offlineMachines || 0)} Machines
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">Current network operational status</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 shadow-sm overflow-hidden">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                    <Target className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider">Target Payout</p>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {(playsWinsData.reduce((acc, curr) => acc + (curr.wins || 0), 0) / Math.max(1, playsWinsData.reduce((acc, curr) => acc + (curr.plays || 0), 0)) * 100).toFixed(1)}%
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">Average win rate across all systems</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                    <div className="grid gap-4 lg:grid-cols-7 mt-4">
                        {/* Revenue Trend */}
                        <Card className="lg:col-span-4 overflow-hidden border-muted/20 shadow-sm">
                            <CardHeader className="flex flex-col space-y-4 pb-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        Revenue Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium">
                                        Total vs Game Revenue ({trendDateRange?.from && trendDateRange?.to ? `${format(trendDateRange.from, "MMM dd")} - ${format(trendDateRange.to, "MMM dd")}` : `Last ${timePeriod} days`})
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-muted/50 shadow-inner">
                                    <Select value={cardRevenueSources.trend} onValueChange={(v) => setCardRevenueSources(p => ({ ...p, trend: v as RevenueSource }))}>
                                        <SelectTrigger className="h-8 w-[90px] bg-background border-muted/50 text-[10px] focus:ring-1 focus:ring-purple-500/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sales">Sales</SelectItem>
                                            <SelectItem value="game">Game</SelectItem>
                                            <SelectItem value="both">Both</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-2 bg-background h-8 px-2 rounded-md border border-muted/50">
                                        <Calendar className="h-3.5 w-3.5 text-purple-500" />
                                        <DatePickerWithRange
                                            date={trendDateRange}
                                            onDateChange={(range) => {
                                                setTrendDateRange(range);
                                                if (!isSameRange(range, dateRange)) {
                                                    setSyncTrendWithGlobal(false);
                                                }
                                            }}
                                            className="border-none shadow-none focus-visible:ring-0 h-6 text-[10px] p-0 w-auto"
                                            footer={
                                                <div className="flex items-center space-x-2 px-1">
                                                    <Checkbox
                                                        id="sync-date"
                                                        checked={syncTrendWithGlobal}
                                                        onCheckedChange={(checked) => setSyncTrendWithGlobal(!!checked)}
                                                    />
                                                    <Label htmlFor="sync-date" className="text-[10px] font-medium leading-none cursor-pointer">
                                                        Sync with Dashboard
                                                    </Label>
                                                </div>
                                            }
                                        />
                                    </div>

                                    <ChartFilter
                                        locations={uniqueLocations}
                                        types={uniqueTypes}
                                        locationValue={trendFilter.location}
                                        typeValue={trendFilter.machineType}
                                        onLocationChange={(v) => setTrendFilter(p => ({ ...p, location: v }))}
                                        onTypeChange={(v) => setTrendFilter(p => ({ ...p, machineType: v }))}
                                    />

                                    <div className="h-8 w-px bg-muted/50 mx-1 hidden sm:block" />

                                    <ChartTypeSelector
                                        value={overviewChartType}
                                        onChange={setOverviewChartType}
                                        options={["area", "line", "bar"]}
                                        size="sm"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    {overviewChartType === "bar" ? (
                                        <BarChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => format(new Date(value), "EEE dd")}
                                            />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                                                labelFormatter={(label) => `Date: ${format(new Date(label), "EEE MMM dd, yyyy")}`}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            {cardRevenueSources.trend === 'both' ? (
                                                <>
                                                    <Bar name="Sales Revenue" dataKey="salesRevenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                    <Bar name="Game Revenue" dataKey="machineRevenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                                </>
                                            ) : (
                                                <Bar
                                                    name={cardRevenueSources.trend === 'sales' ? 'Sales Revenue' : 'Game Revenue'}
                                                    dataKey={cardRevenueSources.trend === 'sales' ? 'salesRevenue' : 'machineRevenue'}
                                                    fill="#8b5cf6"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            )}
                                        </BarChart>
                                    ) : overviewChartType === "line" ? (
                                        <LineChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => format(new Date(value), "EEE dd")}
                                            />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                                                labelFormatter={(label) => `Date: ${format(new Date(label), "EEE MMM dd, yyyy")}`}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            {cardRevenueSources.trend === 'both' ? (
                                                <>
                                                    <Line name="Sales Revenue" type="monotone" dataKey="salesRevenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                                                    <Line name="Game Revenue" type="monotone" dataKey="machineRevenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4" }} />
                                                </>
                                            ) : (
                                                <Line
                                                    name={cardRevenueSources.trend === 'sales' ? 'Sales Revenue' : 'Game Revenue'}
                                                    type="monotone"
                                                    dataKey={cardRevenueSources.trend === 'sales' ? 'salesRevenue' : 'machineRevenue'}
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    dot={{ fill: "#8b5cf6" }}
                                                />
                                            )}
                                        </LineChart>
                                    ) : (
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorGame" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => format(new Date(value), "EEE dd")}
                                            />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                                                labelFormatter={(label) => `Date: ${format(new Date(label), "EEE MMM dd, yyyy")}`}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            {cardRevenueSources.trend === 'both' ? (
                                                <>
                                                    <Area name="Sales Revenue" type="monotone" dataKey="salesRevenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                                                    <Area name="Game Revenue" type="monotone" dataKey="machineRevenue" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorGame)" />
                                                </>
                                            ) : (
                                                <Area
                                                    name={cardRevenueSources.trend === 'sales' ? 'Sales Revenue' : 'Game Revenue'}
                                                    type="monotone"
                                                    dataKey={cardRevenueSources.trend === 'sales' ? 'salesRevenue' : 'machineRevenue'}
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorRevenue)"
                                                />
                                            )}
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue by Location */}
                        <Card className="lg:col-span-3 overflow-hidden border-muted/20 shadow-sm">
                            <CardHeader className="flex flex-col space-y-4 pb-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                        Revenue by Location
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium">
                                        Performance by zone ({locationDateRange?.from && locationDateRange?.to ? `${format(locationDateRange.from, "MMM dd")} - ${format(locationDateRange.to, "MMM dd")}` : `Last ${timePeriod} days`})
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-muted/50 shadow-inner">
                                    <Select value={cardRevenueSources.location} onValueChange={(v) => {
                                        const source = v as RevenueSource;
                                        setCardRevenueSources(p => ({ ...p, location: source }));
                                    }}>
                                        <SelectTrigger className="h-8 w-20 bg-background border-muted/50 text-[10px] focus:ring-1 focus:ring-blue-500/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sales">Sales</SelectItem>
                                            <SelectItem value="game">Game</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-2 bg-background h-8 px-2 rounded-md border border-muted/50">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                        <DatePickerWithRange
                                            date={locationDateRange}
                                            onDateChange={(range) => {
                                                setLocationDateRange(range);
                                                if (!isSameRange(range, dateRange)) {
                                                    setSyncLocationWithGlobal(false);
                                                }
                                            }}
                                            className="border-none shadow-none focus-visible:ring-0 h-6 text-[10px] p-0 w-auto"
                                            footer={
                                                <div className="flex items-center space-x-2 px-1">
                                                    <Checkbox
                                                        id="sync-location-date"
                                                        checked={syncLocationWithGlobal}
                                                        onCheckedChange={(checked) => setSyncLocationWithGlobal(!!checked)}
                                                    />
                                                    <Label htmlFor="sync-location-date" className="text-[10px] font-medium leading-none cursor-pointer">
                                                        Sync with Dashboard
                                                    </Label>
                                                </div>
                                            }
                                        />
                                    </div>

                                    <div className="h-8 w-px bg-muted/50 mx-1 hidden sm:block" />

                                    <ChartTypeSelector
                                        value={locationChartType}
                                        onChange={setLocationChartType}
                                        options={["pie", "bar"]}
                                        size="sm"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="h-[350px] flex flex-col">
                                <ResponsiveContainer width="100%" height="100%" className="flex-1">
                                    {locationChartType === "pie" ? (
                                        <PieChart>
                                            <Pie
                                                data={locationRevenue}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="revenue"
                                                nameKey="location"
                                                labelLine={true}
                                                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {locationRevenue.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`$${value.toLocaleString()}`, cardRevenueSources.location === 'sales' ? 'Sales Revenue' : 'Game Revenue']}
                                            />
                                        </PieChart>
                                    ) : (
                                        <BarChart data={locationRevenue} layout="vertical" margin={{ left: 40, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="location"
                                                type="category"
                                                stroke="#888888"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                width={110}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                                formatter={(value: number) => [`$${value.toLocaleString()}`, cardRevenueSources.location === 'sales' ? 'Sales Revenue' : 'Game Revenue']}
                                            />
                                            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24}>
                                                {locationRevenue.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                                <div className="mt-2 pt-4 border-t border-muted/20 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Aggregate Revenue</span>
                                    <span className="text-lg font-black tracking-tight text-foreground">
                                        ${locationRevenue.reduce((acc, curr) => acc + (curr.revenue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Plays and Wins */}
                    <div className="grid gap-4 lg:grid-cols-1">
                        <Card className="overflow-hidden border-muted/20 shadow-sm">
                            <CardHeader className="flex flex-col space-y-4 pb-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            Plays vs Wins
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5 h-5">
                                            Group 4: Cranes
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs font-medium">
                                        Crane performance activity patterns ({playsWinsDateRange?.from && playsWinsDateRange?.to ? `${format(playsWinsDateRange.from, "MMM dd")} - ${format(playsWinsDateRange.to, "MMM dd")}` : `Last ${timePeriod} days`})
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-muted/50 shadow-inner">
                                    <div className="flex items-center gap-2 bg-background h-8 px-2 rounded-md border border-muted/50">
                                        <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                                        <DatePickerWithRange
                                            date={playsWinsDateRange}
                                            onDateChange={(range) => {
                                                setPlaysWinsDateRange(range);
                                                if (!isSameRange(range, dateRange)) {
                                                    setSyncPlaysWinsWithGlobal(false);
                                                }
                                            }}
                                            className="border-none shadow-none focus-visible:ring-0 h-6 text-[10px] p-0 w-auto"
                                            footer={
                                                <div className="flex items-center space-x-2 px-1">
                                                    <Checkbox
                                                        id="sync-pw-date"
                                                        checked={syncPlaysWinsWithGlobal}
                                                        onCheckedChange={(checked) => setSyncPlaysWinsWithGlobal(!!checked)}
                                                    />
                                                    <Label htmlFor="sync-pw-date" className="text-[10px] font-medium leading-none cursor-pointer">
                                                        Sync with Dashboard
                                                    </Label>
                                                </div>
                                            }
                                        />
                                    </div>
                                    <ChartTypeSelector
                                        value={playsWinsChartType}
                                        onChange={setPlaysWinsChartType}
                                        options={["composed", "area", "bar"]}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {playsWinsChartType === "area" ? (
                                            <AreaChart data={playsWinsData}>
                                                <defs>
                                                    <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                                                    </linearGradient>
                                                    <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => {
                                                    try { return format(new Date(val), "MMM dd"); } catch (e) { return val; }
                                                }} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                                    labelFormatter={(label) => {
                                                        try { return format(new Date(label), "PPPP"); } catch (e) { return label; }
                                                    }}
                                                />
                                                <Legend verticalAlign="top" height={36} />
                                                <Area type="monotone" dataKey="plays" name="Total Plays" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPlays)" strokeWidth={3} />
                                                <Area type="monotone" dataKey="wins" name="Wins" stroke="#10b981" fillOpacity={1} fill="url(#colorWins)" strokeWidth={3} />
                                            </AreaChart>
                                        ) : playsWinsChartType === "bar" ? (
                                            <BarChart data={playsWinsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => {
                                                    try { return format(new Date(val), "MMM dd"); } catch (e) { return val; }
                                                }} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                                    labelFormatter={(label) => {
                                                        try { return format(new Date(label), "PPPP"); } catch (e) { return label; }
                                                    }}
                                                />
                                                <Legend verticalAlign="top" height={36} />
                                                <Bar dataKey="plays" name="Total Plays" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={24} />
                                                <Bar dataKey="wins" name="Wins" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                                            </BarChart>
                                        ) : (
                                            <ComposedChart data={playsWinsData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => {
                                                    try { return format(new Date(val), "MMM dd"); } catch (e) { return val; }
                                                }} />
                                                <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                                    labelFormatter={(label) => {
                                                        try { return format(new Date(label), "PPPP"); } catch (e) { return label; }
                                                    }}
                                                />
                                                <Legend verticalAlign="top" height={36} />
                                                <Bar yAxisId="left" dataKey="plays" name="Total Plays" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={40} />
                                                <Line yAxisId="right" type="monotone" dataKey="wins" name="Wins" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            </ComposedChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-6 grid grid-cols-3 divide-x border-t border-muted/20 pt-4">
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Total Plays</span>
                                        <span className="text-xl font-black text-foreground">{playsWinsData.reduce((acc, curr) => acc + (curr.plays || 0), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Total Wins</span>
                                        <span className="text-xl font-black text-emerald-600">{playsWinsData.reduce((acc, curr) => acc + (curr.wins || 0), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Payout Accuracy</span>
                                        <span className="text-xl font-black text-blue-600">
                                            {(playsWinsData.reduce((acc, curr) => acc + (curr.wins || 0), 0) / Math.max(1, playsWinsData.reduce((acc, curr) => acc + (curr.plays || 0), 0)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-muted/20 shadow-sm">
                            <CardHeader className="flex flex-col space-y-4 pb-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-muted/5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-violet-100 rounded-lg">
                                            <Gamepad2 className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-foreground">Revenue by Category</CardTitle>
                                    </div>
                                    <CardDescription className="ml-11 mt-1">Performance yield across machine types</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DatePickerWithRange
                                        date={typeDateRange}
                                        onDateChange={(range) => {
                                            setTypeDateRange(range);
                                            if (!isSameRange(range, dateRange)) setSyncTypeWithGlobal(false);
                                        }}
                                        footer={
                                            <div className="flex items-center space-x-2 px-1">
                                                <Checkbox
                                                    id="sync-type"
                                                    checked={syncTypeWithGlobal}
                                                    onCheckedChange={(checked) => {
                                                        setSyncTypeWithGlobal(!!checked);
                                                        if (checked && dateRange) setTypeDateRange(dateRange);
                                                    }}
                                                />
                                                <Label htmlFor="sync-type" className="text-xs font-medium cursor-pointer">Sync with Dashboard</Label>
                                            </div>
                                        }
                                    />
                                    <ChartFilter
                                        locations={uniqueLocations}
                                        locationValue={typeFilter.location}
                                        onLocationChange={(v) => setTypeFilter(p => ({ ...p, location: v }))}
                                        // Type filter removed as requested
                                        types={[]}
                                        onTypeChange={() => { }}
                                    />
                                    <div className="flex bg-muted/50 p-1 rounded-md border border-muted">
                                        <Button
                                            variant={typeBreakdown.includes('cash') ? 'default' : 'ghost'}
                                            size="sm"
                                            className="h-6 px-2 text-[10px] gap-1.5"
                                            onClick={() => setTypeBreakdown(prev => prev.includes('cash') ? prev.filter(p => p !== 'cash') : [...prev, 'cash'])}
                                        >
                                            <div className={cn("h-2 w-2 rounded-full", typeBreakdown.includes('cash') ? "bg-white" : "bg-emerald-500")} />
                                            Cash
                                        </Button>
                                        <Button
                                            variant={typeBreakdown.includes('bonus') ? 'default' : 'ghost'}
                                            size="sm"
                                            className="h-6 px-2 text-[10px] gap-1.5"
                                            onClick={() => setTypeBreakdown(prev => prev.includes('bonus') ? prev.filter(p => p !== 'bonus') : [...prev, 'bonus'])}
                                        >
                                            <div className={cn("h-2 w-2 rounded-full", typeBreakdown.includes('bonus') ? "bg-white" : "bg-amber-500")} />
                                            Bonus
                                        </Button>
                                    </div>
                                    <div className="h-8 w-px bg-muted/50 mx-1 hidden sm:block" />
                                    <ChartTypeSelector
                                        value={typeChartType}
                                        onChange={setTypeChartType}
                                        options={["bar", "pie"]}
                                        size="sm"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {typeChartType === "pie" ? (
                                            <PieChart>
                                                <Pie
                                                    data={[...typeRevenue].sort((a, b) => {
                                                        const key = typeBreakdown.length === 1 && typeBreakdown[0] === 'cash' ? 'cashRevenue' :
                                                            typeBreakdown.length === 1 && typeBreakdown[0] === 'bonus' ? 'bonusRevenue' : 'revenue';
                                                        return b[key] - a[key];
                                                    })}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={2}
                                                    dataKey={typeBreakdown.length === 1 && typeBreakdown[0] === 'cash' ? 'cashRevenue' :
                                                        typeBreakdown.length === 1 && typeBreakdown[0] === 'bonus' ? 'bonusRevenue' : 'revenue'}
                                                    nameKey="type"
                                                    label={false}
                                                    strokeWidth={2}
                                                    stroke="#fff"
                                                >
                                                    {typeRevenue.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeOpacity={0.5} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-white/95 backdrop-blur-md p-4 border border-white/20 shadow-2xl rounded-2xl min-w-[200px]">
                                                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed border-gray-200">
                                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
                                                                        <span className="font-extrabold text-indigo-950 text-sm tracking-tight">{data.type}</span>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        {(!typeBreakdown.length || (typeBreakdown.includes('cash') && typeBreakdown.includes('bonus'))) && (
                                                                            <div className="flex justify-between items-center group">
                                                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Total</span>
                                                                                <span className="text-sm font-black text-indigo-950">${data.revenue.toLocaleString()}</span>
                                                                            </div>
                                                                        )}

                                                                        {(typeBreakdown.includes('cash') || (!typeBreakdown.length)) && (
                                                                            <div className="flex justify-between items-center group">
                                                                                <span className="text-[11px] font-bold text-emerald-600/60 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Cash</span>
                                                                                <span className="text-sm font-bold text-emerald-600">${data.cashRevenue.toLocaleString()}</span>
                                                                            </div>
                                                                        )}

                                                                        {(typeBreakdown.includes('bonus') || (!typeBreakdown.length)) && (
                                                                            <div className="flex justify-between items-center group">
                                                                                <span className="text-[11px] font-bold text-amber-600/60 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Bonus</span>
                                                                                <span className="text-sm font-bold text-amber-600">${data.bonusRevenue.toLocaleString()}</span>
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                                                                            <span className="text-[10px] font-medium text-gray-400">Avg / Unit</span>
                                                                            <span className="text-[11px] font-bold text-gray-600">${data.avgRevenue.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Legend
                                                    layout="vertical"
                                                    verticalAlign="middle"
                                                    align="right"
                                                    iconType="circle"
                                                    formatter={(value, entry: any) => {
                                                        const val = Number(entry.payload.value || 0);
                                                        return (
                                                            <span className="text-xs font-medium text-gray-600 ml-2">
                                                                {value}
                                                                <span className="font-bold text-indigo-950 ml-2">
                                                                    ${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toLocaleString()}
                                                                </span>
                                                            </span>
                                                        );
                                                    }}
                                                />
                                            </PieChart>
                                        ) : (
                                            <BarChart
                                                data={[...typeRevenue].sort((a, b) => b.revenue - a.revenue)}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                            >
                                                <defs>
                                                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#8b5cf6" />
                                                        <stop offset="100%" stopColor="#6366f1" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="type" stroke="#6b7280" fontSize={12} width={100} tickLine={false} axisLine={false} fontWeight={500} />
                                                <Tooltip
                                                    cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-white p-4 border border-indigo-100 shadow-xl rounded-xl min-w-[180px]">
                                                                    <p className="font-bold text-indigo-950 mb-2 border-b border-gray-100 pb-1">{label}</p>
                                                                    {!typeBreakdown.length && (
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs text-muted-foreground mr-4">Total Revenue</span>
                                                                            <span className="text-indigo-600 font-bold text-lg">${Number(data.revenue).toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                    {typeBreakdown.includes('cash') && (
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                                                <span className="text-xs text-muted-foreground">Cash</span>
                                                                            </div>
                                                                            <span className="text-emerald-600 font-bold">${Number(data.cashRevenue).toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                    {typeBreakdown.includes('bonus') && (
                                                                        <div className="flex justify-between items-center mt-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                                                <span className="text-xs text-muted-foreground">Bonus</span>
                                                                            </div>
                                                                            <span className="text-amber-600 font-bold">${Number(data.bonusRevenue).toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                {typeBreakdown.length === 0 ? (
                                                    <Bar dataKey="revenue" fill="url(#barGradient)" radius={[0, 6, 6, 0]} barSize={32} />
                                                ) : (
                                                    <>
                                                        {typeBreakdown.includes('cash') && <Bar dataKey="cashRevenue" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={32} />}
                                                        {typeBreakdown.includes('bonus') && <Bar dataKey="bonusRevenue" stackId="a" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={32} />}
                                                    </>
                                                )}
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Machines Tab */}
                <TabsContent value="machines" className="space-y-4">
                    {/* Filters for Machines Tab */}
                    <AdvancedFilters
                        filters={machineFilters}
                        onFilterChange={setMachineFilters}
                        showSortOptions={true}
                        showPerformanceFilter={true}
                        showRevenueFilter={true}
                        locations={uniqueLocations}
                        machineTypes={uniqueTypes}
                    />
                    {/* Top/Bottom Performers */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    Top Performers
                                </CardTitle>
                                <CardDescription>Machines with highest revenue</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[...filteredMachines]
                                        .sort((a, b) => b.revenue - a.revenue)
                                        .slice(0, 5)
                                        .map((machine, idx) => (
                                            <div key={machine.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-sm">{machine.name}</p>
                                                        <p className="text-xs text-muted-foreground">{machine.location}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">${machine.revenue}</p>
                                                    <p className="text-xs text-muted-foreground">{machine.plays} plays</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                    Needs Attention
                                </CardTitle>
                                <CardDescription>Machines with lowest uptime or revenue</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[...filteredMachines]
                                        .sort((a, b) => a.uptime - b.uptime)
                                        .slice(0, 5)
                                        .map((machine, idx) => (
                                            <div key={machine.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-sm">{machine.name}</p>
                                                        <p className="text-xs text-muted-foreground">{machine.location}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-600">{machine.uptime}% uptime</p>
                                                    <Badge variant={machine.status === "Online" ? "default" : "destructive"} className="text-xs">
                                                        {machine.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Machine Performance Chart */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Machine Performance Overview</CardTitle>
                                <CardDescription>Revenue and plays by machine</CardDescription>
                            </div>
                            <ChartTypeSelector
                                value={machineChartType}
                                onChange={setMachineChartType}
                                options={["bar", "line", "area"]}
                                size="sm"
                            />
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                {machineChartType === "area" ? (
                                    <AreaChart data={filteredMachines.slice(0, 15)}>
                                        <defs>
                                            <linearGradient id="colorMachineRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorMachineRev)" name="Revenue ($)" />
                                    </AreaChart>
                                ) : machineChartType === "line" ? (
                                    <LineChart data={filteredMachines.slice(0, 15)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue ($)" />
                                        <Line yAxisId="right" type="monotone" dataKey="plays" stroke="#06b6d4" strokeWidth={2} name="Plays" />
                                    </LineChart>
                                ) : (
                                    <BarChart data={filteredMachines.slice(0, 15)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                                        <Bar yAxisId="right" dataKey="plays" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Plays" />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Machine Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Machines Performance</CardTitle>
                            <CardDescription>Detailed metrics for all machines</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="border-b">
                                            <th className="h-12 px-4 text-left font-medium">Machine</th>
                                            <th className="h-12 px-4 text-left font-medium">Location</th>
                                            <th className="h-12 px-4 text-left font-medium">Type</th>
                                            <th className="h-12 px-4 text-right font-medium">Revenue</th>
                                            <th className="h-12 px-4 text-right font-medium">Plays</th>
                                            <th className="h-12 px-4 text-right font-medium">Win Rate</th>
                                            <th className="h-12 px-4 text-right font-medium">Uptime</th>
                                            <th className="h-12 px-4 text-center font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMachines.slice(0, 20).map((machine) => (
                                            <tr key={machine.id} className="border-b hover:bg-muted/50">
                                                <td className="p-4 font-medium">{machine.name}</td>
                                                <td className="p-4">{machine.location}</td>
                                                <td className="p-4">{machine.type}</td>
                                                <td className="p-4 text-right font-medium">${machine.revenue}</td>
                                                <td className="p-4 text-right">{machine.plays}</td>
                                                <td className="p-4 text-right">{machine.winRate}%</td>
                                                <td className="p-4 text-right">
                                                    <span className={machine.uptime >= 90 ? 'text-green-600' : machine.uptime >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                                                        {machine.uptime}%
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={machine.status === "Online" ? "default" : machine.status === "Maintenance" ? "secondary" : "destructive"}>
                                                        {machine.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stock Tab */}
                <TabsContent value="stock" className="space-y-4">
                    {/* Filters for Stock Tab */}
                    <AdvancedFilters
                        filters={stockFilters}
                        onFilterChange={setStockFilters}
                        showCategoryFilter={true}
                        showBrandFilter={true}
                    />
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Stock by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock by Category</CardTitle>
                                <CardDescription>Value distribution across categories</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryStock}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="totalValue"
                                            nameKey="category"
                                        >
                                            {categoryStock.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Stock by Brand */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock by Brand</CardTitle>
                                <CardDescription>Inventory value by brand</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={brandStock.slice(0, 8)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                                        <YAxis type="category" dataKey="brand" stroke="#888888" fontSize={12} width={100} />
                                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
                                        <Bar dataKey="totalValue" fill="#10b981" radius={[0, 4, 4, 0]}>
                                            {brandStock.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Low Stock Alert */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Low Stock Items
                            </CardTitle>
                            <CardDescription>Items that need reordering</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredStock
                                    .filter(s => s.isLowStock)
                                    .slice(0, 9)
                                    .map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.category} • {item.brand}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-orange-600">{item.totalQuantity}</p>
                                                <p className="text-xs text-muted-foreground">min: {item.reorderPoint}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Performance</CardTitle>
                            <CardDescription>All inventory items with metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="border-b">
                                            <th className="h-12 px-4 text-left font-medium">Item</th>
                                            <th className="h-12 px-4 text-left font-medium">Category</th>
                                            <th className="h-12 px-4 text-left font-medium">Brand</th>
                                            <th className="h-12 px-4 text-right font-medium">Quantity</th>
                                            <th className="h-12 px-4 text-right font-medium">Unit Cost</th>
                                            <th className="h-12 px-4 text-right font-medium">Total Value</th>
                                            <th className="h-12 px-4 text-right font-medium">Turnover</th>
                                            <th className="h-12 px-4 text-center font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStock.slice(0, 20).map((item) => (
                                            <tr key={item.id} className="border-b hover:bg-muted/50">
                                                <td className="p-4 font-medium max-w-[200px] truncate">{item.name}</td>
                                                <td className="p-4">{item.category}</td>
                                                <td className="p-4">{item.brand}</td>
                                                <td className="p-4 text-right">{item.totalQuantity}</td>
                                                <td className="p-4 text-right">${item.costPerUnit.toFixed(2)}</td>
                                                <td className="p-4 text-right font-medium">${item.stockValue.toFixed(2)}</td>
                                                <td className="p-4 text-right">{item.turnoverRate}x</td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={item.isLowStock ? "destructive" : "default"}>
                                                        {item.isLowStock ? "Low Stock" : "OK"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Advanced Stock Analytics - Collapsible */}
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full gap-2">
                                Advanced Stock Insights
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                            <ReorderRecommendations maxItems={8} days={parseInt(timePeriod)} />
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>

                {/* Compare Tab */}
                <TabsContent value="compare" className="space-y-4">
                    {/* Filters for Compare Tab */}
                    <AdvancedFilters
                        filters={compareFilters}
                        onFilterChange={setCompareFilters}
                        locations={["All Locations", "Zone A", "Zone B", "Zone C", "Ground Floor", "Level 1"]} // Explicit locations if needed
                        className="mb-4"
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle>Machine Comparison</CardTitle>
                            <CardDescription>Select two machines to compare their performance side-by-side</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Machine 1</label>
                                    <Select value={comparisonMachine1} onValueChange={setComparisonMachine1}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a machine" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {machinePerformance.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Machine 2</label>
                                    <Select value={comparisonMachine2} onValueChange={setComparisonMachine2}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a machine" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {machinePerformance.filter(m => m.id !== comparisonMachine1).map((m) => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {comparisonData.length > 0 && (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Radar Chart */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Performance Radar</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <RadarChart data={comparisonData}>
                                                        <PolarGrid />
                                                        <PolarAngleAxis dataKey="metric" />
                                                        <PolarRadiusAxis />
                                                        <Radar name="Machine 1" dataKey="item1Value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                                        <Radar name="Machine 2" dataKey="item2Value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                                                        <Legend />
                                                        <Tooltip />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>

                                        {/* Bar Comparison */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={comparisonData} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                        <XAxis type="number" />
                                                        <YAxis type="category" dataKey="metric" width={100} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="item1Value" fill="#8b5cf6" name="Machine 1" />
                                                        <Bar dataKey="item2Value" fill="#06b6d4" name="Machine 2" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Detailed Comparison Table */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Detailed Metrics</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="rounded-md border">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr className="border-b">
                                                            <th className="h-12 px-4 text-left font-medium">Metric</th>
                                                            <th className="h-12 px-4 text-right font-medium text-purple-600">Machine 1</th>
                                                            <th className="h-12 px-4 text-right font-medium text-cyan-600">Machine 2</th>
                                                            <th className="h-12 px-4 text-right font-medium">Difference</th>
                                                            <th className="h-12 px-4 text-right font-medium">% Change</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {comparisonData.map((row, idx) => (
                                                            <tr key={idx} className="border-b hover:bg-muted/50">
                                                                <td className="p-4 font-medium">{row.metric}</td>
                                                                <td className="p-4 text-right text-purple-600">{row.item1Value}</td>
                                                                <td className="p-4 text-right text-cyan-600">{row.item2Value}</td>
                                                                <td className={`p-4 text-right ${row.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {row.difference >= 0 ? '+' : ''}{row.difference}
                                                                </td>
                                                                <td className={`p-4 text-right ${row.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {row.percentChange >= 0 ? '+' : ''}{row.percentChange}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {!comparisonMachine1 || !comparisonMachine2 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Select two machines above to see their comparison</p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Advanced Comparison Tools */}
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full gap-2">
                                Advanced Comparison Tools
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                                <LocationCompareChart days={parseInt(timePeriod)} />
                                <PeriodComparisonCard days={parseInt(timePeriod)} />
                            </div>
                            <MultiMachineCompare days={parseInt(timePeriod)} />
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>

                {/* Financial Tab - NEW */}
                <TabsContent value="financial" className="space-y-4">
                    {/* Filters for Financial Tab */}
                    <AdvancedFilters
                        filters={overviewFilters} // Sharing with overview for now as financial data is broad
                        onFilterChange={(f) => {
                            setOverviewFilters(f);
                            setTimePeriod(f.timePeriod);
                        }}
                        showRevenueFilter={true}
                        variant="compact"
                    />
                    <FinancialAnalyticsTab timePeriod={parseInt(timePeriod)} revenueSource={revenueSource} />
                </TabsContent>

                {/* Reports Tab - NEW */}
                <TabsContent value="reports" className="space-y-4">
                    <AdvancedReportsTab days={parseInt(timePeriod)} revenueSource={revenueSource} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
