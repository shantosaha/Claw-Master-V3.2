"use client";

import { ArcadeMachine, StockItem, AuditLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { Bot, ExternalLink, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface MachineAssignmentHistoryProps {
    item: StockItem;
    machines: ArcadeMachine[];
    onViewAll?: () => void;
    maxItems?: number;
}

interface AssignmentRecord {
    machineId: string;
    machineName: string;
    slotName?: string;
    assignedAt: Date;
    removedAt?: Date;
    isCurrent: boolean;
}

export function MachineAssignmentHistory({
    item,
    machines,
    onViewAll,
    maxItems = 5
}: MachineAssignmentHistoryProps) {
    // Get current assignments
    const currentAssignments = machines.filter(m =>
        m.slots.some(slot =>
            slot.currentItem?.id === item.id ||
            slot.upcomingQueue?.some(uItem => uItem.itemId === item.id)
        )
    );

    // Extract assignment history from item.history
    const assignmentHistory: AssignmentRecord[] = [];

    // Add current assignment
    if (item.assignedMachineId && item.assignedMachineName) {
        assignmentHistory.push({
            machineId: item.assignedMachineId,
            machineName: item.assignedMachineName,
            assignedAt: new Date(item.updatedAt || item.createdAt),
            isCurrent: true
        });
    }

    // Parse history for past assignments
    if (item.history) {
        item.history
            .filter(log =>
                log.action.toLowerCase().includes("assign") ||
                log.action.toLowerCase().includes("machine")
            )
            .forEach(log => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const details = log.details as any;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newValue = log.newValue as any;

                if (details?.machineName || newValue?.assignedMachineName) {
                    const machineName = details?.machineName || newValue?.assignedMachineName;
                    const machineId = details?.machineId || newValue?.assignedMachineId;

                    // Avoid duplicating current assignment
                    if (machineId !== item.assignedMachineId) {
                        assignmentHistory.push({
                            machineId: machineId || "",
                            machineName: machineName || "Unknown Machine",
                            assignedAt: new Date(log.timestamp),
                            isCurrent: false
                        });
                    }
                }
            });
    }

    // Sort by date descending, current first
    const sortedHistory = assignmentHistory
        .sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1;
            if (!a.isCurrent && b.isCurrent) return 1;
            return b.assignedAt.getTime() - a.assignedAt.getTime();
        })
        .slice(0, maxItems);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Machine Assignment History
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {sortedHistory.length === 0 && currentAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Never assigned to a machine.
                    </p>
                ) : (
                    <ScrollArea className="h-[180px]">
                        <div className="space-y-2">
                            {/* Show current assignments from machines */}
                            {currentAssignments.map(machine => {
                                const slots = machine.slots.filter(s =>
                                    s.currentItem?.id === item.id
                                );
                                const queuedSlots = machine.slots.filter(s =>
                                    s.upcomingQueue?.some(u => u.itemId === item.id)
                                );

                                return (
                                    <div
                                        key={machine.id}
                                        className="p-2.5 rounded-lg bg-primary/5 border border-primary/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Link
                                                href={`/machines/${machine.id}`}
                                                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                            >
                                                {machine.name}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <Badge variant="default" className="text-xs">
                                                Current
                                            </Badge>
                                        </div>
                                        {slots.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                In use: {slots.map(s => s.name).join(", ")}
                                            </p>
                                        )}
                                        {queuedSlots.length > 0 && (
                                            <p className="text-xs text-yellow-600 mt-1">
                                                Queued: {queuedSlots.map(s => s.name).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Show history entries */}
                            {sortedHistory
                                .filter(record => !record.isCurrent || !currentAssignments.find(m => m.id === record.machineId))
                                .map((record, index) => (
                                    <div
                                        key={`${record.machineId}-${index}`}
                                        className="p-2.5 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {record.machineName}
                                            </span>
                                            {record.isCurrent ? (
                                                <Badge variant="default" className="text-xs">
                                                    Current
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    Past
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Clock className="h-3 w-3" />
                                            {format(record.assignedAt, "MMM d, yyyy")}
                                            {record.removedAt && (
                                                <>
                                                    <ArrowRight className="h-3 w-3" />
                                                    {format(record.removedAt, "MMM d, yyyy")}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </ScrollArea>
                )}

                {(sortedHistory.length > maxItems || currentAssignments.length > 0) && onViewAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={onViewAll}
                    >
                        View All Assignments →
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
