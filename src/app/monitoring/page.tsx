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
    ArrowDown
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
                        {/* Machine Image (Small) */}
                        <div className="h-16 w-16 bg-muted rounded-md flex-shrink-0 overflow-hidden border">
                            {machine.imageUrl ? (
                                <img src={machine.imageUrl} alt={machine.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-secondary">
                                    <View className="h-6 w-6 text-muted-foreground opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Name and Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate w-full" title={machine.name}>
                                {machine.name}
                            </h3>
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
                                    onAction('compare', machine);
                                }
                            }}
                            asChild={!onAction}
                        >
                            {!onAction ? (
                                <Link href={`/machines/${machine.id}`}>
                                    View Details
                                </Link>
                            ) : "Compare"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs border-dashed"
                            onClick={(e) => {
                                if (onAction) {
                                    e.preventDefault();
                                    onAction('submit_report', machine);
                                }
                            }}
                            asChild={!onAction}
                        >
                            {!onAction ? (
                                <Link href={`/machines/${machine.id}?tab=settings`}>
                                    Settings
                                </Link>
                            ) : "Service"}
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
                <Button variant="ghost" size="sm">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
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
                                    <span className="text-xs text-blue-500 cursor-pointer hover:underline">Show Image</span>
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
    const [viewMode, setViewMode] = useState<"grid" | "report">("grid");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
    });

    const [sortOption, setSortOption] = useState<string>("default");

    // Report specific state (mock data for now)
    const [reportData, setReportData] = useState<MonitoringReportItem[]>([]);

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
            const query = searchQuery.toLowerCase() || "";

            const matchesSearch = name.includes(query) || tag.includes(query);
            const matchesLocation = locationFilter === "all" || machine.location === locationFilter;
            return matchesSearch && matchesLocation;
        });
    }, [mergedMachines, searchQuery, locationFilter]);

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

    const [selectedMachineForAction, setSelectedMachineForAction] = useState<ExtendedMachineStatus | null>(null);
    const [selectedTab, setSelectedTab] = useState("monitor");

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
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Online Machines</CardTitle>
                        <Wifi className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{onlineCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {((onlineCount / machines.length) * 100).toFixed(1)}% Operational
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <Activity className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unacknowledgedAlerts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires Attention
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payout Health</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder logic for aggregate payout health */}
                        <div className="text-2xl font-bold">
                            {Math.round(reportData.reduce((acc, curr) => acc + (curr.customerPlays + curr.staffPlays), 0) / Math.max(1, reportData.reduce((acc, curr) => acc + curr.payouts, 0)))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg Plays / Win
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Live</div>
                        <p className="text-xs text-muted-foreground">
                            Last updated: {lastUpdate ? format(lastUpdate, 'h:mm:ss a') : 'Never'}
                        </p>
                    </CardContent>
                </Card>
            </div>

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
                                        placeholder="Search machines..."
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

                                <Select value={locationFilter} onValueChange={setLocationFilter}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Locations</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* New Sort Dropdown for Grid View */}
                                <Select value={sortOption} onValueChange={setSortOption}>
                                    <SelectTrigger className="w-[160px] h-9">
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
                                            if (action === 'submit_report') {
                                                setSelectedMachineForAction(machine);
                                                setSelectedTab("submit");
                                            } else if (action === 'compare') {
                                                setSelectedMachineForAction(machine);
                                                setSelectedTab("comparison");
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <MonitoringReportTable data={sortedMachines as any} />
                        )}
                    </div>
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
                                machine={selectedMachineForAction as any}
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
