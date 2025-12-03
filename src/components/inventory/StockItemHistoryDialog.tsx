"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockItem, AuditLog } from "@/types";
import { History, UserCircle, Edit, ArrowRightLeft, ListPlus, ListMinus, ListX } from "lucide-react";

interface StockItemHistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: StockItem | null;
    historyLogs: AuditLog[];
}

const ActionIcon = ({ action }: { action: string }) => {
    const lowerCaseAction = action.toLowerCase();
    if (lowerCaseAction.includes("create")) return <ListPlus className="h-4 w-4 text-green-500" />;
    if (lowerCaseAction.includes("update") || lowerCaseAction.includes("edit")) return <Edit className="h-4 w-4 text-blue-500" />;
    if (lowerCaseAction.includes("add")) return <ListPlus className="h-4 w-4 text-sky-500" />;
    if (lowerCaseAction.includes("remove")) return <ListMinus className="h-4 w-4 text-orange-500" />;
    if (lowerCaseAction.includes("set") || lowerCaseAction.includes("adjust")) return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
    return <History className="h-4 w-4 text-muted-foreground" />;
};

const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function StockItemHistoryDialog({ isOpen, onOpenChange, item, historyLogs }: StockItemHistoryDialogProps) {
    if (!item) return null;

    // Filter logs for this item and sort by date descending
    const fullHistory = historyLogs
        .filter(log => log.entityType === 'StockItem' && log.entityId === item.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to 5 most recent entries for the summary view
    const displayedHistory = fullHistory.slice(0, 5);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl flex items-center">
                        <History className="mr-2 h-5 w-5 text-primary" /> Stock History for: {item.name}
                    </DialogTitle>
                    <DialogDescription className="font-body">
                        SKU: {item.sku} (Showing last 5 changes)
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow my-4">
                    {displayedHistory.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedHistory.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="p-2 align-top">
                                            <ActionIcon action={entry.action} />
                                        </TableCell>
                                        <TableCell className="p-2 align-top text-xs font-body whitespace-nowrap">
                                            {new Date(entry.timestamp).toLocaleDateString()} <br />
                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell className="p-2 align-top font-semibold font-body text-sm">{formatActionText(entry.action)}</TableCell>
                                        <TableCell className="p-2 align-top text-xs font-body">
                                            <div className="flex items-center gap-1">
                                                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                {entry.userId} ({entry.userRole})
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2 align-top text-xs font-body">
                                            {/* Adjust Stock Details */}
                                            {entry.details?.location && <p>Location: {entry.details.location}</p>}
                                            {entry.details?.change !== undefined && <p>Change: {String(entry.details.change).startsWith('-') || entry.details.change === 'set' ? '' : '+'}{entry.details.change} units</p>}
                                            {entry.details?.newQuantity !== undefined && <p>New Qty: {entry.details.newQuantity} units</p>}

                                            {/* Status Change Details */}
                                            {entry.action === "STOCK_LEVEL_CHANGE" ? (
                                                <div className="space-y-0.5">
                                                    {entry.details?.oldStatus && entry.details?.newStatus && (
                                                        <p className="font-medium">Status: {entry.details.oldStatus} &rarr; {entry.details.newStatus}</p>
                                                    )}
                                                    {entry.details?.quantitySetTo !== undefined && (
                                                        <p className="text-muted-foreground">Quantity set to: {entry.details.quantitySetTo}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                entry.details?.oldStatus && entry.details?.newStatus && (
                                                    <p>Status: {entry.details.oldStatus} &rarr; {entry.details.newStatus}</p>
                                                )
                                            )}

                                            {/* Machine Assignment Details */}
                                            {entry.details?.machine && entry.action.includes("ASSIGN") && (
                                                <p>Machine: {entry.details.machine} {entry.details.slot ? `(Slot: ${entry.details.slot})` : ''}</p>
                                            )}
                                            {entry.details?.status && entry.action.includes("ASSIGN") && (
                                                <p>Type: {entry.details.status}</p>
                                            )}
                                            {entry.details?.replacedBy && (
                                                <p>Replaced By: {entry.details.replacedBy}</p>
                                            )}

                                            {/* Create/Update Details */}
                                            {entry.action === "CREATE_ITEM" && entry.details?.name && <p>Name: {entry.details.name}</p>}
                                            {entry.action === "CREATE_ITEM" && entry.details?.category && <p>Category: {entry.details.category}</p>}

                                            {entry.action === "UPDATE_ITEM" && (
                                                <>
                                                    {entry.details?.changes && <p className="font-medium">{entry.details.changes}</p>}
                                                    {entry.details?.name && <p className="text-muted-foreground">{entry.details.name}</p>}
                                                    {entry.details?.quantity && <p className="text-muted-foreground">{entry.details.quantity}</p>}
                                                </>
                                            )}


                                            {/* Generic Reason */}
                                            {entry.details?.reason && <p className="mt-1 text-muted-foreground italic">Reason: {entry.details.reason}</p>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 font-body text-muted-foreground">
                            <ListX className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                            No history entries available for this item.
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="pt-4 mt-auto border-t flex justify-between sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">Close</Button>
                    <Button asChild variant="default" className="font-body">
                        <a href={`/inventory/${item.id}`}>View Full History</a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
