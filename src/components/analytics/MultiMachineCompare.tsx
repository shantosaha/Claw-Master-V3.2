"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import { analyticsService, MachinePerformance } from "@/services/analyticsService";
import { Activity, BarChart3 } from "lucide-react";

interface MultiMachineCompareProps {
    days?: number;
    className?: string;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export function MultiMachineCompare({ days = 30, className }: MultiMachineCompareProps) {
    const [machines, setMachines] = useState<MachinePerformance[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedMachines, setSelectedMachines] = useState<MachinePerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMachines();
    }, [days]);

    useEffect(() => {
        if (selectedIds.length > 0) {
            loadComparison();
        } else {
            setSelectedMachines([]);
        }
    }, [selectedIds, days]);

    const loadMachines = async () => {
        setLoading(true);
        try {
            const data = await analyticsService.getMachinePerformance(days);
            setMachines(data);
            // Auto-select first 2 machines
            if (data.length >= 2) {
                setSelectedIds([data[0].id, data[1].id]);
            }
        } catch (error) {
            console.error("Failed to load machines:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadComparison = async () => {
        try {
            const result = await analyticsService.compareMultipleMachines(selectedIds, days);
            setSelectedMachines(result.machines);
        } catch (error) {
            console.error("Failed to load comparison:", error);
        }
    };

    const handleMachineSelect = (index: number, machineId: string) => {
        const newIds = [...selectedIds];
        newIds[index] = machineId;
        setSelectedIds(newIds.filter(Boolean));
    };

    const addMachineSlot = () => {
        if (selectedIds.length < 4) {
            const availableMachine = machines.find((m) => !selectedIds.includes(m.id));
            if (availableMachine) {
                setSelectedIds([...selectedIds, availableMachine.id]);
            }
        }
    };

    const removeMachineSlot = (index: number) => {
        const newIds = selectedIds.filter((_, i) => i !== index);
        setSelectedIds(newIds);
    };

    // Prepare radar data
    const radarData = ["plays", "revenue", "winRate", "uptime"].map((metric) => ({
        metric: metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, " $1"),
        ...selectedMachines.reduce(
            (acc, m, i) => ({
                ...acc,
                [`machine${i}`]: (m as any)[metric],
            }),
            {}
        ),
    }));

    // Prepare bar data
    const barData = selectedMachines.map((m, i) => ({
        name: m.name.length > 15 ? m.name.substring(0, 15) + "..." : m.name,
        fullName: m.name,
        revenue: m.revenue,
        plays: m.plays,
        color: COLORS[i],
    }));

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="animate-pulse h-[400px] bg-muted rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Multi-Machine Comparison
                </CardTitle>
                <CardDescription>Select up to 4 machines to compare side-by-side</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Machine Selectors */}
                <div className="flex flex-wrap gap-3">
                    {selectedIds.map((id, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index] }}
                            />
                            <Select
                                value={id}
                                onValueChange={(value) => handleMachineSelect(index, value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={`Machine ${index + 1}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {machines
                                        .filter((m) => !selectedIds.includes(m.id) || m.id === id)
                                        .map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {selectedIds.length > 2 && (
                                <button
                                    onClick={() => removeMachineSlot(index)}
                                    className="text-muted-foreground hover:text-foreground text-sm"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    {selectedIds.length < 4 && (
                        <button
                            onClick={addMachineSlot}
                            className="px-3 py-2 text-sm border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                        >
                            + Add Machine
                        </button>
                    )}
                </div>

                {selectedMachines.length >= 2 && (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Radar Chart */}
                        <div className="p-4 rounded-lg border bg-muted/30">
                            <h4 className="text-sm font-medium mb-3">Performance Radar</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="metric" fontSize={12} />
                                    <PolarRadiusAxis fontSize={10} />
                                    {selectedMachines.map((_, i) => (
                                        <Radar
                                            key={i}
                                            name={selectedMachines[i]?.name || `Machine ${i + 1}`}
                                            dataKey={`machine${i}`}
                                            stroke={COLORS[i]}
                                            fill={COLORS[i]}
                                            fillOpacity={0.2}
                                        />
                                    ))}
                                    <Legend />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar Comparison */}
                        <div className="p-4 rounded-lg border bg-muted/30">
                            <h4 className="text-sm font-medium mb-3">Revenue & Plays</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            name === "revenue" ? `$${value}` : value,
                                            name.charAt(0).toUpperCase() + name.slice(1),
                                        ]}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="plays" fill="#06b6d4" name="Plays" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Metrics Table */}
                {selectedMachines.length >= 2 && (
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b">
                                    <th className="h-10 px-4 text-left font-medium">Metric</th>
                                    {selectedMachines.map((m, i) => (
                                        <th key={m.id} className="h-10 px-4 text-right font-medium">
                                            <span
                                                className="inline-flex items-center gap-1.5"
                                                style={{ color: COLORS[i] }}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: COLORS[i] }}
                                                />
                                                {m.name.length > 12 ? m.name.substring(0, 12) + "..." : m.name}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { key: "revenue", label: "Revenue", format: (v: number) => `$${v}` },
                                    { key: "plays", label: "Plays", format: (v: number) => v.toLocaleString() },
                                    { key: "winRate", label: "Win Rate", format: (v: number) => `${v}%` },
                                    { key: "uptime", label: "Uptime", format: (v: number) => `${v}%` },
                                    { key: "avgPlayValue", label: "Avg Play Value", format: (v: number) => `$${v}` },
                                ].map((row) => (
                                    <tr key={row.key} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-medium">{row.label}</td>
                                        {selectedMachines.map((m) => (
                                            <td key={m.id} className="p-3 text-right">
                                                {row.format((m as any)[row.key])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
