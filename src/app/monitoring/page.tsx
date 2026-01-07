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
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { monitoringService, MachineStatus, MonitoringAlert, MonitoringReportItem } from "@/services/monitoringService";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import Link from "next/link";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import { GlobalServiceHistoryTable } from "@/components/machines/GlobalServiceHistoryTable";
import { ServiceReportForm } from "@/components/machines/ServiceReportForm";
import { MachineComparisonTable } from "@/components/machines/MachineComparisonTable";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    Cell,
    LineChart,
    Line
} from "recharts";

// Custom hook for monitoring data
function useMonitoring() {
    const [machines, setMachines] = useState<MachineStatus[]>([]);
    const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

        monitoringService.startPolling(30000);

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
            const data = await monitoringService.fetchMachineStatuses();
            setMachines(data);
            setLastUpdate(new Date());
            setError(null);
        } catch {
            setError('Failed to refresh data');
        }
        setIsLoading(false);
    }, []);

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
    open,
    onOpenChange
}: {
    machine: ExtendedMachineStatus | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!machine) return null;

    // Generate some trend data based on machine ID
    const trendData = useMemo(() => {
        const seed = machine.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const random = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        return Array.from({ length: 12 }, (_, i) => ({
            time: `${i * 2}h`,
            plays: Math.floor(random(i) * 20) + 5
        }));
    }, [machine.id]);

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
                        <DialogTitle>{machine.name} - Quick View</DialogTitle>
                    </div>
                    <DialogDescription>
                        Real-time status and performance metrics for {machine.location}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Visuals & Status */}
                    <div className="space-y-4">
                        <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                            {machine.imageUrl ? (
                                <img src={machine.imageUrl} alt={machine.name} className="w-full h-full object-cover" />
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
                                    <p className="text-xl font-bold">{machine.payoutAccuracy}%</p>
                                    <p className={cn(
                                        "text-[10px] mb-1 font-medium",
                                        machine.payoutAccuracy && machine.payoutAccuracy > 100 ? "text-red-500" : "text-green-500"
                                    )}>
                                        {machine.payoutStatus}
                                    </p>
                                </div>
                            </Card>
                            <Card className="p-3 bg-muted/30">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold">Plays Today</p>
                                <p className="text-xl font-bold">{machine.customerPlays ?? 0}</p>
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Performance & Settings</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t pt-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[11px]">Staff Plays:</span>
                                        <span className="font-mono font-bold text-blue-500">{machine.staffPlays ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-[11px]">Payouts:</span>
                                        <span className="font-mono font-bold text-green-600">{machine.payouts ?? 0}</span>
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
                        </div>
                    </div>

                    {/* Chart & Control */}
                    <div className="space-y-4">
                        <div className="h-[200px] w-full">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4">24h Play Trend</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide />
                                    <RechartsTooltip
                                        labelStyle={{ color: 'black' }}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="plays"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorPlays)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 pt-4">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Claw Strength History</h4>
                            <div className="space-y-1">
                                {[
                                    { date: "Jan 07", c1: 45, c2: 30, c3: 15, c4: 55, staff: "Daniel" },
                                    { date: "Jan 03", c1: 40, c2: 25, c3: 15, c4: 50, staff: "Shanto" },
                                ].map((h, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-muted/30 rounded">
                                        <span className="font-medium text-muted-foreground">{h.date}</span>
                                        <div className="flex gap-2">
                                            <span>{h.c1}-{h.c2}-{h.c3} ({h.c4})</span>
                                        </div>
                                        <span className="text-blue-500">{h.staff}</span>
                                    </div>
                                ))}
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
                    </div>
                </div>
            </DialogContent>
        </Dialog>
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
                                        <img src={machine.imageUrl} alt={machine.name} className="h-full w-full object-cover" />
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
                                            src={machine.imageUrl}
                                            alt={machine.name}
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
                                        machine.payoutStatus === 'Very Low' && "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700"
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
            'Very High': 5,
            'High': 4,
            'OK': 3,
            'Low': 2,
            'Very Low': 1
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

    const renderSortableHeader = (label: string, key: keyof MonitoringReportItem, className?: string) => (
        <TableHead className={className}>
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => requestSort(key)}
            >
                {label}
                <SortIcon columnKey={key} />
            </Button>
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
                            {renderSortableHeader("Payout Status", "payoutStatus", "w-[140px]")}
                            {renderSortableHeader("Tag", "tag")}
                            {renderSortableHeader("Description", "description", "min-w-[200px]")}
                            {renderSortableHeader("Customer Plays", "customerPlays", "text-right justify-end")}
                            {renderSortableHeader("Staff Plays", "staffPlays", "text-right justify-end")}
                            {renderSortableHeader("Payouts", "payouts", "text-right justify-end")}
                            {renderSortableHeader("Plays/Payout", "playsPerPayout", "text-right justify-end")}
                            {renderSortableHeader("Target", "payoutSettings", "text-right justify-end")}
                            {renderSortableHeader("Accuracy %", "payoutAccuracy", "text-right justify-end")}
                            {renderSortableHeader("Settings Date", "settingsDate")}
                            {renderSortableHeader("Staff Name", "staffName")}
                            {renderSortableHeader("C1", "c1", "text-right justify-end")}
                            {renderSortableHeader("C2", "c2", "text-right justify-end")}
                            {renderSortableHeader("C3", "c3", "text-right justify-end")}
                            {renderSortableHeader("C4", "c4", "text-right justify-end")}
                            <TableHead>Image</TableHead>
                            {renderSortableHeader("Remarks", "remarks")}
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
                                <TableCell>
                                    <Badge
                                        className={cn(
                                            "w-full justify-center text-white",
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
                                <TableCell className="font-mono text-xs">{item.tag}</TableCell>
                                <TableCell>
                                    <Link href={`/machines/${item.machineId}`} className="hover:underline text-primary font-medium">
                                        {item.description}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right">{item.customerPlays}</TableCell>
                                <TableCell className="text-right">{item.staffPlays}</TableCell>
                                <TableCell className="text-right">{item.payouts}</TableCell>
                                <TableCell className="text-right font-medium">{item.playsPerPayout}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{item.payoutSettings}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {item.payoutAccuracy > 0 ? (
                                        <span className={cn(
                                            item.payoutAccuracy > 100 ? "text-red-500" : "text-green-500"
                                        )}>
                                            {item.payoutAccuracy}%
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {format(item.settingsDate, 'M/d/yyyy')}<br />
                                    {format(item.settingsDate, 'h:mm:ss a')}
                                </TableCell>
                                <TableCell className="text-xs">{item.staffName}</TableCell>
                                <TableCell className="text-right text-xs">{item.c1}</TableCell>
                                <TableCell className="text-right text-xs">{item.c2}</TableCell>
                                <TableCell className="text-right text-xs">{item.c3}</TableCell>
                                <TableCell className="text-right text-xs">{item.c4}</TableCell>
                                <TableCell>
                                    {item.imageUrl ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <span className="text-xs text-blue-500 cursor-pointer hover:underline">Show Image</span>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                <VisuallyHidden>
                                                    <DialogTitle>{item.description} Image</DialogTitle>
                                                </VisuallyHidden>
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.description}
                                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No image</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.remarks}</TableCell>
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

    const titles = {
        revenue: "Estimated Revenue Drill-down",
        activity: "Activity Leaderboard",
        accuracy: "Payout Accuracy Overview",
        uptime: "Network Health Details"
    };

    const sortedData = useMemo(() => {
        const list = [...machines];
        if (type === 'revenue' || type === 'activity') {
            return list.sort((a, b) => (b.customerPlays || 0) - (a.customerPlays || 0));
        }
        if (type === 'accuracy') {
            return list.filter(m => m.payoutStatus !== 'OK').sort((a, b) => {
                const statusOrder = { 'Very High': 4, 'Very Low': 3, 'High': 2, 'Low': 1, 'OK': 0 };
                return (statusOrder[b.payoutStatus as keyof typeof statusOrder] || 0) - (statusOrder[a.payoutStatus as keyof typeof statusOrder] || 0);
            });
        }
        if (type === 'uptime') {
            return list.filter(m => m.status !== 'online');
        }
        return list;
    }, [machines, type]);

    const chartData = useMemo(() => {
        return sortedData.slice(0, 8).map(m => ({
            name: m.name.substring(0, 10),
            value: type === 'revenue' ? (m.customerPlays || 0) * 3.6 : (m.customerPlays || 0)
        }));
    }, [sortedData, type]);

    return (
        <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{titles[type]}</DialogTitle>
                    <DialogDescription>
                        Breakdown of the top metrics and status alerts for the current period.
                    </DialogDescription>
                </DialogHeader>

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
                                            {type === 'revenue' ? 'Revenue' : (type === 'accuracy' ? 'Status' : 'Plays')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.slice(0, 10).map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs">{m.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{m.location}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2">
                                                {type === 'revenue' && <span className="font-mono text-xs">${((m.customerPlays || 0) * 3.6).toFixed(0)}</span>}
                                                {type === 'activity' && <span className="font-mono text-xs">{m.customerPlays}</span>}
                                                {type === 'accuracy' && (
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] h-4",
                                                        m.payoutStatus === 'Very High' ? "bg-red-500 text-white" :
                                                            (m.payoutStatus === 'Very Low' ? "bg-yellow-600 text-white" : "bg-muted")
                                                    )}>
                                                        {m.payoutStatus}
                                                    </Badge>
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
                            {(type === 'revenue' || type === 'activity') ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} fontSize={10} tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={type === 'revenue' ? '#22c55e' : '#3b82f6'} fillOpacity={0.8 - (index * 0.1)} />
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

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "report">("grid");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
    });

    const [sortOption, setSortOption] = useState<string>("default");

    // Report specific state (mock data for now)
    const [reportData, setReportData] = useState<MonitoringReportItem[]>([]);

    // Aggregated stats from report data
    const stats = useMemo(() => {
        const totalPlays = reportData.reduce((acc, curr) => acc + (curr.customerPlays || 0), 0);
        const totalRevenue = reportData.reduce((acc, curr) => acc + ((curr.customerPlays || 0) * 3.6), 0);
        const criticalCount = reportData.filter(r => r.payoutStatus === 'Very High' || r.payoutStatus === 'Very Low').length;
        const avgAccuracy = reportData.length > 0
            ? Math.round(reportData.reduce((acc, curr) => acc + (curr.payoutAccuracy || 0), 0) / reportData.length)
            : 0;

        return { totalPlays, totalRevenue, criticalCount, avgAccuracy };
    }, [reportData]);

    useEffect(() => {
        const fetchReport = async () => {
            const data = await monitoringService.fetchMonitoringReport(dateRange?.from || new Date(), dateRange?.to || new Date());
            setReportData(data);
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
            const tag = machine.assetTag?.toLowerCase() || machine.tag?.toLowerCase() || "";
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
            {/* Top Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card
                    className="shadow-sm border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('revenue')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Avg <span className="font-medium">${(stats.totalRevenue / Math.max(1, machines.length)).toFixed(1)}</span> / unit
                            <span className="text-[10px] ml-2 text-blue-500 font-medium">Click to show details</span>
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="shadow-sm border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('activity')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customer Activity</CardTitle>
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalPlays.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Plays</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{Math.round(stats.totalPlays / Math.max(1, machines.length))}</span> sessions / unit
                            <span className="text-[10px] ml-2 text-blue-500 font-medium">Click to show details</span>
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="shadow-sm border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('accuracy')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payout Accuracy</CardTitle>
                        <Target className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgAccuracy}%</div>
                        <p className="text-xs text-muted-foreground mt-1 text-orange-600 font-medium">
                            {stats.criticalCount} machines need attention
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="shadow-sm border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveStatDetail('uptime')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
                        <Wifi className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((onlineCount / Math.max(1, machines.length)) * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-green-600">{onlineCount}</span> live, <span className="font-medium text-red-600">{offlineCount}</span> down
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

                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {sortedMachines.map((machine) => (
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
                            <MonitoringReportTable data={sortedMachines as any} />
                        )}
                    </div>

                    <MachineQuickViewDialog
                        machine={quickViewMachine}
                        open={!!quickViewMachine}
                        onOpenChange={(open) => !open && setQuickViewMachine(null)}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <GlobalServiceHistoryTable />
                </TabsContent>

                <TabsContent value="submit">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-4 bg-muted/30 p-4 rounded-lg border">
                            <h2 className="text-sm font-medium mb-2">Select Machine to Auto-fill</h2>
                            <Select
                                value={selectedMachineForAction?.id || ""}
                                onValueChange={(val) => setSelectedMachineForAction(mergedMachines.find(m => m.id === val) || null)}
                            >
                                <SelectTrigger className="w-full md:w-[400px]">
                                    <SelectValue placeholder="Search or select a machine..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {mergedMachines.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name} ({m.assetTag || "No Tag"})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedMachineForAction ? (
                            <ServiceReportForm
                                machine={selectedMachineForAction as ExtendedMachineStatus}
                                onSuccess={() => {
                                    setSelectedMachineForAction(null);
                                    setSelectedTab("monitor");
                                }}
                            />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground border rounded-md bg-muted/10">
                                Please select a machine to submit a report
                            </div>
                        )}
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
