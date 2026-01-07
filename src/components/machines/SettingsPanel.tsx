"use client";

import { useEffect, useState } from "react";
import { settingsService, itemMachineSettingsService, machineService } from "@/services";
import { PlayfieldSetting, ItemMachineSettings, AdvancedMachineSettings } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedSettingsForm } from "./AdvancedSettingsForm";
import { logAction } from "@/services/auditLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { where, orderBy, limit } from "firebase/firestore";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, Lock } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";

interface SettingsPanelProps {
    machineId: string;
    machineName?: string;
    activeStockItem?: { id: string; name: string } | null;
}

export function SettingsPanel({ machineId, machineName, activeStockItem }: SettingsPanelProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("playfield");

    // Existing playfield state
    const [settings, setSettings] = useState<PlayfieldSetting[]>([]);
    const [itemSettings, setItemSettings] = useState<ItemMachineSettings | null>(null);
    const [currentSetting, setCurrentSetting] = useState<{
        c1: string | number;
        c2: string | number;
        c3: string | number;
        c4: string | number;
        payoutRate: string | number;
    }>({
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        payoutRate: 0,
    });

    // New advanced settings state
    const [advancedSettings, setAdvancedSettings] = useState<AdvancedMachineSettings>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, [machineId, activeStockItem?.id]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // 1. Load Machine Advanced Settings
            const machine = await machineService.getById(machineId);
            if (machine) {
                setAdvancedSettings(machine.advancedSettings || {});
            }

            // 2. Load playfield settings history from settingsService
            const data = await settingsService.query(
                where("machineId", "==", machineId),
                orderBy("timestamp", "desc"),
                limit(5)
            );
            setSettings(data);

            // 3. If there's an active stock item, also load from itemMachineSettingsService
            if (activeStockItem?.id) {
                const allItemSettings = await itemMachineSettingsService.getAll();
                const existingItemSettings = allItemSettings.find(
                    s => s.itemId === activeStockItem.id && s.machineId === machineId
                );
                setItemSettings(existingItemSettings || null);

                // Prefer item-specific settings if available
                if (existingItemSettings) {
                    setCurrentSetting({
                        c1: existingItemSettings.c1,
                        c2: existingItemSettings.c2,
                        c3: existingItemSettings.c3,
                        c4: existingItemSettings.c4,
                        payoutRate: existingItemSettings.playPerWin,
                    });
                    return;
                }
            }

            // Fallback to latest playfield settings
            if (data.length > 0) {
                const latest = data[0];
                setCurrentSetting({
                    c1: latest.c1 ?? latest.strengthSetting ?? 0,
                    c2: latest.c2 ?? 0,
                    c3: latest.c3 ?? 0,
                    c4: latest.c4 ?? 0,
                    payoutRate: latest.payoutRate ?? latest.payoutPercentage ?? 0,
                });
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to safely parse input to number
    const parseValue = (val: string | number | undefined): number => {
        if (val === "" || val === undefined || val === null) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : Math.max(0, num);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const c1 = parseValue(currentSetting.c1);
            const c2 = parseValue(currentSetting.c2);
            const c3 = parseValue(currentSetting.c3);
            const c4 = parseValue(currentSetting.c4);
            const payoutRate = parseValue(currentSetting.payoutRate);

            // 1. Save to playfield settings (history/log)
            await settingsService.add({
                machineId,
                c1,
                c2,
                c3,
                c4,
                payoutRate,
                strengthSetting: c1,
                voltage: 0,
                payoutPercentage: payoutRate,
                stockItemId: activeStockItem?.id,
                stockItemName: activeStockItem?.name,
                timestamp: new Date(),
                setBy: user.uid,
            } as any);

            // 2. If there's an active stock item, also save to itemMachineSettingsService
            if (activeStockItem?.id) {
                const itemSettingsData: Omit<ItemMachineSettings, 'id'> = {
                    itemId: activeStockItem.id,
                    itemName: activeStockItem.name,
                    machineId,
                    machineName: machineName || "Unknown Machine",
                    c1,
                    c2,
                    c3,
                    c4,
                    playPrice: 1.80, // Default, could be made configurable
                    playPerWin: payoutRate,
                    expectedRevenue: 1.80 * payoutRate,
                    lastUpdatedBy: user.uid,
                    lastUpdatedAt: new Date().toISOString(),
                    createdAt: itemSettings?.createdAt || new Date().toISOString(),
                };

                if (itemSettings) {
                    // Update existing
                    await itemMachineSettingsService.update(itemSettings.id, itemSettingsData);
                } else {
                    // Create new
                    await itemMachineSettingsService.add(itemSettingsData as ItemMachineSettings);
                }
            }

            // 3. Log the action
            await logAction(
                user.uid,
                "UPDATE_SETTINGS",
                "Settings",
                machineId,
                {
                    message: "Playfield settings updated",
                    c1,
                    c2,
                    c3,
                    c4,
                    payout: payoutRate,
                    stockItem: activeStockItem?.name || "None"
                }
            );

            toast.success("Settings Updated", {
                description: `Settings saved for ${activeStockItem?.name || "current stock"}.`
            });

            await loadSettings();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleAdvancedSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await machineService.update(machineId, {
                advancedSettings
            });

            await logAction(
                user.uid,
                "UPDATE_SETTINGS",
                "Machine",
                machineId,
                {
                    message: "Advanced machine settings updated",
                    hasPricing: !!advancedSettings.cardCashPlayPrice,
                    hasIdentity: !!advancedSettings.macId
                }
            );

            toast.success("Advanced Settings Saved", {
                description: "Machine configuration updated successfully."
            });
        } catch (error) {
            console.error("Failed to save advanced settings:", error);
            toast.error("Failed to save advanced settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-sm text-muted-foreground">Loading settings...</div>;

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-col h-auto sm:flex-row w-full mb-4 p-1">
                <TabsTrigger value="playfield" className="w-full sm:flex-1 py-1.5 px-3 text-xs md:text-sm">Playfield Settings</TabsTrigger>
                <TabsTrigger value="advanced" className="w-full sm:flex-1 py-1.5 px-3 text-xs md:text-sm">Advanced Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="playfield" className="space-y-6">
                <div className="grid gap-4 p-4 border rounded-md bg-muted/20">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium">Current Configuration</h3>
                        <div className="flex items-center gap-2">
                            {activeStockItem && (
                                <div className="text-sm text-muted-foreground">
                                    Active Stock: <span className="font-medium text-foreground">{activeStockItem.name}</span>
                                </div>
                            )}
                            {itemSettings && (
                                <Badge variant="outline" className="text-xs">Synced</Badge>
                            )}
                        </div>
                    </div>

                    <PermissionGate
                        permission="editMachines"
                        fallback={
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-md border border-dashed">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        You don't have permission to edit machine settings. Contact an administrator to request access.
                                    </p>
                                </div>
                                {/* Show read-only values */}
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 opacity-60">
                                    <div className="space-y-2">
                                        <Label>C1 (Catch)</Label>
                                        <Input type="number" value={currentSetting.c1} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>C2 (Pickup)</Label>
                                        <Input type="number" value={currentSetting.c2} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>C3 (Carry)</Label>
                                        <Input type="number" value={currentSetting.c3} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payout Rate</Label>
                                        <Input type="number" value={currentSetting.payoutRate} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>C4 (Prize)</Label>
                                        <Input type="number" value={currentSetting.c4} disabled />
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                                <div className="space-y-2">
                                    <Label title="First Stage / Grabbing Power" className="text-[11px] truncate block">C1 (Catch)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="64"
                                        className="h-8 text-sm"
                                        value={currentSetting.c1}
                                        onChange={(e) => setCurrentSetting({ ...currentSetting, c1: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label title="Second Stage / Carry Power" className="text-[11px] truncate block">C2 (Pickup)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="64"
                                        className="h-8 text-sm"
                                        value={currentSetting.c2}
                                        onChange={(e) => setCurrentSetting({ ...currentSetting, c2: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label title="Third Stage / Carry to Chute" className="text-[11px] truncate block">C3 (Carry)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="64"
                                        className="h-8 text-sm"
                                        value={currentSetting.c3}
                                        onChange={(e) => setCurrentSetting({ ...currentSetting, c3: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label title="Plays per Prize" className="text-[11px] truncate block">Payout Rate</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-8 text-sm"
                                        value={currentSetting.payoutRate}
                                        onChange={(e) => setCurrentSetting({ ...currentSetting, payoutRate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label title="Max Strength at Payout" className="text-[11px] truncate block">C4 (Prize)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="64"
                                        className="h-8 text-sm"
                                        value={currentSetting.c4}
                                        onChange={(e) => setCurrentSetting({ ...currentSetting, c4: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Update Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </PermissionGate>
                </div>

                <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-4">Settings History</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {settings.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No history recorded</div>
                        ) : (
                            settings.map((setting) => (
                                <div key={setting.id} className="text-sm p-3 border rounded-md bg-card hover:bg-muted/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {formatDate(setting.timestamp, "MMM d, yyyy 'at' HH:mm")}
                                            </span>
                                            {setting.stockItemName ? (
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    Active Stock: {setting.stockItemId ? (
                                                        <Link href={`/inventory/${setting.stockItemId}`} className="text-primary hover:underline">
                                                            {setting.stockItemName}
                                                        </Link>
                                                    ) : (
                                                        setting.stockItemName
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground mt-0.5">No stock linked</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            By: {setting.setBy?.substring(0, 8)}...
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center bg-muted/30 p-2 rounded">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground">C1</span>
                                            <span className="font-semibold text-xs">{setting.c1 ?? setting.strengthSetting ?? '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground">C2</span>
                                            <span className="font-semibold text-xs">{setting.c2 ?? '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground">C3</span>
                                            <span className="font-semibold text-xs">{setting.c3 ?? '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground">Payout</span>
                                            <span className="font-semibold text-xs">{setting.payoutRate ?? setting.payoutPercentage ?? '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase text-muted-foreground">C4</span>
                                            <span className="font-semibold text-xs">{setting.c4 ?? '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="advanced">
                <PermissionGate
                    permission="editMachines"
                    fallback={
                        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/20 text-center">
                            <Lock className="h-8 w-8 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Restricted Access</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Advanced machine configuration is restricted to administrators and technicians.
                            </p>
                            <AdvancedSettingsForm settings={advancedSettings} onChange={() => { }} disabled={true} />
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <AdvancedSettingsForm
                            settings={advancedSettings}
                            onChange={setAdvancedSettings}
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleAdvancedSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Advanced Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </PermissionGate>
            </TabsContent>
        </Tabs>
    );
}
