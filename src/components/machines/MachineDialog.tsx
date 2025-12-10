"use client";

import { useState, useEffect } from "react";
import { ArcadeMachine, MachineDisplayItem } from "@/types";
import { machineService } from "@/services";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MachineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemToEdit?: MachineDisplayItem | null;
    onSuccess: () => void;
}

export function MachineDialog({ open, onOpenChange, itemToEdit, onSuccess }: MachineDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ArcadeMachine>>({
        assetTag: "",
        name: "",
        location: "",
        status: "Online",
        slots: [],
    });
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [slotStatus, setSlotStatus] = useState<string>("online");

    useEffect(() => {
        if (itemToEdit) {
            // If editing a slot, we still load the whole machine data
            // but we track which slot we are editing
            setFormData(itemToEdit.originalMachine || itemToEdit);

            if (itemToEdit.isSlot && itemToEdit.slotId) {
                setEditingSlotId(itemToEdit.slotId);
                setSlotStatus(itemToEdit.slotStatus || "online");
            } else {
                setEditingSlotId(null);
                setSlotStatus("online");
            }
        } else {
            setFormData({
                assetTag: "",
                name: "",
                location: "",
                status: "Online",
                slots: [],
            });
            setEditingSlotId(null);
            setSlotStatus("online");
        }
    }, [itemToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            if (itemToEdit) {
                const updatedData = { ...formData };

                // If editing a slot, update the slot status in the slots array
                if (editingSlotId && updatedData.slots) {
                    updatedData.slots = updatedData.slots.map(slot => {
                        if (slot.id === editingSlotId) {
                            return {
                                ...slot,
                                status: slotStatus as any
                            };
                        }
                        return slot;
                    });
                }

                // Update
                await machineService.update(itemToEdit.id, updatedData);
                await logAction(
                    user.uid,
                    "update",
                    "machine",
                    itemToEdit.id,
                    editingSlotId ? "Updated machine slot details" : "Updated machine details",
                    itemToEdit,
                    updatedData
                );
            } else {
                // Create
                const newId = await machineService.add(formData as Omit<ArcadeMachine, "id">);
                await logAction(
                    user.uid,
                    "create",
                    "machine",
                    newId,
                    "Created new machine",
                    null,
                    formData
                );
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save machine:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {itemToEdit
                            ? (editingSlotId ? `Edit Slot: ${itemToEdit.slotName}` : "Edit Machine")
                            : "Add New Machine"}
                    </DialogTitle>
                    <DialogDescription>
                        {itemToEdit
                            ? (editingSlotId ? "Update the status of this slot." : "Update the details of the machine.")
                            : "Enter the details for the new machine."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assetTag" className="text-right">
                            Asset Tag
                        </Label>
                        <Input
                            id="assetTag"
                            value={formData.assetTag}
                            onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            required
                            disabled={!!editingSlotId} // Disable name editing when editing a slot (since it's the machine name)
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                            Location
                        </Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>

                    {editingSlotId ? (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="slotStatus" className="text-right">
                                Slot Status
                            </Label>
                            <Select
                                value={slotStatus}
                                onValueChange={(value) => setSlotStatus(value)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Machine Status
                            </Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Online">Online</SelectItem>
                                    <SelectItem value="Offline">Offline</SelectItem>
                                    <SelectItem value="Error">Error</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </form>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
