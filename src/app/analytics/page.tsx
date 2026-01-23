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
    ChevronDown
} from "lucide-react";
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
import { Calendar, Filter } from "lucide-react";

// Color palette for charts
const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#84cc16"];

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
        <div className="flex items-center gap-1 sm:gap-2">
            <Select value={locationValue} onValueChange={onLocationChange}>
                <SelectTrigger className="h-6 w-[110px] text-[10px] bg-background">
                    <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                    {locations.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={typeValue} onValueChange={onTypeChange}>
                <SelectTrigger className="h-6 w-[110px] text-[10px] bg-background">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    {types.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                </SelectContent>
            </Select>
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
    const [timePeriod, setTimePeriod] = useState("30");
    const [revenueSource, setRevenueSource] = useState<RevenueSource>("sales");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
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
    const [locationFilter, setLocationFilter] = useState<AnalyticsFilter>({});
    const [typeFilter, setTypeFilter] = useState<AnalyticsFilter>({});
    const [playsWinsFilter, setPlaysWinsFilter] = useState<AnalyticsFilter>({});
    const [playsWinsData, setPlaysWinsData] = useState<any[]>([]);

    // Derived Date Range for Effects
    const customRange = useMemo(() => dateRange?.from && dateRange?.to ? { startDate: startOfDay(dateRange.from), endDate: endOfDay(dateRange.to) } : undefined, [dateRange]);

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

    // --- Individual Section Effects ---

    // 1. Revenue Trend Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            analyticsService.getRevenueTimeSeries(parseInt(timePeriod), cardRevenueSources.trend, customRange, trendFilter)
                .then(setRevenueData)
                .catch(err => console.error("Error fetching trend data:", err));
        }
    }, [timePeriod, cardRevenueSources.trend, customRange, trendFilter, authLoading, hasRole]);

    // 2. Revenue by Location Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            analyticsService.getRevenueByLocation(parseInt(timePeriod), cardRevenueSources.location, customRange, locationFilter)
                .then(setLocationRevenue)
                .catch(err => console.error("Error fetching location revenue:", err));
        }
    }, [timePeriod, cardRevenueSources.location, customRange, locationFilter, authLoading, hasRole]);

    // 3. Revenue by Machine Type Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            // Type revenue usually based on Game revenue. If you want source selection, add it to state.
            analyticsService.getRevenueByMachineType(parseInt(timePeriod), 'game', customRange, typeFilter)
                .then(setTypeRevenue)
                .catch(err => console.error("Error fetching type revenue:", err));
        }
    }, [timePeriod, customRange, typeFilter, authLoading, hasRole]);

    // 4. Plays vs Wins Data
    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES)) {
            // Plays/Wins uses TimeSeriesData structure. defaulting to 'game' source or 'trend' source? 
            // Plays/wins are game specific usually. logic uses getRevenueTimeSeries.
            const source = 'game';
            analyticsService.getRevenueTimeSeries(parseInt(timePeriod), source, customRange, playsWinsFilter)
                .then(setPlaysWinsData)
                .catch(err => console.error("Error fetching plays/wins data:", err));
        }
    }, [timePeriod, customRange, playsWinsFilter, authLoading, hasRole]);


    const loadComparisonData = async () => {
        if (comparisonMachine1 && comparisonMachine2) {
            const data = await analyticsService.compareMachines(comparisonMachine1, comparisonMachine2, parseInt(timePeriod));
            setComparisonData(data);
        }
    };

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

    const filteredMachines = getFilteredMachines();
    const filteredStock = getFilteredStock();

    // Derived Filter Options moved here to ensure they are available for valid rendering
    const uniqueLocations = ["All Locations", ...Array.from(new Set(machinePerformance.map((m: any) => m.location).filter(Boolean)))].sort();
    const uniqueTypes = ["All Types", ...Array.from(new Set(machinePerformance.map((m: any) => m.type).filter(Boolean)))].sort();
    const uniqueCategories = ["All Categories", ...Array.from(new Set(stockPerformance.map((s: any) => s.category).filter(Boolean)))].sort();
    const uniqueBrands = ["All Brands", ...Array.from(new Set(stockPerformance.map((s: any) => s.brand).filter(Boolean)))].sort();

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
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-muted/50">
                        <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                        <DatePickerWithRange
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="border-none shadow-none focus-visible:ring-0"
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
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Global Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sales">Sales Revenue</SelectItem>
                            <SelectItem value="game">Game Revenue</SelectItem>
                            <SelectItem value="both">Combined</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={loadAllData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleDownload} disabled={!revenueData || revenueData.length === 0}>
                        <Download className="h-4 w-4" />
                    </Button>
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
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
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

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    {/* Filters for Overview Tab */}


                    <div className="grid gap-4 lg:grid-cols-7">
                        {/* Revenue Trend */}
                        <Card className="lg:col-span-4">
                            <CardHeader className="flex flex-col space-y-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle>Revenue Trend</CardTitle>
                                        <Select value={cardRevenueSources.trend} onValueChange={(v) => setCardRevenueSources(p => ({ ...p, trend: v as RevenueSource }))}>
                                            <SelectTrigger className="h-6 w-24 bg-muted border-none text-[10px] py-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sales">Sales</SelectItem>
                                                <SelectItem value="game">Game</SelectItem>
                                                <SelectItem value="both">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <CardDescription>
                                        Daily revenue ({dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : `Last ${timePeriod} days`})
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ChartFilter
                                        locations={uniqueLocations}
                                        types={uniqueTypes}
                                        locationValue={trendFilter.location}
                                        typeValue={trendFilter.machineType}
                                        onLocationChange={(v) => setTrendFilter(p => ({ ...p, location: v }))}
                                        onTypeChange={(v) => setTrendFilter(p => ({ ...p, machineType: v }))}
                                    />
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
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, cardRevenueSources.trend === 'sales' ? 'Sales Rev' : cardRevenueSources.trend === 'game' ? 'Game Rev' : 'Total Revenue']}
                                                labelFormatter={(label) => `Date: ${format(new Date(label), "EEE MMM dd, yyyy")}`}
                                            />
                                            <Bar dataKey={cardRevenueSources.trend === 'sales' ? 'salesRevenue' : cardRevenueSources.trend === 'game' ? 'machineRevenue' : 'revenue'} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, cardRevenueSources.trend === 'sales' ? 'Sales Rev' : cardRevenueSources.trend === 'game' ? 'Game Rev' : 'Total Revenue']}
                                                labelFormatter={(label) => `Date: ${format(new Date(label), "EEE MMM dd, yyyy")}`}
                                            />
                                            <Line type="monotone" dataKey={cardRevenueSources.trend === 'sales' ? 'salesRevenue' : cardRevenueSources.trend === 'game' ? 'machineRevenue' : 'revenue'} stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                                        </LineChart>
                                    ) : (
                                        <AreaChart data={revenueData}>
                                            <defs>
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
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, cardRevenueSources.trend === 'sales' ? 'Sales Rev' : cardRevenueSources.trend === 'game' ? 'Game Rev' : 'Total Revenue']}
                                                labelFormatter={(label) => `Date: ${format(new Date(label), "EEE MMM dd, yyyy")}`}
                                            />
                                            <Area type="monotone" dataKey={cardRevenueSources.trend === 'sales' ? 'salesRevenue' : cardRevenueSources.trend === 'game' ? 'machineRevenue' : 'revenue'} stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue by Location */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle>Revenue by Location</CardTitle>
                                            <Select value={cardRevenueSources.location} onValueChange={(v) => {
                                                const source = v as RevenueSource;
                                                setCardRevenueSources(p => ({ ...p, location: source }));
                                            }}>
                                                <SelectTrigger className="h-6 w-24 bg-muted border-none text-[10px] py-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sales">Sales</SelectItem>
                                                    <SelectItem value="game">Game</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <CardDescription>
                                            Performance by zone ({dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : `Last ${timePeriod} days`})
                                        </CardDescription>
                                    </div>
                                    <ChartFilter
                                        locations={uniqueLocations}
                                        types={uniqueTypes}
                                        locationValue={locationFilter.location}
                                        typeValue={locationFilter.machineType}
                                        onLocationChange={(v) => setLocationFilter(p => ({ ...p, location: v }))}
                                        onTypeChange={(v) => setLocationFilter(p => ({ ...p, machineType: v }))}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
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
                                            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {locationRevenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [`$${value.toFixed(2)}`, cardRevenueSources.location === 'sales' ? 'Sales Revenue' : 'Game Revenue']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Plays and Wins */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle>Plays vs Wins</CardTitle>
                                    <CardDescription>Daily activity comparison</CardDescription>
                                </div>
                                <ChartFilter
                                    locations={uniqueLocations}
                                    types={uniqueTypes}
                                    locationValue={playsWinsFilter.location}
                                    typeValue={playsWinsFilter.machineType}
                                    onLocationChange={(v) => setPlaysWinsFilter(p => ({ ...p, location: v }))}
                                    onTypeChange={(v) => setPlaysWinsFilter(p => ({ ...p, machineType: v }))}
                                />
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={playsWinsData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px' }}
                                            labelFormatter={(label) => `Date: ${label}`}
                                        />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="plays" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Plays" />
                                        <Line yAxisId="right" type="monotone" dataKey="wins" stroke="#10b981" strokeWidth={2} name="Wins" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle>Revenue by Machine Type</CardTitle>
                                    <CardDescription>Compare performance across machine categories</CardDescription>
                                </div>
                                <ChartFilter
                                    locations={uniqueLocations}
                                    types={uniqueTypes}
                                    locationValue={typeFilter.location}
                                    typeValue={typeFilter.machineType}
                                    onLocationChange={(v) => setTypeFilter(p => ({ ...p, location: v }))}
                                    onTypeChange={(v) => setTypeFilter(p => ({ ...p, machineType: v }))}
                                />
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={typeRevenue} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                                        <YAxis type="category" dataKey="type" stroke="#888888" fontSize={12} width={120} />
                                        <Tooltip
                                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                                        />
                                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                            {typeRevenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
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
