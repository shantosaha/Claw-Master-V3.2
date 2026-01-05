"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { snapshotService } from "@/services";
import { StockItem, ArcadeMachine } from "@/types";

interface CreateSnapshotDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    entity: StockItem | ArcadeMachine;
    entityType: "stockItem" | "machine";
    userId?: string;
    onSuccess?: () => void;
}

export function CreateSnapshotDialog({
    isOpen,
    onOpenChange,
    entity,
    entityType,
    userId = "demo-user",
    onSuccess
}: CreateSnapshotDialogProps) {
    const [label, setLabel] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (entityType === "stockItem") {
                await snapshotService.createForStockItem(entity as StockItem, userId, label || undefined);
            } else {
                await snapshotService.createForMachine(entity as ArcadeMachine, userId, label || undefined);
            }

            toast.success("Snapshot created successfully");
            setLabel("");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Failed to create snapshot:", error);
            toast.error("Failed to create snapshot");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        Create Snapshot
                    </DialogTitle>
                    <DialogDescription>
                        Save a point-in-time copy of <strong>{entity.name}</strong> for future reference.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="label">Label (optional)</Label>
                        <Input
                            id="label"
                            placeholder="e.g., Before price update, Initial setup..."
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Add a descriptive label to help identify this snapshot later.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Camera className="h-4 w-4 mr-2" />
                                Create Snapshot
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
