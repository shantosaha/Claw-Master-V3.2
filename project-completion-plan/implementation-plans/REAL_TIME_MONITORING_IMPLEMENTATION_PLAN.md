# Real-Time Monitoring Implementation Plan

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Settings Tracker
- **Feature**: Real-Time Machine Monitoring
- **Priority**: P0 Critical
- **Estimated Effort**: 40-60 hours

---

## 1. Feature Overview

### Current State
The `/monitoring` page is a placeholder displaying "Live Feed Coming Soon".

### Target State
A fully functional real-time monitoring dashboard showing:
- Live machine status across all locations
- Real-time telemetry data (voltage, plays, win rate)
- Alert system for errors and issues
- Historical data visualization
- Quick action capabilities

---

## 2. Technical Architecture

### Data Flow

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Game Machines │────▶│  External API  │────▶│   Claw Master  │
│   (Physical)   │     │   (Telemetry)  │     │     (App)      │
└────────────────┘     └────────────────┘     └────────────────┘
                              │
                       Poll every 30s
                              │
                              ▼
                       ┌────────────────┐
                       │  Data Process  │
                       │  & Transform   │
                       └────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │ Firebase │    │  React   │    │  Alert   │
       │ Storage  │    │  State   │    │  System  │
       └──────────┘    └──────────┘    └──────────┘
```

### Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Real-time Updates | Firebase Realtime DB or Polling | Simple, scales well |
| State Management | React Context + useReducer | Centralized state |
| Charts | Recharts | Already in use |
| Alerts | Sonner toast + Badge | Consistent with app |

---

## 3. Implementation Phases

### Phase 1: Data Layer (Week 1)

#### 3.1.1 Create Monitoring Service

```typescript
// src/services/monitoringService.ts
import { apiService } from './apiService';

export interface MachineStatus {
  id: string;
  assetTag: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  lastPing: Date;
  telemetry: {
    voltage: number;
    playCountToday: number;
    winRate: number;
    temperature?: number;
    errorCode?: string;
  };
}

export interface MonitoringAlert {
  id: string;
  machineId: string;
  machineName: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

class MonitoringService {
  private subscribers: Map<string, (data: MachineStatus[]) => void> = new Map();
  private alertSubscribers: Map<string, (alerts: MonitoringAlert[]) => void> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastData: MachineStatus[] = [];
  private alerts: MonitoringAlert[] = [];

  async fetchMachineStatuses(): Promise<MachineStatus[]> {
    try {
      const response = await apiService.fetchGames();
      return this.transformToMachineStatuses(response);
    } catch (error) {
      console.error('Failed to fetch machine statuses:', error);
      throw error;
    }
  }

  private transformToMachineStatuses(apiData: any[]): MachineStatus[] {
    return apiData.map(item => ({
      id: item.id || item.assetTag,
      assetTag: item.assetTag,
      name: item.name,
      location: item.location,
      status: this.determineStatus(item),
      lastPing: new Date(item.lastUpdate || Date.now()),
      telemetry: {
        voltage: item.voltage || 0,
        playCountToday: item.playsToday || 0,
        winRate: item.winRate || 0,
        temperature: item.temperature,
        errorCode: item.errorCode,
      },
    }));
  }

  private determineStatus(item: any): MachineStatus['status'] {
    if (item.errorCode) return 'error';
    if (item.maintenanceMode) return 'maintenance';
    const lastUpdate = new Date(item.lastUpdate || 0);
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (lastUpdate.getTime() < fiveMinutesAgo) return 'offline';
    return 'online';
  }

  startPolling(intervalMs: number = 30000): void {
    if (this.pollingInterval) return;
    
    // Initial fetch
    this.poll();
    
    // Set up interval
    this.pollingInterval = setInterval(() => this.poll(), intervalMs);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const data = await this.fetchMachineStatuses();
      this.checkForAlerts(data);
      this.lastData = data;
      this.notifySubscribers(data);
    } catch (error) {
      // Notify error state
      this.alerts.push({
        id: Date.now().toString(),
        machineId: 'system',
        machineName: 'System',
        type: 'error',
        message: 'Failed to fetch machine data',
        timestamp: new Date(),
        acknowledged: false,
      });
      this.notifyAlertSubscribers();
    }
  }

  private checkForAlerts(newData: MachineStatus[]): void {
    for (const machine of newData) {
      const previous = this.lastData.find(m => m.id === machine.id);
      
      // Check for status changes
      if (previous && previous.status !== machine.status) {
        if (machine.status === 'error' || machine.status === 'offline') {
          this.alerts.push({
            id: Date.now().toString() + machine.id,
            machineId: machine.id,
            machineName: machine.name,
            type: machine.status === 'error' ? 'error' : 'warning',
            message: `Machine ${machine.name} is now ${machine.status}`,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
      
      // Check for low voltage
      if (machine.telemetry.voltage < 100 && machine.telemetry.voltage > 0) {
        const existingAlert = this.alerts.find(
          a => a.machineId === machine.id && a.message.includes('voltage')
        );
        if (!existingAlert) {
          this.alerts.push({
            id: Date.now().toString() + machine.id + 'voltage',
            machineId: machine.id,
            machineName: machine.name,
            type: 'warning',
            message: `Low voltage detected: ${machine.telemetry.voltage}V`,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
    }
    
    this.notifyAlertSubscribers();
  }

  subscribe(id: string, callback: (data: MachineStatus[]) => void): () => void {
    this.subscribers.set(id, callback);
    // Send current data immediately
    if (this.lastData.length > 0) {
      callback(this.lastData);
    }
    return () => this.subscribers.delete(id);
  }

  subscribeToAlerts(id: string, callback: (alerts: MonitoringAlert[]) => void): () => void {
    this.alertSubscribers.set(id, callback);
    if (this.alerts.length > 0) {
      callback(this.alerts);
    }
    return () => this.alertSubscribers.delete(id);
  }

  private notifySubscribers(data: MachineStatus[]): void {
    this.subscribers.forEach(callback => callback(data));
  }

  private notifyAlertSubscribers(): void {
    this.alertSubscribers.forEach(callback => callback([...this.alerts]));
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifyAlertSubscribers();
    }
  }

  clearAcknowledgedAlerts(): void {
    this.alerts = this.alerts.filter(a => !a.acknowledged);
    this.notifyAlertSubscribers();
  }
}

export const monitoringService = new MonitoringService();
```

#### 3.1.2 Create Monitoring Hook

```typescript
// src/hooks/useMonitoring.ts
import { useState, useEffect, useCallback } from 'react';
import { monitoringService, MachineStatus, MonitoringAlert } from '@/services/monitoringService';

export function useMonitoring() {
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
      await monitoringService.fetchMachineStatuses();
    } catch (err) {
      setError('Failed to refresh data');
    }
    setIsLoading(false);
  }, []);

  // Computed values
  const onlineCount = machines.filter(m => m.status === 'online').length;
  const offlineCount = machines.filter(m => m.status === 'offline').length;
  const errorCount = machines.filter(m => m.status === 'error').length;
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
    acknowledgeAlert,
    refresh,
  };
}
```

---

### Phase 2: UI Components (Week 2)

#### 3.2.1 Machine Status Card

```typescript
// src/components/monitoring/MachineStatusCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  PlayCircle, 
  Percent, 
  AlertTriangle,
  Settings,
  Eye
} from "lucide-react";
import { MachineStatus } from "@/services/monitoringService";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MachineStatusCardProps {
  machine: MachineStatus;
  onViewDetails?: () => void;
}

export function MachineStatusCard({ machine, onViewDetails }: MachineStatusCardProps) {
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
      machine.status === 'error' && "border-red-300 bg-red-50/50",
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
              {machine.location} • {machine.assetTag}
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
              <p className="text-xs font-medium">{machine.telemetry.voltage}V</p>
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
            <div className="flex items-center gap-2 p-2 rounded bg-red-100 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">{machine.telemetry.errorCode}</span>
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
```

#### 3.2.2 Alert Panel

```typescript
// src/components/monitoring/AlertPanel.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { MonitoringAlert } from "@/services/monitoringService";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AlertPanelProps {
  alerts: MonitoringAlert[];
  onAcknowledge: (alertId: string) => void;
}

export function AlertPanel({ alerts, onAcknowledge }: AlertPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  
  const alertIcons = {
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  const alertStyles = {
    error: "border-l-red-500 bg-red-50",
    warning: "border-l-yellow-500 bg-yellow-50",
    info: "border-l-blue-500 bg-blue-50",
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className={cn(
      "mb-4 transition-all duration-200",
      unacknowledgedCount > 0 && "border-red-200 animate-pulse-slow"
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
              {alerts.filter(a => !a.acknowledged).map((alert) => (
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
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
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
```

---

### Phase 3: Main Page (Week 3)

#### 3.3.1 Monitoring Page

```typescript
// src/app/monitoring/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useMonitoring } from "@/hooks/useMonitoring";
import { MachineStatusCard } from "@/components/monitoring/MachineStatusCard";
import { AlertPanel } from "@/components/monitoring/AlertPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
        machine.assetTag.toLowerCase().includes(searchQuery.toLowerCase());
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
                • Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
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
              <div className="p-2 rounded-full bg-green-100">
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
              <div className="p-2 rounded-full bg-gray-100">
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
              <div className="p-2 rounded-full bg-red-100">
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
              <div className="p-2 rounded-full bg-blue-100">
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
        <Card className="border-red-200 bg-red-50">
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
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-6 w-20 mb-4" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Machine Grid */}
      {!isLoading && filteredMachines.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No machines found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}

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
```

---

## 4. Testing Strategy

### Unit Tests

```typescript
// src/services/__tests__/monitoringService.test.ts
describe('MonitoringService', () => {
  it('transforms API data correctly', () => {});
  it('determines status based on lastUpdate', () => {});
  it('creates alerts for status changes', () => {});
  it('detects low voltage conditions', () => {});
});
```

### Integration Tests

```typescript
// src/components/monitoring/__tests__/MachineStatusCard.test.tsx
describe('MachineStatusCard', () => {
  it('displays machine information', () => {});
  it('shows correct status indicator', () => {});
  it('shows error message when present', () => {});
});
```

### E2E Tests

```typescript
// e2e/monitoring.spec.ts
test('monitoring page loads and displays machines', async ({ page }) => {
  await page.goto('/monitoring');
  await expect(page.locator('h1')).toContainText('Monitoring');
  await expect(page.locator('[data-testid="machine-card"]')).toHaveCount.gte(1);
});
```

---

## 5. Success Criteria

- [ ] Page loads and displays machine data
- [ ] Auto-refresh every 30 seconds
- [ ] Status indicators update in real-time
- [ ] Alerts appear for status changes
- [ ] Filtering works correctly
- [ ] Search works correctly
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Loading states display correctly

---

## 6. Timeline

| Week | Tasks |
|------|-------|
| 1 | Data layer, monitoring service, hook |
| 2 | UI components (cards, alerts, filters) |
| 3 | Main page integration, testing |
| 4 | Polish, performance optimization |
