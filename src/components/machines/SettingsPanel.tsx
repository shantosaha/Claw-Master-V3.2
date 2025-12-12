"use client";


import { useEffect, useState } from "react";
import { settingsService } from "@/services";
import { PlayfieldSetting } from "@/types";
import { logAction } from "@/services/auditLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { where, orderBy, limit } from "firebase/firestore";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";


interface SettingsPanelProps {
    machineId: string;
    activeStockItem?: { id: string; name: string } | null;
}

export function SettingsPanel({ machineId, activeStockItem }: SettingsPanelProps) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<PlayfieldSetting[]>([]);
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, [machineId]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.query(
                where("machineId", "==", machineId),
                orderBy("timestamp", "desc"),
                limit(5)
            );
            setSettings(data);
            if (data.length > 0) {
                // Pre-fill form with latest
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
        return isNaN(num) ? 0 : Math.max(0, num); // Ensure non-negative
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Parse values
            const c1 = parseValue(currentSetting.c1);
            const c2 = parseValue(currentSetting.c2);
            const c3 = parseValue(currentSetting.c3);
            const c4 = parseValue(currentSetting.c4);
            const payoutRate = parseValue(currentSetting.payoutRate);

            await settingsService.add({
                machineId,
                c1,
                c2,
                c3,
                c4,
                payoutRate,
                // Legacy support
                strengthSetting: c1,
                voltage: 0,
                payoutPercentage: payoutRate,

                stockItemId: activeStockItem?.id,
                stockItemName: activeStockItem?.name,

                timestamp: new Date(),
                setBy: user.uid,
            } as any);

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
                description: `New configuration saved for ${activeStockItem?.name || "current stock"}.`
            });

            await loadSettings();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 p-4 border rounded-md bg-muted/20">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Current Configuration</h3>
                    {activeStockItem && (
                        <div className="text-sm text-muted-foreground">
                            Active Stock: <span className="font-medium text-foreground">{activeStockItem.name}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label title="First Stage / Grabbing Power">C1 (Catch)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={currentSetting.c1}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, c1: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label title="Second Stage / Carry Power">C2 (Pickup)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={currentSetting.c2}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, c2: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label title="Third Stage / Carry to Chute">C3 (Carry)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={currentSetting.c3}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, c3: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label title="Plays per Prize">Payout Rate</Label>
                        <Input
                            type="number"
                            min="0"
                            value={currentSetting.payoutRate}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, payoutRate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label title="Max Strength at Payout">C4 (Prize)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={currentSetting.c4}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, c4: e.target.value })}
                        />
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Update Settings"}
                </Button>
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
                                <div className="grid grid-cols-5 gap-2 text-center bg-muted/30 p-2 rounded">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground">C1</span>
                                        <span className="font-medium">{setting.c1 ?? setting.strengthSetting ?? '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground">C2</span>
                                        <span className="font-medium">{setting.c2 ?? '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground">C3</span>
                                        <span className="font-medium">{setting.c3 ?? '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground">Payout</span>
                                        <span className="font-medium">{setting.payoutRate ?? setting.payoutPercentage ?? '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground">C4</span>
                                        <span className="font-medium">{setting.c4 ?? '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
