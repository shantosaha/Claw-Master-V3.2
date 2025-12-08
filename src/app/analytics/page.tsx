"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
    Filter,
    Lock,
    ChevronDown,
    Wallet,
    FileText
} from "lucide-react";
import { analyticsService, AnalyticsOverview, MachinePerformance, StockPerformance, TimeSeriesData } from "@/services/analyticsService";
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
import { TrendIndicator } from "@/components/analytics/TrendIndicator";
import { PeriodComparisonCard } from "@/components/analytics/PeriodComparisonCard";
import { LocationCompareChart } from "@/components/analytics/LocationCompareChart";
import { MultiMachineCompare } from "@/components/analytics/MultiMachineCompare";
import { ReorderRecommendations } from "@/components/analytics/ReorderRecommendations";
import { FinancialAnalyticsTab } from "@/components/analytics/FinancialAnalyticsTab";
import { AdvancedReportsTab } from "@/components/analytics/AdvancedReportsTab";
import { cn } from "@/lib/utils";

// Color palette
const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#84cc16"];
const GRADIENT_COLORS = {
    purple: { from: "#8b5cf6", to: "#6366f1" },
    cyan: { from: "#06b6d4", to: "#0891b2" },
    green: { from: "#10b981", to: "#059669" },
    orange: { from: "#f59e0b", to: "#d97706" },
    red: { from: "#ef4444", to: "#dc2626" },
};

// Allowed roles for analytics access
const ALLOWED_ROLES = ["admin", "manager"];

export default function AnalyticsPage() {
    const { userProfile, loading: authLoading, hasRole } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [revenueData, setRevenueData] = useState<TimeSeriesData[]>([]);
    const [machinePerformance, setMachinePerformance] = useState<MachinePerformance[]>([]);
    const [stockPerformance, setStockPerformance] = useState<StockPerformance[]>([]);
    const [locationRevenue, setLocationRevenue] = useState<any[]>([]);
    const [typeRevenue, setTypeRevenue] = useState<any[]>([]);
    const [categoryStock, setCategoryStock] = useState<any[]>([]);
    const [brandStock, setBrandStock] = useState<any[]>([]);
    const [timePeriod, setTimePeriod] = useState("30");
    const [selectedTab, setSelectedTab] = useState("overview");

    // Machine comparison state
    const [comparisonMachine1, setComparisonMachine1] = useState<string>("");
    const [comparisonMachine2, setComparisonMachine2] = useState<string>("");
    const [comparisonData, setComparisonData] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !hasRole(ALLOWED_ROLES as any)) {
            router.push("/");
        } else if (!authLoading) {
            loadAllData();
        }
    }, [authLoading, hasRole, router]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [
                overviewData,
                revenue,
                machines,
                stock,
                locRevenue,
                tRevenue,
                catStock,
                brStock
            ] = await Promise.all([
                analyticsService.getOverview(),
                analyticsService.getRevenueTimeSeries(parseInt(timePeriod)),
                analyticsService.getMachinePerformance(),
                analyticsService.getStockPerformance(),
                analyticsService.getRevenueByLocation(),
                analyticsService.getRevenueByMachineType(),
                analyticsService.getStockByCategory(),
                analyticsService.getStockByBrand(),
            ]);

            setOverview(overviewData);
            setRevenueData(revenue);
            setMachinePerformance(machines);
            setStockPerformance(stock);
            setLocationRevenue(locRevenue);
            setTypeRevenue(tRevenue);
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
            const data = await analyticsService.compareMachines(comparisonMachine1, comparisonMachine2);
            setComparisonData(data);
        }
    };

    useEffect(() => {
        loadComparisonData();
    }, [comparisonMachine1, comparisonMachine2]);

    useEffect(() => {
        if (!authLoading && hasRole(ALLOWED_ROLES as any)) {
            loadAllData();
        }
    }, [timePeriod]);

    // Access denied screen
    if (!authLoading && !hasRole(ALLOWED_ROLES as any)) {
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

    if (authLoading || loading) {
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
                <div className="flex items-center gap-3">
                    <Select value={timePeriod} onValueChange={setTimePeriod}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Time Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="14">Last 14 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="60">Last 60 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={loadAllData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
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
                            <CardTitle className="text-sm font-medium text-purple-100">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-purple-200" />
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">${overview.totalRevenue.toLocaleString()}</div>
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
                            <CardTitle className="text-sm font-medium text-cyan-100">Total Plays</CardTitle>
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
                            <CardTitle className="text-sm font-medium text-emerald-100">Win Rate</CardTitle>
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
                            <CardTitle className="text-sm font-medium text-amber-100">Stock Value</CardTitle>
                            <Package className="h-4 w-4 text-amber-200" />
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-bold">${overview.totalStockValue.toLocaleString()}</div>
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
                                    <p className="text-2xl font-bold">${overview.avgRevenuePerPlay}</p>
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
                    <div className="grid gap-4 lg:grid-cols-7">
                        {/* Revenue Trend */}
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Daily revenue over the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                            formatter={(value: number) => [`$${value}`, 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue by Location */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Revenue by Location</CardTitle>
                                <CardDescription>Performance across floor levels</CardDescription>
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
                                        <Tooltip formatter={(value: number) => [`$${value}`, 'Revenue']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Plays and Wins */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Plays vs Wins</CardTitle>
                                <CardDescription>Daily activity comparison</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="plays" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Plays" />
                                        <Line yAxisId="right" type="monotone" dataKey="wins" stroke="#10b981" strokeWidth={2} name="Wins" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Machine Type</CardTitle>
                                <CardDescription>Compare performance across machine categories</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={typeRevenue} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                                        <YAxis type="category" dataKey="type" stroke="#888888" fontSize={12} width={120} />
                                        <Tooltip formatter={(value: number) => [`$${value}`, 'Revenue']} />
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
                                    {machinePerformance
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
                                    {machinePerformance
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
                        <CardHeader>
                            <CardTitle>Machine Performance Overview</CardTitle>
                            <CardDescription>Revenue and plays by machine</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={machinePerformance.slice(0, 15)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                                    <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                                    <Bar yAxisId="right" dataKey="plays" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Plays" />
                                </BarChart>
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
                                        {machinePerformance.slice(0, 20).map((machine) => (
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
                                {stockPerformance
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
                                        {stockPerformance.slice(0, 20).map((item) => (
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
                            <ReorderRecommendations maxItems={8} />
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>

                {/* Compare Tab */}
                <TabsContent value="compare" className="space-y-4">
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
                                <LocationCompareChart />
                                <PeriodComparisonCard days={parseInt(timePeriod)} />
                            </div>
                            <MultiMachineCompare />
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>

                {/* Financial Tab - NEW */}
                <TabsContent value="financial" className="space-y-4">
                    <FinancialAnalyticsTab timePeriod={parseInt(timePeriod)} />
                </TabsContent>

                {/* Reports Tab - NEW */}
                <TabsContent value="reports" className="space-y-4">
                    <AdvancedReportsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
