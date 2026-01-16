"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MachineDisplayItem, ArcadeMachine, StockItem } from "@/types";
import { MachineTable } from "./MachineTable";
import { Archive } from "lucide-react";

interface ArchivedMachinesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    archivedMachines: MachineDisplayItem[];
    onEdit: (machine: MachineDisplayItem) => void;
    onDelete: (machine: MachineDisplayItem) => void;
    onStatusUpdate: (machine: MachineDisplayItem, status: string) => void;
    onAssignStock: (machine: ArcadeMachine, slotId?: string) => void;
    onStockLevelChange: (item: StockItem, newLevel: string) => void;
    onRestore: (machine: MachineDisplayItem) => void;
}

export function ArchivedMachinesDialog({
    open,
    onOpenChange,
    archivedMachines,
    onEdit,
    onDelete,
    onStatusUpdate,
    onAssignStock,
    onStockLevelChange,
    onRestore
}: ArchivedMachinesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
                    <div className="bg-amber-100 p-2 rounded-full">
                        <Archive className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl">Archived Machines</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            View and restore previously archived machines.
                        </p>
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    {archivedMachines.length === 0 ? (
                        <div className="py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed">
                            <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">No archived machines found.</p>
                        </div>
                    ) : (
                        <MachineTable
                            machines={archivedMachines}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusUpdate={onStatusUpdate}
                            onAssignStock={onAssignStock}
                            onStockLevelChange={onStockLevelChange}
                            onRestore={onRestore}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
