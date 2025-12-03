"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { machineService, stockService } from "@/services";
import { ArcadeMachine, StockItem, MachineDisplayItem } from "@/types";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SlotsList } from "@/components/machines/SlotsList";
import { SettingsPanel } from "@/components/machines/SettingsPanel";
import { HistoryList } from "@/components/machines/HistoryList";
import { MachineDialog } from "@/components/machines/MachineDialog";
import { toast } from "sonner";

export default function MachineDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const slotId = searchParams.get('slotId');

    const [machine, setMachine] = useState<ArcadeMachine | null>(null);
    const [assignedStock, setAssignedStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [supervisorOverride, setSupervisorOverride] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadMachine();
        }
    }, [id, slotId]);

    const loadMachine = async () => {
        setLoading(true);
        try {
            const data = await machineService.getById(id);
            setMachine(data);

            if (data) {
                const allStock = await stockService.getAll();

                // Filter stock based on slot if slotId is present
                const machineStock = allStock.filter(item => {
                    // If viewing a specific slot, only show items assigned to that slot
                    if (slotId) {
                        return item.assignedSlotId === slotId;
                    }
                    // Otherwise show all items for the machine (by name match or assignedMachineId)
                    return item.assignedMachineId === data.id ||
                        item.locations?.some(loc => loc.name.toLowerCase().includes(data.name.toLowerCase()));
                });

                setAssignedStock(machineStock);
            }

        } catch (error) {
            console.error("Failed to load machine:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading details...</div>;
    if (!machine) return <div>Machine not found</div>;

    const currentSlot = slotId ? machine.slots.find(s => s.id === slotId) : null;
    const displayTitle = currentSlot ? `${machine.name} - ${currentSlot.name}` : machine.name;
    const displayStatus = currentSlot ? currentSlot.status : machine.status;

    // Prepare item for editing
    const itemToEdit: MachineDisplayItem | null = machine ? {
        ...machine,
        isSlot: !!currentSlot,
        slotId: currentSlot?.id,
        slotName: currentSlot?.name,
        slotStatus: currentSlot?.status,
        originalMachine: machine
    } : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{displayTitle}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs">
                                {machine.assetTag}
                            </Badge>
                            <span>•</span>
                            <span className="font-medium text-foreground">{machine.type || "Unknown Type"}</span>
                            <span>•</span>
                            <span>{machine.location}</span>
                            <span>•</span>
                            <Badge variant={
                                (String(displayStatus).toLowerCase() === 'online') ? 'default' :
                                    (String(displayStatus).toLowerCase() === 'maintenance') ? 'secondary' :
                                        'destructive'
                            }>
                                {displayStatus?.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <Switch
                            id="supervisor-mode"
                            checked={supervisorOverride}
                            onCheckedChange={setSupervisorOverride}
                        />
                        <Label htmlFor="supervisor-mode">Supervisor Override</Label>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {currentSlot ? "Edit Slot" : "Edit Machine"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Slots / Games</h2>
                        <SlotsList
                            machine={currentSlot ? {
                                ...machine,
                                slots: [currentSlot]
                            } : machine}
                            onUpdate={loadMachine}
                        />
                    </div>

                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">History & Logs</h2>
                        <HistoryList history={machine.history || []} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Playfield Settings</h2>
                        <SettingsPanel machineId={machine.id} />
                    </div>

                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Assigned Stock</h2>
                        {assignedStock.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No stock assigned to this {currentSlot ? 'slot' : 'machine'}.</p>
                        ) : (
                            <div className="space-y-2">
                                {assignedStock.map(item => {
                                    const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                                    return (
                                        <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                            <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.sku}</div>
                                            </div>
                                            <Badge variant={totalQty > 0 ? "outline" : "destructive"}>
                                                {totalQty} left
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MachineDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                itemToEdit={itemToEdit}
                onSuccess={() => {
                    loadMachine();
                    toast.success("Updated successfully");
                }}
            />
        </div>
    );
}
