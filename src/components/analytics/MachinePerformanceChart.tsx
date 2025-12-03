"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { machineService } from "@/services";
import { ArcadeMachine } from "@/types";

export function MachinePerformanceChart() {
    const [data, setData] = useState<{ name: string; plays: number }[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const machines = await machineService.getAll();
            // Sort by play count and take top 5
            const topMachines = machines
                .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
                .slice(0, 5)
                .map(m => ({
                    name: m.name,
                    plays: m.playCount || 0,
                }));
            setData(topMachines);
        } catch (error) {
            console.error("Failed to load machine data:", error);
        }
    };

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
