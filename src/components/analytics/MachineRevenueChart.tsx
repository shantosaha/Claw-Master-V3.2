"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChartIcon } from "lucide-react";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";
import { cn } from "@/lib/utils";

type PlayType = 'standard' | 'employee' | 'total';
type ChartType = 'bar' | 'line';
type MetricType = 'revenue' | 'winRate';

interface MachineRevenueChartProps {
    data?: GameReportItem[];
    metric?: MetricType;
    className?: string;
}

export function MachineRevenueChart({ data: propData, metric = 'revenue', className }: MachineRevenueChartProps) {
    const [rawData, setRawData] = useState<GameReportItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Separate filter states
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [subGroupFilter, setSubGroupFilter] = useState<string>('all');
    const [chartType, setChartType] = useState<ChartType>('bar');

    // Get unique groups from data
    const groupOptions = useMemo(() => {
        const groups = new Set<string>();
        rawData.forEach(item => {
            if (item.group) groups.add(item.group);
        });
        return Array.from(groups).sort();
    }, [rawData]);

    // Get unique subgroups based on selected group
    const subGroupOptions = useMemo(() => {
        const subGroups = new Set<string>();
        rawData
            .filter(item => groupFilter === 'all' || item.group === groupFilter)
            .forEach(item => {
                if (item.subGroup) subGroups.add(item.subGroup);
            });
        return Array.from(subGroups).sort();
    }, [rawData, groupFilter]);

    // Reset subgroup when group changes
    useEffect(() => {
        setSubGroupFilter('all');
    }, [groupFilter]);

    // Process and filter data based on selections
    const chartData = useMemo(() => {
        let filtered = [...rawData];

        // Apply location filter
        if (locationFilter !== 'all') {
            if (locationFilter === 'basement') {
                filtered = filtered.filter(item =>
                    item.location?.toLowerCase().includes('basement') ||
                    item.location?.toLowerCase() === 'bm' ||
                    item.description?.includes('BM')
                );
            } else if (locationFilter === 'ground') {
                filtered = filtered.filter(item =>
                    item.location?.toLowerCase().includes('ground') ||
                    item.location?.toLowerCase() === 'g' ||
                    item.description?.endsWith(' G')
                );
            } else if (locationFilter === 'level1') {
                filtered = filtered.filter(item =>
                    item.location?.toLowerCase().includes('level') ||
                    item.location?.toLowerCase() === 'l1' ||
                    item.description?.includes('L1')
                );
            }
        }

        // Apply group filter
        if (groupFilter !== 'all') {
            filtered = filtered.filter(item => item.group === groupFilter);
        }

        // Apply subgroup filter
        if (subGroupFilter !== 'all') {
            filtered = filtered.filter(item => item.subGroup === subGroupFilter);
        }

        // Map to chart format with selected play type
        const processed = filtered
            .map(item => {
                const plays = (item.standardPlays || 0) + (item.empPlays || 0);

                const wins = item.merchandise || 0;
                const winRate = plays > 0 ? (wins / plays) * 100 : 0;

                return {
                    name: item.description || item.assetTag || String(item.tag),
                    plays,
                    revenue: item.totalRev || 0,
                    winRate,
                    wins,
                    group: item.group,
                    subGroup: item.subGroup,
                    location: item.location
                };
            })
            .filter(m => metric === 'revenue' ? m.revenue > 0 : m.plays > 0);

        // Sort based on metric
        if (metric === 'revenue') {
            processed.sort((a, b) => b.revenue - a.revenue);
        } else {
            processed.sort((a, b) => b.winRate - a.winRate);
        }

        return processed.slice(0, chartType === 'line' ? 10 : 5);
    }, [rawData, locationFilter, groupFilter, subGroupFilter, chartType, metric]);

    const loadData = useCallback(async () => {
        if (propData) {
            setRawData(propData);
            return;
        }

        setLoading(true);
        try {
            const gameReportData = await gameReportApiService.fetchTodayReport();
            setRawData(gameReportData);
        } catch (error) {
            console.error("Failed to load machine data:", error);
        } finally {
            setLoading(false);
        }
    }, [propData]);

    useEffect(() => {
        loadData();

        if (!propData) {
            const interval = setInterval(loadData, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [loadData, propData]);

    // Dynamic title based on filters
    const getTitle = () => {
        const metricLabel = metric === 'revenue' ? 'Revenue' : 'Win Rate';
        return `Top Machines - ${metricLabel}`;
    };

    // Get bar color based on play type
    const getBarColor = (index: number) => {
        if (metric === 'winRate') {
            return index % 2 === 0 ? "#10b981" : "#34d399";
        }
        return index % 2 === 0 ? "#7c3aed" : "#8b5cf6";
    };

    const getLineColor = () => {
        if (metric === 'winRate') return "#10b981";
        return "#7c3aed";
    };

    return (
        <Card className={cn("flex flex-col shadow-none border-0 p-0", className)}>
            <CardHeader className="pb-2">
                <div className="flex flex-col gap-2">
                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{getTitle()}</CardTitle>
                        {/* Chart Type Toggle */}
                        <div className="flex gap-1 border rounded-md p-0.5">
                            <Button
                                variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setChartType('bar')}
                            >
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={chartType === 'line' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setChartType('line')}
                            >
                                <LineChartIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex gap-2 flex-wrap">
                        {/* Location Filter */}
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-semibold">All Floors</SelectItem>
                                <SelectItem value="basement" className="text-xs">Basement</SelectItem>
                                <SelectItem value="ground" className="text-xs">Ground</SelectItem>
                                <SelectItem value="level1" className="text-xs">Level 1</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Group Filter */}
                        <Select value={groupFilter} onValueChange={setGroupFilter}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-semibold">All Groups</SelectItem>
                                {groupOptions.map(group => (
                                    <SelectItem key={group} value={group} className="text-xs">
                                        {group.split('-')[1] || group}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* SubGroup Filter - Only show when a group is selected */}
                        {groupFilter !== 'all' && subGroupOptions.length > 0 && (
                            <Select value={subGroupFilter} onValueChange={setSubGroupFilter}>
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue placeholder="SubGroup" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs font-semibold">All SubGroups</SelectItem>
                                    {subGroupOptions.map(subGroup => (
                                        <SelectItem key={subGroup} value={subGroup} className="text-xs">
                                            {subGroup}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-2 flex-1">
                {chartData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                        No data for selected filters
                    </div>
                ) : chartType === 'bar' ? (
                    <ResponsiveContainer width="100%" height={420}>
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                angle={-15}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => metric === 'revenue' ? `$${value}` : `${value.toFixed(0)}%`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                formatter={(value: number, name: string) => {
                                    if (metric === 'revenue') {
                                        return [`$${value.toLocaleString()}`, 'Revenue'];
                                    }
                                    return [`${value.toFixed(1)}%`, 'Win Rate'];
                                }}
                                labelFormatter={(label) => <span className="font-semibold">{label}</span>}
                            />
                            <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={420}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => metric === 'revenue' ? `$${value}` : `${value.toFixed(0)}%`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                formatter={(value: number, name: string) => {
                                    if (metric === 'revenue') {
                                        return [`$${value.toLocaleString()}`, 'Revenue'];
                                    }
                                    return [`${value.toFixed(1)}%`, 'Win Rate'];
                                }}
                                labelFormatter={(label) => <span className="font-semibold">{label}</span>}
                            />
                            <Line
                                type="monotone"
                                dataKey={metric}
                                stroke={getLineColor()}
                                strokeWidth={2}
                                dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
