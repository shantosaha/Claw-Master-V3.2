"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/context/AuthContext";
import { pendingStockCheckService, notificationService, stockService, machineService } from "@/services";
import { PendingStockCheck, StockItem, StockLocation } from "@/types";
import { ComparisonView } from "./ComparisonView";
import { DiscardDialog } from "./DiscardDialog";
import { formatDistanceToNow, format } from "date-fns";
import {
    Clock,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    RefreshCw,
    AlertCircle,
    Undo2,
    Eye
} from "lucide-react";
import { toast } from "sonner";

/**
 * Helper function to update multiple stock item quantities by modifying their locations arrays
 * This is more efficient and avoids multiple re-renders
 */
async function updateStockQuantitiesBatch(updates: { id: string; quantity: number }[]): Promise<boolean> {
    if (updates.length === 0) return true;
    try {
        const batchUpdates: { id: string; data: Partial<StockItem> }[] = [];

        for (const update of updates) {
            const currentItem = await stockService.getById(update.id);
            if (!currentItem) continue;

            let updatedLocations: StockLocation[] = [...(currentItem.locations || [])];
            if (updatedLocations.length === 0) {
                updatedLocations = [{ name: "Warehouse", quantity: update.quantity }];
            } else {
                updatedLocations = updatedLocations.map((loc, index) => ({
                    ...loc,
                    quantity: index === 0 ? update.quantity : 0
                }));
            }

            batchUpdates.push({
                id: update.id,
                data: {
                    locations: updatedLocations,
                    updatedAt: new Date()
                }
            });
        }

        if (batchUpdates.length > 0) {
            await stockService.updateBatch(batchUpdates);
        }
        return true;
    } catch (error) {
        console.error(`[updateStockQuantitiesBatch] Failed:`, error);
        return false;
    }
}

export function PendingReviewsTab() {
    const { user, userProfile, canApproveStockCheck } = useAuth();
    const [pending, setPending] = useState<PendingStockCheck[]>([]);
    const [history, setHistory] = useState<PendingStockCheck[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [discardingSubmission, setDiscardingSubmission] = useState<PendingStockCheck | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pendingData, historyData] = await Promise.all([
                pendingStockCheckService.getPending(),
                pendingStockCheckService.getHistory(),
            ]);
            setPending(pendingData);
            setHistory(historyData.slice(0, 20)); // Last 20
        } catch (error) {
            console.error("Failed to load pending reviews:", error);
            toast.error("Failed to load pending reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (submission: PendingStockCheck) => {
        if (!user || !userProfile) return;

        setProcessingId(submission.id);
        try {
            const { report } = submission;

            // Collect updates
            const machineUpdates: { id: string; data: { status: 'Online' | 'Offline' | 'Maintenance' | 'Error' } }[] = [];
            const stockUpdates: { id: string; quantity: number }[] = [];

            // Collect machine statuses
            for (const [machineId, check] of Object.entries(report.machineChecks)) {
                if (check.status) {
                    machineUpdates.push({
                        id: machineId,
                        data: { status: check.status as 'Online' | 'Offline' | 'Maintenance' | 'Error' }
                    });
                }
            }

            // Collect item quantities from machine slots
            for (const [, slots] of Object.entries(report.itemChecks)) {
                for (const [, check] of Object.entries(slots)) {
                    if (check.actualQty !== null && check.itemId && check.actualQty !== check.systemQty) {
                        // Avoid duplicates in the same submission
                        if (!stockUpdates.some(s => s.id === check.itemId)) {
                            stockUpdates.push({ id: check.itemId, quantity: check.actualQty });
                        }
                    }
                }
            }

            // Collect replacement items
            for (const [itemId, check] of Object.entries(report.replacementItemChecks)) {
                if (check.actualQty !== null && check.actualQty !== check.systemQty) {
                    if (!stockUpdates.some(s => s.id === itemId)) {
                        stockUpdates.push({ id: itemId, quantity: check.actualQty });
                    }
                }
            }

            console.log(`[Approve] BATCH applying ${machineUpdates.length} machine updates, ${stockUpdates.length} stock updates`);

            // Apply machine updates in batch
            if (machineUpdates.length > 0) {
                try {
                    await machineService.updateBatch(machineUpdates);
                } catch (e) {
                    console.error(`[Approve] Machine batch update failed:`, e);
                    // Fallback to loop if batch fails? No, batch is safer for consistency
                }
            }

            // Apply stock updates in batch
            if (stockUpdates.length > 0) {
                const success = await updateStockQuantitiesBatch(stockUpdates);
                if (!success) {
                    toast.error("Some stock updates failed to apply.");
                }
            }

            // Mark as approved (this is effectively the last step of the transaction)
            await pendingStockCheckService.approve(
                submission.id,
                user.uid,
                userProfile.displayName || userProfile.email
            );

            // Notify submitter
            await notificationService.create(
                submission.submittedBy,
                "stock_check_approved",
                "Stock Check Approved",
                `Your stock check submission has been approved by ${userProfile.displayName || "an admin"}.`,
                { submissionId: submission.id }
            );

            toast.success("Submission approved and changes applied", {
                description: `Updated ${machineUpdates.length} machine(s) and ${stockUpdates.length} stock item(s).`
            });

            // Reload data to reflect changes
            await loadData();
        } catch (error) {
            console.error("Failed to approve submission:", error);
            toast.error("Failed to approve submission");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDiscard = async (reason?: string) => {
        if (!user || !userProfile || !discardingSubmission) return;

        setProcessingId(discardingSubmission.id);
        try {
            await pendingStockCheckService.discard(
                discardingSubmission.id,
                user.uid,
                userProfile.displayName || userProfile.email,
                reason
            );

            // Notify submitter
            await notificationService.create(
                discardingSubmission.submittedBy,
                "stock_check_rejected",
                "Stock Check Rejected",
                reason
                    ? `Your stock check was rejected: ${reason}`
                    : `Your stock check was rejected by ${userProfile.displayName || "an admin"}.`,
                { submissionId: discardingSubmission.id }
            );

            toast.success("Submission discarded");
            setDiscardingSubmission(null);
            loadData();
        } catch (error) {
            console.error("Failed to discard submission:", error);
            toast.error("Failed to discard submission");
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Restore a submission (works for both approved and discarded)
     * If it was approved, we need to rollback the changes first
     */
    const handleRestore = async (submission: PendingStockCheck) => {
        setProcessingId(submission.id);
        try {
            // If it was APPROVED, we need to rollback changes first
            if (submission.status === "approved") {
                const { snapshotBefore, report } = submission;

                // Rollback machine statuses to before state
                const machineRollbacks: { id: string; data: { status: 'Online' | 'Offline' | 'Maintenance' | 'Error' } }[] = [];
                for (const [machineId, check] of Object.entries(report.machineChecks)) {
                    if (check.status) {
                        const beforeMachine = snapshotBefore.machines.find(m => m.id === machineId);
                        if (beforeMachine) {
                            machineRollbacks.push({ id: machineId, data: { status: beforeMachine.status } });
                        }
                    }
                }

                // Rollback item quantities to before state
                const stockRollbacks: { id: string; data: { quantity: number } }[] = [];
                for (const [, slots] of Object.entries(report.itemChecks)) {
                    for (const [, check] of Object.entries(slots)) {
                        if (check.actualQty !== null && check.itemId && check.actualQty !== check.systemQty) {
                            const beforeItem = snapshotBefore.items.find(i => i.id === check.itemId);
                            if (beforeItem) {
                                stockRollbacks.push({ id: check.itemId, data: { quantity: beforeItem.quantity } });
                            }
                        }
                    }
                }

                // Rollback replacement items
                for (const [itemId, check] of Object.entries(report.replacementItemChecks)) {
                    if (check.actualQty !== null && check.actualQty !== check.systemQty) {
                        const beforeItem = snapshotBefore.items.find(i => i.id === itemId);
                        if (beforeItem) {
                            stockRollbacks.push({ id: itemId, data: { quantity: beforeItem.quantity } });
                        }
                    }
                }

                // Apply rollbacks
                if (machineRollbacks.length > 0) {
                    await machineService.updateBatch(machineRollbacks);
                }
                if (stockRollbacks.length > 0) {
                    // Use the batch helper we just created
                    await updateStockQuantitiesBatch(stockRollbacks.map(r => ({ id: r.id, quantity: r.data.quantity })));
                }

                toast.info(`Rolled back ${machineRollbacks.length} machine(s) and ${stockRollbacks.length} item(s)`);
            }

            // Now restore to pending status
            const result = await pendingStockCheckService.restore(submission.id);
            if (result.success) {
                toast.success("Submission restored to pending");
                loadData();
            } else {
                toast.error(result.error || "Failed to restore");
            }
        } catch (error) {
            console.error("Failed to restore submission:", error);
            toast.error("Failed to restore submission");
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Check if a submission can be restored (within 12 hours of review)
     * Now works for BOTH approved and discarded
     */
    const canRestore = (submission: PendingStockCheck): boolean => {
        if (submission.status === "pending") return false;

        const reviewedAt = submission.reviewedAt
            ? typeof submission.reviewedAt === "string"
                ? new Date(submission.reviewedAt)
                : submission.reviewedAt
            : null;

        if (!reviewedAt) return false;

        const hoursSince = (Date.now() - reviewedAt.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 12;
    };

    const getTimeRemaining = (submission: PendingStockCheck): string => {
        const reviewedAt = submission.reviewedAt
            ? typeof submission.reviewedAt === "string"
                ? new Date(submission.reviewedAt)
                : submission.reviewedAt
            : null;

        if (!reviewedAt) return "";

        const expiresAt = new Date(reviewedAt.getTime() + 12 * 60 * 60 * 1000);
        const remaining = expiresAt.getTime() - Date.now();
        const hoursRemaining = Math.floor(remaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        if (hoursRemaining > 0) {
            return `${hoursRemaining}h ${minutesRemaining}m left to restore`;
        }
        return `${minutesRemaining}m left to restore`;
    };

    const canUserApprove = canApproveStockCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Pending Reviews</h2>
                    <p className="text-sm text-muted-foreground">
                        Review and approve stock check submissions
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Permission Warning */}
            {!canUserApprove && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3 text-amber-800 dark:text-amber-400">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm">
                                You don&apos;t have permission to approve submissions. Contact an admin to get approval rights.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending List */}
            {pending.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-muted-foreground">No pending submissions</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            All stock checks have been reviewed
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {pending.map((submission) => (
                        <Collapsible
                            key={submission.id}
                            open={expandedId === submission.id}
                            onOpenChange={(open) => setExpandedId(open ? submission.id : null)}
                        >
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>
                                                    {submission.submittedByName?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">
                                                    {submission.submittedByName}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(
                                                        typeof submission.submittedAt === "string"
                                                            ? new Date(submission.submittedAt)
                                                            : submission.submittedAt,
                                                        { addSuffix: true }
                                                    )}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                Pending
                                            </Badge>
                                            <Badge variant="outline">
                                                {submission.report.stats.verifiedItems} items
                                            </Badge>
                                            <Badge variant="outline">
                                                {submission.report.stats.checkedMachines} machines
                                            </Badge>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    {expandedId === submission.id ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <Separator className="mb-4" />
                                        <ComparisonView submission={submission} />

                                        {canUserApprove && (
                                            <div className="flex justify-end gap-3 mt-6">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setDiscardingSubmission(submission)}
                                                    disabled={processingId === submission.id}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Discard
                                                </Button>
                                                <Button
                                                    onClick={() => handleApprove(submission)}
                                                    disabled={processingId === submission.id}
                                                >
                                                    {processingId === submission.id ? (
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Check className="h-4 w-4 mr-2" />
                                                    )}
                                                    Approve & Apply
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    ))}
                </div>
            )}

            {/* History Section */}
            <Separator />
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Review History</h3>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            {showHistory ? "Hide" : "Show"} History
                            {showHistory ? (
                                <ChevronUp className="h-4 w-4 ml-2" />
                            ) : (
                                <ChevronDown className="h-4 w-4 ml-2" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <ScrollArea className="h-[500px] mt-4">
                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No review history yet
                                </p>
                            ) : (
                                history.map((item) => (
                                    <Collapsible
                                        key={item.id}
                                        open={expandedHistoryId === item.id}
                                        onOpenChange={(open) => setExpandedHistoryId(open ? item.id : null)}
                                    >
                                        <Card className={item.status === "approved" ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}>
                                            <CardHeader className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Badge
                                                            variant={item.status === "approved" ? "default" : "destructive"}
                                                            className={item.status === "approved" ? "bg-green-600" : ""}
                                                        >
                                                            {item.status === "approved" ? (
                                                                <Check className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <X className="h-3 w-3 mr-1" />
                                                            )}
                                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                        </Badge>
                                                        <div>
                                                            <p className="text-sm font-medium">{item.submittedByName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.status === "approved" ? "Approved" : "Rejected"} by {item.reviewedByName} •{" "}
                                                                {item.reviewedAt &&
                                                                    format(
                                                                        typeof item.reviewedAt === "string"
                                                                            ? new Date(item.reviewedAt)
                                                                            : item.reviewedAt,
                                                                        "MMM d, h:mm a"
                                                                    )}
                                                            </p>
                                                            {item.rejectionReason && (
                                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                                    Reason: {item.rejectionReason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {canRestore(item) && canUserApprove && (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleRestore(item)}
                                                                    disabled={processingId === item.id}
                                                                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                                                >
                                                                    {processingId === item.id ? (
                                                                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                                                    ) : (
                                                                        <Undo2 className="h-4 w-4 mr-1" />
                                                                    )}
                                                                    Restore
                                                                </Button>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {getTimeRemaining(item)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                {expandedHistoryId === item.id ? "Hide" : "View"} Details
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CollapsibleContent>
                                                <CardContent className="pt-0">
                                                    <Separator className="mb-4" />
                                                    <ComparisonView submission={item} />
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CollapsibleContent>
            </Collapsible>

            {/* Discard Dialog */}
            <DiscardDialog
                open={!!discardingSubmission}
                onOpenChange={(open) => !open && setDiscardingSubmission(null)}
                onConfirm={handleDiscard}
                submitterName={discardingSubmission?.submittedByName || ""}
                loading={processingId === discardingSubmission?.id}
            />
        </div>
    );
}
