"use client";

import { useState } from "react";
import { ArcadeMachine, ArcadeMachineSlot } from "@/types";
import { machineService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RotateCw, Package } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StockRotationDialog } from "./StockRotationDialog";
import { generateId } from "@/lib/utils";

interface SlotsListProps {
    machine: ArcadeMachine;
    onUpdate: () => void;
}

export function SlotsList({ machine, onUpdate }: SlotsListProps) {
    const [newSlotName, setNewSlotName] = useState("");
    const [adding, setAdding] = useState(false);
    const [rotationSlotId, setRotationSlotId] = useState<string | null>(null);

    const handleAddSlot = async () => {
        if (!newSlotName.trim()) return;
        setAdding(true);
        try {
            const newSlot: ArcadeMachineSlot = {
                id: generateId(),
                name: newSlotName,
                gameType: "Claw", // Default
                status: "online",
                currentItem: null,
                upcomingQueue: [],
                stockLevel: "Empty"
            };

            const updatedSlots = [...(machine.slots || []), newSlot];
            await machineService.update(machine.id, { slots: updatedSlots });
            setNewSlotName("");
            onUpdate();
        } catch (error) {
            console.error("Failed to add slot:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveSlot = async (index: number) => {
        try {
            const updatedSlots = [...(machine.slots || [])];
            updatedSlots.splice(index, 1);
            await machineService.update(machine.id, { slots: updatedSlots });
            onUpdate();
        } catch (error) {
            console.error("Failed to remove slot:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="New Slot Name (e.g., Left Claw)"
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value)}
                />
                <Button onClick={handleAddSlot} disabled={adding || !newSlotName.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Next Up</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(!machine.slots || machine.slots.length === 0) ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No slots configured.
                            </TableCell>
                        </TableRow>
                    ) : (
                        machine.slots.map((slot, index) => (
                            <TableRow key={slot.id || index}>
                                <TableCell className="font-medium">{slot.name}</TableCell>
                                <TableCell>
                                    {slot.currentItem ? (
                                        <div className="flex flex-col">
                                            <Link
                                                href={`/inventory/${slot.currentItem.id}`}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                {slot.currentItem.name}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">{slot.currentItem.sku}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground italic">Empty</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {slot.upcomingQueue.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {slot.upcomingQueue.length}
                                            </Badge>
                                            <Link
                                                href={`/inventory/${slot.upcomingQueue[0].itemId}`}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                {slot.upcomingQueue[0].name}
                                            </Link>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={slot.status === 'online' ? 'outline' : 'secondary'}>
                                        {slot.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRotationSlotId(slot.id)}
                                            title="Rotate Stock"
                                        >
                                            <RotateCw className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => handleRemoveSlot(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {rotationSlotId && (
                <StockRotationDialog
                    open={!!rotationSlotId}
                    onOpenChange={(open) => !open && setRotationSlotId(null)}
                    machine={machine}
                    slotId={rotationSlotId}
                    onSuccess={onUpdate}
                />
            )}
        </div>
    );
}
