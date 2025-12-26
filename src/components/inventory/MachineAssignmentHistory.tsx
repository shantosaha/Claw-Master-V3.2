"use client";

import { useState } from "react";
import { ArcadeMachine, StockItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
import { Bot, ExternalLink, Clock, ArrowRight, User, ArrowLeftRight, Plus, Minus, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { migrateToMachineAssignments } from "@/utils/machineAssignmentUtils";

interface MachineAssignmentHistoryProps {
    item: StockItem;
    machines: ArcadeMachine[];
}

interface HistoryEntry {
    id: string;
    action: string;
    actionType: 'assign' | 'unassign' | 'status_change' | 'transfer' | 'other';
    machineName: string;
    machineId?: string;
    fromMachine?: string;
    fromMachineId?: string;
    toMachine?: string;
    toMachineId?: string;
    slotName?: string;
    fromSlot?: string;
    toSlot?: string;
    status?: string;
    fromStatus?: string;
    toStatus?: string;
    timestamp: Date;
    userId: string;
    userRole?: string;
    isCurrent: boolean;
}

export function MachineAssignmentHistory({
    item,
    machines,
}: MachineAssignmentHistoryProps) {
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Parse all assignment-related history entries
    const historyEntries: HistoryEntry[] = [];

    // Add all current assignments from machineAssignments array
    const currentAssignments = migrateToMachineAssignments(item);
    currentAssignments.forEach((assignment, index) => {
        historyEntries.push({
            id: `current-${assignment.machineId}`,
            action: assignment.status === 'Using' ? 'Using in machine' : 'Queued as replacement',
            actionType: 'assign',
            machineName: assignment.machineName,
            machineId: assignment.machineId,
            toMachine: assignment.machineName,
            toMachineId: assignment.machineId,

            status: assignment.status === 'Using' ? 'Assigned' : 'Assigned for Replacement',
            toStatus: assignment.status,
            timestamp: new Date(assignment.assignedAt),
            userId: 'system',
            isCurrent: true
        });
    });

    // Parse history for all assignment/machine actions
    if (item.history) {
        item.history.forEach(log => {
            const actionLower = log.action.toLowerCase();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const details = log.details as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newValue = log.newValue as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const oldValue = log.oldValue as any;

            if (
                actionLower.includes('assign') ||
                actionLower.includes('machine') ||
                actionLower.includes('status') ||
                actionLower.includes('transfer')
            ) {
                let actionType: 'assign' | 'unassign' | 'status_change' | 'transfer' | 'other' = 'other';
                let actionDescription = log.action;

                const fromMachine = details?.fromMachine || details?.previousMachine || oldValue?.assignedMachineName;
                const toMachine = details?.toMachine || details?.machine || details?.machineName || newValue?.assignedMachineName;
                const fromMachineId = details?.fromMachineId || details?.previousMachineId || oldValue?.assignedMachineId;
                const toMachineId = details?.toMachineId || details?.machineId || newValue?.assignedMachineId;
                const fromStatus = details?.fromStatus || details?.oldStatus || details?.previousStatus || oldValue?.assignedStatus;
                const toStatus = details?.toStatus || details?.newStatus || details?.status || newValue?.assignedStatus;
                const fromSlot = details?.fromSlot || details?.previousSlot;
                const toSlot = details?.toSlot || details?.slot || details?.slotName;

                if (fromMachine && toMachine && fromMachine !== toMachine) {
                    actionType = 'transfer';
                    actionDescription = `Machine Transfer`;
                } else if (actionLower.includes('assign_machine') || actionLower.includes('assigned')) {
                    actionType = 'assign';
                    actionDescription = `Assigned to machine`;
                } else if (actionLower.includes('unassign') || actionLower.includes('remove')) {
                    actionType = 'unassign';
                    actionDescription = `Removed from machine`;
                } else if (actionLower.includes('status') && (fromStatus || toStatus)) {
                    actionType = 'status_change';
                    actionDescription = `Status Changed`;
                }

                historyEntries.push({
                    id: log.id,
                    action: actionDescription,
                    actionType,
                    machineName: toMachine || fromMachine || 'Unknown',
                    machineId: toMachineId || fromMachineId,
                    fromMachine,
                    fromMachineId,
                    toMachine,
                    toMachineId,
                    status: toStatus,
                    fromStatus,
                    toStatus,
                    timestamp: new Date(log.timestamp),
                    userId: log.userId || 'system',
                    userRole: log.userRole,
                    isCurrent: false
                });
            }
        });
    }

    // Sort by date descending, current first
    const sortedHistory = historyEntries.sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
    });

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'assign':
                return <Plus className="h-3.5 w-3.5 text-green-500" />;
            case 'unassign':
                return <Minus className="h-3.5 w-3.5 text-red-500" />;
            case 'status_change':
                return <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" />;
            case 'transfer':
                return <ArrowRight className="h-3.5 w-3.5 text-purple-500" />;
            default:
                return <Bot className="h-3.5 w-3.5 text-muted-foreground" />;
        }
    };

    const getActionBadgeColor = (actionType: string) => {
        switch (actionType) {
            case 'assign':
                return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
            case 'unassign':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            case 'status_change':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'transfer':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusLabel = (status?: string) => {
        if (!status) return '';
        return status === 'Assigned' ? 'Using' : status === 'Assigned for Replacement' ? 'Replacement' : status;
    };

    const handleEntryClick = (entry: HistoryEntry) => {
        setSelectedEntry(entry);
        setIsDialogOpen(true);
    };

    return (
        <>
            {/* Scrollable List View */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Machine Assignment History
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {sortedHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No assignment history found.
                        </p>
                    ) : (
                        <ScrollArea className="h-[240px]">
                            <div className="space-y-1.5">
                                {sortedHistory.map((entry, index) => (
                                    <div
                                        key={entry.id || index}
                                        className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${entry.isCurrent
                                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                            : 'bg-muted/20 border-border/50 hover:bg-muted/40'
                                            }`}
                                        onClick={() => handleEntryClick(entry)}
                                    >
                                        {/* Row 1: Action + Badge */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {getActionIcon(entry.actionType)}
                                                <span className="text-sm font-medium">{entry.action}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {entry.isCurrent && (
                                                    <Badge variant="default" className="text-xs h-5">Current</Badge>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>

                                        {/* Row 2: Machine info (compact) */}
                                        <div className="flex items-center gap-1.5 text-xs mt-1.5 ml-5">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            {entry.actionType === 'transfer' ? (
                                                <span className="text-muted-foreground">
                                                    <span className="font-medium text-foreground">{entry.fromMachine}</span>
                                                    <ArrowRight className="h-3 w-3 inline mx-1" />
                                                    <span className="font-medium text-primary">{entry.toMachine}</span>
                                                </span>
                                            ) : entry.actionType === 'status_change' ? (
                                                <span className="text-muted-foreground">
                                                    <span className="font-medium text-foreground">{entry.machineName}</span>
                                                    <span className="mx-1">•</span>
                                                    <span>{getStatusLabel(entry.fromStatus)}</span>
                                                    <ArrowRight className="h-3 w-3 inline mx-1" />
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">{getStatusLabel(entry.toStatus)}</span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    <span className="font-medium text-foreground">{entry.machineName}</span>
                                                    {entry.toStatus && (
                                                        <span className="ml-1">({getStatusLabel(entry.toStatus)})</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 3: Time + User */}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 ml-5">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{format(entry.timestamp, "MMM d, yyyy 'at' h:mm a")}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span>{entry.userId === 'system' ? 'System' : entry.userId}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Popup Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>History Detail</DialogTitle>
                    </DialogHeader>

                    {selectedEntry && (
                        <div className="space-y-4">
                            {/* Action Type */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <div className={`p-2 rounded-lg ${selectedEntry.actionType === 'assign' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    selectedEntry.actionType === 'unassign' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                        selectedEntry.actionType === 'status_change' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                            selectedEntry.actionType === 'transfer' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                'bg-muted'
                                    }`}>
                                    {selectedEntry.actionType === 'assign' && <Plus className="h-4 w-4" />}
                                    {selectedEntry.actionType === 'unassign' && <Minus className="h-4 w-4" />}
                                    {selectedEntry.actionType === 'status_change' && <ArrowLeftRight className="h-4 w-4" />}
                                    {selectedEntry.actionType === 'transfer' && <ArrowRight className="h-4 w-4" />}
                                    {selectedEntry.actionType === 'other' && <Bot className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{selectedEntry.action}</p>
                                    {selectedEntry.isCurrent && (
                                        <Badge className="mt-1 text-xs">Current Assignment</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Machine Info */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">MACHINE</p>
                                {selectedEntry.actionType === 'transfer' ? (
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                        <Link
                                            href={`/machines/${selectedEntry.fromMachineId}`}
                                            className="p-3 rounded-lg border bg-card hover:bg-muted text-center"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">From</p>
                                            <p className="font-medium text-sm">{selectedEntry.fromMachine}</p>
                                            {selectedEntry.fromSlot && <p className="text-xs text-muted-foreground">{selectedEntry.fromSlot}</p>}
                                        </Link>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <Link
                                            href={`/machines/${selectedEntry.toMachineId}`}
                                            className="p-3 rounded-lg border bg-card hover:bg-muted text-center"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">To</p>
                                            <p className="font-medium text-sm">{selectedEntry.toMachine}</p>
                                            {selectedEntry.toSlot && <p className="text-xs text-muted-foreground">{selectedEntry.toSlot}</p>}
                                        </Link>
                                    </div>
                                ) : (
                                    <Link
                                        href={`/machines/${selectedEntry.machineId}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        <Bot className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{selectedEntry.machineName}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                )}
                            </div>

                            {/* Status */}
                            {(selectedEntry.fromStatus || selectedEntry.toStatus) && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">STATUS</p>
                                    {selectedEntry.actionType === 'status_change' && selectedEntry.fromStatus && selectedEntry.toStatus ? (
                                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                                            <Badge variant="outline">{getStatusLabel(selectedEntry.fromStatus)}</Badge>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <Badge>{getStatusLabel(selectedEntry.toStatus)}</Badge>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <Badge>{getStatusLabel(selectedEntry.toStatus || selectedEntry.fromStatus)}</Badge>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Details */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">DETAILS</p>
                                <div className="p-3 rounded-lg border bg-card space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date</span>
                                        <span className="font-medium">{format(selectedEntry.timestamp, "MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Time</span>
                                        <span className="font-medium">{format(selectedEntry.timestamp, "h:mm a")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Performed by</span>
                                        <span className="font-medium">{selectedEntry.userId === 'system' ? 'System' : selectedEntry.userId}</span>
                                    </div>
                                    {selectedEntry.userRole && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Role</span>
                                            <span className="font-medium">{selectedEntry.userRole}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stock Item */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">STOCK ITEM</p>
                                <Link
                                    href={`/inventory/${item.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    {item.imageUrls?.[0] || item.imageUrl ? (
                                        <img src={item.imageUrls?.[0] || item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-medium">
                                            {item.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.sku} • {item.category}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
