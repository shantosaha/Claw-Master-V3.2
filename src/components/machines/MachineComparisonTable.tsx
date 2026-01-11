"use client";

import { useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArcadeMachine } from "@/types";
import { MachineStatus } from "@/services/monitoringService";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";

interface MachineComparisonTableProps {
    machines: MachineStatus[];
    initialMachineId?: string;
}

interface DailyStats {
    date: Date;
    customerPlays: number;
    staffPlays: number;
    payouts: number;
    playsPerPayout: number;
    payoutSettings: number;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    revenue: number;
}

type MetricKey = Exclude<keyof DailyStats, 'date'>;

export function MachineComparisonTable({ machines, initialMachineId }: MachineComparisonTableProps) {
    const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>(initialMachineId);

    // Update selected ID if initial changes (e.g. from parent action)
    useEffect(() => {
        if (initialMachineId) {
            setSelectedMachineId(initialMachineId);
        }
    }, [initialMachineId]);

    const selectedMachine = machines.find(m => m.id === selectedMachineId);

    // Default to last 3 days
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        to: new Date()
    });

    const [stats, setStats] = useState<DailyStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!dateRange?.from || !selectedMachine) return;

            setIsLoading(true);
            const newStats: DailyStats[] = [];

            // Generate all dates in range
            const start = dateRange.from;
            const end = dateRange.to || dateRange.from;

            try {
                const dates = eachDayOfInterval({ start, end });

                for (const date of dates) {
                    // Simulate fetching daily stats
                    const seed = selectedMachine.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + date.getTime();
                    const random = (offset: number) => {
                        const x = Math.sin(seed + offset) * 10000;
                        return x - Math.floor(x);
                    };

                    newStats.push({
                        date,
                        customerPlays: Math.floor(random(1) * 200) + 20,
                        staffPlays: Math.floor(random(2) * 10),
                        payouts: Math.floor(random(3) * 5),
                        playsPerPayout: Math.floor(random(1) * 200 / (Math.floor(random(3) * 5) || 1)),
                        payoutSettings: 20 + Math.floor(random(4) * 10),
                        c1: 20 + Math.floor(random(5) * 5),
                        c2: 15 + Math.floor(random(6) * 5),
                        c3: 10 + Math.floor(random(7) * 5),
                        c4: 25 + Math.floor(random(8) * 5),
                        revenue: (Math.floor(random(1) * 200) + 20) * 2
                    });
                }
                setStats(newStats.sort((a, b) => b.date.getTime() - a.date.getTime()));
            } catch (e) {
                console.error("Error generating dates/stats", e);
            }
            setIsLoading(false);
        };

        fetchStats();
    }, [dateRange, selectedMachine]);

    const metrics: { label: string, key: MetricKey, format?: (v: number) => string }[] = [
        { label: "Customer Plays", key: "customerPlays" },
        { label: "Staff Plays", key: "staffPlays" },
        { label: "Total Revenue", key: "revenue", format: (v: number) => `$${v}` },
        { label: "Payouts", key: "payouts" },
        { label: "Plays Per Payout", key: "playsPerPayout" },
        { label: "Target Plays/Win", key: "payoutSettings" },
        { label: "Claw Strength C1", key: "c1" },
        { label: "Claw Strength C2", key: "c2" },
        { label: "Claw Strength C3", key: "c3" },
        { label: "Claw Strength C4", key: "c4" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Select Machine</label>
                    <Select
                        value={selectedMachineId}
                        onValueChange={setSelectedMachineId}
                    >
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Select a machine..." />
                        </SelectTrigger>
                        <SelectContent>
                            {machines.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Date Range</label>
                    <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                        className="w-full sm:w-[260px]"
                    />
                </div>
            </div>

            {!selectedMachine ? (
                <div className="text-center py-12 text-muted-foreground border rounded-md bg-muted/10">
                    Please select a machine to view comparison data
                </div>
            ) : (
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Metric</TableHead>
                                {stats.map(stat => (
                                    <TableHead key={stat.date.toISOString()} className="text-right min-w-[120px]">
                                        {format(stat.date, "MMM dd, yyyy")}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={stats.length + 1} className="h-24 text-center">
                                        Loading comparisons...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                metrics.map((metric) => (
                                    <TableRow key={metric.label}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {metric.label}
                                        </TableCell>
                                        {stats.map(stat => (
                                            <TableCell key={stat.date.toISOString()} className="text-right">
                                                {metric.format
                                                    ? metric.format(stat[metric.key])
                                                    : (typeof stat[metric.key] === 'number' && isNaN(stat[metric.key]) ? '-' : stat[metric.key])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
