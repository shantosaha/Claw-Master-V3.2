"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    Globe,
    BarChart3,
    DollarSign
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
    jotformEnabled?: boolean;
    jotformApiKey?: string;
    jotformApiToken?: string;

    gameReportApiUrl: string;
    gameReportSiteId: string;
    gameReportEnabled: boolean;
    gameReportApiKey?: string;
    gameReportApiToken?: string;

    revenueApiUrl: string;
    revenueSiteId: string;
    revenueEnabled: boolean;
    revenueApiKey?: string;
    revenueApiToken?: string;

    // Legacy/Global
    isEnabled: boolean;
    apiKey?: string;
    apiToken?: string;

    urlPresets?: ApiUrlPreset[];
    updatedAt?: string;
    updatedBy?: string;
}

const DEFAULT_PRESETS: ApiUrlPreset[] = [
    { label: "Production (Remote)", value: "https://claw.kokoamusement.com.au" },
    { label: "Local Server (127.0.0.1)", value: "http://127.0.0.1:8000" },
    { label: "Local Server (localhost)", value: "http://localhost:8000" },
];

export function ApiSettingsPanel() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [savingJotform, setSavingJotform] = useState(false);
    const [savingGameReport, setSavingGameReport] = useState(false);
    const [savingRevenue, setSavingRevenue] = useState(false);
    const [savingAll, setSavingAll] = useState(false);
    const [testingJotform, setTestingJotform] = useState(false);
    const [testingGameReport, setTestingGameReport] = useState(false);
    const [testingRevenue, setTestingRevenue] = useState(false);
    const [jotformTestResult, setJotformTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [gameReportTestResult, setGameReportTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [revenueTestResult, setRevenueTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [newPresetName, setNewPresetName] = useState("");
    const [formData, setFormData] = useState<ApiSettings>({
        jotformApiUrl: "",
        jotformFormId: "",
        jotformEnabled: true,
        jotformApiKey: "",
        jotformApiToken: "",

        gameReportApiUrl: "",
        gameReportSiteId: "614",
        gameReportEnabled: true,
        gameReportApiKey: "",
        gameReportApiToken: "",

        revenueApiUrl: "",
        revenueSiteId: "614",
        revenueEnabled: true,
        revenueApiKey: "",
        revenueApiToken: "",

        isEnabled: true,
        apiKey: "",
        apiToken: "",
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
                // Merge with defaults to ensure new fields exist
                setFormData({
                    ...formData,
                    ...data,
                    jotformEnabled: data.jotformEnabled ?? data.isEnabled ?? true,
                    gameReportEnabled: data.gameReportEnabled ?? data.isEnabled ?? true,
                    revenueEnabled: data.revenueEnabled ?? data.isEnabled ?? true,
                    gameReportApiUrl: data.gameReportApiUrl || data.jotformApiUrl || "",
                    gameReportSiteId: data.gameReportSiteId || data.jotformFormId || "614",
                    revenueApiUrl: data.revenueApiUrl || data.jotformApiUrl || "",
                    revenueSiteId: data.revenueSiteId || data.jotformFormId || "614",
                });
            }
        } catch (error) {
            console.error("Failed to load API settings:", error);
        }
        setLoading(false);
    };

    const handleSaveAll = async (updatedData?: Partial<ApiSettings>) => {
        if (!user) return false;

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
                setFormData(prev => ({ ...prev, ...updated }));
                return true;
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Failed to save API settings:", error);
            toast.error("Failed to save settings");
            return false;
        }
    };

    const handleSaveEverything = async () => {
        setSavingAll(true);
        const success = await handleSaveAll();
        if (success) {
            toast.success("All API Settings Saved Successfully");
        }
        setSavingAll(false);
    };

    const handleSaveJotform = async () => {
        setSavingJotform(true);
        setJotformTestResult(null);
        const success = await handleSaveAll();
        if (success) {
            toast.success("JotForm API Settings Saved");
        }
        setSavingJotform(false);
    };

    const handleSaveGameReport = async () => {
        setSavingGameReport(true);
        setGameReportTestResult(null);
        const success = await handleSaveAll();
        if (success) {
            toast.success("Game Report API Settings Saved");
        }
        setSavingGameReport(false);
    };

    const handleSaveRevenue = async () => {
        setSavingRevenue(true);
        setRevenueTestResult(null);
        const success = await handleSaveAll();
        if (success) {
            toast.success("Revenue API Settings Saved");
        }
        setSavingRevenue(false);
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

        handleSaveAll({ urlPresets: newPresets });
        setNewPresetName("");
    };

    const removePreset = (value: string) => {
        const presets = formData.urlPresets || DEFAULT_PRESETS;
        const newPresets = presets.filter(p => p.value !== value);
        handleSaveAll({ urlPresets: newPresets });
    };

    const testJotformConnection = async () => {
        setTestingJotform(true);
        setJotformTestResult(null);

        await handleSaveAll();

        try {
            const endpoint = `/api/jotform/${formData.jotformFormId}`;
            const response = await fetch(endpoint);

            if (response.ok) {
                const data = await response.json();
                const count = data?.response?.length || (Array.isArray(data) ? data.length : 0);
                setJotformTestResult({
                    success: true,
                    message: `Connected successfully! Found ${count} records.`
                });
                toast.success("JotForm Connection Successful");
            } else {
                const error = await response.json();
                setJotformTestResult({
                    success: false,
                    message: `Error: ${error.error || response.status}`
                });
                toast.error("JotForm Connection Failed");
            }
        } catch (error) {
            setJotformTestResult({
                success: false,
                message: `Error: ${String(error)}`
            });
            toast.error("JotForm Connection Failed");
        }
        setTestingJotform(false);
    };

    const testGameReportConnection = async () => {
        setTestingGameReport(true);
        setGameReportTestResult(null);

        await handleSaveAll();

        try {
            const today = new Date().toISOString().split('T')[0];
            const endpoint = `/api/game_report/${formData.gameReportSiteId}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: today,
                    endDate: today,
                    aggregated: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                const count = Array.isArray(data) ? data.length : (data?.response?.length || 0);
                setGameReportTestResult({
                    success: true,
                    message: `Connected successfully! Found ${count} machine records.`
                });
                toast.success("Game Report Connection Successful");
            } else {
                const error = await response.json().catch(() => ({}));
                setGameReportTestResult({
                    success: false,
                    message: `Error: ${error.error || response.status}`
                });
                toast.error("Game Report Connection Failed");
            }
        } catch (error) {
            setGameReportTestResult({
                success: false,
                message: `Error: ${String(error)}`
            });
            toast.error("Game Report Connection Failed");
        }
        setTestingGameReport(false);
    };

    const testRevenueConnection = async () => {
        setTestingRevenue(true);
        setRevenueTestResult(null);

        await handleSaveAll();

        try {
            const today = new Date().toISOString().split('T')[0];
            const endpoint = `/api/revenue/${formData.revenueSiteId}?startDate=${today}&endDate=${today}`;
            const response = await fetch(endpoint);

            if (response.ok) {
                const data = await response.json();
                const count = Array.isArray(data) ? data.length : (data?.response?.length || 0);
                setRevenueTestResult({
                    success: true,
                    message: `Connected successfully! Found ${count} revenue entries.`
                });
                toast.success("Revenue API Connection Successful");
            } else {
                const error = await response.json().catch(() => ({}));
                setRevenueTestResult({
                    success: false,
                    message: `Error: ${error.error || response.status}`
                });
                toast.error("Revenue API Connection Failed");
            }
        } catch (error) {
            setRevenueTestResult({
                success: false,
                message: `Error: ${String(error)}`
            });
            toast.error("Revenue API Connection Failed");
        }
        setTestingRevenue(false);
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
                {/* JotForm API Configuration */}
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
                                    checked={formData.jotformEnabled}
                                    onCheckedChange={(checked) => setFormData({ ...formData, jotformEnabled: checked })}
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
                                            placeholder="https://claw.kokoamusement.com.au"
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

                        <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="jotform-api-key">JotForm API Key</Label>
                                <Input
                                    id="jotform-api-key"
                                    type="password"
                                    placeholder="Enter JotForm specific API key"
                                    value={formData.jotformApiKey || ""}
                                    onChange={(e) => setFormData({ ...formData, jotformApiKey: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jotform-api-token">JotForm API Token</Label>
                                <Input
                                    id="jotform-api-token"
                                    type="password"
                                    placeholder="Enter bearer token"
                                    value={formData.jotformApiToken || ""}
                                    onChange={(e) => setFormData({ ...formData, jotformApiToken: e.target.value })}
                                />
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
                        {jotformTestResult && (
                            <Alert className={jotformTestResult.success ? "border-green-500" : "border-red-500"}>
                                {jotformTestResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <AlertDescription>{jotformTestResult.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={handleSaveJotform} disabled={savingJotform}>
                                {savingJotform ? (
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
                            <Button variant="outline" onClick={testJotformConnection} disabled={testingJotform}>
                                {testingJotform ? (
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
                    </CardContent>
                </Card>

                {/* Game Report API Configuration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Game Report API Configuration
                                </CardTitle>
                                <CardDescription>
                                    Configure the API endpoint for machine plays and revenue data
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="game-report-enabled" className="text-sm">Enabled</Label>
                                <Switch
                                    id="game-report-enabled"
                                    checked={formData.gameReportEnabled}
                                    onCheckedChange={(checked) => setFormData({ ...formData, gameReportEnabled: checked })}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="game-report-url">API Base URL</Label>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Select
                                        value={(formData.urlPresets || DEFAULT_PRESETS).find(p => p.value === formData.gameReportApiUrl) ? formData.gameReportApiUrl : "custom"}
                                        onValueChange={(value) => {
                                            if (value !== "custom") {
                                                setFormData({ ...formData, gameReportApiUrl: value });
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
                                            id="game-report-url"
                                            className="pl-9"
                                            placeholder="https://claw.kokoamusement.com.au"
                                            value={formData.gameReportApiUrl}
                                            onChange={(e) => setFormData({ ...formData, gameReportApiUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    The base URL for the Game Report API
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="game-report-site-id">Site ID</Label>
                                <Input
                                    id="game-report-site-id"
                                    placeholder="614"
                                    value={formData.gameReportSiteId}
                                    onChange={(e) => setFormData({ ...formData, gameReportSiteId: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The site identifier (e.g., 614)
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-blue-200/30">
                            <div className="space-y-2">
                                <Label htmlFor="game-report-api-key">Game Report API Key</Label>
                                <Input
                                    id="game-report-api-key"
                                    type="password"
                                    placeholder="Enter Game Report specific API key"
                                    value={formData.gameReportApiKey || ""}
                                    onChange={(e) => setFormData({ ...formData, gameReportApiKey: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="game-report-api-token">Game Report API Token</Label>
                                <Input
                                    id="game-report-api-token"
                                    type="password"
                                    placeholder="Enter bearer token"
                                    value={formData.gameReportApiToken || ""}
                                    onChange={(e) => setFormData({ ...formData, gameReportApiToken: e.target.value })}
                                />
                            </div>
                        </div>

                        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertDescription>
                                <strong>Current endpoint:</strong>{' '}
                                <code className="text-xs bg-muted px-1 rounded">
                                    {formData.gameReportApiUrl}/game_report/{formData.gameReportSiteId}
                                </code>
                            </AlertDescription>
                        </Alert>

                        {/* Test Result */}
                        {gameReportTestResult && (
                            <Alert className={gameReportTestResult.success ? "border-green-500" : "border-red-500"}>
                                {gameReportTestResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <AlertDescription>{gameReportTestResult.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={handleSaveGameReport} disabled={savingGameReport}>
                                {savingGameReport ? (
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
                            <Button variant="outline" onClick={testGameReportConnection} disabled={testingGameReport}>
                                {testingGameReport ? (
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
                    </CardContent>
                </Card>

                {/* Revenue API Configuration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-500" />
                                    Revenue API Configuration
                                </CardTitle>
                                <CardDescription>
                                    Configure the API endpoint for store POS and iTeller data
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="revenue-enabled" className="text-sm">Enabled</Label>
                                <Switch
                                    id="revenue-enabled"
                                    checked={formData.revenueEnabled}
                                    onCheckedChange={(checked) => setFormData({ ...formData, revenueEnabled: checked })}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="revenue-url">API Base URL</Label>
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <Select
                                        value={(formData.urlPresets || DEFAULT_PRESETS).find(p => p.value === formData.revenueApiUrl) ? formData.revenueApiUrl : "custom"}
                                        onValueChange={(value) => {
                                            if (value !== "custom") {
                                                setFormData({ ...formData, revenueApiUrl: value });
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
                                            id="revenue-url"
                                            className="pl-9"
                                            placeholder="https://claw.kokoamusement.com.au"
                                            value={formData.revenueApiUrl}
                                            onChange={(e) => setFormData({ ...formData, revenueApiUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    The base URL for the Revenue API
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="revenue-site-id">Site ID</Label>
                                <Input
                                    id="revenue-site-id"
                                    placeholder="614"
                                    value={formData.revenueSiteId}
                                    onChange={(e) => setFormData({ ...formData, revenueSiteId: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The site identifier (e.g., 614)
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-green-200/30">
                            <div className="space-y-2">
                                <Label htmlFor="revenue-api-key">Revenue API Key</Label>
                                <Input
                                    id="revenue-api-key"
                                    type="password"
                                    placeholder="Enter Revenue specific API key"
                                    value={formData.revenueApiKey || ""}
                                    onChange={(e) => setFormData({ ...formData, revenueApiKey: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="revenue-api-token">Revenue API Token</Label>
                                <Input
                                    id="revenue-api-token"
                                    type="password"
                                    placeholder="Enter bearer token"
                                    value={formData.revenueApiToken || ""}
                                    onChange={(e) => setFormData({ ...formData, revenueApiToken: e.target.value })}
                                />
                            </div>
                        </div>

                        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                            <Info className="h-4 w-4 text-green-500" />
                            <AlertDescription>
                                <strong>Current endpoint:</strong>{' '}
                                <code className="text-xs bg-muted px-1 rounded">
                                    {formData.revenueApiUrl}/revenue/{formData.revenueSiteId}
                                </code>
                            </AlertDescription>
                        </Alert>

                        {/* Test Result */}
                        {revenueTestResult && (
                            <Alert className={revenueTestResult.success ? "border-green-500" : "border-red-500"}>
                                {revenueTestResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <AlertDescription>{revenueTestResult.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={handleSaveRevenue} disabled={savingRevenue}>
                                {savingRevenue ? (
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
                            <Button variant="outline" onClick={testRevenueConnection} disabled={testingRevenue}>
                                {testingRevenue ? (
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
                    </CardContent>
                </Card>

                {/* Save All Button */}
                <div className="flex justify-end pt-4 border-t">
                    <Button
                        size="lg"
                        onClick={handleSaveEverything}
                        disabled={savingAll || loading}
                        className="w-full md:w-auto min-w-[200px]"
                    >
                        {savingAll ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving All Settings...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save All API Settings
                            </>
                        )}
                    </Button>
                </div>

                {formData.updatedAt && (
                    <p className="text-xs text-muted-foreground text-center">
                        Last updated: {new Date(formData.updatedAt).toLocaleString()}
                    </p>
                )}
            </div>
        </PermissionGate >
    );
}
