"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    RefreshCw,
    Activity,
    Wifi,
    WifiOff,
    AlertTriangle,
    AlertCircle,
    Search,
    LayoutGrid,
    List,
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
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { monitoringService, MachineStatus, MonitoringAlert } from "@/services/monitoringService";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import Link from "next/link";

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

// Machine Status Card Component
function MachineStatusCard({ machine }: { machine: MachineStatus }) {
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
            machine.status === 'offline' && "opacity-60"
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

            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Header */}
                    <div>
                        <h3 className="font-semibold text-sm truncate pr-6">
                            {machine.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {machine.location} • {machine.assetTag || 'No Tag'}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <Badge
                        variant="outline"
                        className={cn("text-xs capitalize", statusBadgeVariants[machine.status])}
                    >
                        {machine.status}
                    </Badge>

                    {/* Telemetry */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                            <Zap className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
                            <p className="text-xs font-medium">{machine.telemetry.voltage.toFixed(0)}V</p>
                            <p className="text-[10px] text-muted-foreground">Voltage</p>
                        </div>
                        <div className="text-center">
                            <PlayCircle className="h-3 w-3 mx-auto mb-1 text-blue-500" />
                            <p className="text-xs font-medium">{machine.telemetry.playCountToday}</p>
                            <p className="text-[10px] text-muted-foreground">Plays</p>
                        </div>
                        <div className="text-center">
                            <Percent className="h-3 w-3 mx-auto mb-1 text-green-500" />
                            <p className="text-xs font-medium">{machine.telemetry.winRate}%</p>
                            <p className="text-[10px] text-muted-foreground">Win Rate</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {machine.telemetry.errorCode && (
                        <div className="flex items-center gap-2 p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs truncate">{machine.telemetry.errorCode}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/machines/${machine.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-3 w-3 mr-1" />
                            Settings
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
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Get unique locations
    const locations = useMemo(() => {
        const locs = [...new Set(machines.map(m => m.location))];
        return locs.sort();
    }, [machines]);

    // Filter machines
    const filteredMachines = useMemo(() => {
        return machines.filter(machine => {
            const matchesSearch =
                machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (machine.assetTag && machine.assetTag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === "all" || machine.status === statusFilter;
            const matchesLocation = locationFilter === "all" || machine.location === locationFilter;
            return matchesSearch && matchesStatus && matchesLocation;
        });
    }, [machines, searchQuery, statusFilter, locationFilter]);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Real-time Monitoring
                        {isLoading && (
                            <Badge variant="outline" className="animate-pulse">
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Updating...
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Live machine status and telemetry data
                        {lastUpdate && (
                            <span className="ml-2 text-xs">
                                • Updated {formatTimeAgo(lastUpdate)}
                            </span>
                        )}
                    </p>
                </div>
                <Button onClick={refresh} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Wifi className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{onlineCount}</p>
                                <p className="text-xs text-muted-foreground">Online</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                <WifiOff className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{offlineCount}</p>
                                <p className="text-xs text-muted-foreground">Offline</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{errorCount}</p>
                                <p className="text-xs text-muted-foreground">Errors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{machines.length}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Panel */}
            {unacknowledgedAlerts.length > 0 && (
                <AlertPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />
            )}

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search machines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-md p-1">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="py-4 text-center text-red-600">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p>{error}</p>
                        <Button variant="outline" onClick={refresh} className="mt-2">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && machines.length === 0 && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <LoadingSkeleton variant="card" count={8} />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredMachines.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No machines found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </CardContent>
                </Card>
            )}

            {/* Machine Grid */}
            <div className={cn(
                "grid gap-4",
                viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
            )}>
                {filteredMachines.map((machine) => (
                    <MachineStatusCard key={machine.id} machine={machine} />
                ))}
            </div>
        </div>
    );
}
