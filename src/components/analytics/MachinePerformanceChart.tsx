"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChartIcon, Gamepad2, Settings2, Check } from "lucide-react";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type PlayType = 'standard' | 'employee' | 'total';
type ChartType = 'bar' | 'line';

interface MachinePerformanceChartProps {
    data?: GameReportItem[];
    className?: string;
}

export function MachinePerformanceChart({ data: propData, className }: MachinePerformanceChartProps) {
    const [rawData, setRawData] = useState<GameReportItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Separate filter states
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [subGroupFilter, setSubGroupFilter] = useState<string>('all');
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [excludedTags, setExcludedTags] = useState<string[]>([]);

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

        // Apply exclusion filter
        if (excludedTags.length > 0) {
            filtered = filtered.filter(item => !excludedTags.includes(String(item.tag)));
        }

        // Map to chart format with selected play type
        const processed = filtered
            .map(item => {
                const plays = (item.standardPlays || 0) + (item.empPlays || 0);
                return {
                    name: item.description || item.assetTag || String(item.tag),
                    plays,
                    revenue: item.totalRev || 0,
                    group: item.group,
                    subGroup: item.subGroup,
                    location: item.location
                };
            })
            .filter(m => m.plays > 0)
            .sort((a, b) => b.plays - a.plays)
            .slice(0, chartType === 'line' ? 10 : 5);

        return processed;
    }, [rawData, locationFilter, groupFilter, subGroupFilter, chartType, excludedTags]);

    // All distinct machines for the exclusion list
    const allMachines = useMemo(() => {
        const unique = new Map();
        rawData.forEach(item => {
            if (item.tag) {
                const name = item.description || item.assetTag || String(item.tag);
                unique.set(String(item.tag), name);
            }
        });
        return Array.from(unique.entries())
            .map(([tag, name]) => ({ tag, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rawData]);

    const toggleExclusion = (tag: string) => {
        setExcludedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

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
        return `Top Machines - Total Plays`;
    };

    // Get bar color based on play type
    const getBarColor = (index: number) => {
        return index % 2 === 0 ? "#10b981" : "#34d399";
    };

    const getLineColor = () => {
        return "#10b981";
    };

    return (
        <Card className={cn("flex flex-col", className)}>
            <CardHeader className="pb-2">
                <div className="flex flex-col gap-2">
                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5 text-emerald-500" />
                            {getTitle()}
                        </CardTitle>
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
                </div>
            </CardHeader>
            <CardContent className="pl-2 flex-1 flex flex-col gap-4">
                {/* Filters Row */}
                <div className="flex gap-2 flex-wrap px-2">
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

                    {/* Exclusion Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                                <Settings2 className="h-3.5 w-3.5" />
                                {excludedTags.length > 0 ? (
                                    <>Excluded <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">{excludedTags.length}</Badge></>
                                ) : (
                                    "Filter Games"
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search machines..." className="h-8 text-xs" />
                                <CommandList>
                                    <CommandEmpty className="py-2 text-xs text-center">No machine found.</CommandEmpty>
                                    <CommandGroup>
                                        <ScrollArea className="h-64">
                                            {allMachines.map((m) => (
                                                <CommandItem
                                                    key={m.tag}
                                                    onSelect={() => toggleExclusion(m.tag)}
                                                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                                                >
                                                    <div className={cn(
                                                        "flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary",
                                                        excludedTags.includes(m.tag) ? "bg-primary text-primary-foreground" : "opacity-50"
                                                    )}>
                                                        {excludedTags.includes(m.tag) && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <span className="text-xs flex-1 truncate">{m.name}</span>
                                                    {excludedTags.includes(m.tag) && (
                                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Hidden</span>
                                                    )}
                                                </CommandItem>
                                            ))}
                                        </ScrollArea>
                                    </CommandGroup>
                                </CommandList>
                                {excludedTags.length > 0 && (
                                    <div className="p-2 border-t flex justify-between items-center bg-muted/30">
                                        <span className="text-[10px] text-muted-foreground">{excludedTags.length} machines hidden</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px]"
                                            onClick={() => setExcludedTags([])}
                                        >
                                            Reset All
                                        </Button>
                                    </div>
                                )}
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex-1 min-h-0">
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
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(value: number) => [value.toLocaleString(), 'Plays']}
                                    labelFormatter={(label) => <span className="font-semibold">{label}</span>}
                                />
                                <Bar dataKey="plays" radius={[4, 4, 0, 0]}>
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
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(value: number) => [value.toLocaleString(), 'Plays']}
                                    labelFormatter={(label) => <span className="font-semibold">{label}</span>}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="plays"
                                    stroke={getLineColor()}
                                    strokeWidth={2}
                                    dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card >
    );
}
