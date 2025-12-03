"use client";

import { useState } from "react";
import { ReorderRequest, StockItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ReceiveOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requests: ReorderRequest[];
    stockItems: StockItem[];
    onReceive: (request: ReorderRequest, action: 'update_existing' | 'create_new', itemId?: string) => void;
}

export function ReceiveOrderDialog({ open, onOpenChange, requests, stockItems, onReceive }: ReceiveOrderDialogProps) {
    const [selectedRequestId, setSelectedRequestId] = useState<string>("");
    const [action, setAction] = useState<'update_existing' | 'create_new'>('update_existing');
    const [targetItemId, setTargetItemId] = useState<string>("");

    const selectedRequest = requests.find(r => r.id === selectedRequestId);

    const handleConfirm = () => {
        if (selectedRequest) {
            onReceive(selectedRequest, action, action === 'update_existing' ? targetItemId : undefined);
            onOpenChange(false);
            setSelectedRequestId("");
            setAction('update_existing');
            setTargetItemId("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Receive Order</DialogTitle>
                    <DialogDescription>
                        Process incoming stock from fulfilled reorder requests.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Fulfilled Request</label>
                        <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a request..." />
                            </SelectTrigger>
                            <SelectContent>
                                {requests.filter(r => r.status === 'fulfilled' || r.status === 'ordered').map(req => (
                                    <SelectItem key={req.id} value={req.id}>
                                        {req.itemName} - {req.quantityRequested} units ({req.status})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRequest && (
                        <div className="p-4 bg-muted rounded-md space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Item:</span>
                                <span className="font-medium">{selectedRequest.itemName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Qty Requested:</span>
                                <span className="font-medium">{selectedRequest.quantityRequested}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Requested By:</span>
                                <span>{selectedRequest.requestedBy}</span>
                            </div>
                        </div>
                    )}

                    {selectedRequest && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action</label>
                            <Select value={action} onValueChange={(v: any) => setAction(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="update_existing">Add to Existing Item</SelectItem>
                                    <SelectItem value="create_new">Create New Item</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedRequest && action === 'update_existing' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Stock Item</label>
                            <Select value={targetItemId} onValueChange={setTargetItemId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Search or select item..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} (SKU: {item.sku})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedRequest.itemId && !targetItemId && (
                                <p className="text-xs text-muted-foreground">
                                    Linked Item ID: {selectedRequest.itemId} (Select this if correct)
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!selectedRequestId || (action === 'update_existing' && !targetItemId)}>
                        Process Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
