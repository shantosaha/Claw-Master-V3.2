"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { appSettingsService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { StockCheckSettings } from "@/types";
import { toast } from "sonner";

interface StockCheckSettingsFormProps {
    onSave?: () => void;
}

export function StockCheckSettingsForm({ onSave }: StockCheckSettingsFormProps) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<StockCheckSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await appSettingsService.getStockCheckSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !settings) return;

        try {
            await appSettingsService.updateStockCheckSettings(
                {
                    queueMode: settings.queueMode,
                    blockDurationMinutes: settings.blockDurationMinutes,
                },
                user.uid
            );
            toast.success("Stock check settings saved successfully");
            onSave?.();
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        }
    };

    // Expose save function to parent
    useEffect(() => {
        if (settings) {
            (window as any).__stockCheckSettingsSave = handleSave;
        }
    }, [settings]);

    if (loading || !settings) {
        return <p className="text-sm text-muted-foreground">Loading...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label>Submission Queue Mode</Label>
                <RadioGroup
                    value={settings.queueMode}
                    onValueChange={(value) =>
                        setSettings({ ...settings, queueMode: value as any })
                    }
                >
                    <div className="flex items-start space-x-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="allow_multiple" id="allow_multiple" className="mt-1" />
                        <div className="grid gap-1.5 leading-none flex-1">
                            <Label htmlFor="allow_multiple" className="font-medium cursor-pointer">
                                Allow Multiple Submissions
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Users can submit multiple stock checks at any time (no blocking)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="block_until_resolved" id="block_until_resolved" className="mt-1" />
                        <div className="grid gap-1.5 leading-none flex-1">
                            <Label htmlFor="block_until_resolved" className="font-medium cursor-pointer">
                                Block Until Resolved
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Only one pending submission allowed at a time. New submissions are blocked until the current one is approved or discarded.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="block_for_duration" id="block_for_duration" className="mt-1" />
                        <div className="grid gap-1.5 leading-none flex-1">
                            <Label htmlFor="block_for_duration" className="font-medium cursor-pointer">
                                Block for Duration
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Block new submissions for a specified time after each submission
                            </p>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            {settings.queueMode === "block_for_duration" && (
                <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
                    <Label htmlFor="duration">Block Duration (minutes)</Label>
                    <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="1440"
                        value={settings.blockDurationMinutes || ""}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                blockDurationMinutes: parseInt(e.target.value) || undefined,
                            })
                        }
                        placeholder="e.g., 30"
                        className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                        How long to block new submissions after each submission (1-1440 minutes)
                    </p>
                </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> These settings control how stock check submissions are queued and processed.
                    Changes take effect immediately for all users.
                </p>
            </div>
        </div>
    );
}
