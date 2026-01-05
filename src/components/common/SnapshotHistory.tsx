"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Snapshot, StockItem, ArcadeMachine } from "@/types";
import { snapshotService } from "@/services";
import { CreateSnapshotDialog } from "./CreateSnapshotDialog";
import { Camera, History, Clock, User, ArrowRight, Tag, ChevronRight, GitCompare, Plus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface SnapshotHistoryProps {
    entity: StockItem | ArcadeMachine;
    entityType: "stockItem" | "machine";
    userId?: string;
}

export function SnapshotHistory({ entity, entityType, userId }: SnapshotHistoryProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
    const [compareSnapshot, setCompareSnapshot] = useState<Snapshot | null>(null);
    const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);

    const fetchSnapshots = async () => {
        setIsLoading(true);
        try {
            const data = await snapshotService.getByEntity(entityType, entity.id);
            setSnapshots(data);
        } catch (error) {
            console.error("Failed to fetch snapshots:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSnapshots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entity.id, entityType]);

    const handleCompare = (snapshot: Snapshot) => {
        // Compare with current state
        const currentAsSnapshot: Snapshot = {
            id: "current",
            entityType,
            entityId: entity.id,
            entityName: entity.name,
            version: snapshots.length + 1,
            label: "Current State",
            data: { ...entity } as Record<string, unknown>,
            createdBy: "system",
            createdAt: new Date()
        };

        setSelectedSnapshot(snapshot);
        setCompareSnapshot(currentAsSnapshot);
        setIsCompareDialogOpen(true);
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return "—";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (typeof value === "object") {
            if (Array.isArray(value)) return `[${value.length} items]`;
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    const differences = selectedSnapshot && compareSnapshot
        ? snapshotService.diff(selectedSnapshot, compareSnapshot)
        : [];

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <History className="h-5 w-5 text-purple-600" />
                                Version History
                            </CardTitle>
                            <CardDescription>
                                Point-in-time snapshots of this {entityType === "stockItem" ? "item" : "machine"}
                            </CardDescription>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Camera className="h-4 w-4 mr-1" />
                            Create Snapshot
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading snapshots...
                        </div>
                    ) : snapshots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                            <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p>No snapshots yet</p>
                            <p className="text-xs mt-1">Create a snapshot to save the current state</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[280px]">
                            <div className="space-y-2 pr-4">
                                {snapshots.map((snapshot) => (
                                    <div
                                        key={snapshot.id}
                                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    v{snapshot.version}
                                                </Badge>
                                                {snapshot.label && (
                                                    <span className="text-sm font-medium flex items-center gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        {snapshot.label}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => handleCompare(snapshot)}
                                            >
                                                <GitCompare className="h-3 w-3 mr-1" />
                                                Compare
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(snapshot.createdAt), "MMM d, yyyy h:mm a")}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {snapshot.createdBy}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Create Snapshot Dialog */}
            <CreateSnapshotDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                entity={entity}
                entityType={entityType}
                userId={userId}
                onSuccess={fetchSnapshots}
            />

            {/* Compare Dialog */}
            <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GitCompare className="h-5 w-5 text-purple-600" />
                            Compare Versions
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                        <div className="text-center">
                            <Badge variant="outline">v{selectedSnapshot?.version}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                {selectedSnapshot?.label || format(new Date(selectedSnapshot?.createdAt || new Date()), "MMM d, yyyy")}
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                            <Badge>Current</Badge>
                            <p className="text-xs text-muted-foreground mt-1">Live State</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {differences.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No differences found</p>
                                <p className="text-xs mt-1">The snapshot matches the current state</p>
                            </div>
                        ) : (
                            differences.map((diff, idx) => (
                                <div key={idx} className="p-3 rounded-lg border bg-card">
                                    <div className="font-medium text-sm mb-2 capitalize">
                                        {diff.field.replace(/([A-Z])/g, " $1").trim()}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                            <p className="text-[10px] uppercase text-red-600 dark:text-red-400 mb-1">Old Value</p>
                                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                                {formatValue(diff.oldValue)}
                                            </pre>
                                        </div>
                                        <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                            <p className="text-[10px] uppercase text-green-600 dark:text-green-400 mb-1">New Value</p>
                                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                                {formatValue(diff.newValue)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
