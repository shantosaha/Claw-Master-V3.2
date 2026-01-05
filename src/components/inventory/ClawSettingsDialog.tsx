"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings2, DollarSign, Grip, Save } from "lucide-react";
import { ItemMachineSettings, StockItem, ArcadeMachine } from "@/types";
import { itemMachineSettingsService } from "@/services";
import { toast } from "sonner";

interface ClawSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: StockItem;
    machine: ArcadeMachine;
    slotId?: string;
    onSaved?: (settings: ItemMachineSettings) => void;
}

export function ClawSettingsDialog({
    open,
    onOpenChange,
    item,
    machine,
    slotId,
    onSaved,
}: ClawSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [existingSettings, setExistingSettings] = useState<ItemMachineSettings | null>(null);

    // Form state
    const [c1, setC1] = useState(20);
    const [c2, setC2] = useState(15);
    const [c3, setC3] = useState(10);
    const [c4, setC4] = useState(24);
    const [playPrice, setPlayPrice] = useState(1.80);
    const [playPerWin, setPlayPerWin] = useState(10);
    const [notes, setNotes] = useState("");

    // Computed values
    const expectedRevenue = playPrice * playPerWin;
    const costPerUnit = item.supplyChain?.costPerUnit || item.value || 10;
    const profitMargin = expectedRevenue - costPerUnit;

    useEffect(() => {
        if (open && item && machine) {
            loadExistingSettings();
        }
    }, [open, item?.id, machine?.id]);

    const loadExistingSettings = async () => {
        setLoading(true);
        try {
            const all = await itemMachineSettingsService.getAll();
            const existing = all.find(
                s => s.itemId === item.id && s.machineId === machine.id
            );

            if (existing) {
                setExistingSettings(existing);
                setC1(existing.c1);
                setC2(existing.c2);
                setC3(existing.c3);
                setC4(existing.c4);
                setPlayPrice(existing.playPrice);
                setPlayPerWin(existing.playPerWin);
                setNotes(existing.notes || "");
            } else {
                setC1(20);
                setC2(15);
                setC3(10);
                setC4(24);
                setPlayPrice(1.80);
                setPlayPerWin(10);
                setNotes("");
            }
        } catch (error) {
            console.error("Failed to load claw settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const settingsData: Omit<ItemMachineSettings, 'id'> = {
                itemId: item.id,
                itemName: item.name,
                machineId: machine.id,
                machineName: machine.name,
                slotId,
                c1,
                c2,
                c3,
                c4,
                playPrice,
                playPerWin,
                expectedRevenue,
                notes: notes || undefined,
                lastUpdatedBy: "user",
                lastUpdatedAt: new Date().toISOString(),
                createdAt: existingSettings?.createdAt || new Date().toISOString(),
            };

            let savedSettings: ItemMachineSettings;
            if (existingSettings) {
                await itemMachineSettingsService.update(existingSettings.id, settingsData);
                savedSettings = { ...settingsData, id: existingSettings.id } as ItemMachineSettings;
            } else {
                const id = await itemMachineSettingsService.add(settingsData as ItemMachineSettings);
                savedSettings = { ...settingsData, id } as ItemMachineSettings;
            }

            toast.success("Claw settings saved!");
            onSaved?.(savedSettings);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save claw settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Claw Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure claw strength and payout settings for <strong>{item.name}</strong> on <strong>{machine.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Claw Strength Settings */}
                        <Card>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Grip className="h-4 w-4" />
                                    Claw Grip Stages (0-64)
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="c1">C1 - Catch</Label>
                                        <Input
                                            id="c1"
                                            type="number"
                                            min={0}
                                            max={64}
                                            value={c1}
                                            onChange={(e) => setC1(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="c2">C2 - Pickup</Label>
                                        <Input
                                            id="c2"
                                            type="number"
                                            min={0}
                                            max={64}
                                            value={c2}
                                            onChange={(e) => setC2(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="c3">C3 - Carry</Label>
                                        <Input
                                            id="c3"
                                            type="number"
                                            min={0}
                                            max={64}
                                            value={c3}
                                            onChange={(e) => setC3(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="c4">C4 - Win (Max)</Label>
                                        <Input
                                            id="c4"
                                            type="number"
                                            min={0}
                                            max={64}
                                            value={c4}
                                            onChange={(e) => setC4(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payout Settings */}
                        <Card>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    Payout Configuration
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="playPrice">Play Price ($)</Label>
                                        <Input
                                            id="playPrice"
                                            type="number"
                                            step="0.10"
                                            min="0"
                                            value={playPrice}
                                            onChange={(e) => setPlayPrice(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="playPerWin">Plays to Win</Label>
                                        <Input
                                            id="playPerWin"
                                            type="number"
                                            min="1"
                                            value={playPerWin}
                                            onChange={(e) => setPlayPerWin(parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                </div>

                                {/* Calculated Summary */}
                                <div className="bg-muted rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Expected Revenue:</span>
                                        <span className="font-medium">${expectedRevenue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Item Cost:</span>
                                        <span className="font-medium">${costPerUnit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t pt-2">
                                        <span className="text-muted-foreground">Profit Margin:</span>
                                        <Badge variant={profitMargin > 0 ? "default" : "destructive"}>
                                            ${profitMargin.toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Input
                                id="notes"
                                placeholder="Any additional notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
