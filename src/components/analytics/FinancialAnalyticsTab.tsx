"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendIndicator } from "./TrendIndicator";
import { ChartTypeSelector, ChartType } from "./ChartTypeSelector";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Line,
    LineChart,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { analyticsService, FinancialMetrics, TimeSeriesData, RevenueSource } from "@/services/analyticsService";
import { DollarSign, TrendingUp, Calculator, PiggyBank, Target, BarChart3 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialAnalyticsTabProps {
    timePeriod?: number;
    revenueSource?: RevenueSource;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export function FinancialAnalyticsTab({ timePeriod = 30, revenueSource = 'sales' }: FinancialAnalyticsTabProps) {
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [revenueData, setRevenueData] = useState<TimeSeriesData[]>([]);
    const [forecast, setForecast] = useState<TimeSeriesData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<ChartType>("area");
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Local overrides
    const [localRevenueSource, setLocalRevenueSource] = useState<RevenueSource>(revenueSource);

    useEffect(() => {
        setLocalRevenueSource(revenueSource);
    }, [revenueSource]);

    useEffect(() => {
        loadData();
    }, [timePeriod, revenueSource]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [financialMetrics, revenue, forecastData] = await Promise.all([
                analyticsService.getFinancialMetrics(timePeriod, revenueSource),
                analyticsService.getRevenueTimeSeries(timePeriod, revenueSource),
                analyticsService.getProjectedRevenue(7),
            ]);
            setMetrics(financialMetrics);
            setRevenueData(revenue);
            setForecast(forecastData);
        } catch (err) {
            console.error("Failed to load financial data:", err);
            setError("Failed to load some financial metrics. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const combinedData = [
        ...revenueData.map((d) => ({ ...d, type: "actual" })),
        ...forecast.map((d) => ({ ...d, type: "forecast" })),
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
                    ))}
                </div>
                <div className="animate-pulse h-[400px] bg-muted rounded-lg" />
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Data Unavailable
                    </CardTitle>
                    <CardDescription>
                        {error || "Financial metrics are currently unavailable."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={loadData} variant="outline" className="gap-2">
                        <ChevronDown className="h-4 w-4 rotate-90" />
                        Retry Loading
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const renderChart = () => {
        const chartData = revenueData; // Show full period

        const commonProps = {
            data: chartData,
        };

        switch (chartType) {
            case "line":
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: "#8b5cf6" }}
                            name="Revenue"
                        />
                    </LineChart>
                );
            case "bar":
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                );
            default:
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#colorRevenue)"
                            name="Revenue"
                        />
                    </AreaChart>
                );
        }
    };

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-indigo-500 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${localRevenueSource === 'sales' ? metrics.salesRevenue.toLocaleString() :
                                localRevenueSource === 'game' ? metrics.machineRevenue.toLocaleString() :
                                    metrics.totalRevenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-purple-100 flex items-center justify-between">
                            <span>Last {timePeriod} days</span>
                            <Select value={localRevenueSource} onValueChange={(v) => setLocalRevenueSource(v as RevenueSource)}>
                                <SelectTrigger className="h-5 w-20 bg-white/10 border-none text-[9px] py-0 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales">Sales</SelectItem>
                                    <SelectItem value="game">Game</SelectItem>
                                    <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                            </Select>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-100">Gross Profit</CardTitle>
                        <PiggyBank className="h-4 w-4 text-green-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.grossProfit.toLocaleString()}</div>
                        <p className="text-xs text-green-100">{metrics.profitMargin}% margin</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg/Machine</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.avgRevenuePerMachine.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Revenue per machine</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Projected Monthly</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.projectedMonthlyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Based on current trend</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Daily revenue over selected period</CardDescription>
                    </div>
                    <ChartTypeSelector
                        value={chartType}
                        onChange={setChartType}
                        options={["area", "line", "bar"]}
                        size="sm"
                    />
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        {renderChart()}
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Advanced Section */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                        Advanced Financial Insights
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Revenue by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Revenue by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={metrics.revenueByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="revenue"
                                            nameKey="category"
                                        >
                                            {metrics.revenueByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue Forecast */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">7-Day Forecast</CardTitle>
                                <CardDescription>Projected revenue based on historical trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={forecast}>
                                        <defs>
                                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Forecast"]} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fill="url(#colorForecast)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cost Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Cost Analysis Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                                    <p className="text-xl font-bold text-green-600">${metrics.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                                    <p className="text-xl font-bold text-red-600">${metrics.totalCost.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-sm text-muted-foreground mb-1">Gross Profit</p>
                                    <p className="text-xl font-bold text-purple-600">${metrics.grossProfit.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-sm text-muted-foreground mb-1">Avg Daily Revenue</p>
                                    <p className="text-xl font-bold">${metrics.avgRevenuePerDay.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
