"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Settings2,
    Grip,
    DollarSign,
    Target,
    Edit,
    Plus,
    ChevronRight
} from "lucide-react";
import { ItemMachineSettings, StockItem, ArcadeMachine } from "@/types";
import { itemMachineSettingsService } from "@/services";
import { ClawSettingsDialog } from "./ClawSettingsDialog";
import Link from "next/link";

interface MachineSettingsCardProps {
    item: StockItem;
    machines: ArcadeMachine[];
    className?: string;
}

export function MachineSettingsCard({ item, machines, className }: MachineSettingsCardProps) {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<ItemMachineSettings[]>([]);
    const [editingSettings, setEditingSettings] = useState<{
        machine: ArcadeMachine;
        slotId?: string;
    } | null>(null);

    useEffect(() => {
        loadSettings();
    }, [item.id]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const allSettings = await itemMachineSettingsService.getAll();
            const itemSettings = allSettings.filter(s => s.itemId === item.id);
            setSettings(itemSettings);
        } catch (error) {
            console.error("Failed to load machine settings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Get machines this item is assigned to
    const assignedMachineIds = new Set(
        (item.machineAssignments || []).map(a => a.machineId)
    );
    const assignedMachines = machines.filter(m => assignedMachineIds.has(m.id));

    const getSettingsForMachine = (machineId: string) => {
        return settings.find(s => s.machineId === machineId);
    };

    const handleSettingsSaved = (newSettings: ItemMachineSettings) => {
        setSettings(prev => {
            const existing = prev.findIndex(s => s.id === newSettings.id);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = newSettings;
                return updated;
            }
            return [...prev, newSettings];
        });
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings2 className="h-5 w-5" />
                        Machine Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (assignedMachines.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings2 className="h-5 w-5" />
                        Machine Settings
                    </CardTitle>
                    <CardDescription>
                        Claw settings per machine for this item
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <Grip className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No machines assigned</p>
                        <p className="text-sm">Assign this item to a machine to configure settings</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings2 className="h-5 w-5" />
                        Machine Settings
                    </CardTitle>
                    <CardDescription>
                        Claw settings per machine ({settings.length} configured)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {assignedMachines.map((machine) => {
                        const machineSettings = getSettingsForMachine(machine.id);
                        const hasSettings = !!machineSettings;

                        return (
                            <div
                                key={machine.id}
                                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Grip className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <Link
                                                href={`/machines/${machine.id}`}
                                                className="font-medium hover:underline flex items-center gap-1"
                                            >
                                                {machine.name}
                                                <ChevronRight className="h-3 w-3" />
                                            </Link>
                                            {hasSettings ? (
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span>C1:{machineSettings.c1}</span>
                                                    <span>C2:{machineSettings.c2}</span>
                                                    <span>C3:{machineSettings.c3}</span>
                                                    <span>C4:{machineSettings.c4}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    No settings configured
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {hasSettings && (
                                            <div className="text-right mr-2">
                                                <div className="text-sm font-medium flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3 text-green-600" />
                                                    {machineSettings.playPrice.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Target className="h-3 w-3" />
                                                    {machineSettings.playPerWin} plays
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            variant={hasSettings ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => setEditingSettings({ machine })}
                                        >
                                            {hasSettings ? (
                                                <>
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Configure
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Profit indicator */}
                                {hasSettings && (
                                    <div className="mt-2 pt-2 border-t">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Expected Revenue:</span>
                                            <Badge variant="secondary">
                                                ${machineSettings.expectedRevenue.toFixed(2)} per win
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Settings Dialog */}
            {editingSettings && (
                <ClawSettingsDialog
                    open={!!editingSettings}
                    onOpenChange={(open) => !open && setEditingSettings(null)}
                    item={item}
                    machine={editingSettings.machine}
                    slotId={editingSettings.slotId}
                    onSaved={handleSettingsSaved}
                />
            )}
        </>
    );
}
