"use client";

import { useEffect, useState } from "react";
import { settingsService } from "@/services";
import { PlayfieldSetting } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { where, orderBy, limit } from "firebase/firestore";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/context/AuthContext";


interface SettingsPanelProps {
    machineId: string;
}

export function SettingsPanel({ machineId }: SettingsPanelProps) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<PlayfieldSetting[]>([]);
    const [currentSetting, setCurrentSetting] = useState<Partial<PlayfieldSetting>>({
        strengthSetting: 0,
        voltage: 0,
        payoutPercentage: 0,
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
                    strengthSetting: latest.strengthSetting,
                    voltage: latest.voltage,
                    payoutPercentage: latest.payoutPercentage,
                });
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await settingsService.add({
                machineId,
                strengthSetting: Number(currentSetting.strengthSetting),
                voltage: Number(currentSetting.voltage),
                payoutPercentage: Number(currentSetting.payoutPercentage),
                timestamp: new Date(),
                setBy: user.uid,
            } as any);
            await loadSettings();
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 p-4 border rounded-md bg-muted/20">
                <h3 className="font-medium">Current Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Strength</Label>
                        <Input
                            type="number"
                            value={currentSetting.strengthSetting}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, strengthSetting: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Voltage</Label>
                        <Input
                            type="number"
                            value={currentSetting.voltage}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, voltage: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Payout %</Label>
                        <Input
                            type="number"
                            value={currentSetting.payoutPercentage}
                            onChange={(e) => setCurrentSetting({ ...currentSetting, payoutPercentage: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Update Settings"}
                </Button>
            </div>

            <div>
                <h3 className="font-medium mb-2">History</h3>
                <div className="space-y-2">
                    {settings.map((setting) => (
                        <div key={setting.id} className="text-sm p-2 border rounded flex justify-between items-center">
                            <span className="text-muted-foreground">
                                {formatDate(setting.timestamp, "MMM d, HH:mm")}
                            </span>
                            <div className="flex gap-4">
                                <span>Str: {setting.strengthSetting}</span>
                                <span>Vol: {setting.voltage}</span>
                                <span>Pay: {setting.payoutPercentage}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
