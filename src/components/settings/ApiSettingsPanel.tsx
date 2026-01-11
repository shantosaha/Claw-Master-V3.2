"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { toast } from "sonner";
import {
    Save,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Server,
    Link2,
    Shield,
    Info,
    Globe
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ApiUrlPreset {
    label: string;
    value: string;
}

interface ApiSettings {
    jotformApiUrl: string;
    jotformFormId: string;
    isEnabled: boolean;
    urlPresets?: ApiUrlPreset[];
    updatedAt?: string;
    updatedBy?: string;
}

const DEFAULT_PRESETS: ApiUrlPreset[] = [
    { label: "Production (Remote)", value: "http://claw.kokoamusement.com.au" },
    { label: "Local Server (127.0.0.1)", value: "http://127.0.0.1:8000" },
    { label: "Local Server (localhost)", value: "http://localhost:8000" },
];

export function ApiSettingsPanel() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [newPresetName, setNewPresetName] = useState("");
    const [formData, setFormData] = useState<ApiSettings>({
        jotformApiUrl: "",
        jotformFormId: "",
        isEnabled: true,
        urlPresets: DEFAULT_PRESETS,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/settings/api-integration');
            if (response.ok) {
                const data = await response.json();
                setFormData(data);
            }
        } catch (error) {
            console.error("Failed to load API settings:", error);
        }
        setLoading(false);
    };

    const handleSave = async (updatedData?: Partial<ApiSettings>) => {
        if (!user) return;
        setSaving(true);
        setTestResult(null);

        const dataToSave = {
            ...formData,
            ...updatedData,
            updatedBy: user.uid,
        };

        try {
            const response = await fetch('/api/settings/api-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave),
            });

            if (response.ok) {
                const updated = await response.json();
                setFormData(updated);
                toast.success("API Settings Saved", {
                    description: updatedData?.urlPresets
                        ? "Presets updated successfully."
                        : "Settings will be used immediately for all API requests."
                });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Failed to save API settings:", error);
            toast.error("Failed to save settings");
        }
        setSaving(false);
    };

    const addCurrentAsPreset = () => {
        if (!formData.jotformApiUrl || !newPresetName) {
            toast.error("Enter both a preset name and a URL");
            return;
        }

        const presets = formData.urlPresets || DEFAULT_PRESETS;
        if (presets.some(p => p.value === formData.jotformApiUrl)) {
            toast.error("This URL is already in your presets");
            return;
        }

        const newPresets = [
            ...presets,
            { label: newPresetName, value: formData.jotformApiUrl }
        ];

        handleSave({ urlPresets: newPresets });
        setNewPresetName("");
    };

    const removePreset = (value: string) => {
        const presets = formData.urlPresets || DEFAULT_PRESETS;
        const newPresets = presets.filter(p => p.value !== value);
        handleSave({ urlPresets: newPresets });
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);

        // First save the current settings
        await handleSave();

        try {
            const endpoint = `/api/jotform/${formData.jotformFormId}`;
            const response = await fetch(endpoint);

            if (response.ok) {
                const data = await response.json();
                const count = data?.response?.length || (Array.isArray(data) ? data.length : 0);
                setTestResult({
                    success: true,
                    message: `Connected successfully! Found ${count} records.`
                });
                toast.success("Connection Successful", {
                    description: `Found ${count} records from ${formData.jotformApiUrl}`
                });
            } else {
                const error = await response.json();
                setTestResult({
                    success: false,
                    message: `Error: ${error.error || response.status}`
                });
                toast.error("Connection Failed", {
                    description: error.error || `Status ${response.status}`
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: `Error: ${String(error)}`
            });
            toast.error("Connection Failed", {
                description: "Could not connect to the API"
            });
        }
        setTesting(false);
    };

    if (loading) {
        return <div className="p-4 text-muted-foreground">Loading API settings...</div>;
    }

    return (
        <PermissionGate
            permission="manageTeam"
            fallback={
                <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        Only administrators can modify API integration settings.
                    </AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    JotForm API Configuration
                                </CardTitle>
                                <CardDescription>
                                    Configure the API endpoint for service report data
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="api-enabled" className="text-sm">Enabled</Label>
                                <Switch
                                    id="api-enabled"
                                    checked={formData.isEnabled}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="api-url">API Base URL</Label>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Select
                                        value={(formData.urlPresets || DEFAULT_PRESETS).find(p => p.value === formData.jotformApiUrl) ? formData.jotformApiUrl : "custom"}
                                        onValueChange={(value) => {
                                            if (value !== "custom") {
                                                setFormData({ ...formData, jotformApiUrl: value });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full lg:w-[220px]">
                                            <SelectValue placeholder="Select Environment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(formData.urlPresets || DEFAULT_PRESETS).map((preset) => (
                                                <SelectItem key={preset.value} value={preset.value}>
                                                    {preset.label}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">Custom URL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex-1 relative">
                                        <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="api-url"
                                            className="pl-9"
                                            placeholder="http://claw.kokoamusement.com.au"
                                            value={formData.jotformApiUrl}
                                            onChange={(e) => setFormData({ ...formData, jotformApiUrl: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <Input
                                        placeholder="Preset Name (e.g. Staging)"
                                        value={newPresetName}
                                        onChange={(e) => setNewPresetName(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs whitespace-nowrap"
                                        onClick={addCurrentAsPreset}
                                        disabled={!formData.jotformApiUrl || !newPresetName}
                                    >
                                        Save as Preset
                                    </Button>
                                </div>

                                {/* List of Custom Presets */}
                                {formData.urlPresets && formData.urlPresets.filter(p => !DEFAULT_PRESETS.some(dp => dp.value === p.value)).length > 0 && (
                                    <div className="mt-4 space-y-2 border rounded-md p-2 bg-muted/20">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground px-1">Custom Presets</p>
                                        <div className="space-y-1">
                                            {formData.urlPresets.filter(p => !DEFAULT_PRESETS.some(dp => dp.value === p.value)).map(preset => (
                                                <div key={preset.value} className="flex items-center justify-between text-xs bg-background p-1.5 rounded border border-border/50">
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-medium truncate">{preset.label}</span>
                                                        <span className="text-[10px] text-muted-foreground truncate">{preset.value}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removePreset(preset.value)}
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Choose a preset or enter a custom URL and save it for future use.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="form-id">Form ID / Endpoint</Label>
                                <Input
                                    id="form-id"
                                    placeholder="614"
                                    value={formData.jotformFormId}
                                    onChange={(e) => setFormData({ ...formData, jotformFormId: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The form number (e.g., 614, 615)
                                </p>
                            </div>
                        </div>

                        <Alert className="bg-muted/30">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Current endpoint:</strong>{' '}
                                <code className="text-xs bg-muted px-1 rounded">
                                    {formData.jotformApiUrl}/jotform/{formData.jotformFormId}
                                </code>
                            </AlertDescription>
                        </Alert>

                        {/* Test Result */}
                        {testResult && (
                            <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
                                {testResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <AlertDescription>{testResult.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={() => handleSave()} disabled={saving}>
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Settings
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={testConnection} disabled={testing}>
                                {testing ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4 mr-2" />
                                        Test Connection
                                    </>
                                )}
                            </Button>
                        </div>

                        {formData.updatedAt && (
                            <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(formData.updatedAt).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PermissionGate >
    );
}
