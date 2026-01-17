"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { View, Users, Ticket, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import { MachineStatus, MonitoringReportItem } from "@/services/monitoringService";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
} from "recharts";

type ExtendedMachineStatus = MachineStatus & Partial<MonitoringReportItem> & { group?: string };

interface NonCraneQuickViewDialogProps {
    machine: ExtendedMachineStatus | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Simplified quick view dialog for non-crane machines.
 * Shows basic status, plays, revenue without claw-specific features.
 */
export function NonCraneQuickViewDialog({
    machine,
    open,
    onOpenChange
}: NonCraneQuickViewDialogProps) {
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

    // Calculate estimated revenue
    const estimatedRevenue = ((machine.customerPlays || 0) * 1.8).toFixed(0);
    const avgRevenuePerPlay = machine.customerPlays && machine.customerPlays > 0
        ? (parseFloat(estimatedRevenue) / machine.customerPlays).toFixed(2)
        : "0.00";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full", statusColors[machine.status || 'online'])} />
                        <DialogTitle>{machine.name} - Quick View</DialogTitle>
                    </div>
                    <DialogDescription>
                        Status and performance metrics for {machine.location}
                        {machine.group && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                {machine.group}
                            </Badge>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Visuals & Status */}
                    <div className="space-y-4">
                        <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                            {machine.imageUrl ? (
                                <img
                                    src={getThumbnailUrl(machine.imageUrl, 600)}
                                    alt={machine.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <View className="h-12 w-12 text-muted-foreground opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-3 bg-muted/30">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Customer Plays
                                </p>
                                <p className="text-xl font-bold">{machine.customerPlays ?? 0}</p>
                            </Card>
                            <Card className="p-3 bg-muted/30">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Est. Revenue
                                </p>
                                <p className="text-xl font-bold text-green-600">${estimatedRevenue}</p>
                            </Card>
                        </div>

                        {/* Performance Details */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Performance Metrics</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t pt-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground text-[11px]">Staff Plays:</span>
                                    <span className="font-mono font-bold text-blue-500">{machine.staffPlays ?? 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground text-[11px]">Avg $/Play:</span>
                                    <span className="font-mono font-bold text-green-600">${avgRevenuePerPlay}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                                        <Ticket className="h-3 w-3" />
                                        Points:
                                    </span>
                                    <span className="font-mono font-bold text-purple-600">{(machine as any).points ?? '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground text-[11px]">Machine Type:</span>
                                    <span className="font-medium text-muted-foreground">{machine.group || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Info */}
                    <div className="space-y-4">
                        <div className="h-[200px] w-full">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                24h Activity Trend
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorPlaysNonCrane" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorPlaysNonCrane)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Machine Info */}
                        <div className="space-y-2 pt-4">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground">Machine Information</h4>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] p-2 bg-muted/30 rounded">
                                    <span className="font-medium text-muted-foreground">Location</span>
                                    <span>{machine.location}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] p-2 bg-muted/30 rounded">
                                    <span className="font-medium text-muted-foreground">Asset Tag</span>
                                    <span className="font-mono">{machine.assetTag || machine.tag || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] p-2 bg-muted/30 rounded">
                                    <span className="font-medium text-muted-foreground">Status</span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] capitalize",
                                            machine.status === 'online' && "bg-green-100 text-green-800",
                                            machine.status === 'offline' && "bg-gray-100 text-gray-800",
                                            machine.status === 'error' && "bg-red-100 text-red-800",
                                            machine.status === 'maintenance' && "bg-yellow-100 text-yellow-800"
                                        )}
                                    >
                                        {machine.status}
                                    </Badge>
                                </div>
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
