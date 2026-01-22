"use client";

import { useEffect, useState } from "react";
import { gameReportApiService } from "@/services/gameReportApiService";
import { DollarSign, Gamepad2, TrendingUp, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
    machineId: string;
    assetTag?: string;
    apiTag?: string;
    groups?: string[];
}

export function MachineQuickStats({ assetTag, apiTag, groups }: QuickStatsProps) {
    const [stats, setStats] = useState<{
        totalRevenue: number;
        totalPlays: number;
        avgRevenue: number;
        peakRevenue: number;
        peakDate: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const effectiveTag = apiTag || assetTag;
                if (!effectiveTag) {
                    setLoading(false);
                    return;
                }

                const todayDate = new Date();
                const dailyPromises = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(todayDate);
                    d.setDate(d.getDate() - i);
                    dailyPromises.push(
                        gameReportApiService.fetchGameReport({
                            startDate: d,
                            endDate: d,
                            groups,
                            tag: parseInt(effectiveTag),
                            aggregate: true
                        }).then(reports => ({
                            date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                            reports
                        }))
                    );
                }

                const results = await Promise.all(dailyPromises);

                let totalRev = 0;
                let totalPlays = 0;
                let peakRev = 0;
                let peakDay = "";

                results.forEach(({ date, reports }) => {
                    let dayRev = 0;
                    let dayPlays = 0;
                    if (reports && Array.isArray(reports)) {
                        reports.forEach(r => {
                            dayRev += r.totalRev || 0;
                            dayPlays += (r.standardPlays || 0) + (r.empPlays || 0);
                        });
                    }

                    totalRev += dayRev;
                    totalPlays += dayPlays;
                    if (dayRev > peakRev) {
                        peakRev = dayRev;
                        peakDay = date;
                    }
                });

                setStats({
                    totalRevenue: totalRev,
                    totalPlays: totalPlays,
                    avgRevenue: totalRev / 7,
                    peakRevenue: peakRev,
                    peakDate: peakDay || "N/A"
                });
            } catch (err) {
                console.error("Failed to fetch quick stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [apiTag, assetTag, groups]);

    if (loading) return (
        <div className="flex items-center justify-center p-8 bg-muted/10 rounded-lg border border-dashed">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground font-medium">Calculating stats...</span>
        </div>
    );

    if (!stats) return null;

    const cards = [
        {
            label: "7d Revenue",
            value: `$${stats.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            subLabel: "Total last 7 days"
        },
        {
            label: "7d Total Plays",
            value: stats.totalPlays.toLocaleString(),
            icon: Gamepad2,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
            subLabel: "Standard + Staff"
        },
        {
            label: "Avg Daily Rev",
            value: `$${stats.avgRevenue.toFixed(2)}`,
            icon: TrendingUp,
            color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
            subLabel: "Per day average"
        },
        {
            label: "Best Day",
            value: `$${stats.peakRevenue.toFixed(2)}`,
            icon: Trophy,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
            subLabel: stats.peakDate
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {cards.map((card, i) => (
                <div key={i} className="relative group">
                    <Card className="overflow-hidden border border-border/40 shadow-sm bg-card hover:border-primary/20 transition-all duration-300">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110",
                                    card.color
                                )}>
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80 leading-none">
                                        {card.label}
                                    </p>
                                    <p className="text-xl font-black tracking-tight text-foreground">
                                        {card.value}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-primary/30" />
                                        <p className="text-[10px] text-muted-foreground font-medium truncate italic">
                                            {card.subLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
