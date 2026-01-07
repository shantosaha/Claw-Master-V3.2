"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PendingStockCheck } from "@/types";
import { ArrowRight, Minus, Plus, AlertCircle, Check } from "lucide-react";

interface ComparisonViewProps {
    submission: PendingStockCheck;
}

interface ChangeItem {
    type: "machine_status" | "item_quantity" | "issue";
    machineId?: string;
    machineName?: string;
    itemId?: string;
    itemName?: string;
    before?: string | number;
    after?: string | number;
    issue?: string;
    changed: boolean;
}

export function ComparisonView({ submission }: ComparisonViewProps) {
    const { report, snapshotBefore } = submission;

    // Build machine lookup from snapshot
    const machineMap = new Map(
        snapshotBefore.machines.map((m) => [m.id, m])
    );

    // Build item lookup from snapshot
    const itemMap = new Map(
        snapshotBefore.items.map((i) => [i.id, i])
    );

    // Collect all changes
    const changes: ChangeItem[] = [];

    // Machine status changes
    Object.entries(report.machineChecks).forEach(([machineId, check]) => {
        const original = machineMap.get(machineId);
        if (check.status && original) {
            changes.push({
                type: "machine_status",
                machineId,
                machineName: original.name,
                before: original.status,
                after: check.status,
                changed: original.status !== check.status,
            });
        }
    });

    // Item quantity changes
    Object.entries(report.itemChecks).forEach(([machineId, slots]) => {
        Object.entries(slots).forEach(([slotId, check]) => {
            if (check.actualQty !== null && check.itemId) {
                const original = itemMap.get(check.itemId);
                changes.push({
                    type: "item_quantity",
                    machineId,
                    machineName: machineMap.get(machineId)?.name || machineId,
                    itemId: check.itemId,
                    itemName: check.itemName,
                    before: original?.quantity ?? check.systemQty,
                    after: check.actualQty,
                    changed: (original?.quantity ?? check.systemQty) !== check.actualQty,
                });

                // Issues
                if (check.issue?.trim()) {
                    changes.push({
                        type: "issue",
                        machineId,
                        machineName: machineMap.get(machineId)?.name || machineId,
                        itemId: check.itemId,
                        itemName: check.itemName,
                        issue: check.issue,
                        changed: true,
                    });
                }
            }
        });
    });

    // Replacement item changes
    Object.entries(report.replacementItemChecks).forEach(([itemId, check]) => {
        if (check.actualQty !== null) {
            const original = itemMap.get(itemId);
            changes.push({
                type: "item_quantity",
                itemId,
                itemName: check.itemName,
                before: original?.quantity ?? check.systemQty,
                after: check.actualQty,
                changed: (original?.quantity ?? check.systemQty) !== check.actualQty,
            });
        }
    });

    // Separate changed vs unchanged
    const changedItems = changes.filter((c) => c.changed);
    const unchangedItems = changes.filter((c) => !c.changed);

    // Summary stats
    const quantityChanges = changedItems.filter((c) => c.type === "item_quantity").length;
    const statusChanges = changedItems.filter((c) => c.type === "machine_status").length;
    const issuesReported = changedItems.filter((c) => c.type === "issue").length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Online": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "Offline": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
            case "Maintenance": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            case "Error": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default: return "";
        }
    };

    return (
        <div className="space-y-4">
            {/* Summary Header */}
            <Card className="bg-muted/50">
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {quantityChanges}
                            </Badge>
                            <span className="text-muted-foreground">quantity {quantityChanges === 1 ? "change" : "changes"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {statusChanges}
                            </Badge>
                            <span className="text-muted-foreground">status {statusChanges === 1 ? "change" : "changes"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                {issuesReported}
                            </Badge>
                            <span className="text-muted-foreground">{issuesReported === 1 ? "issue" : "issues"} reported</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Changed Items */}
            {changedItems.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plus className="h-4 w-4 text-green-500" />
                            Changes ({changedItems.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {changedItems.map((change, idx) => (
                            <div key={idx}>
                                {idx > 0 && <Separator className="my-3" />}

                                {change.type === "machine_status" && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{change.machineName}</p>
                                            <p className="text-xs text-muted-foreground">Machine Status</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(String(change.before))}>
                                                {String(change.before)}
                                            </Badge>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <Badge className={getStatusColor(String(change.after))}>
                                                {String(change.after)}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {change.type === "item_quantity" && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{change.itemName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {change.machineName ? `@ ${change.machineName}` : "Replacement Stock"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                {change.before}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <span className={`text-sm font-mono px-2 py-1 rounded ${Number(change.after) < Number(change.before)
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                }`}>
                                                {change.after}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {change.type === "issue" && (
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-sm">{change.itemName}</p>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {change.machineName ? `@ ${change.machineName}` : "Issue"}
                                            </p>
                                            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                                {change.issue}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Unchanged Items (collapsible) */}
            {unchangedItems.length > 0 && (
                <Card className="border-dashed">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                            <Minus className="h-4 w-4" />
                            No Change ({unchangedItems.length} items verified)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {unchangedItems.slice(0, 10).map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-muted-foreground">
                                    <Check className="h-3 w-3 mr-1" />
                                    {item.itemName || item.machineName}
                                </Badge>
                            ))}
                            {unchangedItems.length > 10 && (
                                <Badge variant="outline" className="text-muted-foreground">
                                    +{unchangedItems.length - 10} more
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {changedItems.length === 0 && (
                <Card className="text-center py-8">
                    <CardContent>
                        <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-muted-foreground">All items verified with no changes</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
