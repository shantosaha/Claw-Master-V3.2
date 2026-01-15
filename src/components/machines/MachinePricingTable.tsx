"use client";

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
import { DollarSign, Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MachinePricingTableProps {
    machines: MachineDisplayItem[];
}

export function MachinePricingTable({ machines }: MachinePricingTableProps) {
    return (
        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 border-b">
                        <TableHead className="w-[100px] font-bold">Tag</TableHead>
                        <TableHead className="font-bold">Machine Name</TableHead>
                        <TableHead className="font-bold">Location</TableHead>
                        <TableHead className="text-right font-bold">
                            <div className="flex items-center justify-end gap-1">
                                <DollarSign className="h-3 w-3" />
                                Standard
                            </div>
                        </TableHead>
                        <TableHead className="text-right font-bold">
                            <div className="flex items-center justify-end gap-1">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                VIP Price
                            </div>
                        </TableHead>
                        <TableHead className="text-center font-bold">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {machines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                No machines found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        machines.map((item) => {
                            const standardPrice = item.advancedSettings?.cardCashPlayPrice ?? 0;
                            const vipPrice = item.advancedSettings?.vipDiscountedPrice ?? 0;
                            const status = item.slotStatus || item.status;

                            return (
                                <TableRow key={item.slotId || item.id} className="hover:bg-muted/30 transition-colors group">
                                    <TableCell className="font-mono font-medium py-3">
                                        <Link
                                            href={`/machines/${item.id}${item.slotId ? `?slotId=${item.slotId}` : ''}`}
                                            className="hover:underline text-blue-600 decoration-blue-400 underline-offset-4"
                                        >
                                            {item.assetTag}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="py-3">
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
                                                <span className="font-semibold text-sm group-hover:text-primary transition-colors">{item.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.type || "Standard Machine"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                                            <MapPin className="h-3 w-3 opacity-50" />
                                            {item.location || "N/A"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-3">
                                        <div className="inline-flex flex-col items-end">
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                ${standardPrice.toFixed(2)}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Non-Member</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-3">
                                        <div className="inline-flex flex-col items-end">
                                            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                ${vipPrice.toFixed(2)}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase mt-1">VIP Member</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-3">
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
    );
}
