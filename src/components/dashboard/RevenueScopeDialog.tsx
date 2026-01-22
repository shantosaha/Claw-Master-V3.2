"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DollarSign,
    CreditCard,
    Banknote,
    TrendingUp,
    TrendingDown,
    Store,
    Smartphone,
    ArrowUpRight,
    ArrowDownRight,
    CalendarIcon,
    RefreshCw,
    PieChart,
    BarChart3,
    Percent,
    Calculator,
    Layers,
    Receipt
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { revenueApiService, RevenueItem, RevenueSummary } from "@/services/revenueApiService";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";

interface RevenueScopeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type DateRange = {
    from: Date;
    to: Date;
};

export function RevenueScopeDialog({ open, onOpenChange }: RevenueScopeDialogProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
    const [summary, setSummary] = useState<RevenueSummary | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(),
        to: new Date()
    });
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Fetch revenue data
    const fetchData = async () => {
        setLoading(true);
        try {
            const items = await revenueApiService.fetchRevenue({
                startDate: dateRange.from,
                endDate: dateRange.to
            });
            setRevenueItems(items);
            setSummary(revenueApiService.calculateSummary(items));
        } catch (error) {
            console.error("Failed to fetch revenue data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open, dateRange]);

    // Preset date ranges
    const setPresetRange = (preset: string) => {
        const today = new Date();
        switch (preset) {
            case "today":
                setDateRange({ from: today, to: today });
                break;
            case "yesterday":
                const yesterday = subDays(today, 1);
                setDateRange({ from: yesterday, to: yesterday });
                break;
            case "last7":
                setDateRange({ from: subDays(today, 7), to: today });
                break;
            case "last30":
                setDateRange({ from: subDays(today, 30), to: today });
                break;
            case "thisMonth":
                setDateRange({ from: startOfMonth(today), to: today });
                break;
            case "lastMonth":
                const lastMonth = subMonths(today, 1);
                setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
                break;
        }
    };

    // Calculate derived stats
    const posItems = revenueItems.filter(i => i.type === "pos");
    const tellerItems = revenueItems.filter(i => i.type === "teller");

    const cardPercentage = summary ? (summary.totalCard / summary.grandTotal) * 100 : 0;
    const cashPercentage = summary ? (summary.totalCash / summary.grandTotal) * 100 : 0;
    const posPercentage = summary ? (summary.posTotals.total / summary.grandTotal) * 100 : 0;
    const tellerPercentage = summary ? (summary.tellerTotals.total / summary.grandTotal) * 100 : 0;

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!w-[95vw] !max-w-[1300px] !h-[90vh] !max-h-[90vh] p-6 overflow-hidden flex flex-col"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Receipt className="h-6 w-6 text-emerald-500" />
                        Revenue Scope
                        <Badge variant="outline" className="ml-2 text-xs">
                            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex gap-1 flex-wrap items-center">
                        <Button variant="outline" size="sm" onClick={() => setPresetRange("today")}>Today</Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange("yesterday")}>Yesterday</Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange("last7")}>Last 7 Days</Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange("last30")}>Last 30 Days</Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange("thisMonth")}>This Month</Button>
                        <DatePickerWithRange
                            className="w-auto"
                            date={{ from: dateRange.from, to: dateRange.to }}
                            onDateChange={(range) => {
                                if (range?.from && range?.to) {
                                    setDateRange({ from: range.from, to: range.to });
                                    fetchData();
                                }
                            }}
                        />
                        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="flex w-full mb-4 gap-1 shrink-0">
                        <TabsTrigger value="overview" className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                            <PieChart className="h-4 w-4 hidden sm:block" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="pos" className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                            <Store className="h-4 w-4 hidden sm:block" />
                            POS
                        </TabsTrigger>
                        <TabsTrigger value="iteller" className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                            <Smartphone className="h-4 w-4 hidden sm:block" />
                            iTeller
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                            <CreditCard className="h-4 w-4 hidden sm:block" />
                            Payments
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                            <Calculator className="h-4 w-4 hidden sm:block" />
                            Summary
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 min-h-0">
                        {/* Overview Tab */}
                        <TabsContent value="overview" className="mt-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : summary ? (
                                <div className="space-y-6">
                                    {/* Grand Total Card */}
                                    <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-none">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-emerald-100 text-sm font-medium">Grand Total Revenue</p>
                                                    <p className="text-4xl font-bold mt-1">{formatCurrency(summary.grandTotal)}</p>
                                                    <p className="text-emerald-100 text-sm mt-2">
                                                        {revenueItems.length} sources • {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                                                    </p>
                                                </div>
                                                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                                                    <DollarSign className="h-10 w-10 text-white" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Split Overview */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Revenue by Source */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                    <Layers className="h-4 w-4 text-purple-500" />
                                                    Revenue by Source
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* POS */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                                <Store className="h-5 w-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">POS Revenue</p>
                                                                <p className="text-sm text-muted-foreground">{posItems.length} terminals</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg">{formatCurrency(summary.posTotals.total)}</p>
                                                            <Badge variant="secondary">{posPercentage.toFixed(1)}%</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                                                            style={{ width: `${posPercentage}%` }}
                                                        />
                                                    </div>

                                                    <Separator />

                                                    {/* iTeller */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                                <Smartphone className="h-5 w-5 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">iTeller Revenue</p>
                                                                <p className="text-sm text-muted-foreground">{tellerItems.length} units</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg">{formatCurrency(summary.tellerTotals.total)}</p>
                                                            <Badge variant="secondary">{tellerPercentage.toFixed(1)}%</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                                                            style={{ width: `${tellerPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Revenue by Payment Method */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-blue-500" />
                                                    Revenue by Payment Method
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* Cash */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                                <Banknote className="h-5 w-5 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">Cash Revenue</p>
                                                                <p className="text-sm text-muted-foreground">Physical currency</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg text-green-600">{formatCurrency(summary.totalCash)}</p>
                                                            <Badge variant="secondary">{cashPercentage.toFixed(1)}%</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-green-600"
                                                            style={{ width: `${cashPercentage}%` }}
                                                        />
                                                    </div>

                                                    <Separator />

                                                    {/* Card */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <CreditCard className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">Card Revenue</p>
                                                                <p className="text-sm text-muted-foreground">Credit/Debit cards</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg text-blue-600">{formatCurrency(summary.totalCard)}</p>
                                                            <Badge variant="secondary">{cardPercentage.toFixed(1)}%</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                                            style={{ width: `${cardPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Refunds */}
                                    {summary.totalRefunds > 0 && (
                                        <Card className="border-red-200 bg-red-50/50">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                                            <TrendingDown className="h-5 w-5 text-red-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-red-800">Total Refunds</p>
                                                            <p className="text-sm text-red-600">Deducted from revenue</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-2xl text-red-600">-{formatCurrency(summary.totalRefunds)}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    No revenue data available for this period
                                </div>
                            )}
                        </TabsContent>

                        {/* POS Details Tab */}
                        <TabsContent value="pos" className="mt-0">
                            <div className="space-y-4">
                                {/* POS Summary */}
                                <Card className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white border-none">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-purple-100 text-sm">Total POS Revenue</p>
                                                <p className="text-3xl font-bold">{summary ? formatCurrency(summary.posTotals.total) : "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-purple-100 text-sm">Cash</p>
                                                <p className="text-2xl font-bold">{summary ? formatCurrency(summary.posTotals.cash) : "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-purple-100 text-sm">Card</p>
                                                <p className="text-2xl font-bold">{summary ? formatCurrency(summary.posTotals.card) : "-"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Individual POS List */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Store className="h-5 w-5 text-purple-500" />
                                            Individual POS Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {posItems.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-8">No POS data available</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {posItems.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                                <Store className="h-5 w-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{item.name}</p>
                                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Banknote className="h-3 w-3 text-green-500" />
                                                                        Cash: {formatCurrency(item.cashRev)}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <CreditCard className="h-3 w-3 text-blue-500" />
                                                                        Card: {formatCurrency(item.cardRev)}
                                                                    </span>
                                                                    {item.refunds > 0 && (
                                                                        <span className="flex items-center gap-1 text-red-500">
                                                                            <TrendingDown className="h-3 w-3" />
                                                                            Refunds: {formatCurrency(item.refunds)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg">{formatCurrency(item.total)}</p>
                                                            {summary && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {((item.total / summary.posTotals.total) * 100).toFixed(1)}% of POS
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* iTeller Details Tab */}
                        <TabsContent value="iteller" className="mt-0">
                            <div className="space-y-4">
                                {/* iTeller Summary */}
                                <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white border-none">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-orange-100 text-sm">Total iTeller Revenue</p>
                                                <p className="text-3xl font-bold">{summary ? formatCurrency(summary.tellerTotals.total) : "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-orange-100 text-sm">Cash</p>
                                                <p className="text-2xl font-bold">{summary ? formatCurrency(summary.tellerTotals.cash) : "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-orange-100 text-sm">Card</p>
                                                <p className="text-2xl font-bold">{summary ? formatCurrency(summary.tellerTotals.card) : "-"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Individual iTeller List */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Smartphone className="h-5 w-5 text-orange-500" />
                                            Individual iTeller Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {tellerItems.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-8">No iTeller data available</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {tellerItems.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                                <Smartphone className="h-5 w-5 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{item.name}</p>
                                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Banknote className="h-3 w-3 text-green-500" />
                                                                        Cash: {formatCurrency(item.cashRev)}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <CreditCard className="h-3 w-3 text-blue-500" />
                                                                        Card: {formatCurrency(item.cardRev)}
                                                                    </span>
                                                                    {item.refunds > 0 && (
                                                                        <span className="flex items-center gap-1 text-red-500">
                                                                            <TrendingDown className="h-3 w-3" />
                                                                            Refunds: {formatCurrency(item.refunds)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg">{formatCurrency(item.total)}</p>
                                                            {summary && summary.tellerTotals.total > 0 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {((item.total / summary.tellerTotals.total) * 100).toFixed(1)}% of iTeller
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Payment Methods Tab */}
                        <TabsContent value="payment" className="mt-0">
                            <div className="space-y-4">
                                {/* Cash vs Card Summary */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white border-none">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-green-100 text-sm">Total Cash Revenue</p>
                                                    <p className="text-3xl font-bold">{summary ? formatCurrency(summary.totalCash) : "-"}</p>
                                                    <Badge className="mt-2 bg-white/20 text-white border-none">
                                                        {cashPercentage.toFixed(1)}% of total
                                                    </Badge>
                                                </div>
                                                <Banknote className="h-16 w-16 text-green-200/50" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-blue-100 text-sm">Total Card Revenue</p>
                                                    <p className="text-3xl font-bold">{summary ? formatCurrency(summary.totalCard) : "-"}</p>
                                                    <Badge className="mt-2 bg-white/20 text-white border-none">
                                                        {cardPercentage.toFixed(1)}% of total
                                                    </Badge>
                                                </div>
                                                <CreditCard className="h-16 w-16 text-blue-200/50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Breakdown by Source + Payment */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                                            Payment Method by Source
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* POS Payment Breakdown */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Store className="h-5 w-5 text-purple-500" />
                                                    <span className="font-medium">POS Payment Methods</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pl-7">
                                                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Banknote className="h-4 w-4 text-green-500" />
                                                            POS Cash
                                                        </p>
                                                        <p className="text-2xl font-bold text-green-600">
                                                            {summary ? formatCurrency(summary.posTotals.cash) : "-"}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <CreditCard className="h-4 w-4 text-blue-500" />
                                                            POS Card
                                                        </p>
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {summary ? formatCurrency(summary.posTotals.card) : "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* iTeller Payment Breakdown */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Smartphone className="h-5 w-5 text-orange-500" />
                                                    <span className="font-medium">iTeller Payment Methods</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pl-7">
                                                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Banknote className="h-4 w-4 text-green-500" />
                                                            iTeller Cash
                                                        </p>
                                                        <p className="text-2xl font-bold text-green-600">
                                                            {summary ? formatCurrency(summary.tellerTotals.cash) : "-"}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <CreditCard className="h-4 w-4 text-blue-500" />
                                                            iTeller Card
                                                        </p>
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {summary ? formatCurrency(summary.tellerTotals.card) : "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Summary & Totals Tab */}
                        <TabsContent value="summary" className="mt-0">
                            <div className="space-y-4">
                                {/* Complete Summary Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-emerald-500" />
                                            Complete Revenue Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-lg border overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-muted/50">
                                                    <tr className="border-b">
                                                        <th className="px-4 py-3 text-left font-medium text-sm">Category</th>
                                                        <th className="px-4 py-3 text-right font-medium text-sm">Cash</th>
                                                        <th className="px-4 py-3 text-right font-medium text-sm">Card</th>
                                                        <th className="px-4 py-3 text-right font-medium text-sm">Refunds</th>
                                                        <th className="px-4 py-3 text-right font-medium text-sm">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* POS Row */}
                                                    <tr className="border-b hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                            <Store className="h-4 w-4 text-purple-500" />
                                                            POS Terminals
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-green-600">
                                                            {summary ? formatCurrency(summary.posTotals.cash) : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-blue-600">
                                                            {summary ? formatCurrency(summary.posTotals.card) : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-red-500">
                                                            {posItems.reduce((sum, i) => sum + i.refunds, 0) > 0
                                                                ? `-${formatCurrency(posItems.reduce((sum, i) => sum + i.refunds, 0))}`
                                                                : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold">
                                                            {summary ? formatCurrency(summary.posTotals.total) : "-"}
                                                        </td>
                                                    </tr>

                                                    {/* iTeller Row */}
                                                    <tr className="border-b hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                            <Smartphone className="h-4 w-4 text-orange-500" />
                                                            iTeller Units
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-green-600">
                                                            {summary ? formatCurrency(summary.tellerTotals.cash) : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-blue-600">
                                                            {summary ? formatCurrency(summary.tellerTotals.card) : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-red-500">
                                                            {tellerItems.reduce((sum, i) => sum + i.refunds, 0) > 0
                                                                ? `-${formatCurrency(tellerItems.reduce((sum, i) => sum + i.refunds, 0))}`
                                                                : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold">
                                                            {summary ? formatCurrency(summary.tellerTotals.total) : "-"}
                                                        </td>
                                                    </tr>

                                                    {/* Totals Row */}
                                                    <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
                                                        <td className="px-4 py-4 font-bold flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                                            GRAND TOTAL
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-bold text-green-600">
                                                            {summary ? formatCurrency(summary.totalCash) : "-"}
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-bold text-blue-600">
                                                            {summary ? formatCurrency(summary.totalCard) : "-"}
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-bold text-red-600">
                                                            {summary && summary.totalRefunds > 0
                                                                ? `-${formatCurrency(summary.totalRefunds)}`
                                                                : "-"}
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-bold text-lg text-emerald-600">
                                                            {summary ? formatCurrency(summary.grandTotal) : "-"}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <Percent className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                            <p className="text-2xl font-bold">{cashPercentage.toFixed(1)}%</p>
                                            <p className="text-sm text-muted-foreground">Cash Ratio</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <Percent className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                                            <p className="text-2xl font-bold">{cardPercentage.toFixed(1)}%</p>
                                            <p className="text-sm text-muted-foreground">Card Ratio</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <Store className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                                            <p className="text-2xl font-bold">{posItems.length}</p>
                                            <p className="text-sm text-muted-foreground">POS Terminals</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <Smartphone className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                                            <p className="text-2xl font-bold">{tellerItems.length}</p>
                                            <p className="text-sm text-muted-foreground">iTeller Units</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* All Items Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Receipt className="h-5 w-5 text-indigo-500" />
                                            All Revenue Sources
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {revenueItems.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-8">No revenue data available</p>
                                        ) : (
                                            <div className="rounded-lg border overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr className="border-b">
                                                            <th className="px-4 py-3 text-left font-medium">Source</th>
                                                            <th className="px-4 py-3 text-left font-medium">Type</th>
                                                            <th className="px-4 py-3 text-right font-medium">Cash</th>
                                                            <th className="px-4 py-3 text-right font-medium">Card</th>
                                                            <th className="px-4 py-3 text-right font-medium">Refunds</th>
                                                            <th className="px-4 py-3 text-right font-medium">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {revenueItems.map((item, index) => (
                                                            <tr key={index} className="border-b hover:bg-muted/30">
                                                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                                                <td className="px-4 py-3">
                                                                    <Badge variant={item.type === "pos" ? "default" : "secondary"}>
                                                                        {item.type === "pos" ? "POS" : "iTeller"}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-green-600">
                                                                    {formatCurrency(item.cashRev)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-blue-600">
                                                                    {formatCurrency(item.cardRev)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-red-500">
                                                                    {item.refunds > 0 ? `-${formatCurrency(item.refunds)}` : "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold">
                                                                    {formatCurrency(item.total)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
