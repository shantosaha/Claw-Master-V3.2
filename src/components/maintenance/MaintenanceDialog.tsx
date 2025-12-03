"use client";

import { useState, useEffect } from "react";
import { MaintenanceTask, ArcadeMachine } from "@/types";
import { maintenanceService, machineService } from "@/services";
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
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function MaintenanceDialog({ open, onOpenChange, onSuccess }: MaintenanceDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState<ArcadeMachine[]>([]);
    const [formData, setFormData] = useState({
        machineId: "",
        priority: "medium",
        description: "",
    });

    useEffect(() => {
        if (open) {
            loadMachines();
        }
    }, [open]);

    const loadMachines = async () => {
        try {
            const data = await machineService.getAll();
            setMachines(data);
        } catch (error) {
            console.error("Failed to load machines:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const newId = await maintenanceService.add({
                machineId: formData.machineId,
                priority: formData.priority as any,
                description: formData.description,
                status: "open",
                createdBy: user.uid,
                createdAt: new Date(),
            } as any);

            await logAction(
                user.uid,
                "create",
                "machine", // Using 'machine' as entity type, or could add 'maintenance' to types
                newId,
                "Created maintenance ticket",
                null,
                formData
            );

            onSuccess();
            onOpenChange(false);
            setFormData({ machineId: "", priority: "medium", description: "" });
        } catch (error) {
            console.error("Failed to create ticket:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Maintenance Ticket</DialogTitle>
                    <DialogDescription>
                        Report an issue with a machine.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="machine" className="text-right">
                            Machine
                        </Label>
                        <Select
                            value={formData.machineId}
                            onValueChange={(value) => setFormData({ ...formData, machineId: value })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select machine" />
                            </SelectTrigger>
                            <SelectContent>
                                {machines.map((machine) => (
                                    <SelectItem key={machine.id} value={machine.id}>
                                        {machine.name} ({machine.assetTag})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="priority" className="text-right">
                            Priority
                        </Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                            Description
                        </Label>
                        <div className="col-span-3 space-y-2">
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs text-muted-foreground"
                                disabled
                            >
                                ✨ Refine with AI (Coming Soon)
                            </Button>
                        </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={loading || !formData.machineId || !formData.description}>
                        {loading ? "Submitting..." : "Create Ticket"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
