"use client";

import { useState } from "react";
import { ArcadeMachine, AuditLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Bot, ExternalLink, Clock, ArrowRight, User, ArrowLeftRight, Plus, Minus, ChevronRight, Package, RefreshCw } from "lucide-react";
import Link from "next/link";

interface StockAssignmentHistoryProps {
    machine: ArcadeMachine;
    logs: AuditLog[];
}

interface HistoryEntry {
    id: string;
    action: string;
    actionType: 'assign' | 'unassign' | 'status_change' | 'replenish' | 'other';
    itemName: string;
    itemId?: string;
    slotName?: string;
    quantity?: number;
    timestamp: Date;
    userId: string;
    userRole?: string;
    fullLog: AuditLog;
    isCurrent?: boolean;
}

export function StockAssignmentHistory({
    machine,
    logs,
}: StockAssignmentHistoryProps) {
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter and parse logs related to stock
    const stockHistoryEntries: HistoryEntry[] = [];

    // Add current assignments
    if (machine.slots && machine.slots.length > 0) {
        machine.slots.forEach(slot => {
            if (slot.currentItem) {
                stockHistoryEntries.push({
                    id: `current_${slot.id}`,
                    action: `Currently in ${slot.name || 'slot'}`,
                    actionType: 'assign',
                    itemName: slot.currentItem.name,
                    itemId: slot.currentItem.id,
                    slotName: slot.name,
                    quantity: 1,
                    timestamp: new Date(slot.currentItem.updatedAt || new Date()),
                    userId: 'Current',
                    userRole: 'Active',
                    fullLog: {} as any,
                    isCurrent: true
                });
            }
        });
    }

    logs.forEach(log => {
        const actionLower = log.action.toLowerCase();
        const messageLower = (log.details?.message as string || "").toLowerCase();
        const details = log.details as any;

        // Broad filter for stock related actions
        if (
            actionLower.includes('stock') ||
            actionLower.includes('item') ||
            actionLower.includes('queue') ||
            actionLower.includes('prize') ||
            messageLower.includes('stock') ||
            messageLower.includes('prize') ||
            messageLower.includes('queue')
        ) {
            let actionType: HistoryEntry['actionType'] = 'other';
            let itemName = "Unknown Item";
            let itemId = details?.itemId || details?.stockItemId;

            // Try to extract Item Name from message if not in details
            if (!itemName || itemName === "Unknown Item") {
                if (details?.itemName) itemName = details.itemName;
                else if (messageLower.includes('set current stock to ')) {
                    itemName = (log.details?.message as string).replace('Set current stock to ', '');
                } else if (messageLower.includes('queued ') && messageLower.includes(' for replacement')) {
                    itemName = (log.details?.message as string).replace('Queued ', '').replace(' for replacement', '');
                } else if (messageLower.includes('cleared current item')) {
                    itemName = "Current Item";
                }
            }

            // Determine Action Type
            if (actionLower.includes('set current') || messageLower.includes('set current')) {
                actionType = 'assign';
            } else if (actionLower.includes('queue') || messageLower.includes('queue')) {
                actionType = 'replenish';
            } else if (actionLower.includes('clear') || messageLower.includes('remov')) {
                actionType = 'unassign';
            }

            // Only add if we think it's relevant
            stockHistoryEntries.push({
                id: log.id,
                action: log.details?.message as string || log.action,
                actionType,
                itemName,
                itemId,
                slotName: details?.slotName || details?.slotId,
                quantity: details?.quantity,
                timestamp: new Date(log.timestamp),
                userId: log.userId,
                userRole: log.userRole,
                fullLog: log,
                isCurrent: false
            });
        }
    });

    const sortedHistory = stockHistoryEntries.sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
    });

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'assign': return <Plus className="h-3.5 w-3.5 text-green-500" />;
            case 'replenish': return <RefreshCw className="h-3.5 w-3.5 text-blue-500" />;
            case 'unassign': return <Minus className="h-3.5 w-3.5 text-red-500" />;
            default: return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
        }
    };

    const handleEntryClick = (entry: HistoryEntry) => {
        setSelectedEntry(entry);
        setIsDialogOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Stock Assignment History
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {sortedHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No stock assignment history found.
                        </p>
                    ) : (
                        <ScrollArea className="h-[240px]">
                            <div className="space-y-1.5">
                                {sortedHistory.map((entry, index) => (
                                    <div
                                        key={entry.id || index}
                                        className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${entry.isCurrent
                                                ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                                : 'bg-card hover:bg-muted/40'
                                            }`}
                                        onClick={() => handleEntryClick(entry)}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {getActionIcon(entry.actionType)}
                                                <span className="text-sm font-medium truncate">{entry.itemName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${entry.isCurrent ? 'bg-primary text-primary-foreground' :
                                                        entry.actionType === 'assign' ? 'bg-green-100 text-green-700' :
                                                            entry.actionType === 'replenish' ? 'bg-blue-100 text-blue-700' :
                                                                entry.actionType === 'unassign' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {entry.isCurrent ? 'Current' : (entry.actionType === 'replenish' ? 'Queue' : entry.actionType)}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs mt-1.5 ml-5 text-muted-foreground">
                                            <span>{entry.action}</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 ml-5">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{format(entry.timestamp, "MMM d, yyyy 'at' h:mm a")}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span>{entry.userId === 'system' ? 'System' : entry.userId}</span>
                                            </div>
                                            {entry.slotName && (
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">{entry.slotName}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Stock Action Detail</DialogTitle>
                    </DialogHeader>

                    {selectedEntry && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <div className="p-2 rounded-lg bg-background border">
                                    {getActionIcon(selectedEntry.actionType)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{selectedEntry.itemName}</p>
                                    <p className="text-xs text-muted-foreground">{selectedEntry.action}</p>
                                    {selectedEntry.isCurrent && <Badge className="mt-1">Current Item</Badge>}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid gap-2 text-sm border p-3 rounded-lg bg-card">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="font-medium">{format(selectedEntry.timestamp, "MMM d, yyyy")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time</span>
                                    <span className="font-medium">{format(selectedEntry.timestamp, "h:mm a")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">User</span>
                                    <span className="font-medium">{selectedEntry.userId}</span>
                                </div>
                                {selectedEntry.slotName && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Slot</span>
                                        <span className="font-medium">{selectedEntry.slotName}</span>
                                    </div>
                                )}
                            </div>

                            {selectedEntry.itemId && (
                                <Link
                                    href={`/inventory/${selectedEntry.itemId}`}
                                    className="block p-3 rounded-lg border bg-card hover:bg-muted transition-colors text-center text-sm font-medium text-blue-600"
                                >
                                    View Stock Item
                                </Link>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
