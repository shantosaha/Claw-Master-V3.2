"use client";

import { useEffect, useState, useRef } from "react";
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
import { useData } from "@/context/DataProvider";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, Lock, Info, Gift, Clock, CheckCircle2, Users, DollarSign, Trophy, TrendingUp, Gamepad2, Award } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { OptimizedThumbnail } from "@/components/ui/OptimizedImage";
import { getLightboxUrl } from "@/lib/utils/imageUtils";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";

interface SettingsPanelProps {
    machineId: string;
    machineName?: string;
    assetTag?: string;
    activeStockItem?: { id: string; name: string } | null;
    supervisorOverride?: boolean;
}

export function SettingsPanel({
    machineId,
    machineName,
    assetTag,
    activeStockItem,
    supervisorOverride = false
}: SettingsPanelProps) {
    const { user } = useAuth();
    const { refreshMachines } = useData();
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
    const [performanceData, setPerformanceData] = useState<GameReportItem | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const hasSyncedRef = useRef(false);

    // Initial load
    useEffect(() => {
        loadSettings();
    }, [machineId, assetTag, activeStockItem?.id]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // 1. Load Machine Performance Data (Today)
            if (assetTag) {
                const today = new Date();
                const reports = await gameReportApiService.fetchGameReport({
                    startDate: today,
                    endDate: today,
                    tag: parseInt(assetTag), // User confirmed web assetTag = api tag
                    aggregate: true
                });

                if (reports && reports.length > 0) {
                    setPerformanceData(reports[0]);
                    setLastSyncedAt(new Date());
                } else {
                    setPerformanceData(null);
                }
            }

            // 2. Load Machine Advanced Settings
            const machine = await machineService.getById(machineId);
            if (machine) {
                setAdvancedSettings(machine.advancedSettings || {});
            }

            // 3. Load playfield settings history directly from JotForm as requested
            try {
                const { serviceReportService } = await import("@/services/serviceReportService");
                const allReports = await serviceReportService.getReports("GLOBAL_FETCH");
                const sanitizedTag = assetTag?.trim();

                if (sanitizedTag) {
                    console.log(`[SettingsPanel] Filtering ${allReports.length} JotForm reports for tag: "${sanitizedTag}"`);

                    const filteredData = allReports
                        .filter(report => {
                            const reportTag = String(report.inflowSku || report.machineId || "").trim();
                            return reportTag === sanitizedTag;
                        })
                        .map(report => ({
                            id: report.id,
                            machineId: machineId,
                            machineName: machineName || report.machineName,
                            assetTag: report.inflowSku,
                            externalId: report.id,
                            c1: report.c1,
                            c2: report.c2,
                            c3: report.c3,
                            c4: report.c4,
                            payoutRate: report.playsPerWin,
                            imageUrl: report.imageUrl,
                            timestamp: report.timestamp,
                            setBy: report.staffName,
                            remarks: report.remarks
                        }))
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    setSettings(filteredData);

                    // Fallback to latest playfield settings for the current configuration display
                    if (filteredData.length > 0 && !activeStockItem?.id) {
                        const latest = filteredData[0];
                        setCurrentSetting({
                            c1: latest.c1 || 0,
                            c2: latest.c2 || 0,
                            c3: latest.c3 || 0,
                            c4: latest.c4 || 0,
                            payoutRate: latest.payoutRate || 0,
                        });
                    }
                } else {
                    setSettings([]);
                }
            } catch (err) {
                console.error("Failed to load JotForm history:", err);
                setSettings([]);
            }

            // 4. If there's an active stock item, also load from itemMachineSettingsService
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
                machineName,
                assetTag,
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
                const playPrice = advancedSettings.cardCashPlayPrice || 1.80;

                const itemSettingsData: Omit<ItemMachineSettings, 'id'> = {
                    itemId: activeStockItem.id,
                    itemName: activeStockItem.name,
                    machineId,
                    machineName: machineName || "Unknown Machine",
                    c1,
                    c2,
                    c3,
                    c4,
                    playPrice,
                    playPerWin: payoutRate,
                    expectedRevenue: playPrice * payoutRate,
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
            await refreshMachines();
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
            await refreshMachines();
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
                {/* Performance Stats & Current Config Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Today's Performance Card */}
                    <div className="rounded-xl border overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                    <h3 className="text-lg font-semibold text-white">Today's Performance</h3>
                                </div>
                                <div className="text-white/80 text-xs font-medium bg-white/10 px-2 py-1 rounded">
                                    Live from API
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-card flex-1">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Gamepad2 className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Customer Plays</span>
                                    </div>
                                    <div className="text-2xl font-bold">{performanceData?.standardPlays ?? 0}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Staff Plays</span>
                                    </div>
                                    <div className="text-2xl font-bold">{performanceData?.empPlays ?? 0}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Total Plays</span>
                                    </div>
                                    <div className="text-2xl font-bold">{(performanceData?.standardPlays ?? 0) + (performanceData?.empPlays ?? 0)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Award className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Payouts (Wins)</span>
                                    </div>
                                    <div className="text-2xl font-bold">{performanceData?.points ?? 0}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Trophy className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Win Rate</span>
                                    </div>
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                        {performanceData && (performanceData.standardPlays + performanceData.empPlays) > 0
                                            ? `${((performanceData.points / (performanceData.standardPlays + performanceData.empPlays)) * 100).toFixed(1)}%`
                                            : '0.0%'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Revenue</span>
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        ${performanceData?.totalRev?.toFixed(2) ?? '0.00'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Claw Settings Card */}
                    <div className="rounded-xl border overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-white" />
                                    <h3 className="text-lg font-semibold text-white">Claw Settings</h3>
                                </div>
                                {lastSyncedAt && (
                                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] items-center gap-1">
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                        Synced
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-card flex-1 flex flex-col">
                            {activeStockItem && (
                                <div className="flex items-center gap-1.5 mb-4 text-sm font-medium">
                                    <Gift className="h-4 w-4 text-violet-500" />
                                    <span>Active: {activeStockItem.name}</span>
                                </div>
                            )}

                            <PermissionGate
                                permission="editMachines"
                                fallback={
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-auto opacity-70">
                                        {[
                                            { label: 'C1', value: currentSetting.c1 },
                                            { label: 'C2', value: currentSetting.c2 },
                                            { label: 'C3', value: currentSetting.c3 },
                                            { label: 'C4', value: currentSetting.c4 },
                                            { label: 'Payout', value: currentSetting.payoutRate },
                                        ].map((s) => (
                                            <div key={s.label} className="text-center p-2 bg-muted rounded-lg">
                                                <div className="text-[9px] uppercase text-muted-foreground font-bold">{s.label}</div>
                                                <div className="text-sm font-bold">{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                }
                            >
                                <div className="flex-1 flex flex-col">
                                    {!supervisorOverride && (
                                        <div className="flex items-center gap-2 p-2 mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300">
                                            <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                                            <p className="text-[11px]">
                                                Synced from JotForm. Enable <b>Supervisor Override</b> to edit.
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mt-auto">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">C1 (Catch)</Label>
                                            <Input
                                                type="number"
                                                className="h-9 font-bold"
                                                value={currentSetting.c1}
                                                disabled={!supervisorOverride}
                                                onChange={(e) => setCurrentSetting({ ...currentSetting, c1: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">C2 (Pickup)</Label>
                                            <Input
                                                type="number"
                                                className="h-9 font-bold"
                                                value={currentSetting.c2}
                                                disabled={!supervisorOverride}
                                                onChange={(e) => setCurrentSetting({ ...currentSetting, c2: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">C3 (Carry)</Label>
                                            <Input
                                                type="number"
                                                className="h-9 font-bold"
                                                value={currentSetting.c3}
                                                disabled={!supervisorOverride}
                                                onChange={(e) => setCurrentSetting({ ...currentSetting, c3: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Payout</Label>
                                            <Input
                                                type="number"
                                                className="h-9 font-bold"
                                                value={currentSetting.payoutRate}
                                                disabled={!supervisorOverride}
                                                onChange={(e) => setCurrentSetting({ ...currentSetting, payoutRate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">C4 (Prize)</Label>
                                            <Input
                                                type="number"
                                                className="h-9 font-bold"
                                                value={currentSetting.c4}
                                                disabled={!supervisorOverride}
                                                onChange={(e) => setCurrentSetting({ ...currentSetting, c4: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {supervisorOverride && (
                                        <Button onClick={handleSave} disabled={saving} size="sm" className="mt-4 w-full">
                                            {saving ? (
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            {saving ? "Saving..." : "Update Settings"}
                                        </Button>
                                    )}
                                </div>
                            </PermissionGate>
                        </div>
                    </div>
                </div>

                {/* Settings History - Timeline Style */}
                <div className="rounded-xl border overflow-hidden shadow-sm mt-6">
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">Settings History</h3>
                            <Badge variant="outline" className="text-[10px] ml-auto">{settings.length} entries</Badge>
                        </div>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                        {settings.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                No history recorded yet
                            </div>
                        ) : (
                            <div className="relative pl-6 border-l-2 border-muted space-y-4">
                                {settings.map((setting, index) => (
                                    <div key={setting.id} className="relative">
                                        {/* Timeline dot */}
                                        <div className={`absolute -left-[25px] top-2 w-3 h-3 rounded-full border-2 bg-background ${index === 0 ? 'border-violet-500 bg-violet-500' : 'border-muted-foreground/30'}`} />

                                        {/* Card */}
                                        <div className={`p-4 rounded-lg border bg-card transition-all hover:shadow-md ${index === 0 ? 'ring-1 ring-violet-200 dark:ring-violet-900' : ''}`}>
                                            <div className="flex justify-between items-start gap-3 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm">
                                                            {formatDate(setting.timestamp, "MMM d, yyyy")}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(setting.timestamp, "HH:mm")}
                                                        </span>
                                                        {index === 0 && (
                                                            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px]">Latest</Badge>
                                                        )}
                                                    </div>
                                                    {setting.stockItemName ? (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Stock: {setting.stockItemId ? (
                                                                <Link href={`/inventory/${setting.stockItemId}`} className="text-primary hover:underline">
                                                                    {setting.stockItemName}
                                                                </Link>
                                                            ) : setting.stockItemName}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground/60 mt-1">No stock linked</div>
                                                    )}
                                                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                                        By: {setting.setBy || 'Unknown'}
                                                    </div>
                                                </div>

                                                {/* Image thumbnail */}
                                                {setting.imageUrl && (
                                                    <OptimizedThumbnail
                                                        src={setting.imageUrl}
                                                        alt="Submission"
                                                        size={56}
                                                        className="h-14 w-14 rounded-lg border shadow-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => setZoomedImage(setting.imageUrl || null)}
                                                    />
                                                )}
                                            </div>

                                            {/* Values Grid */}
                                            <div className="grid grid-cols-5 gap-2">
                                                {[
                                                    { label: 'C1', value: setting.c1, fallback: setting.strengthSetting },
                                                    { label: 'C2', value: setting.c2 },
                                                    { label: 'C3', value: setting.c3 },
                                                    { label: 'Payout', value: setting.payoutRate, fallback: setting.payoutPercentage },
                                                    { label: 'C4', value: setting.c4 },
                                                ].map((item) => (
                                                    <div key={item.label} className="text-center p-2 bg-muted/40 rounded-md">
                                                        <div className="text-[9px] uppercase text-muted-foreground font-medium">{item.label}</div>
                                                        <div className="font-bold text-sm">
                                                            {(item.value !== undefined && !isNaN(Number(item.value))) ? item.value : (item.fallback ?? '-')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

            <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
                    <VisuallyHidden>
                        <DialogTitle>Image Preview</DialogTitle>
                    </VisuallyHidden>
                    {zoomedImage && (
                        <div className="relative flex items-center justify-center min-h-[50vh]" style={{ height: '80vh' }}>
                            <img
                                src={getLightboxUrl(zoomedImage, 1200)}
                                alt="Zoomed Submission"
                                loading="eager"
                                decoding="async"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Tabs >
    );
}

