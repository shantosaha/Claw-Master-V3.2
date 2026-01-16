"use client";

import { useState, useEffect, useMemo } from "react";
import { OptimizedImage, OptimizedThumbnail } from "@/components/ui/OptimizedImage";
import { getLightboxUrl } from "@/lib/utils/imageUtils";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, X, HelpCircle, RefreshCw } from "lucide-react";
import { ServiceReport, ArcadeMachine } from "@/types";
import { serviceReportService } from "@/services/serviceReportService";
import { machineService } from "@/services";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Helper type for enriched reports
interface EnrichedServiceReport extends ServiceReport {
    resolvedMachineName: string;
}

type SortField = 'timestamp' | 'resolvedMachineName' | 'staffName' | 'playPerWin' | 'inflowSku';
type SortDirection = 'asc' | 'desc';

export function GlobalServiceHistoryTable() {
    const [reports, setReports] = useState<EnrichedServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [staffFilter, setStaffFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [searchAllData, setSearchAllData] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());

    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [rawReports, machines] = await Promise.all([
                    serviceReportService.getReports("GLOBAL_FETCH", {
                        from: dateRange?.from,
                        to: dateRange?.to
                    }),
                    machineService.getAll()
                ]);

                const tagToNameMap = new Map<string, string>();
                machines.forEach((machine: ArcadeMachine) => {
                    if (machine.tag !== undefined) {
                        tagToNameMap.set(String(machine.tag), machine.name);
                    }
                    if (machine.assetTag) {
                        tagToNameMap.set(machine.assetTag, machine.name);
                    }
                });

                const enrichedReports: EnrichedServiceReport[] = rawReports.map(report => ({
                    ...report,
                    resolvedMachineName: tagToNameMap.get(report.inflowSku || report.machineId) || report.machineName
                }));

                setReports(enrichedReports);
                setIsLoading(false);

                // Auto-sync in background (non-blocking) after data is displayed
                if (enrichedReports.length > 0) {
                    console.log("Starting background sync of JotForm settings to machines...");
                    setIsSyncing(true);
                    serviceReportService.syncLatestSettingsToMachines()
                        .then(syncResult => {
                            console.log(`Background sync complete: ${syncResult.synced} machines updated`);
                            setIsSyncing(false);
                        })
                        .catch(err => {
                            console.error("Background sync failed:", err);
                            setIsSyncing(false);
                        });
                }
            } catch (error) {
                console.error("Failed to fetch service reports", error);
                setIsLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    // Get unique staff names for filter dropdown
    const uniqueStaffNames = useMemo(() => {
        const names = new Set(reports.map(r => r.staffName).filter(Boolean));
        return Array.from(names).sort();
    }, [reports]);

    // Filter and sort logic
    const filteredAndSortedReports = useMemo(() => {
        let result = [...reports];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.resolvedMachineName?.toLowerCase().includes(query) ||
                r.staffName?.toLowerCase().includes(query) ||
                r.inflowSku?.toLowerCase().includes(query) ||
                r.remarks?.toLowerCase().includes(query)
            );
        }

        // Apply staff filter
        if (staffFilter !== 'all') {
            result = result.filter(r => r.staffName === staffFilter);
        }

        // Apply date range filter (skip if searchAllData is checked)
        if (!searchAllData && dateRange?.from && dateRange?.to) {
            const start = startOfDay(dateRange.from);
            const end = endOfDay(dateRange.to);
            result = result.filter(r => {
                const reportDate = new Date(r.timestamp);
                return isWithinInterval(reportDate, { start, end });
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortField) {
                case 'timestamp':
                    aVal = new Date(a.timestamp).getTime();
                    bVal = new Date(b.timestamp).getTime();
                    break;
                case 'resolvedMachineName':
                    aVal = a.resolvedMachineName?.toLowerCase() || '';
                    bVal = b.resolvedMachineName?.toLowerCase() || '';
                    break;
                case 'staffName':
                    aVal = a.staffName?.toLowerCase() || '';
                    bVal = b.staffName?.toLowerCase() || '';
                    break;
                case 'playPerWin':
                    aVal = a.playPerWin || 0;
                    bVal = b.playPerWin || 0;
                    break;
                case 'inflowSku':
                    aVal = a.inflowSku || '';
                    bVal = b.inflowSku || '';
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [reports, searchQuery, staffFilter, dateRange, searchAllData, sortField, sortDirection]);

    // Pagination on filtered results
    const totalPages = Math.ceil(filteredAndSortedReports.length / pageSize);
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredAndSortedReports.slice(startIndex, startIndex + pageSize);
    }, [filteredAndSortedReports, currentPage, pageSize]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, staffFilter, dateRange, sortField, sortDirection]);

    const handlePageSizeChange = (newSize: string) => {
        setPageSize(Number(newSize));
        setCurrentPage(1);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="ml-1 h-3 w-3" />
            : <ArrowDown className="ml-1 h-3 w-3" />;
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading submissions...</div>;
    }

    if (reports.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No service reports found.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center h-9">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">Service History</h3>
                    {isSyncing && (
                        <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full animate-pulse">
                            <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                            Auto-syncing machine settings...
                        </div>
                    )}
                </div>
                <div className="text-[10px] text-muted-foreground hidden sm:block">
                    Settings are automatically synced with JotForm submissions
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search machine, staff, tag..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setSearchQuery('')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <label
                        className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                        onClick={() => setSearchAllData(!searchAllData)}
                    >
                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${searchAllData ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-muted-foreground'}`}>
                            {searchAllData && <span className="text-primary-foreground text-[8px]">✓</span>}
                        </div>
                        <span>Search all data (ignore date filter)</span>
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Staff:</span>
                    <Select value={staffFilter} onValueChange={setStaffFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Staff</SelectItem>
                            {uniqueStaffNames.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Date:</span>
                    <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                        className="w-[260px]"
                    />
                </div>

                {(searchQuery || staffFilter !== 'all' || dateRange) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('');
                            setStaffFilter('all');
                            setDateRange(undefined);
                        }}
                        className="text-muted-foreground"
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort('timestamp')}
                            >
                                <div className="flex items-center">
                                    Date
                                    <SortIcon field="timestamp" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort('inflowSku')}
                            >
                                <div className="flex items-center">
                                    Tag
                                    <SortIcon field="inflowSku" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort('resolvedMachineName')}
                            >
                                <div className="flex items-center">
                                    Machine Name
                                    <SortIcon field="resolvedMachineName" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort('staffName')}
                            >
                                <div className="flex items-center">
                                    Staff
                                    <SortIcon field="staffName" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center justify-end gap-1 cursor-help">
                                                C1
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[200px]">
                                            <p className="text-xs"><strong>Catch Strength</strong> - Initial grip force when claw closes on prize</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead className="text-right">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center justify-end gap-1 cursor-help">
                                                C2
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[200px]">
                                            <p className="text-xs"><strong>Top Strength</strong> - Grip force at highest lift point</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead className="text-right">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center justify-end gap-1 cursor-help">
                                                C3
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[200px]">
                                            <p className="text-xs"><strong>Move Strength</strong> - Grip force while moving to chute</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead className="text-right">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center justify-end gap-1 cursor-help">
                                                C4
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[200px]">
                                            <p className="text-xs"><strong>Max Power</strong> - Maximum strength on winning plays (24/48/64)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort('playPerWin')}
                            >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center justify-end gap-1">
                                                Payout Rate
                                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                <SortIcon field="playPerWin" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[220px]">
                                            <p className="text-xs"><strong>Plays Per Win</strong> - Target number of plays before machine allows a winning grab</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead className="text-center">Image</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedReports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    No results match your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedReports.map((report) => (
                                <TableRow
                                    key={report.id}
                                    onMouseEnter={() => {
                                        if (report.imageUrl && !prefetchedImages.has(report.imageUrl)) {
                                            const img = new (window as any).Image();
                                            img.src = report.imageUrl;
                                            setPrefetchedImages(prev => {
                                                const next = new Set(prev);
                                                next.add(report.imageUrl!);
                                                return next;
                                            });
                                        }
                                    }}
                                >
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(report.timestamp), "MMM dd, yyyy hh:mm a")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{report.inflowSku || "N/A"}</Badge>
                                    </TableCell>
                                    <TableCell>{report.resolvedMachineName}</TableCell>
                                    <TableCell>{report.staffName}</TableCell>
                                    <TableCell className="text-right">{isNaN(report.c1) ? '-' : report.c1}</TableCell>
                                    <TableCell className="text-right">{isNaN(report.c2) ? '-' : report.c2}</TableCell>
                                    <TableCell className="text-right">{isNaN(report.c3) ? '-' : report.c3}</TableCell>
                                    <TableCell className="text-right">{isNaN(report.c4) ? '-' : report.c4}</TableCell>
                                    <TableCell className="text-right">{isNaN(report.playPerWin) ? '-' : report.playPerWin}</TableCell>
                                    <TableCell className="text-center">
                                        {report.imageUrl ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <div className="flex justify-center">
                                                        <OptimizedThumbnail
                                                            src={report.imageUrl}
                                                            alt="Thumb"
                                                            size={40}
                                                            className="w-10 h-10 rounded-sm border"
                                                        />
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-5xl max-h-[90vh]">
                                                    <DialogHeader>
                                                        <DialogTitle>Service Image - {format(new Date(report.timestamp), "MMM dd, yyyy HH:mm")}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="relative w-full overflow-hidden bg-muted rounded-md" style={{ height: 'calc(90vh - 100px)' }}>
                                                        <img
                                                            src={getLightboxUrl(report.imageUrl, 1200)}
                                                            alt="Service Report"
                                                            loading="eager"
                                                            decoding="async"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        {report.remarks ? (
                                            <span className="text-sm truncate block" title={report.remarks}>
                                                {report.remarks}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span>of {filteredAndSortedReports.length} entries</span>
                    {filteredAndSortedReports.length !== reports.length && (
                        <span className="text-xs">(filtered from {reports.length})</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
