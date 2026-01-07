"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { appSettingsService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { StockCheckSettings } from "@/types";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

export function StockCheckSettingsCard() {
    const { user, canConfigureStockCheckSettings } = useAuth();
    const [settings, setSettings] = useState<StockCheckSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

        setSaving(true);
        try {
            await appSettingsService.updateStockCheckSettings(
                {
                    queueMode: settings.queueMode,
                    blockDurationMinutes: settings.blockDurationMinutes,
                },
                user.uid
            );
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (!canConfigureStockCheckSettings()) {
        return null;
    }

    if (loading || !settings) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Stock Check Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Stock Check Settings
                </CardTitle>
                <CardDescription>
                    Configure submission rules and blocking behavior
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Submission Queue Mode</Label>
                    <RadioGroup
                        value={settings.queueMode}
                        onValueChange={(value) =>
                            setSettings({ ...settings, queueMode: value as any })
                        }
                    >
                        <div className="flex items-start space-x-2">
                            <RadioGroupItem value="allow_multiple" id="allow_multiple" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="allow_multiple" className="font-medium cursor-pointer">
                                    Allow Multiple Submissions
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Users can submit multiple stock checks at any time (no blocking)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2">
                            <RadioGroupItem value="block_until_resolved" id="block_until_resolved" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="block_until_resolved" className="font-medium cursor-pointer">
                                    Block Until Resolved
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Only one pending submission allowed at a time
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2">
                            <RadioGroupItem value="block_for_duration" id="block_for_duration" />
                            <div className="grid gap-1.5 leading-none">
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
                    <div className="space-y-2">
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
                        />
                        <p className="text-xs text-muted-foreground">
                            How long to block new submissions after each submission
                        </p>
                    </div>
                )}

                <Button onClick={handleSave} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Settings"}
                </Button>
            </CardContent>
        </Card>
    );
}
