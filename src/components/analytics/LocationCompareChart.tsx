"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { analyticsService, LocationComparison } from "@/services/analyticsService";
import { MapPin, DollarSign, PlayCircle, Activity } from "lucide-react";

interface LocationCompareChartProps {
    className?: string;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function LocationCompareChart({ className }: LocationCompareChartProps) {
    const [data, setData] = useState<LocationComparison[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const locationData = await analyticsService.compareLocations();
            setData(locationData);
        } catch (error) {
            console.error("Failed to load location comparison:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="animate-pulse h-[300px] bg-muted rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location Comparison
                </CardTitle>
                <CardDescription>Performance metrics across all locations</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" stroke="#888888" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey="location"
                            stroke="#888888"
                            fontSize={12}
                            width={100}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "hsl(var(--card))",
                            }}
                            formatter={(value: number, name: string) => [
                                name === "revenue" ? `$${value.toLocaleString()}` : value.toLocaleString(),
                                name.charAt(0).toUpperCase() + name.slice(1),
                            ]}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="plays" fill="#06b6d4" name="Plays" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {data.slice(0, 4).map((loc, index) => (
                        <div
                            key={loc.location}
                            className="p-3 rounded-lg bg-muted/50 border"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium truncate">{loc.location}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-muted-foreground">Machines</p>
                                    <p className="font-semibold">{loc.machines}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Win Rate</p>
                                    <p className="font-semibold">{loc.winRate}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
