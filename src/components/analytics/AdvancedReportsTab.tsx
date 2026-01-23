"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    FileText,
    Download,
    Calendar,
    FileSpreadsheet,
    FileType,
    Clock,
    ChevronDown,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Target,
    Zap,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    analyticsService,
    AnalyticsOverview,
    MachinePerformance,
    StockPerformance,
    RevenueSource
} from "@/services/analyticsService";
import { toast } from "sonner";
import { format } from "date-fns";

interface AdvancedReportsTabProps {
    days?: number;
    revenueSource?: RevenueSource;
    className?: string;
}

interface ReportHistoryItem {
    id: string;
    name: string;
    date: string;
    format: string;
    type: string;
}

const reportTypes = [
    {
        id: "revenue",
        name: "Revenue Report",
        description: "Complete revenue breakdown by period, location, and machine",
        icon: TrendingUp,
        formats: ["CSV"], // Simplified for now
    },
    {
        id: "machine",
        name: "Machine Performance",
        description: "Detailed performance metrics for all machines",
        icon: Target,
        formats: ["CSV"],
    },
    {
        id: "stock",
        name: "Stock Analysis",
        description: "Inventory levels, turnover rates, and reorder recommendations",
        icon: FileSpreadsheet,
        formats: ["CSV"],
    },
    {
        id: "summary",
        name: "Executive Summary",
        description: "High-level overview of key metrics and trends",
        icon: FileText,
        formats: ["CSV"],
    },
];

export function AdvancedReportsTab({ days = 30, revenueSource = 'sales', className }: AdvancedReportsTabProps) {
    const [selectedFormat, setSelectedFormat] = useState<Record<string, string>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [machinePerf, setMachinePerf] = useState<MachinePerformance[]>([]);
    const [stockPerf, setStockPerf] = useState<StockPerformance[]>([]);
    const [history, setHistory] = useState<ReportHistoryItem[]>([]);
    const [customMetrics, setCustomMetrics] = useState<string[]>(["revenue", "plays", "wins"]);
    const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
    const [scheduleEmail, setScheduleEmail] = useState("");
    const [schedules, setSchedules] = useState<{ id: string, type: string, frequency: string, email: string }[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("report_schedules");
        if (saved) {
            try { setSchedules(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, []);

    // Load history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem("report_history");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse report history:", e);
            }
        }
    }, []);

    // Save history to localStorage
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem("report_history", JSON.stringify(history));
        }
    }, [history]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewData, machineData, stockData] = await Promise.all([
                analyticsService.getOverview(days, revenueSource),
                analyticsService.getMachinePerformance(days, 'game'),
                analyticsService.getStockPerformance(days)
            ]);
            setOverview(overviewData);
            setMachinePerf(machineData);
            setStockPerf(stockData);
        } catch (error) {
            console.error("Failed to load reports data:", error);
            toast.error("Failed to load data for reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [days, revenueSource]);

    // Generate Dynamic Insights
    const insights = useMemo(() => {
        if (!overview) return [];

        const dynamicInsights = [];

        // Revenue Insight
        if (overview.revenueChange >= 0) {
            dynamicInsights.push({
                type: "success",
                icon: TrendingUp,
                title: "Revenue Trending Up",
                description: `Revenue has increased ${overview.revenueChange}% compared to the previous period. Consistent growth observed.`,
            });
        } else {
            dynamicInsights.push({
                type: "warning",
                icon: TrendingUp,
                title: "Revenue Dip",
                description: `Revenue is down ${Math.abs(overview.revenueChange)}% from the last period. Review top performing locations.`,
            });
        }

        // Stock Insight
        if (overview.lowStockItems > 0) {
            dynamicInsights.push({
                type: "warning",
                icon: AlertTriangle,
                title: "Stock Alert",
                description: `${overview.lowStockItems} items are below reorder point. Ensure critical inventory is restocked to prevent downtime.`,
            });
        } else {
            dynamicInsights.push({
                type: "success",
                icon: Zap,
                title: "Inventory Healthy",
                description: "All stock levels are currently within safe operating thresholds.",
            });
        }

        // Win Rate Insight
        if (overview.winRate > 25) {
            dynamicInsights.push({
                type: "info",
                icon: Target,
                title: "High Win Rate detected",
                description: `Overall win rate is ${overview.winRate}%. If revenue is lower than expected, consider adjusting machine difficulty.`,
            });
        } else if (overview.winRate < 10 && overview.totalPlays > 0) {
            dynamicInsights.push({
                type: "warning",
                icon: Zap,
                title: "Low Play Engagement",
                description: `Average win rate (${overview.winRate}%) is lower than usual. Check machine mechanical health for potential errors.`,
            });
        }

        // Default Optimization Goal
        const targetRevenue = 10000; // Mock target
        const progress = Math.min(100, Math.round((overview.totalRevenue / targetRevenue) * 100));
        dynamicInsights.push({
            type: "default",
            icon: Target,
            title: "Performance Goal",
            description: `Monthly performance target is ${progress}% achieved based on current revenue trends.`,
        });

        return dynamicInsights;
    }, [overview]);

    const downloadCSV = (filename: string, data: string) => {
        const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownload = async (reportId: string) => {
        setGenerating(reportId);

        try {
            // Simulate generation delay for UX
            await new Promise((resolve) => setTimeout(resolve, 1000));

            let csvContent = "";
            let filename = `report_${reportId}_${format(new Date(), "yyyyMMdd")}.csv`;

            switch (reportId) {
                case "revenue":
                    csvContent = "Date,Total Revenue,Plays,Wins\n";
                    // Using time series data specifically would be better, but we can summarize
                    csvContent += `${format(new Date(), "yyyy-MM-dd")},${overview?.totalRevenue},${overview?.totalPlays},${overview?.totalWins}\n`;
                    break;
                case "machine":
                    csvContent = "ID,Name,Location,Type,Plays,Revenue,Win Rate,Status\n";
                    machinePerf.forEach(m => {
                        csvContent += `${m.id},${m.name},${m.location},${m.type},${m.plays},${m.revenue},${m.winRate}%,${m.status}\n`;
                    });
                    break;
                case "stock":
                    csvContent = "ID,Name,Category,Brand,Quantity,Value,Status\n";
                    stockPerf.forEach(s => {
                        csvContent += `${s.id},${s.name},${s.category},${s.brand},${s.totalQuantity},${s.stockValue.toFixed(2)},${s.isLowStock ? "Low" : "OK"}\n`;
                    });
                    break;
                case "summary":
                    csvContent = "Metric,Value\n";
                    csvContent += `Total Revenue,${overview?.totalRevenue}\n`;
                    csvContent += `Total Plays,${overview?.totalPlays}\n`;
                    csvContent += `Total Wins,${overview?.totalWins}\n`;
                    csvContent += `Win Rate,${overview?.winRate}%\n`;
                    csvContent += `Active Machines,${overview?.activeMachines}\n`;
                    break;
            }

            downloadCSV(filename, csvContent);

            // Add to history
            const newHistoryItem: ReportHistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: `${reportId.charAt(0).toUpperCase() + reportId.slice(1)} Report - ${format(new Date(), "MMM d, yyyy")}`,
                date: format(new Date(), "MMM d, yyyy"),
                format: "CSV",
                type: reportId
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
            toast.success("Report generated successfully");

        } catch (error) {
            console.error("Generation error:", error);
            toast.error("Failed to generate report");
        } finally {
            setGenerating(null);
        }
    };

    const getInsightStyle = (type: string) => {
        switch (type) {
            case "success":
                return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
            case "warning":
                return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
            case "info":
                return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
            default:
                return "bg-muted/50";
        }
    };

    const handleDownloadCustom = async () => {
        setGenerating('custom');
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Generate headings
            const headers = customMetrics.map(m => m.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(",");
            let csvContent = `${headers}\n`;

            // Generate row data
            if (overview) {
                const row = customMetrics.map(metric => {
                    switch (metric) {
                        case 'revenue': return overview.totalRevenue;
                        case 'plays': return overview.totalPlays;
                        case 'wins': return overview.totalWins;
                        case 'win_rate': return `${overview.winRate}%`;
                        case 'active_machines': return overview.activeMachines;
                        case 'stock_value': return loading ? '...' : stockPerf.reduce((acc, item) => acc + item.stockValue, 0).toFixed(2);
                        default: return 0;
                    }
                }).join(",");
                csvContent += `${row}\n`;
            }

            downloadCSV(`custom_report_${format(new Date(), "yyyyMMdd")}.csv`, csvContent);

            // Add to history
            const newHistoryItem: ReportHistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: `Custom Report - ${format(new Date(), "MMM d, yyyy")}`,
                date: format(new Date(), "MMM d, yyyy"),
                format: "CSV",
                type: "custom"
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
            toast.success("Custom report generated");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate custom report");
        } finally {
            setGenerating(null);
        }
    };

    const handleAddSchedule = () => {
        if (!scheduleEmail) {
            toast.error("Please enter an email address");
            return;
        }
        const newSchedule = {
            id: Math.random().toString(36).substr(2, 9),
            type: "Summary",
            frequency: scheduleFrequency,
            email: scheduleEmail
        };
        const updated = [...schedules, newSchedule];
        setSchedules(updated);
        localStorage.setItem("report_schedules", JSON.stringify(updated));
        setScheduleEmail("");
        toast.success("Schedule added");
    };

    if (loading && !overview) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Analysing data and generating report parameters...</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Quick Export Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {reportTypes.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow border-none shadow-md overflow-hidden group">
                            <div className="h-1 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {report.formats[0]}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg mt-2">{report.name}</CardTitle>
                                <CardDescription className="text-xs">{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => handleDownload(report.id)}
                                    disabled={generating === report.id}
                                    className="w-full gap-2 shadow-sm"
                                    variant="outline"
                                >
                                    {generating === report.id ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Download
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* AI-Style Insights */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Performance Insights
                    </CardTitle>
                    <CardDescription>Automated recommendations based on current {days} day dashboard data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {insights.map((insight, index) => {
                        const Icon = insight.icon;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "p-4 rounded-lg border transition-all hover:translate-x-1",
                                    getInsightStyle(insight.type)
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 rounded-full bg-background shadow-sm">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{insight.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Advanced Section */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground">
                        Advanced Report Options
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Custom Report Builder */}
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileType className="h-5 w-5 text-muted-foreground" />
                                    Custom Report Builder
                                </CardTitle>
                                <CardDescription>Select individual metrics for a bespoke export</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {["Revenue", "Plays", "Wins", "Win Rate", "Active Machines", "Stock Value"].map((metric) => {
                                            const id = metric.toLowerCase().replace(" ", "_");
                                            const isChecked = customMetrics.includes(id);
                                            return (
                                                <div key={id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        setCustomMetrics(prev =>
                                                            isChecked ? prev.filter(m => m !== id) : [...prev, id]
                                                        );
                                                    }}>
                                                    <div className={cn(
                                                        "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                                        isChecked ? "bg-primary border-primary" : "border-input bg-background"
                                                    )}>
                                                        {isChecked && <div className="h-2 w-2 rounded-sm bg-primary-foreground" />}
                                                    </div>
                                                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {metric}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        className="w-full"
                                        disabled={customMetrics.length === 0 || generating === 'custom'}
                                        onClick={() => handleDownloadCustom()}
                                    >
                                        {generating === 'custom' ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Generate Custom CSV
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scheduled Reports */}
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    Scheduled Reports
                                </CardTitle>
                                <CardDescription>Automate delivery to your management email</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select defaultValue="summary">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Report Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="summary">Executive Summary</SelectItem>
                                                <SelectItem value="revenue">Revenue Detailed</SelectItem>
                                                <SelectItem value="stock">Low Stock Alert</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="Recipient Email"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={scheduleEmail}
                                            onChange={(e) => setScheduleEmail(e.target.value)}
                                        />
                                        <Button size="icon" onClick={handleAddSchedule}>
                                            <Clock className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Schedule List */}
                                    {schedules.length > 0 && (
                                        <div className="pt-2 space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground">Active Schedules</p>
                                            {schedules.map(schedule => (
                                                <div key={schedule.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] uppercase">{schedule.frequency}</Badge>
                                                        <span className="text-xs truncate max-w-[120px]">{schedule.type}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => {
                                                        const newSchedules = schedules.filter(s => s.id !== schedule.id);
                                                        setSchedules(newSchedules);
                                                        localStorage.setItem("report_schedules", JSON.stringify(newSchedules));
                                                        toast.success("Schedule removed");
                                                    }}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Reports History */}
                    {history.length > 0 && (
                        <Card className="border-none shadow-sm bg-muted/30">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-semibold">Generation History</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="space-y-2">
                                    {history.map((report) => (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between p-2 px-3 rounded-lg bg-background border shadow-sm hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded bg-muted">
                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold">{report.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{report.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[9px] h-4">
                                                    {report.format}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(report.type === 'custom' ? 'summary' : report.type)}>
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
