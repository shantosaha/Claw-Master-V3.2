"use client";

import { useEffect, useState, useCallback } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { machineService } from "@/services";
import { gameReportApiService } from "@/services/gameReportApiService";
import { ArcadeMachine } from "@/types";

// Type for machine service with optional subscribe method
interface MachineServiceWithSubscribe {
    subscribe?: (callback: (machines: ArcadeMachine[]) => void) => () => void;
}

export function MachinePerformanceChart() {
    const [data, setData] = useState<{ name: string; plays: number; revenue: number }[]>([]);

    // Define loadData before useEffect to fix declaration order
    const loadData = useCallback(async () => {
        try {
            const machines = await machineService.getAll();

            // Fetch today's game report data from API
            const gameReportData = await gameReportApiService.fetchTodayReport();

            // Create a map of assetTag -> game data
            const playsByTag = new Map<string, { plays: number; revenue: number }>();
            for (const item of gameReportData) {
                const tag = String(item.assetTag || item.tag).trim().toLowerCase();
                if (tag) {
                    playsByTag.set(tag, {
                        plays: (item.standardPlays || 0) + (item.empPlays || 0),
                        revenue: item.totalRev || 0,
                    });
                }
            }

            // Map machines to their play counts from API
            const machinesWithPlays = machines.map(m => {
                const machineTag = String(m.assetTag || m.tag || '').trim().toLowerCase();
                const apiData = playsByTag.get(machineTag);
                return {
                    name: m.name,
                    plays: apiData?.plays || m.playCount || 0,
                    revenue: apiData?.revenue || 0,
                };
            });

            // Sort by play count and take top 5
            const topMachines = machinesWithPlays
                .sort((a, b) => b.plays - a.plays)
                .slice(0, 5);

            setData(topMachines);
        } catch (error) {
            console.error("Failed to load machine data:", error);
        }
    }, []);

    useEffect(() => {
        // Initial load
        loadData();

        // Refresh every 5 minutes
        const interval = setInterval(loadData, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
        };
    }, [loadData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Machines (Play Count)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', color: 'black' }}
                        />
                        <Bar dataKey="plays" fill="#7c3aed" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#7c3aed" : "#8b5cf6"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
