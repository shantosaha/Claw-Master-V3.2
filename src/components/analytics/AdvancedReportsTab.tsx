"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedReportsTabProps {
    className?: string;
}

const reportTypes = [
    {
        id: "revenue",
        name: "Revenue Report",
        description: "Complete revenue breakdown by period, location, and machine",
        icon: TrendingUp,
        formats: ["CSV", "PDF"],
    },
    {
        id: "machine",
        name: "Machine Performance",
        description: "Detailed performance metrics for all machines",
        icon: Target,
        formats: ["CSV", "PDF"],
    },
    {
        id: "stock",
        name: "Stock Analysis",
        description: "Inventory levels, turnover rates, and reorder recommendations",
        icon: FileSpreadsheet,
        formats: ["CSV", "PDF"],
    },
    {
        id: "summary",
        name: "Executive Summary",
        description: "High-level overview of key metrics and trends",
        icon: FileText,
        formats: ["PDF"],
    },
];

const insights = [
    {
        type: "success",
        icon: TrendingUp,
        title: "Revenue Trending Up",
        description: "Revenue has increased 15% compared to the previous period. Machine 'Claw Master 3000' is the top performer.",
    },
    {
        type: "warning",
        icon: AlertTriangle,
        title: "Stock Alert",
        description: "8 items are below reorder point. Consider placing orders for critical items to avoid stockouts.",
    },
    {
        type: "info",
        icon: Zap,
        title: "Optimization Opportunity",
        description: "Zone B shows lower utilization. Consider relocating high-performing machines for better distribution.",
    },
    {
        type: "default",
        icon: Target,
        title: "Goal Progress",
        description: "Monthly revenue target is 85% achieved with 10 days remaining in the period.",
    },
];

export function AdvancedReportsTab({ className }: AdvancedReportsTabProps) {
    const [selectedFormat, setSelectedFormat] = useState<Record<string, string>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);

    const handleDownload = async (reportId: string) => {
        setGenerating(reportId);
        // Simulate download delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setGenerating(null);
        // In real implementation, this would trigger actual file download
        console.log(`Downloading ${reportId} report as ${selectedFormat[reportId] || "CSV"}`);
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

    return (
        <div className={cn("space-y-4", className)}>
            {/* Quick Export Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {reportTypes.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <Select
                                        value={selectedFormat[report.id] || report.formats[0]}
                                        onValueChange={(v) =>
                                            setSelectedFormat({ ...selectedFormat, [report.id]: v })
                                        }
                                    >
                                        <SelectTrigger className="w-[80px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {report.formats.map((format) => (
                                                <SelectItem key={format} value={format}>
                                                    {format}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <CardTitle className="text-lg mt-2">{report.name}</CardTitle>
                                <CardDescription className="text-xs">{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => handleDownload(report.id)}
                                    disabled={generating === report.id}
                                    className="w-full gap-2"
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Performance Insights
                    </CardTitle>
                    <CardDescription>AI-generated recommendations based on your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {insights.map((insight, index) => {
                        const Icon = insight.icon;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "p-4 rounded-lg border transition-colors",
                                    getInsightStyle(insight.type)
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 rounded-full bg-background">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{insight.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
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
                    <Button variant="outline" className="w-full gap-2">
                        Advanced Report Options
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Custom Report Builder */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileType className="h-5 w-5" />
                                    Custom Report Builder
                                </CardTitle>
                                <CardDescription>Build a custom report with selected metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Custom report builder coming soon</p>
                                    <p className="text-xs mt-1">Select metrics, date ranges, and export format</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scheduled Reports */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Scheduled Reports
                                </CardTitle>
                                <CardDescription>Set up automatic report generation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Scheduled reports coming soon</p>
                                    <p className="text-xs mt-1">Daily, weekly, or monthly automated reports</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Reports History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Reports</CardTitle>
                            <CardDescription>Previously generated reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {[
                                    { name: "Revenue Report - November 2024", date: "Dec 1, 2024", format: "PDF" },
                                    { name: "Stock Analysis - Week 48", date: "Nov 30, 2024", format: "CSV" },
                                    { name: "Machine Performance - Q4", date: "Nov 28, 2024", format: "PDF" },
                                ].map((report, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">{report.name}</p>
                                                <p className="text-xs text-muted-foreground">{report.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{report.format}</Badge>
                                            <Button variant="ghost" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
