"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revenueApiService } from "@/services/revenueApiService";
import { Loader2, AlertCircle } from "lucide-react";

interface ChartDataPoint {
    name: string;
    total: number;
}

export function RevenueChart() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRevenueData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch last 7 days of revenue data
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

                const revenueData = await revenueApiService.fetchRevenue({
                    startDate,
                    endDate,
                    aggregate: false // Get daily breakdown
                });

                if (revenueData.length === 0) {
                    // No data available
                    setData([]);
                    setLoading(false);
                    return;
                }

                // Aggregate by date
                const byDate = new Map<string, number>();
                for (const item of revenueData) {
                    if (!item.date) continue; // Skip items without date
                    const dateKey = item.date;
                    const current = byDate.get(dateKey) || 0;
                    byDate.set(dateKey, current + item.total);
                }

                // Convert to chart format
                const chartData: ChartDataPoint[] = [];
                const today = new Date();

                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                    chartData.push({
                        name: dayName,
                        total: byDate.get(dateStr) || 0
                    });
                }

                setData(chartData);
            } catch (err) {
                console.error("Failed to fetch revenue data:", err);
                setError("Unable to load revenue data");
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                {loading ? (
                    <div className="flex items-center justify-center h-[350px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                ) : data.every(d => d.total === 0) ? (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                        No revenue data available for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                                contentStyle={{ borderRadius: '8px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#10b981"
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
