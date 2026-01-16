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
import { RefreshCw, Save, Lock, Info, Gift, Clock, CheckCircle2, Users, DollarSign, Trophy, TrendingUp, Gamepad2, Award, HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { OptimizedImage, OptimizedThumbnail } from "@/components/ui/OptimizedImage";
import { getLightboxUrl } from "@/lib/utils/imageUtils";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
    machineId: string;
    machineName?: string;
    assetTag?: string;
    activeStockItem?: { id: string; name: string } | null;
    supervisorOverride?: boolean;
    isCraneMachine?: boolean;
}

export function SettingsPanel({
    machineId,
    machineName,
    assetTag,
    activeStockItem,
    supervisorOverride = false,
    isCraneMachine = true
}: SettingsPanelProps) {
    const { user } = useAuth();
    const { refreshMachines } = useData();
    // Default to playfield for crane machines, advanced for others
    const [activeTab, setActiveTab] = useState(isCraneMachine ? "playfield" : "advanced");

    // Existing playfield state
    const [settings, setSettings] = useState<PlayfieldSetting[]>([]);
    const [itemSettings, setItemSettings] = useState<ItemMachineSettings | null>(null);
    const [currentSetting, setCurrentSetting] = useState<{
        c1: string | number;
        c2: string | number;
        c3: string | number;
        c4: string | number;
        payoutRate: string | number;
        strongTime: string | number;
        weakTime: string | number;
    }>({
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        payoutRate: 0,
        strongTime: 0,
        weakTime: 0,
    });

    // New advanced settings state
    const [advancedSettings, setAdvancedSettings] = useState<AdvancedMachineSettings>({});
    const [performanceData, setPerformanceData] = useState<GameReportItem | null>(null);
    const [revenueHistory, setRevenueHistory] = useState<{ date: string; revenue: number; plays: number }[]>([]);
    const [chartType, setChartType] = useState<'revenue' | 'plays'>('revenue');
    const [chartStyle, setChartStyle] = useState<'bar' | 'line'>('bar');
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

                // For non-crane machines, also fetch last 7 days revenue
                if (!isCraneMachine) {
                    const today = new Date();
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 6);

                    const weekReports = await gameReportApiService.fetchGameReport({
                        startDate: weekAgo,
                        endDate: today,
                        tag: parseInt(assetTag),
                        aggregate: false // Get daily data
                    });

                    if (weekReports && weekReports.length > 0) {
                        // Group by date and sum revenue + plays
                        const dataByDate = new Map<string, { revenue: number; plays: number }>();
                        weekReports.forEach(r => {
                            const dateKey = r.date || 'today';
                            const existing = dataByDate.get(dateKey) || { revenue: 0, plays: 0 };
                            dataByDate.set(dateKey, {
                                revenue: existing.revenue + r.totalRev,
                                plays: existing.plays + r.standardPlays + r.empPlays
                            });
                        });

                        // Convert to array sorted by date
                        const historyData = Array.from(dataByDate.entries())
                            .map(([date, data]) => ({ date, revenue: data.revenue, plays: data.plays }))
                            .sort((a, b) => a.date.localeCompare(b.date));

                        setRevenueHistory(historyData);
                    }
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
                            payoutRate: report.playPerWin,
                            strongTime: (report as any).strongTime || 0,
                            weakTime: (report as any).weakTime || 0,
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
                            strongTime: (latest as any).strongTime || 0,
                            weakTime: (latest as any).weakTime || 0,
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
                        strongTime: (existingItemSettings as any).strongTime || 0,
                        weakTime: (existingItemSettings as any).weakTime || 0,
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
            const strongTime = parseValue(currentSetting.strongTime);
            const weakTime = parseValue(currentSetting.weakTime);

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
                strongTime,
                weakTime,
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
                    strongTime,
                    weakTime,
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
                    strongTime,
                    weakTime,
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
        <div className="space-y-6">
            {/* Today's Performance Card - Available for ALL machines */}
            <div className="rounded-xl border overflow-hidden shadow-sm">
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
                <div className="p-4 bg-card">
                    <div className={cn(
                        "grid grid-cols-2 md:grid-cols-4 gap-4",
                        isCraneMachine ? "xl:grid-cols-7" : "lg:grid-cols-6"
                    )}>
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
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-medium uppercase tracking-wider">Revenue</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                ${performanceData?.totalRev?.toFixed(2) ?? '0.00'}
                            </div>
                        </div>

                        {/* Crane-specific: Payouts, Win Rate, Accuracy */}
                        {isCraneMachine ? (
                            <>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Award className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Payouts (Wins)</span>
                                    </div>
                                    <div className="text-2xl font-bold">{performanceData?.points ?? 0}</div>
                                </div>
                                <div className="space-y-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                                                    <Trophy className="h-3.5 w-3.5" />
                                                    <span className="text-[11px] font-medium uppercase tracking-wider">Win Rate</span>
                                                    <HelpCircle className="h-3 w-3 opacity-50" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                                <p className="text-xs">
                                                    <strong>Win Rate</strong> = (Total Payouts / Total Plays) × 100%<br />
                                                    <span className="text-muted-foreground">
                                                        The percentage of plays that result in a prize payout.
                                                    </span>
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                        {performanceData && (performanceData.standardPlays + performanceData.empPlays) > 0
                                            ? `${((performanceData.points / (performanceData.standardPlays + performanceData.empPlays)) * 100).toFixed(1)}%`
                                            : '0.0%'}
                                    </div>
                                </div>

                                {/* Payout Accuracy - Only for Claw Machines */}
                                {isCraneMachine && (() => {
                                    const totalPlays = (performanceData?.standardPlays ?? 0) + (performanceData?.empPlays ?? 0);
                                    const totalPayouts = performanceData?.points ?? 0;
                                    const targetPayoutRate = parseFloat(String(currentSetting.payoutRate)) || 0;

                                    // Calculate actual plays per win
                                    const actualPlaysPerWin = totalPayouts > 0 ? totalPlays / totalPayouts : 0;

                                    // Calculate accuracy percentage: (Actual / Target) * 100
                                    // User Logic: 8/10 = 80% (High Payout/Red), 20/10 = 200% (Low Payout/Amber)
                                    let accuracyPct = 0;
                                    let accuracyLabel = 'N/A';
                                    let accuracyColor = 'text-muted-foreground';
                                    let statusLabel = '';

                                    if (targetPayoutRate > 0 && totalPayouts > 0) {
                                        accuracyPct = (actualPlaysPerWin / targetPayoutRate) * 100;
                                        accuracyLabel = `${accuracyPct.toFixed(0)}%`;

                                        // Determine color and label based on payout accuracy
                                        if (accuracyPct < 90) {
                                            accuracyColor = 'text-red-600 dark:text-red-400';
                                            statusLabel = 'High Payout';
                                        } else if (accuracyPct > 110) {
                                            accuracyColor = 'text-amber-600 dark:text-amber-400';
                                            statusLabel = 'Low Payout';
                                        } else {
                                            accuracyColor = 'text-emerald-600 dark:text-emerald-400';
                                            statusLabel = 'On Target';
                                        }
                                    } else if (targetPayoutRate === 0) {
                                        accuracyLabel = 'Not Set';
                                    } else if (totalPayouts === 0) {
                                        accuracyLabel = 'No Payouts';
                                    }

                                    return (
                                        <div className="space-y-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                                                            <Award className="h-3.5 w-3.5" />
                                                            <span className="text-[11px] font-medium uppercase tracking-wider">Accuracy</span>
                                                            <HelpCircle className="h-3 w-3 opacity-50" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="text-xs">
                                                            <strong>Payout Accuracy</strong> = (Actual Plays per Win / Target) × 100%<br />
                                                            <span className="text-muted-foreground mt-1 block italic text-[10px]">
                                                                • 100% = Exact match to target<br />
                                                                • Below 100% = Machine paying too much (loose)<br />
                                                                • Above 100% = Machine paying too little (tight)
                                                            </span>
                                                            <span className="text-muted-foreground mt-2 block border-t pt-1">
                                                                Target: {targetPayoutRate} plays/win<br />
                                                                Actual: {actualPlaysPerWin.toFixed(1)} plays/win
                                                            </span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div className={`text-2xl font-bold ${accuracyColor}`}>
                                                {accuracyLabel}
                                            </div>
                                            {statusLabel && (
                                                <div className={`text-[10px] font-bold uppercase tracking-tight ${accuracyColor}`}>
                                                    {statusLabel}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            /* Non-crane: Show 7-day chart with type and style selector */
                            <div className="col-span-2 md:col-span-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium uppercase tracking-wider">Last 7 Days</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Style toggle */}
                                        <div className="flex gap-0.5 border rounded p-0.5">
                                            <button
                                                onClick={() => setChartStyle('bar')}
                                                className={cn(
                                                    "px-1.5 py-0.5 text-[9px] rounded transition-colors",
                                                    chartStyle === 'bar' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                ▮▮▮
                                            </button>
                                            <button
                                                onClick={() => setChartStyle('line')}
                                                className={cn(
                                                    "px-1.5 py-0.5 text-[9px] rounded transition-colors",
                                                    chartStyle === 'line' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                📈
                                            </button>
                                        </div>
                                        {/* Type toggle */}
                                        <div className="flex gap-1">
                                            {(['revenue', 'plays'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setChartType(type)}
                                                    className={cn(
                                                        "px-2 py-0.5 text-[10px] font-medium rounded transition-colors",
                                                        chartType === type
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                    )}
                                                >
                                                    {type === 'revenue' ? '$' : '▶'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Chart Area */}
                                <div className="h-14 relative">
                                    {revenueHistory.length > 0 ? (
                                        chartStyle === 'bar' ? (
                                            /* Bar Chart */
                                            <div className="flex items-end gap-1 h-full">
                                                {revenueHistory.slice(-7).map((day, i, arr) => {
                                                    const getValue = (d: typeof day) =>
                                                        chartType === 'revenue' ? d.revenue : d.plays;
                                                    const maxVal = Math.max(...arr.map(getValue), 1);
                                                    const heightPct = (getValue(day) / maxVal) * 100;
                                                    const isToday = i === arr.length - 1;
                                                    const barColor = chartType === 'plays'
                                                        ? (isToday ? "bg-blue-500" : "bg-blue-300 dark:bg-blue-700")
                                                        : (isToday ? "bg-emerald-500" : "bg-emerald-300 dark:bg-emerald-700");
                                                    return (
                                                        <TooltipProvider key={day.date}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={cn("flex-1 rounded-t transition-all cursor-help", barColor)}
                                                                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs">
                                                                    <p className="font-medium">
                                                                        {chartType === 'plays'
                                                                            ? `${day.plays} plays`
                                                                            : `$${day.revenue.toFixed(2)}`}
                                                                    </p>
                                                                    <p className="text-muted-foreground text-[10px]">{day.date}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            /* Line Chart */
                                            <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                                                {(() => {
                                                    const data = revenueHistory.slice(-7);
                                                    const getValue = (d: typeof data[0]) =>
                                                        chartType === 'revenue' ? d.revenue : d.plays;
                                                    const maxVal = Math.max(...data.map(getValue), 1);
                                                    const points = data.map((d, i) => {
                                                        const x = (i / (data.length - 1 || 1)) * 100;
                                                        const y = 50 - (getValue(d) / maxVal) * 45;
                                                        return `${x},${y}`;
                                                    }).join(' ');
                                                    const areaPath = `M0,50 L${data.map((d, i) => {
                                                        const x = (i / (data.length - 1 || 1)) * 100;
                                                        const y = 50 - (getValue(d) / maxVal) * 45;
                                                        return `${x},${y}`;
                                                    }).join(' L')} L100,50 Z`;
                                                    const strokeColor = chartType === 'plays' ? '#3b82f6' : '#10b981';
                                                    const fillColor = chartType === 'plays' ? '#3b82f620' : '#10b98120';
                                                    return (
                                                        <>
                                                            <path d={areaPath} fill={fillColor} />
                                                            <polyline
                                                                points={points}
                                                                fill="none"
                                                                stroke={strokeColor}
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                vectorEffect="non-scaling-stroke"
                                                            />
                                                            {data.map((d, i) => {
                                                                const x = (i / (data.length - 1 || 1)) * 100;
                                                                const y = 50 - (getValue(d) / maxVal) * 45;
                                                                return (
                                                                    <circle
                                                                        key={d.date}
                                                                        cx={x}
                                                                        cy={y}
                                                                        r="3"
                                                                        fill={strokeColor}
                                                                        className="cursor-help"
                                                                    />
                                                                );
                                                            })}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        )
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                            No data available
                                        </div>
                                    )}
                                </div>
                                {revenueHistory.length > 0 && (
                                    <div className="text-[10px] text-muted-foreground">
                                        {chartType === 'plays'
                                            ? `Total: ${revenueHistory.reduce((sum, d) => sum + d.plays, 0)} plays`
                                            : `Total: $${revenueHistory.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs for Playfield (Crane only) and Advanced (All) */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-col h-auto sm:flex-row w-full mb-4 p-1">
                    {isCraneMachine && (
                        <TabsTrigger value="playfield" className="w-full sm:flex-1 py-1.5 px-3 text-xs md:text-sm">Playfield Settings</TabsTrigger>
                    )}
                    <TabsTrigger value="advanced" className="w-full sm:flex-1 py-1.5 px-3 text-xs md:text-sm">Advanced Configuration</TabsTrigger>
                </TabsList>

                <TabsContent value="playfield" className="space-y-6">
                    {/* Claw Settings - Now Full Width */}
                    <div className="grid grid-cols-1 gap-6">
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
                            <div className="p-4 bg-card flex-1 flex flex-col md:flex-row gap-6">
                                {/* Left side: Settings Form */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            {activeStockItem && (
                                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                                    <Gift className="h-4 w-4 text-violet-500" />
                                                    <span>Active: {activeStockItem.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <PermissionGate
                                        permission="editMachines"
                                        fallback={
                                            <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mt-auto opacity-70">
                                                {[
                                                    { label: 'C1', value: currentSetting.c1 },
                                                    { label: 'C2', value: currentSetting.c2 },
                                                    { label: 'C3', value: currentSetting.c3 },
                                                    { label: 'C4', value: currentSetting.c4 },
                                                    { label: 'Strong Time', value: currentSetting.strongTime },
                                                    { label: 'Weak Time', value: currentSetting.weakTime },
                                                    { label: 'Payout', value: currentSetting.payoutRate },
                                                ].map((s) => (
                                                    <div key={s.label} className="text-center p-2 bg-muted rounded-lg">
                                                        <div className="text-[9px] uppercase text-muted-foreground font-bold whitespace-nowrap">{s.label}</div>
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
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-auto">
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
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">C4 (Prize)</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-9 font-bold border-violet-200 dark:border-violet-900"
                                                        value={currentSetting.c4}
                                                        disabled={!supervisorOverride}
                                                        onChange={(e) => setCurrentSetting({ ...currentSetting, c4: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Strong Time</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        className="h-9 font-bold"
                                                        value={currentSetting.strongTime}
                                                        disabled={!supervisorOverride}
                                                        onChange={(e) => setCurrentSetting({ ...currentSetting, strongTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Weak Time</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        className="h-9 font-bold"
                                                        value={currentSetting.weakTime}
                                                        disabled={!supervisorOverride}
                                                        onChange={(e) => setCurrentSetting({ ...currentSetting, weakTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 font-bold">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Payout</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-9 font-bold bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                                                        value={currentSetting.payoutRate}
                                                        disabled={!supervisorOverride}
                                                        onChange={(e) => setCurrentSetting({ ...currentSetting, payoutRate: e.target.value })}
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

                                {/* Right side: Latest JotForm/Sync Image */}
                                <div className="flex-shrink-0 w-full md:w-64 flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/50">
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-3 self-start">Latest Verification Photo</div>
                                    {settings.length > 0 && settings[0].imageUrl ? (
                                        <div className="relative group cursor-pointer w-full" onClick={() => setZoomedImage(settings[0].imageUrl || null)}>
                                            <OptimizedImage
                                                src={settings[0].imageUrl}
                                                alt="Latest Submission"
                                                width={600}
                                                aspectRatio="4/3"
                                                className="w-full h-48 rounded-lg border-2 border-white shadow-sm transition-transform group-hover:scale-[1.02]"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <TrendingUp className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                                            <Gamepad2 className="h-10 w-10 mb-2 opacity-20" />
                                            <span className="text-[11px]">No photo available</span>
                                        </div>
                                    )}
                                    {settings.length > 0 && (
                                        <div className="mt-3 text-[10px] text-muted-foreground text-center">
                                            From submission on {formatDate(settings[0].timestamp, "MMM d, yyyy")}
                                        </div>
                                    )}
                                </div>
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
                                            <div className={`p-3 rounded-lg border bg-card transition-all hover:shadow-md ${index === 0 ? 'ring-1 ring-violet-200 dark:ring-violet-900' : ''}`}>
                                                {/* Header row with info */}
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <span className="font-medium text-sm">
                                                        {formatDate(setting.timestamp, "MMM d, yyyy")}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(setting.timestamp, "HH:mm")}
                                                    </span>
                                                    {index === 0 && (
                                                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px]">Latest</Badge>
                                                    )}
                                                    {/* Remarks in the middle */}
                                                    {(setting as any).remarks && (
                                                        <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]" title={(setting as any).remarks}>
                                                            "{(setting as any).remarks}"
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                                        {setting.stockItemName || 'No stock linked'} • <span className="font-semibold text-foreground">{setting.setBy || 'Unknown'}</span>
                                                    </span>
                                                </div>

                                                {/* Compact layout: Metrics + Image side by side */}
                                                <div className="flex gap-3 items-stretch">
                                                    {/* Metrics Grid - compact single row */}
                                                    <div className="flex-1 grid grid-cols-7 gap-1">
                                                        {[
                                                            { label: 'C1', value: setting.c1, fallback: setting.strengthSetting },
                                                            { label: 'C2', value: setting.c2 },
                                                            { label: 'C3', value: setting.c3 },
                                                            { label: 'C4', value: setting.c4 },
                                                            { label: 'Payout', value: setting.payoutRate, fallback: setting.payoutPercentage },
                                                            { label: 'ST', value: (setting as any).strongTime },
                                                            { label: 'WT', value: (setting as any).weakTime },
                                                        ].map((item) => (
                                                            <div key={item.label} className="text-center py-1.5 px-1 bg-muted/40 rounded">
                                                                <div className="text-[8px] uppercase text-muted-foreground font-medium">{item.label}</div>
                                                                <div className="font-bold text-sm leading-tight">
                                                                    {(item.value !== undefined && !isNaN(Number(item.value))) ? item.value : (item.fallback ?? '-')}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Bigger Image */}
                                                    {setting.imageUrl && (
                                                        <OptimizedThumbnail
                                                            src={setting.imageUrl}
                                                            alt="Submission"
                                                            size={120}
                                                            className="h-20 w-28 rounded-lg border shadow-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity object-cover"
                                                            onClick={() => setZoomedImage(setting.imageUrl || null)}
                                                        />
                                                    )}
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
            </Tabs>

            <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black/90 border-none">
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
        </div>
    );
}

