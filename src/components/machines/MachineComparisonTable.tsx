"use client";

import { useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Calendar as CalendarIcon, X, ExternalLink, Image as ImageIcon, ZoomIn } from "lucide-react";
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
    }, [dateRange, selectedMachine, selectionMode, specificDates]);

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
                    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card/50 items-center md:items-start">
                        {/* Machine Image */}
                        <div className="h-24 w-24 rounded-md border bg-muted flex-shrink-0 overflow-hidden relative group">
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
                            className="h-24 w-24 rounded-md border bg-muted flex-shrink-0 overflow-hidden relative group cursor-pointer"
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
                                <h3 className="text-lg font-bold">
                                    <Link
                                        href={`/machines/${selectedMachine.id}`}
                                        className="hover:underline hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        {selectedMachine.name}
                                        <ExternalLink className="h-4 w-4 opacity-50" />
                                    </Link>
                                </h3>
                                <Badge variant={selectedMachine.status === 'online' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                                    {selectedMachine.status}
                                </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{selectedMachine.assetTag || fullMachine?.tag || "N/A"}</span>
                                <span className="mx-2">•</span>
                                {selectedMachine.location || fullMachine?.location}
                            </div>
                            <div className="text-sm text-muted-foreground/80 mt-2 max-w-lg">
                                {fullMachine?.slots?.[0]?.currentItem ? (
                                    <>Current Item: <span className="font-medium text-foreground">{fullMachine.slots[0].currentItem.name}</span></>
                                ) : "No item assigned"}
                            </div>
                        </div>
                    </div>

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
