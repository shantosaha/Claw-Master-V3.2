"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DiscardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason?: string) => void;
    submitterName: string;
    loading?: boolean;
}

export function DiscardDialog({
    open,
    onOpenChange,
    onConfirm,
    submitterName,
    loading = false,
}: DiscardDialogProps) {
    const [reason, setReason] = useState("");
    const [showWarning, setShowWarning] = useState(false);

    const handleDiscard = () => {
        if (!reason.trim()) {
            setShowWarning(true);
            return;
        }
        onConfirm(reason);
    };

    const handleDiscardWithoutReason = () => {
        onConfirm(undefined);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setReason("");
            setShowWarning(false);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Discard Submission
                    </DialogTitle>
                    <DialogDescription>
                        This will reject the stock check submission from{" "}
                        <strong>{submitterName}</strong>. No changes will be applied.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for rejection (optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter a reason for rejecting this submission..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (e.target.value.trim()) setShowWarning(false);
                            }}
                            rows={3}
                        />
                    </div>

                    {showWarning && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                No reason provided. The submitter will receive a notification
                                without an explanation. Are you sure you want to continue?
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    {showWarning ? (
                        <Button
                            variant="destructive"
                            onClick={handleDiscardWithoutReason}
                            disabled={loading}
                        >
                            {loading ? "Discarding..." : "Discard Without Reason"}
                        </Button>
                    ) : (
                        <Button
                            variant="destructive"
                            onClick={handleDiscard}
                            disabled={loading}
                        >
                            {loading ? "Discarding..." : "Discard Submission"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
