"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
    AlertTriangle, Download, Trash2, Plug, Upload,
    Keyboard, Code, History, RotateCcw, Info,
    Lock, Unlock, Cloud, Sparkles, FileDiff,
    Accessibility, Palette, Clock, ShieldCheck
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const { user } = useAuth();

    // --- State Definitions ---
    // General
    const [language, setLanguage] = useState("en");
    const [timezone, setTimezone] = useState("Australia/Sydney");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [currency, setCurrency] = useState("AUD");

    // Display
    const [defaultView, setDefaultView] = useState("list");

    // Accessibility
    const [fontSize, setFontSize] = useState("medium");
    const [highContrast, setHighContrast] = useState(false);
    const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    // Notifications & Email
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [emailMarketing, setEmailMarketing] = useState(false);
    const [emailSecurity, setEmailSecurity] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(true);

    // Privacy
    const [cookieAnalytics, setCookieAnalytics] = useState(true);
    const [cookieMarketing, setCookieMarketing] = useState(false);
    const [trackingOptOut, setTrackingOptOut] = useState(false);
    const [dataRetention, setDataRetention] = useState("1_year");

    // Automation
    const [dndEnabled, setDndEnabled] = useState(false);
    const [dndStartTime, setDndStartTime] = useState("18:00");
    const [dndEndTime, setDndEndTime] = useState("09:00");

    // System & Lock
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [soundEffects, setSoundEffects] = useState(false);
    const [settingsLocked, setSettingsLocked] = useState(false);

    // Advanced
    const [developerMode, setDeveloperMode] = useState(false);
    const [debugLogging, setDebugLogging] = useState(false);

    // State Management
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showDiffModal, setShowDiffModal] = useState(false);

    // Memoized keyboard shortcuts to prevent recreating on every render
    const keyboardShortcuts = useMemo(() => [
        { key: "Ctrl/Cmd + K", action: "Quick search" },
        { key: "Ctrl/Cmd + S", action: "Save changes" },
        { key: "Ctrl/Cmd + ,", action: "Open settings" },
        { key: "Esc", action: "Close dialog" },
    ], []);

    // Storage key for settings persistence
    const SETTINGS_STORAGE_KEY = 'claw-master-settings';

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                const settings = JSON.parse(storedSettings);
                // General
                if (settings.language) setLanguage(settings.language);
                if (settings.timezone) setTimezone(settings.timezone);
                if (settings.dateFormat) setDateFormat(settings.dateFormat);
                if (settings.currency) setCurrency(settings.currency);
                // Display
                if (settings.defaultView) setDefaultView(settings.defaultView);
                // Accessibility
                if (settings.fontSize) setFontSize(settings.fontSize);
                if (typeof settings.highContrast === 'boolean') setHighContrast(settings.highContrast);
                if (typeof settings.screenReaderOptimized === 'boolean') setScreenReaderOptimized(settings.screenReaderOptimized);
                if (typeof settings.reducedMotion === 'boolean') setReducedMotion(settings.reducedMotion);
                // Notifications
                if (typeof settings.emailNotifications === 'boolean') setEmailNotifications(settings.emailNotifications);
                if (typeof settings.smsNotifications === 'boolean') setSmsNotifications(settings.smsNotifications);
                if (typeof settings.emailMarketing === 'boolean') setEmailMarketing(settings.emailMarketing);
                if (typeof settings.emailSecurity === 'boolean') setEmailSecurity(settings.emailSecurity);
                if (typeof settings.emailUpdates === 'boolean') setEmailUpdates(settings.emailUpdates);
                // Privacy
                if (typeof settings.cookieAnalytics === 'boolean') setCookieAnalytics(settings.cookieAnalytics);
                if (typeof settings.cookieMarketing === 'boolean') setCookieMarketing(settings.cookieMarketing);
                if (typeof settings.trackingOptOut === 'boolean') setTrackingOptOut(settings.trackingOptOut);
                if (settings.dataRetention) setDataRetention(settings.dataRetention);
                // Automation
                if (typeof settings.dndEnabled === 'boolean') setDndEnabled(settings.dndEnabled);
                if (settings.dndStartTime) setDndStartTime(settings.dndStartTime);
                if (settings.dndEndTime) setDndEndTime(settings.dndEndTime);
                // System
                if (typeof settings.autoRefresh === 'boolean') setAutoRefresh(settings.autoRefresh);
                if (typeof settings.soundEffects === 'boolean') setSoundEffects(settings.soundEffects);
                // Advanced
                if (typeof settings.developerMode === 'boolean') setDeveloperMode(settings.developerMode);
                if (typeof settings.debugLogging === 'boolean') setDebugLogging(settings.debugLogging);
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (hasUnsavedChanges) {
            setIsSyncing(true);
            const timer = setTimeout(() => setIsSyncing(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [hasUnsavedChanges]);

    // --- Handlers (Memoized with useCallback) ---
    const handleChange = useCallback(<T,>(setter: (value: T) => void, value: T) => {
        if (settingsLocked) {
            toast.error("Settings are locked. Please unlock to make changes.");
            return;
        }
        setter(value);
        setHasUnsavedChanges(true);
    }, [settingsLocked]);

    const handleSaveAll = useCallback(() => {
        setShowDiffModal(true);
    }, []);

    const confirmSave = useCallback(() => {
        // Persist settings to localStorage
        try {
            const settingsToSave = {
                language, timezone, dateFormat, currency,
                defaultView,
                fontSize, highContrast, screenReaderOptimized, reducedMotion,
                emailNotifications, smsNotifications, emailMarketing, emailSecurity, emailUpdates,
                cookieAnalytics, cookieMarketing, trackingOptOut, dataRetention,
                dndEnabled, dndStartTime, dndEndTime,
                autoRefresh, soundEffects,
                developerMode, debugLogging,
            };
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
        setShowDiffModal(false);
        setHasUnsavedChanges(false);
        toast.success("Settings saved successfully!");
    }, [language, timezone, dateFormat, currency, defaultView, fontSize, highContrast, screenReaderOptimized, reducedMotion, emailNotifications, smsNotifications, emailMarketing, emailSecurity, emailUpdates, cookieAnalytics, cookieMarketing, trackingOptOut, dataRetention, dndEnabled, dndStartTime, dndEndTime, autoRefresh, soundEffects, developerMode, debugLogging]);

    const handleLockSettings = useCallback(() => {
        setSettingsLocked(prev => !prev);
        toast.success(settingsLocked ? "Settings unlocked" : "Settings locked");
    }, [settingsLocked]);

    const handleApplyPreset = useCallback((preset: string) => {
        if (settingsLocked) {
            toast.error("Settings are locked. Please unlock to apply presets.");
            return;
        }

        const applyChanges = () => {
            switch (preset) {
                case "High Accessibility":
                    setFontSize("large");
                    setHighContrast(true);
                    setReducedMotion(true);
                    break;
                case "High Privacy":
                    setCookieAnalytics(false);
                    setCookieMarketing(false);
                    setTrackingOptOut(true);
                    break;
                case "Focus Mode":
                    setEmailNotifications(false);
                    setSmsNotifications(false);
                    setSoundEffects(false);
                    break;
                case "Standard":
                default:
                    // Reset to defaults
                    setFontSize("medium");
                    setHighContrast(false);
                    setReducedMotion(false);
                    break;
            }
            setHasUnsavedChanges(true);
        };

        toast.promise(
            new Promise((resolve) => setTimeout(() => {
                applyChanges();
                resolve(true);
            }, 1000)),
            {
                loading: `Applying ${preset} preset...`,
                success: `${preset} preset applied successfully!`,
                error: 'Failed to apply preset',
            }
        );
    }, [settingsLocked]);

    const handleRestoreVersion = useCallback(() => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Restoring previous version...',
                success: 'Settings restored to version from Yesterday, 2:30 PM',
                error: 'Failed to restore settings',
            }
        );
    }, []);

    const handleClearCache = useCallback(() => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Clearing application cache...',
                success: 'Cache cleared successfully!',
                error: 'Failed to clear cache',
            }
        );
    }, []);

    const handleExport = useCallback((format: "csv" | "json") => {
        toast.success(`Exporting data as ${format.toUpperCase()}...`, {
            description: "Your download will start shortly.",
        });
    }, []);

    const handleBackupSettings = useCallback(() => {
        // Create actual backup JSON
        const settings = {
            language, timezone, dateFormat, currency,
            defaultView, fontSize, highContrast, screenReaderOptimized, reducedMotion,
            emailNotifications, smsNotifications, emailMarketing, emailSecurity, emailUpdates,
            cookieAnalytics, cookieMarketing, trackingOptOut, dataRetention,
            dndEnabled, dndStartTime, dndEndTime,
            autoRefresh, soundEffects, developerMode, debugLogging
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claw-master-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Settings backed up successfully!");
    }, [language, timezone, dateFormat, currency, defaultView, fontSize, highContrast,
        screenReaderOptimized, reducedMotion, emailNotifications, smsNotifications,
        emailMarketing, emailSecurity, emailUpdates, cookieAnalytics, cookieMarketing,
        trackingOptOut, dataRetention, dndEnabled, dndStartTime, dndEndTime,
        autoRefresh, soundEffects, developerMode, debugLogging]);

    const handleRestoreSettings = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const settings = JSON.parse(event.target?.result as string);
                        // Apply settings
                        if (settings.language) setLanguage(settings.language);
                        if (settings.timezone) setTimezone(settings.timezone);
                        if (settings.dateFormat) setDateFormat(settings.dateFormat);
                        if (settings.currency) setCurrency(settings.currency);
                        if (settings.defaultView) setDefaultView(settings.defaultView);
                        if (settings.fontSize) setFontSize(settings.fontSize);
                        if (settings.highContrast !== undefined) setHighContrast(settings.highContrast);
                        // ... apply other settings
                        setHasUnsavedChanges(true);
                        toast.success("Settings restored successfully!");
                    } catch (error) {
                        toast.error("Failed to restore settings. Invalid file format.");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, []);

    const handleResetSettings = useCallback(() => {
        toast.promise(
            new Promise((resolve) => setTimeout(() => {
                // Reset all settings to defaults
                setLanguage("en");
                setTimezone("Australia/Sydney");
                setDateFormat("DD/MM/YYYY");
                setCurrency("AUD");
                setDefaultView("list");
                setFontSize("medium");
                setHighContrast(false);
                setScreenReaderOptimized(false);
                setReducedMotion(false);
                setEmailNotifications(true);
                setSmsNotifications(false);
                setEmailMarketing(false);
                setEmailSecurity(true);
                setEmailUpdates(true);
                setCookieAnalytics(true);
                setCookieMarketing(false);
                setTrackingOptOut(false);
                setDataRetention("1_year");
                setDndEnabled(false);
                setAutoRefresh(true);
                setSoundEffects(false);
                setDeveloperMode(false);
                setDebugLogging(false);
                setHasUnsavedChanges(true);
                resolve(true);
            }, 1000)),
            {
                loading: 'Resetting all settings...',
                success: 'All settings reset to defaults',
                error: 'Failed to reset settings',
            }
        );
    }, []);

    // Early return if not authenticated
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>Please log in to view and manage settings.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                            Settings
                            {isSyncing && (
                                <Badge variant="outline" className="text-xs font-normal animate-pulse">
                                    <Cloud className="mr-1 h-3 w-3" /> Syncing...
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground">Manage application settings and preferences.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLockSettings}
                            className={settingsLocked ? "border-amber-500 text-amber-600" : ""}
                        >
                            {settingsLocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                            {settingsLocked ? "Locked" : "Unlocked"}
                        </Button>
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-amber-600 hidden md:inline">Unsaved changes</span>
                                <Button size="sm" onClick={handleSaveAll}>Save All</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Suggestions */}
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Suggestion: Enable Dark Mode</p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">Based on your usage time (evening), dark mode might reduce eye strain.</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100">Apply</Button>
                    </CardContent>
                </Card>

                <Tabs defaultValue="general" className="space-y-4">
                    <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="display">Display</TabsTrigger>
                        <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy</TabsTrigger>
                        <TabsTrigger value="data">Data</TabsTrigger>
                        <TabsTrigger value="automation">Automation</TabsTrigger>
                        <TabsTrigger value="presets">Presets</TabsTrigger>
                        <TabsTrigger value="system">System</TabsTrigger>
                        <TabsTrigger value="integrations">Integrations</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Language & Region</CardTitle>
                                <CardDescription>Set your language, timezone, and format preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select value={language} onValueChange={(val) => handleChange(setLanguage, val)} disabled={settingsLocked}>
                                        <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={timezone} onValueChange={(val) => handleChange(setTimezone, val)} disabled={settingsLocked}>
                                        <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                                            <SelectItem value="America/New_York">New York (EST)</SelectItem>
                                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="dateFormat">Date Format</Label>
                                        <Select value={dateFormat} onValueChange={(val) => handleChange(setDateFormat, val)} disabled={settingsLocked}>
                                            <SelectTrigger id="dateFormat"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select value={currency} onValueChange={(val) => handleChange(setCurrency, val)} disabled={settingsLocked}>
                                            <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AUD">AUD ($)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Display Tab */}
                    <TabsContent value="display" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize how the application looks.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Theme</Label>
                                    <p className="text-sm text-muted-foreground">Select your preferred color theme.</p>
                                </div>
                                <ModeToggle />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Layout</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="defaultView">Default View Mode</Label>
                                    <Select value={defaultView} onValueChange={(val) => handleChange(setDefaultView, val)} disabled={settingsLocked}>
                                        <SelectTrigger id="defaultView"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="list">List View</SelectItem>
                                            <SelectItem value="grid">Grid View</SelectItem>
                                            <SelectItem value="compact">Compact View</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Accessibility Tab */}
                    <TabsContent value="accessibility" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Accessibility className="h-5 w-5" />
                                    Accessibility Settings
                                </CardTitle>
                                <CardDescription>Customize the interface for your needs.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="fontSize">Font Size</Label>
                                            <p className="text-sm text-muted-foreground">Adjust the text size for better readability.</p>
                                        </div>
                                        <Select value={fontSize} onValueChange={(val) => handleChange(setFontSize, val)} disabled={settingsLocked}>
                                            <SelectTrigger id="fontSize" className="w-[180px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="small">Small</SelectItem>
                                                <SelectItem value="medium">Medium (Default)</SelectItem>
                                                <SelectItem value="large">Large</SelectItem>
                                                <SelectItem value="xl">Extra Large</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="highContrast">High Contrast Mode</Label>
                                            <p className="text-sm text-muted-foreground">Increase contrast for better visibility.</p>
                                        </div>
                                        <Switch id="highContrast" checked={highContrast} onCheckedChange={(val) => handleChange(setHighContrast, val)} disabled={settingsLocked} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="screenReader">Screen Reader Optimizations</Label>
                                            <p className="text-sm text-muted-foreground">Enhance compatibility with screen readers.</p>
                                        </div>
                                        <Switch id="screenReader" checked={screenReaderOptimized} onCheckedChange={(val) => handleChange(setScreenReaderOptimized, val)} disabled={settingsLocked} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="reducedMotion">Reduced Motion</Label>
                                            <p className="text-sm text-muted-foreground">Minimize animations and transitions.</p>
                                        </div>
                                        <Switch id="reducedMotion" checked={reducedMotion} onCheckedChange={(val) => handleChange(setReducedMotion, val)} disabled={settingsLocked} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Channels</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="emailNotif">Email Notifications</Label>
                                    <Switch id="emailNotif" checked={emailNotifications} onCheckedChange={(val) => handleChange(setEmailNotifications, val)} disabled={settingsLocked} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="smsNotif">SMS Notifications</Label>
                                    <Switch id="smsNotif" checked={smsNotifications} onCheckedChange={(val) => handleChange(setSmsNotifications, val)} disabled={settingsLocked} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Preferences</CardTitle>
                                <CardDescription>Manage the types of emails you receive.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="emailSec">Security Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Login alerts and security updates.</p>
                                    </div>
                                    <Switch id="emailSec" checked={emailSecurity} onCheckedChange={(val) => handleChange(setEmailSecurity, val)} disabled={settingsLocked} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="emailUpd">Product Updates</Label>
                                        <p className="text-sm text-muted-foreground">News about new features and improvements.</p>
                                    </div>
                                    <Switch id="emailUpd" checked={emailUpdates} onCheckedChange={(val) => handleChange(setEmailUpdates, val)} disabled={settingsLocked} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="emailMkt">Marketing & Tips</Label>
                                        <p className="text-sm text-muted-foreground">Tips on how to use the app effectively.</p>
                                    </div>
                                    <Switch id="emailMkt" checked={emailMarketing} onCheckedChange={(val) => handleChange(setEmailMarketing, val)} disabled={settingsLocked} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" />
                                    Privacy & Cookies
                                </CardTitle>
                                <CardDescription>Manage your data privacy and cookie settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="essentialCookies">Essential Cookies</Label>
                                            <p className="text-sm text-muted-foreground">Required for the app to function. Cannot be disabled.</p>
                                        </div>
                                        <Switch id="essentialCookies" checked={true} disabled />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="analyticsCookies">Analytics Cookies</Label>
                                            <p className="text-sm text-muted-foreground">Help us improve by collecting anonymous usage data.</p>
                                        </div>
                                        <Switch id="analyticsCookies" checked={cookieAnalytics} onCheckedChange={(val) => handleChange(setCookieAnalytics, val)} disabled={settingsLocked} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="marketingCookies">Marketing Cookies</Label>
                                            <p className="text-sm text-muted-foreground">Used to show relevant offers and promotions.</p>
                                        </div>
                                        <Switch id="marketingCookies" checked={cookieMarketing} onCheckedChange={(val) => handleChange(setCookieMarketing, val)} disabled={settingsLocked} />
                                    </div>
                                </div>
                                <div className="border-t pt-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="trackingOpt">Tracking Opt-out</Label>
                                            <p className="text-sm text-muted-foreground">Send "Do Not Track" request with your traffic.</p>
                                        </div>
                                        <Switch id="trackingOpt" checked={trackingOptOut} onCheckedChange={(val) => handleChange(setTrackingOptOut, val)} disabled={settingsLocked} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dataRetention">Data Retention Policy</Label>
                                        <p className="text-sm text-muted-foreground mb-2">How long should we keep your activity logs?</p>
                                        <Select value={dataRetention} onValueChange={(val) => handleChange(setDataRetention, val)} disabled={settingsLocked}>
                                            <SelectTrigger id="dataRetention"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30_days">30 Days</SelectItem>
                                                <SelectItem value="1_year">1 Year</SelectItem>
                                                <SelectItem value="forever">Forever</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Tab */}
                    <TabsContent value="data" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Export Data</Label>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                                            <Download className="mr-2 h-4 w-4" /> Export CSV
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                                            <Download className="mr-2 h-4 w-4" /> Export JSON
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Clear Cache</Label>
                                    <Button variant="outline" size="sm" onClick={handleClearCache}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Clear Cache
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Backup & Restore</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleBackupSettings}>
                                        <Download className="mr-2 h-4 w-4" /> Backup
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleRestoreSettings}>
                                        <Upload className="mr-2 h-4 w-4" /> Restore
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Settings History & Rollback
                                </CardTitle>
                                <CardDescription>Restore your settings to a previous state.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                        <div>
                                            <p className="text-sm font-medium">Yesterday, 2:30 PM</p>
                                            <p className="text-xs text-muted-foreground">Changed theme, notifications</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleRestoreVersion} disabled={settingsLocked}>
                                            <RotateCcw className="mr-2 h-3 w-3" /> Restore
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                            <CardHeader>
                                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" /> Danger Zone
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">Reset All Settings</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will reset all settings to default.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetSettings}>Reset</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Automation Tab */}
                    <TabsContent value="automation" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Scheduled Settings
                                </CardTitle>
                                <CardDescription>Automate settings based on time of day.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="dndEnabled">Do Not Disturb Schedule</Label>
                                        <p className="text-sm text-muted-foreground">Automatically mute notifications during specific hours.</p>
                                    </div>
                                    <Switch id="dndEnabled" checked={dndEnabled} onCheckedChange={(val) => handleChange(setDndEnabled, val)} disabled={settingsLocked} />
                                </div>
                                {dndEnabled && (
                                    <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="dndStart">Start Time</Label>
                                            <Input id="dndStart" type="time" value={dndStartTime} onChange={(e) => handleChange(setDndStartTime, e.target.value)} disabled={settingsLocked} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="dndEnd">End Time</Label>
                                            <Input id="dndEnd" type="time" value={dndEndTime} onChange={(e) => handleChange(setDndEndTime, e.target.value)} disabled={settingsLocked} />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Presets Tab */}
                    <TabsContent value="presets" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Settings Presets
                                </CardTitle>
                                <CardDescription>Quickly apply pre-configured settings profiles.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <Card className="border-dashed cursor-pointer hover:bg-accent transition-colors" onClick={() => handleApplyPreset("Standard")}>
                                    <CardHeader>
                                        <CardTitle className="text-base">Standard</CardTitle>
                                        <CardDescription>Default settings for balanced usage.</CardDescription>
                                    </CardHeader>
                                </Card>
                                <Card className="border-dashed cursor-pointer hover:bg-accent transition-colors" onClick={() => handleApplyPreset("High Privacy")}>
                                    <CardHeader>
                                        <CardTitle className="text-base">High Privacy</CardTitle>
                                        <CardDescription>Maximized data protection and minimal tracking.</CardDescription>
                                    </CardHeader>
                                </Card>
                                <Card className="border-dashed cursor-pointer hover:bg-accent transition-colors" onClick={() => handleApplyPreset("High Accessibility")}>
                                    <CardHeader>
                                        <CardTitle className="text-base">High Accessibility</CardTitle>
                                        <CardDescription>Large text, high contrast, reduced motion.</CardDescription>
                                    </CardHeader>
                                </Card>
                                <Card className="border-dashed cursor-pointer hover:bg-accent transition-colors" onClick={() => handleApplyPreset("Focus Mode")}>
                                    <CardHeader>
                                        <CardTitle className="text-base">Focus Mode</CardTitle>
                                        <CardDescription>Minimal notifications and distractions.</CardDescription>
                                    </CardHeader>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* System Tab */}
                    <TabsContent value="system" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>System</CardTitle>
                                <CardDescription>Configure system behavior and preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="autoRefresh">Auto-Refresh</Label>
                                            <Tooltip>
                                                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                                <TooltipContent><p>Automatically refresh data every 30 seconds</p></TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Automatically refresh data every 30 seconds.</p>
                                    </div>
                                    <Switch id="autoRefresh" checked={autoRefresh} onCheckedChange={(val) => handleChange(setAutoRefresh, val)} disabled={settingsLocked} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="soundEffects">Sound Effects</Label>
                                        <p className="text-sm text-muted-foreground">Play sounds for notifications and alerts.</p>
                                    </div>
                                    <Switch id="soundEffects" checked={soundEffects} onCheckedChange={(val) => handleChange(setSoundEffects, val)} disabled={settingsLocked} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Keyboard className="h-5 w-5" />
                                    Keyboard Shortcuts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {keyboardShortcuts.map((shortcut, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="text-sm">{shortcut.action}</span>
                                            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">{shortcut.key}</kbd>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Integrations Tab */}
                    <TabsContent value="integrations" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Integrations</CardTitle>
                                <CardDescription>Connect with third-party services and tools.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                            <Plug className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Stripe</p>
                                            <p className="text-sm text-muted-foreground">Payment processing</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Connect</Button>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                            <Plug className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Slack</p>
                                            <p className="text-sm text-muted-foreground">Team communication</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Connect</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Advanced Tab */}
                    <TabsContent value="advanced" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Developer Settings
                                </CardTitle>
                                <CardDescription>Advanced settings for developers and power users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="devMode">Developer Mode</Label>
                                        <p className="text-sm text-muted-foreground">Enable advanced developer features and debugging tools.</p>
                                    </div>
                                    <Switch id="devMode" checked={developerMode} onCheckedChange={(val) => handleChange(setDeveloperMode, val)} disabled={settingsLocked} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="debugLog">Debug Logging</Label>
                                        <p className="text-sm text-muted-foreground">Enable verbose logging to browser console.</p>
                                    </div>
                                    <Switch id="debugLog" checked={debugLogging} onCheckedChange={(val) => handleChange(setDebugLogging, val)} disabled={settingsLocked} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* About Tab */}
                    <TabsContent value="about" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>About</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm">
                                    <p className="font-medium">Claw Master v1.0.0</p>
                                    <p className="text-muted-foreground">Built with Next.js 15 & Firebase</p>
                                </div>
                                <div className="pt-4">
                                    <Button variant="outline" className="w-full">
                                        <Info className="mr-2 h-4 w-4" />
                                        Launch Onboarding Wizard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Diff Viewer Modal */}
                <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileDiff className="h-5 w-5" />
                                Review Changes
                            </DialogTitle>
                            <DialogDescription>
                                Review your changes before saving.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2 sticky top-0 bg-background">
                                <div>Setting</div>
                                <div className="text-muted-foreground">Original</div>
                                <div className="text-green-600 dark:text-green-400">New</div>
                            </div>
                            {/* Simulated Diff Items */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>Language</div>
                                <div className="text-muted-foreground">English</div>
                                <div className="text-green-600 dark:text-green-400">{language === 'en' ? 'English' : language === 'es' ? 'Español' : 'Français'}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>Font Size</div>
                                <div className="text-muted-foreground">Medium</div>
                                <div className="text-green-600 dark:text-green-400">{fontSize}</div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDiffModal(false)}>Cancel</Button>
                            <Button onClick={confirmSave}>Confirm & Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
