"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    View,
    Activity,
    PlayCircle,
    DollarSign,
    Ticket,
    Cpu,
    Wifi,
    Calendar,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExtendedMachineStatus } from "./NonCraneMachineCard";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
} from "recharts";

interface NonCraneQuickViewDialogProps {
    machine: ExtendedMachineStatus | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NonCraneQuickViewDialog({
    machine,
    open,
    onOpenChange
}: NonCraneQuickViewDialogProps) {
    if (!machine) return null;

    // Generate trend data based on machine ID
    const trendData = useMemo(() => {
        const seed = machine.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const random = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        return Array.from({ length: 12 }, (_, i) => ({
            time: `${i * 2}h`,
            plays: Math.floor(random(i) * 15) + 2
        }));
    }, [machine.id]);

    const statusColors = {
        online: "bg-green-500",
        offline: "bg-gray-400",
        error: "bg-red-500",
        maintenance: "bg-yellow-500",
    };

    const displayImageUrl = machine.imageUrl;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full", statusColors[machine.status || 'online'])} />
                        <DialogTitle className="text-xl">{machine.name} - Unit Quick View</DialogTitle>
                    </div>
                    <DialogDescription>
                        Performance metrics and technical status for {machine.location}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* visuals and primary metrics */}
                    <div className="space-y-6">
                        <div className="aspect-video relative rounded-xl overflow-hidden border-2 bg-muted shadow-inner">
                            {displayImageUrl ? (
                                <img
                                    src={getThumbnailUrl(displayImageUrl, 600)}
                                    alt={machine.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                                    <View className="h-16 w-16 mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-widest">No Image Available</span>
                                </div>
                            )}
                            <div className="absolute top-3 left-3">
                                <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-[10px] py-0.5">
                                    Tag: {machine.assetTag || 'N/A'}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <PlayCircle className="h-4 w-4 text-blue-500" />
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Plays Today</span>
                                </div>
                                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
                                    {machine.customerPlays ?? 0}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                                    + {machine.staffPlays ?? 0} Staff Tests
                                </div>
                            </Card>
                            <Card className="p-4 bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Est. Revenue</span>
                                </div>
                                <div className="text-2xl font-black text-green-700 dark:text-green-400">
                                    ${((machine.customerPlays || 0) * 3.6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                                    Avg $3.60 / play
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                <Cpu className="h-3.5 w-3.5" />
                                Technical Context
                            </h4>
                            <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Machine Group</p>
                                    <p className="text-xs font-black uppercase tracking-tight">Other Arcade</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Points System</p>
                                    <p className="text-xs font-black flex items-center gap-1.5 text-orange-600">
                                        <Ticket className="h-3.5 w-3.5" />
                                        {machine.payouts ?? 0} Issued
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Connectivity</p>
                                    <div className="flex items-center gap-1.5">
                                        <Wifi className={cn("h-3.5 w-3.5", machine.status === 'online' ? "text-green-500" : "text-muted-foreground")} />
                                        <span className="text-xs font-bold capitalize">{machine.status}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Last Seen</p>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-bold">Today, 10:45 AM</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart and control */}
                    <div className="space-y-6">
                        <div className="bg-card border rounded-xl p-5 shadow-sm">
                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-6 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                24h Play Activity
                            </h4>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorPlaysNonCrane" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 'bold' }}
                                            interval={2}
                                        />
                                        <YAxis hide />
                                        <RechartsTooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontWeight: 'bold',
                                                fontSize: '11px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="plays"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorPlaysNonCrane)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 border-dashed">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                    <Cpu className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h5 className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-1">
                                        Controller Details
                                    </h5>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-relaxed font-medium">
                                        Intercard Reader: <span className="font-black">V4.2</span><br />
                                        Protocol: <span className="font-black">RS-232 / Card-In</span><br />
                                        Pulse Weight: <span className="font-black">100ms</span>
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="pt-2 flex flex-col gap-3">
                            <Button variant="default" className="w-full font-black py-6 text-sm flex items-center justify-center gap-2" asChild>
                                <Link href={`/machines/${machine.id}`}>
                                    Open Full Analysis Page
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full font-bold text-muted-foreground" onClick={() => onOpenChange(false)}>
                                Close Quick View
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
