"use client";

import { useState, useEffect, Fragment } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Calendar as CalendarIcon, X, ExternalLink, Image as ImageIcon, ZoomIn, Users, PlayCircle, DollarSign, Ticket, TrendingUp, Target, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArcadeMachine, ServiceReport } from "@/types";
import { MachineStatus } from "@/services/monitoringService";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import { useData } from "@/context/DataProvider";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import Link from "next/link";
import { SpecificDatePicker } from "@/components/analytics/SpecificDatePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { serviceReportService } from "@/services/serviceReportService";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";
import { isCraneMachine } from "@/utils/machineTypeUtils";

interface MachineComparisonTableProps {
    machines: MachineStatus[];
    initialMachineId?: string;
}

interface DailyStats {
    date: Date;
    customerPlays: number;
    staffPlays: number;
    totalPlays: number;
    payouts: number;
    playsPerPayout: number;
    payoutSettings: number;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    revenue: number;
    cashRev: number;
    bonusRev: number;
    strongTime: number;
    weakTime: number;
}

type MetricKey = Exclude<keyof DailyStats, 'date'>;

export function MachineComparisonTable({ machines, initialMachineId }: MachineComparisonTableProps) {
    const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>(initialMachineId);
    const [openMachineSearch, setOpenMachineSearch] = useState(false);
    const { machines: allMachines } = useData();

    // Update selected ID if initial changes (e.g. from parent action)
    useEffect(() => {
        if (initialMachineId) {
            setSelectedMachineId(initialMachineId);
        }
    }, [initialMachineId]);

    const selectedMachine = machines.find(m => m.id === selectedMachineId);
    const fullMachine = allMachines.find(m => m.id === selectedMachineId);
    const isSelectedCrane = isCraneMachine(fullMachine);

    const [recentReportImage, setRecentReportImage] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Fetch recent report image when machine changes
    useEffect(() => {
        const fetchRecentImage = async () => {
            if (!selectedMachineId) return;

            // Try to find a report for this machine that has an image
            try {
                // We'll search for reports related to this machine's asset tag or ID
                const targetTag = selectedMachine?.assetTag || fullMachine?.tag || (selectedMachine as any)?.tag;
                if (!targetTag && !selectedMachineId) return;

                // For now we just fetch global reports and filter locally
                // Ideally this would be a server-side filter
                const reports = await serviceReportService.getReports(selectedMachineId);

                // Filter matching the tag strictly
                const matchingReports = reports.filter(r => {
                    if (!r.imageUrl) return false;

                    // Check if report tag matches machine tag
                    // inflowSku maps to the 'tag' field in the report service
                    if (!r.inflowSku) return false;

                    // Normalize for comparison
                    const rTag = String(r.inflowSku).trim().toLowerCase();
                    const mTag = String(targetTag).trim().toLowerCase();

                    return rTag === mTag;
                });

                // Sort by date descending
                const sorted = matchingReports
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                if (sorted.length > 0 && sorted[0].imageUrl) {
                    setRecentReportImage(sorted[0].imageUrl);
                } else {
                    setRecentReportImage(null);
                }
            } catch (err) {
                console.error("Failed to fetch recent report image", err);
                setRecentReportImage(null);
            }
        };

        fetchRecentImage();
    }, [selectedMachineId, selectedMachine?.assetTag, fullMachine?.tag]);

    // Machine Image (Cabinet)
    const machineImage = fullMachine?.imageUrl;

    // Use recent JotForm image if available, otherwise fall back to stock/currentItem
    // The user specifically requested "jot form url image (take the jot form url same assest tag, recent one then load it)"
    // If no report image, we can fall back to the item image as a sensible default
    const displayStockImage = recentReportImage || selectedMachine?.imageUrl || fullMachine?.slots?.[0]?.currentItem?.imageUrl;

    // Default to last 3 days
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        to: new Date()
    });

    const [specificDates, setSpecificDates] = useState<Date[]>([]);
    const [selectionMode, setSelectionMode] = useState<'range' | 'specific'>('range');

    const [stats, setStats] = useState<DailyStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!dateRange?.from || !selectedMachine) return;

            setIsLoading(true);
            const newStats: DailyStats[] = [];

            try {
                let dates: Date[] = [];

                if (selectionMode === 'range' && dateRange?.from) {
                    const start = dateRange.from;
                    const end = dateRange.to || dateRange.from;
                    dates = eachDayOfInterval({ start, end });
                } else if (selectionMode === 'specific' && specificDates.length > 0) {
                    dates = [...specificDates];
                }

                if (dates.length === 0) {
                    setStats([]);
                    setIsLoading(false);
                    return;
                }

                for (const date of dates) {
                    // Fetch real data from Game Report API for this specific day
                    const targetTag = selectedMachine.assetTag || fullMachine?.tag || (selectedMachine as any)?.tag;

                    // Fetch data for this day (same start/end for single day)
                    const dayData = await gameReportApiService.fetchGameReport({
                        startDate: date,
                        endDate: date,
                        aggregate: false, // Get raw data
                    });

                    // Find the entry matching this machine's tag
                    let machineData: GameReportItem | undefined;
                    if (targetTag) {
                        const normalizedTag = String(targetTag).trim().toLowerCase();
                        machineData = dayData.find(item => {
                            const itemTag = String(item.assetTag || item.tag).trim().toLowerCase();
                            return itemTag === normalizedTag;
                        });
                    }

                    if (machineData) {
                        // Use real API data
                        const plays = machineData.standardPlays || 0;
                        const staffPlays = machineData.empPlays || 0;
                        const payouts = machineData.points || 0;
                        newStats.push({
                            date,
                            customerPlays: plays,
                            staffPlays: staffPlays,
                            totalPlays: plays + staffPlays,
                            payouts: payouts,
                            playsPerPayout: payouts > 0 ? Math.round((plays + staffPlays) / payouts) : 0,
                            payoutSettings: 20, // Default, could come from settings
                            c1: 0, // C1-C4 come from JotForm settings, not game report
                            c2: 0,
                            c3: 0,
                            c4: 0,
                            revenue: machineData.totalRev || 0,
                            cashRev: machineData.cashDebit || 0,
                            bonusRev: machineData.cashDebitBonus || 0,
                            strongTime: 0, // Would come from JotForm settings
                            weakTime: 0,
                        });
                    } else {
                        // No data for this day, show zeros
                        newStats.push({
                            date,
                            customerPlays: 0,
                            staffPlays: 0,
                            totalPlays: 0,
                            payouts: 0,
                            playsPerPayout: 0,
                            payoutSettings: 0,
                            c1: 0,
                            c2: 0,
                            c3: 0,
                            c4: 0,
                            revenue: 0,
                            cashRev: 0,
                            bonusRev: 0,
                            strongTime: 0,
                            weakTime: 0,
                        });
                    }
                }
                setStats(newStats.sort((a, b) => b.date.getTime() - a.date.getTime()));
            } catch (e) {
                console.error("Error generating dates/stats", e);
            }
            setIsLoading(false);
        };

        fetchStats();
    }, [dateRange, selectedMachine, selectionMode, specificDates]);

    // Only show C1-C4 and time metrics for crane machines
    const metrics: {
        label: string,
        key: MetricKey,
        format?: (v: number) => string,
        craneOnly?: boolean,
        group: 'Activity' | 'Financial' | 'Payouts' | 'Technical' | 'Settings',
        icon?: any
    }[] = [
            // Activity
            { label: "Customer Plays", key: "customerPlays", group: 'Activity', icon: Users },
            { label: "Staff Plays", key: "staffPlays", group: 'Activity', icon: Users },
            { label: "Total Plays", key: "totalPlays", group: 'Activity', icon: PlayCircle },

            // Financial
            { label: "Total Revenue", key: "revenue", format: (v: number) => `$${v.toFixed(2)}`, group: 'Financial', icon: DollarSign },
            { label: "Cash Revenue", key: "cashRev", format: (v: number) => `$${v.toFixed(2)}`, group: 'Financial', icon: DollarSign },
            { label: "Bonus Revenue", key: "bonusRev", format: (v: number) => `$${v.toFixed(2)}`, group: 'Financial', icon: DollarSign },

            // Payouts
            { label: "Payouts", key: "payouts", group: 'Payouts', icon: Ticket },
            { label: "Plays Per Payout", key: "playsPerPayout", group: 'Payouts', icon: TrendingUp },
            { label: "Target Plays/Win", key: "payoutSettings", craneOnly: true, group: 'Payouts', icon: Target },

            // Technical
            { label: "Claw Strength C1", key: "c1", craneOnly: true, group: 'Technical', icon: Zap },
            { label: "Claw Strength C2", key: "c2", craneOnly: true, group: 'Technical', icon: Zap },
            { label: "Claw Strength C3", key: "c3", craneOnly: true, group: 'Technical', icon: Zap },
            { label: "Claw Strength C4", key: "c4", craneOnly: true, group: 'Technical', icon: Zap },
            { label: "Strong Time", key: "strongTime", craneOnly: true, group: 'Technical', icon: Activity },
            { label: "Weak Time", key: "weakTime", craneOnly: true, group: 'Technical', icon: Activity },
        ];

    // Filter metrics based on machine type
    const visibleMetrics = isSelectedCrane
        ? metrics
        : metrics.filter(m => !m.craneOnly);

    // Group metrics
    const groupedMetrics = visibleMetrics.reduce((acc, metric) => {
        if (!acc[metric.group]) acc[metric.group] = [];
        acc[metric.group].push(metric);
        return acc;
    }, {} as Record<string, typeof visibleMetrics>);

    const groupsOrder = ['Activity', 'Financial', 'Payouts', 'Technical'];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Select Machine</label>
                    <Popover open={openMachineSearch} onOpenChange={setOpenMachineSearch}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openMachineSearch}
                                className="w-full sm:w-[300px] justify-between font-normal h-9 bg-background"
                            >
                                {selectedMachine
                                    ? `${selectedMachine.name} (${selectedMachine.assetTag || (selectedMachine as any).tag || "N/A"})`
                                    : "Search machine..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search machine name or tag..." />
                                <CommandList>
                                    <CommandEmpty>No machine found.</CommandEmpty>
                                    <CommandGroup>
                                        {machines.map((m) => (
                                            <CommandItem
                                                key={m.id}
                                                value={`${m.name} ${m.assetTag || (m as any).tag || ""}`}
                                                onSelect={() => {
                                                    setSelectedMachineId(m.id);
                                                    setOpenMachineSearch(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedMachineId === m.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{m.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">Tag: {m.assetTag || (m as any).tag || "N/A"}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Date Selection</label>
                    <Tabs
                        value={selectionMode}
                        onValueChange={(val) => setSelectionMode(val as 'range' | 'specific')}
                        className="w-full"
                    >
                        <div className="flex flex-col sm:flex-row gap-2">
                            <TabsList className="grid grid-cols-2 w-full sm:w-[200px] h-9">
                                <TabsTrigger value="range" className="text-xs">Range</TabsTrigger>
                                <TabsTrigger value="specific" className="text-xs">Specific</TabsTrigger>
                            </TabsList>

                            <div className="flex-1">
                                <TabsContent value="range" className="mt-0">
                                    <DatePickerWithRange
                                        date={dateRange}
                                        onDateChange={setDateRange}
                                        className="w-full"
                                    />
                                </TabsContent>
                                <TabsContent value="specific" className="mt-0">
                                    <SpecificDatePicker
                                        dates={specificDates}
                                        onDatesChange={setSpecificDates}
                                        className="w-full"
                                    />
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>

            {selectionMode === 'specific' && specificDates.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                    {specificDates.sort((a, b) => b.getTime() - a.getTime()).map((date, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 pr-1 truncate max-w-[150px]">
                            {format(date, "MMM dd, yyyy")}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => setSpecificDates(prev => prev.filter(d => d.getTime() !== date.getTime()))}
                            />
                        </Badge>
                    ))}
                    {specificDates.length > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                            onClick={() => setSpecificDates([])}
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            )}

            {!selectedMachine ? (
                <div className="text-center py-12 text-muted-foreground border rounded-md bg-muted/10">
                    Please select a machine to view comparison data
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Selected Machine Header with Images */}
                    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-gradient-to-r from-background to-muted/20 items-center md:items-start shadow-sm">
                        {/* Machine Image */}
                        <div className="h-24 w-24 rounded-md border bg-muted flex-shrink-0 overflow-hidden relative group shadow-inner">
                            {machineImage ? (
                                <img
                                    src={getThumbnailUrl(machineImage, 200)}
                                    alt="Machine"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/50">
                                    <ImageIcon className="h-8 w-8 opacity-20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                                Machine
                            </div>
                        </div>

                        {/* Stock/JotForm Image */}
                        <div
                            className="h-24 w-24 rounded-md border bg-muted flex-shrink-0 overflow-hidden relative group cursor-pointer shadow-inner"
                            onClick={() => displayStockImage && setLightboxImage(displayStockImage)}
                        >
                            <OptimizedImage
                                src={displayStockImage}
                                alt="Stock/Report"
                                width={100}
                                aspectRatio="1/1"
                                className="h-full w-full"
                                imageClassName="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {displayStockImage && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                    <ZoomIn className="h-5 w-5 mb-1" />
                                    <span className="text-[8px] font-medium uppercase tracking-wider">View</span>
                                </div>
                            )}
                            {!displayStockImage && (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/50">
                                    <ImageIcon className="h-8 w-8 opacity-20" />
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-white text-[9px] font-medium truncate px-1">
                                {recentReportImage ? "Latest Report" : "Current Item"}
                            </div>
                        </div>

                        <div className="flex-1 space-y-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <h3 className="text-xl font-bold tracking-tight">
                                    <Link
                                        href={`/machines/${selectedMachine.id}`}
                                        className="hover:text-blue-600 flex items-center gap-2 transition-colors"
                                    >
                                        {selectedMachine.name}
                                        <ExternalLink className="h-4 w-4 opacity-30 hover:opacity-100 transition-opacity" />
                                    </Link>
                                </h3>
                                <Badge variant={selectedMachine.status === 'online' ? 'default' : 'destructive'} className="uppercase text-[10px] font-bold tracking-wider px-2 shadow-sm">
                                    {selectedMachine.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                                    #{selectedMachine.assetTag || fullMachine?.tag || "N/A"}
                                </Badge>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="font-medium text-foreground/80">{selectedMachine.location || fullMachine?.location}</span>
                            </div>
                            <div className="text-sm mt-3 p-2 bg-muted/30 rounded-md border inline-flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Current Item</span>
                                {fullMachine?.slots?.[0]?.currentItem ? (
                                    <span className="font-semibold text-foreground">{fullMachine.slots[0].currentItem.name}</span>
                                ) : <span className="text-muted-foreground italic">No item assigned</span>}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-[200px] font-bold text-xs uppercase tracking-wider text-muted-foreground/70 pl-6 h-12">Metric</TableHead>
                                    {stats.map(stat => (
                                        <TableHead key={stat.date.toISOString()} className="text-right min-w-[120px] font-bold text-foreground/80 h-10 border-l border-border/50">
                                            <div className="flex flex-col items-end gap-0.5 py-2">
                                                <span className="text-xs">{format(stat.date, "MMM dd")}</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">{format(stat.date, "yyyy")}</span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={stats.length + 1} className="h-32 text-center text-muted-foreground animate-pulse">
                                            Loading comparisons...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    groupsOrder.filter(group => groupedMetrics[group]).map(group => (
                                        <Fragment key={group}>
                                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                <TableCell colSpan={stats.length + 1} className="py-2 pl-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-2">
                                                        {group} Metrics
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                            {groupedMetrics[group].map((metric) => {
                                                const Icon = metric.icon;
                                                const isMoney = metric.group === 'Financial';

                                                return (
                                                    <TableRow key={metric.label} className="group hover:bg-muted/5 transition-colors">
                                                        <TableCell className={cn(
                                                            "font-medium py-3 pl-6 border-r border-transparent group-hover:border-border/30",
                                                            isMoney && "text-emerald-700 dark:text-emerald-400"
                                                        )}>
                                                            <div className="flex items-center gap-2">
                                                                {Icon && <Icon className={cn("h-3.5 w-3.5 opacity-50", isMoney && "text-emerald-600")} />}
                                                                {metric.label}
                                                            </div>
                                                        </TableCell>
                                                        {stats.map(stat => {
                                                            const val = stat[metric.key];
                                                            const isZero = val === 0;
                                                            return (
                                                                <TableCell key={stat.date.toISOString()} className={cn(
                                                                    "text-right py-3 border-l border-transparent group-hover:border-border/30",
                                                                    isMoney && !isZero && "font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/10",
                                                                    isZero && "text-muted-foreground/30"
                                                                )}>
                                                                    {metric.format
                                                                        ? metric.format(val)
                                                                        : (typeof val === 'number' && isNaN(val) ? '-' : val)}
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                );
                                            })}
                                        </Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
            {/* Lightbox for zooming in */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <DialogTitle className="sr-only">Image Lightbox</DialogTitle>
                    <div className="relative w-full h-full flex items-center justify-center">
                        {lightboxImage && (
                            <OptimizedImage
                                src={lightboxImage}
                                alt="Full View"
                                width={1200}
                                lightbox
                                aspectRatio="auto"
                                objectFit="contain"
                                className="max-h-[85vh] w-auto rounded-lg shadow-2xl"
                            />
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 rounded-full"
                            onClick={() => setLightboxImage(null)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
