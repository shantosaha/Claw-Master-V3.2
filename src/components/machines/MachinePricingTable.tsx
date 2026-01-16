"use client";

import { useState, useMemo, useEffect } from "react";
import { MachineDisplayItem } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import { DollarSign, Star, MapPin, ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, subYears, startOfYear } from "date-fns";
import { gameReportApiService } from "@/services/gameReportApiService";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { SingleDatePicker } from "@/components/analytics/SingleDatePicker";

interface MachinePricingTableProps {
    machines: MachineDisplayItem[];
}

type SortField = 'assetTag' | 'name' | 'location' | 'revenue' | 'customRevenue' | 'standardPrice' | 'vipPrice' | 'status';
type SortDirection = 'asc' | 'desc';

export function MachinePricingTable({ machines }: MachinePricingTableProps) {
    const [sortField, setSortField] = useState<SortField>('assetTag');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Revenue Data State
    const [dailyRevenueMap, setDailyRevenueMap] = useState<Record<string, number>>({});
    const [customRevenueMap, setCustomRevenueMap] = useState<Record<string, number>>({});
    const [loadingDaily, setLoadingDaily] = useState(true);
    const [loadingCustom, setLoadingCustom] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 1), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string>(format(subDays(new Date(), 1), "yyyy-MM-dd"));
    const [dateRangeOpen, setDateRangeOpen] = useState(false);

    const applyPreset = (preset: string) => {
        const end = new Date();
        let start = new Date();

        switch (preset) {
            case '7d': start = subDays(end, 7); break;
            case '30d': start = subDays(end, 30); break;
            case '6m': start = subMonths(end, 6); break;
            case '1y': start = subYears(end, 1); break;
            case 'all': start = new Date(2023, 0, 1); break; // Project start or similar
            case 'yesterday':
                start = subDays(end, 1);
                end.setDate(end.getDate() - 1); // Only yesterday
                break;
        }

        setStartDate(format(start, "yyyy-MM-dd"));
        setEndDate(format(end, "yyyy-MM-dd"));
    };

    // Fetch Daily Revenue on Mount
    useEffect(() => {
        const fetchDaily = async () => {
            setLoadingDaily(true);
            try {
                const today = new Date();
                const data = await gameReportApiService.fetchAggregatedReport(today, today);

                const map: Record<string, number> = {};
                data.forEach(item => {
                    const tag = String(item.tag);
                    map[tag] = (map[tag] || 0) + (item.totalRev || 0);
                });
                setDailyRevenueMap(map);
            } catch (error) {
                console.error("Failed to fetch daily revenue", error);
            } finally {
                setLoadingDaily(false);
            }
        };
        fetchDaily();
    }, []);

    // Fetch Custom Revenue when dates change
    useEffect(() => {
        const fetchCustom = async () => {
            setLoadingCustom(true);
            try {
                const data = await gameReportApiService.fetchAggregatedReport(
                    new Date(startDate),
                    new Date(endDate)
                );

                const map: Record<string, number> = {};
                data.forEach(item => {
                    const tag = String(item.tag);
                    map[tag] = (map[tag] || 0) + (item.totalRev || 0);
                });
                setCustomRevenueMap(map);
            } catch (error) {
                console.error("Failed to fetch custom revenue", error);
            } finally {
                setLoadingCustom(false);
            }
        };

        const timer = setTimeout(() => {
            fetchCustom();
        }, 800); // Debounce slightly to allow typing/picking both dates

        return () => clearTimeout(timer);
    }, [startDate, endDate]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedMachines = useMemo(() => {
        return [...machines].sort((a, b) => {
            let valA: any;
            let valB: any;

            switch (sortField) {
                case 'assetTag':
                    const numA = parseInt(a.assetTag);
                    const numB = parseInt(b.assetTag);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return sortDirection === 'asc' ? numA - numB : numB - numA;
                    }
                    valA = a.assetTag;
                    valB = b.assetTag;
                    break;
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'location':
                    valA = (a.location || "").toLowerCase();
                    valB = (b.location || "").toLowerCase();
                    break;
                case 'revenue':
                    valA = dailyRevenueMap[a.tag || ""] || 0;
                    valB = dailyRevenueMap[b.tag || ""] || 0;
                    break;
                case 'customRevenue':
                    valA = customRevenueMap[a.tag || ""] || 0;
                    valB = customRevenueMap[b.tag || ""] || 0;
                    break;
                case 'standardPrice':
                    valA = a.advancedSettings?.cardCashPlayPrice ?? 0;
                    valB = b.advancedSettings?.cardCashPlayPrice ?? 0;
                    break;
                case 'vipPrice':
                    valA = a.advancedSettings?.vipDiscountedPrice ?? 0;
                    valB = b.advancedSettings?.vipDiscountedPrice ?? 0;
                    break;
                case 'status':
                    valA = (a.slotStatus || a.status || "").toLowerCase();
                    valB = (b.slotStatus || b.status || "").toLowerCase();
                    break;
                default:
                    valA = 0;
                    valB = 0;
            }

            if (valA === valB) return 0;
            const res = valA > valB ? 1 : -1;
            return sortDirection === 'asc' ? res : -res;
        });
    }, [machines, sortField, sortDirection]);

    const SortIcon = ({ field, className }: { field: SortField, className?: string }) => {
        if (sortField !== field) return <ArrowUpDown className={cn("h-3 w-3 opacity-30", className)} />;
        return sortDirection === 'asc'
            ? <ChevronUp className={cn("h-3 w-3 text-primary", className)} />
            : <ChevronDown className={cn("h-3 w-3 text-primary", className)} />;
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card shadow-sm overflow-hidden text-slate-800">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b hover:bg-slate-50/80">
                            <TableHead
                                className="w-[100px] font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('assetTag')}
                            >
                                <div className="flex items-center gap-2">
                                    Tag
                                    <SortIcon field="assetTag" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('name')}
                            >
                                <div className="flex items-center gap-2">
                                    Machine Name
                                    <SortIcon field="name" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('location')}
                            >
                                <div className="flex items-center gap-2">
                                    Location
                                    <SortIcon field="location" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('revenue')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                                    Daily Rev
                                    <SortIcon field="revenue" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right font-bold cursor-pointer hover:text-primary transition-colors bg-blue-50/40 relative group/col p-0"
                            >
                                <div className="flex items-center justify-end h-full w-full">
                                    {/* Sort Area - Specific for sorting */}
                                    <div
                                        className="h-full pl-4 pr-1 flex items-center hover:bg-blue-100/50 transition-colors z-10"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleSort('customRevenue');
                                        }}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <SortIcon field="customRevenue" />
                                        </div>
                                    </div>

                                    {/* Popover Area - Main content trigger */}
                                    <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-end leading-tight px-4 py-3 h-full select-none hover:bg-blue-100/30 transition-colors flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3 text-blue-600" />
                                                    <span className="text-blue-900 border-b border-blue-400/30 border-dashed">Period Rev</span>
                                                </div>
                                                <span className="text-[9px] font-medium text-blue-600/70 whitespace-nowrap mt-0.5">
                                                    {format(new Date(startDate), "MMM d")} - {format(new Date(endDate), "MMM d")}
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[320px] p-4 shadow-xl border-blue-100 z-[100]" align="end">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
                                                        Quick Presets
                                                    </h4>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {[
                                                            { id: 'yesterday', label: 'Last Day' },
                                                            { id: '7d', label: 'Last 7 Days' },
                                                            { id: '30d', label: '30 Days' },
                                                            { id: '6m', label: '6 Months' },
                                                            { id: '1y', label: '1 Year' },
                                                            { id: 'all', label: 'Full History' }
                                                        ].map(p => (
                                                            <Button
                                                                key={p.id}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                                onClick={() => {
                                                                    applyPreset(p.id);
                                                                }}
                                                            >
                                                                {p.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="h-px bg-slate-100" />

                                                <div>
                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Range</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] w-10 text-slate-500 font-bold">START</span>
                                                            <Input
                                                                type="date"
                                                                className="h-8 text-xs font-medium border-slate-200 focus-visible:ring-blue-500"
                                                                value={startDate}
                                                                onChange={(e) => setStartDate(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] w-10 text-slate-500 font-bold">END</span>
                                                            <Input
                                                                type="date"
                                                                className="h-8 text-xs font-medium border-slate-200 focus-visible:ring-blue-500"
                                                                value={endDate}
                                                                onChange={(e) => setEndDate(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
                                                    onClick={() => setDateRangeOpen(false)}
                                                >
                                                    Apply & Close
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('standardPrice')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    <DollarSign className="h-3 w-3" />
                                    Standard
                                    <SortIcon field="standardPrice" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('vipPrice')}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    VIP Price
                                    <SortIcon field="vipPrice" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-center font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => toggleSort('status')}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    Status
                                    <SortIcon field="status" />
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedMachines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                    No machines found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedMachines.map((item) => {
                                const standardPrice = item.advancedSettings?.cardCashPlayPrice ?? 0;
                                const vipPrice = item.advancedSettings?.vipDiscountedPrice ?? 0;
                                const status = item.slotStatus || item.status;
                                const revenue = item.revenue ?? 0;

                                return (
                                    <TableRow
                                        key={item.slotId || item.id}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <TableCell className="font-mono font-medium py-4">
                                            <span className="text-blue-600 font-bold group-hover:underline decoration-blue-400 underline-offset-4">
                                                {item.assetTag}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={getThumbnailUrl(item.imageUrl, 80)}
                                                            alt={item.name}
                                                            className="w-10 h-10 rounded-lg object-cover border shadow-sm group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-muted border flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                                            NO IMG
                                                        </div>
                                                    )}
                                                    {item.isSlot && (
                                                        <Badge className="absolute -top-2 -right-2 h-4 px-1 text-[8px] bg-primary text-primary-foreground min-w-[12px] flex justify-center border-none">
                                                            S
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/machines/${item.id}${item.slotId ? `?slotId=${item.slotId}` : ''}`}
                                                        className="font-semibold text-sm hover:text-blue-600 hover:underline transition-colors"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.type || "Standard Machine"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                                                <MapPin className="h-3 w-3 opacity-40" />
                                                {item.location || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="inline-flex flex-col items-end">
                                                {loadingDaily ? (
                                                    <Loader2 className="h-4 w-4 animate-spin opacity-20" />
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-emerald-600">
                                                            ${(dailyRevenueMap[item.tag || ""] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[9px] text-emerald-600 font-bold uppercase mt-1 flex items-center gap-0.5">
                                                            <TrendingUp className="h-2 w-2" />
                                                            Today
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 bg-blue-50/10">
                                            <div className="inline-flex flex-col items-end">
                                                {loadingCustom ? (
                                                    <Loader2 className="h-4 w-4 animate-spin opacity-20" />
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-blue-600">
                                                            ${(customRevenueMap[item.tag || ""] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[9px] text-blue-600 font-bold uppercase mt-1 flex items-center gap-0.5">
                                                            <Calendar className="h-2 w-2 text-blue-400" />
                                                            Selected
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="inline-flex flex-col items-end">
                                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                    ${standardPrice.toFixed(2)}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Non-Member</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="inline-flex flex-col items-end">
                                                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                    ${vipPrice.toFixed(2)}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase mt-1">VIP Member</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <Badge
                                                variant={status?.toLowerCase() === 'online' ? 'default' : status?.toLowerCase() === 'maintenance' ? 'secondary' : 'outline'}
                                                className={cn(
                                                    "uppercase text-[9px] font-bold px-2 py-0.5 tracking-wider",
                                                    status?.toLowerCase() === 'online' ? "bg-emerald-500 hover:bg-emerald-600" : ""
                                                )}
                                            >
                                                {status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
