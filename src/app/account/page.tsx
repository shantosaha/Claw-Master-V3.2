"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Bell, Activity, Lock, Save, Download, Upload, QrCode, Key, AlertTriangle, Filter, MapPin, BarChart3, Cloud, Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AccountPage() {
    const { user, userProfile } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [bio, setBio] = useState("");
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [pushAlerts, setPushAlerts] = useState(true);
    const [stockAlerts, setStockAlerts] = useState(true);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
    const [orderAlerts, setOrderAlerts] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activityFilter, setActivityFilter] = useState("all");
    const [isSyncing, setIsSyncing] = useState(false);
    const [backupCodes] = useState([
        "ABCD-1234-EFGH",
        "IJKL-5678-MNOP",
        "QRST-9012-UVWX",
        "YZAB-3456-CDEF",
    ]);

    // Track unsaved changes
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

    // Simulate Sync - using callback to avoid setState in effect body
    useEffect(() => {
        if (!hasUnsavedChanges) {
            return;
        }
        // Schedule the sync indicator update
        const syncTimer = setTimeout(() => {
            setIsSyncing(true);
        }, 0);
        const resetTimer = setTimeout(() => setIsSyncing(false), 2000);
        return () => {
            clearTimeout(syncTimer);
            clearTimeout(resetTimer);
        };
    }, [hasUnsavedChanges]);

    if (!user) return <div>Please log in to view your account.</div>;

    // Get user initials for avatar fallback
    const getInitials = () => {
        if (user.displayName) {
            return user.displayName
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase();
        }
        return user.email?.[0]?.toUpperCase() || "U";
    };

    const handleSaveProfile = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setHasUnsavedChanges(false);
            toast.success("Profile updated successfully", {
                description: "Your changes have been saved.",
            });
        }, 1000);
    };

    const handleUploadAvatar = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                toast.success("Profile picture uploaded!", {
                    description: "Your new avatar will be updated shortly.",
                });
            }
        };
        input.click();
    };

    const handleDownloadPersonalData = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Preparing your data export...',
                success: 'Personal data downloaded successfully!',
                error: 'Failed to download data',
            }
        );
    };

    const handleEnable2FA = () => {
        setTwoFactorEnabled(true);
        toast.success("Two-factor authentication enabled", {
            description: "Your account is now more secure.",
        });
    };

    const handleDisable2FA = () => {
        setTwoFactorEnabled(false);
        toast.success("Two-factor authentication disabled");
    };

    const handleDownloadBackupCodes = () => {
        const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup-codes.txt';
        a.click();
        toast.success("Backup codes downloaded");
    };

    const handleExportActivity = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Exporting activity log...',
                success: 'Activity log exported successfully!',
                error: 'Failed to export activity',
            }
        );
    };

    const activityData = [
        { type: "machine", color: "blue", title: "Updated machine status", detail: "Machine #12 - 2 hours ago" },
        { type: "inventory", color: "green", title: "Added new inventory item", detail: "Pokemon Plush - 5 hours ago" },
        { type: "maintenance", color: "yellow", title: "Created maintenance task", detail: "Claw repair - Yesterday" },
        { type: "settings", color: "purple", title: "Updated settings", detail: "Notification preferences - 2 days ago" },
        { type: "order", color: "pink", title: "Processed order", detail: "Order #1234 - 3 days ago" },
    ];

    const filteredActivity = activityFilter === "all"
        ? activityData
        : activityData.filter(item => item.type === activityFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                        My Account
                        {isSyncing && (
                            <Badge variant="outline" className="text-xs font-normal animate-pulse">
                                <Cloud className="mr-1 h-3 w-3" /> Syncing...
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your personal information and account settings.
                    </p>
                </div>
                {hasUnsavedChanges && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
                        <Button size="sm" onClick={handleSaveProfile}>
                            {isSaving ? "Saving..." : "Save All"}
                        </Button>
                    </div>
                )}
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="data">Data & Privacy</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Your personal details and contact information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                                    <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Profile Picture</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleUploadAvatar}>
                                            <Upload className="mr-2 h-3 w-3" />
                                            Upload New
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer">
                                                Manage via Google
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Fields */}
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="displayName">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Display Name
                                        </div>
                                    </Label>
                                    <Input id="displayName" value={user.displayName || ""} disabled />
                                    <p className="text-xs text-muted-foreground">
                                        Managed via your Google Account
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email Address
                                        </div>
                                    </Label>
                                    <Input id="email" type="email" value={user.email || ""} disabled />
                                    <p className="text-xs text-muted-foreground">
                                        Primary email for notifications and login
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Phone Number
                                        </div>
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+61 4XX XXX XXX"
                                        value={phoneNumber}
                                        onChange={(e) => { setPhoneNumber(e.target.value); setHasUnsavedChanges(true); }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        For SMS notifications and two-factor authentication
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Role
                                        </div>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="role" value={userProfile?.role || "Loading..."} disabled className="capitalize" />
                                        <Badge variant="secondary" className="capitalize">
                                            {userProfile?.role || "User"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell us a little about yourself..."
                                        value={bio}
                                        onChange={(e) => { setBio(e.target.value); setHasUnsavedChanges(true); }}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Two-Factor Authentication
                                </div>
                            </CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <p className="font-medium">Authenticator App</p>
                                    <p className="text-sm text-muted-foreground">
                                        Use an app like Google Authenticator or Authy
                                    </p>
                                </div>
                                {twoFactorEnabled ? (
                                    <Badge variant="secondary">Enabled</Badge>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={handleEnable2FA}>
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Setup
                                    </Button>
                                )}
                            </div>

                            {twoFactorEnabled && (
                                <>
                                    <div className="p-4 border rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">Backup Codes</p>
                                            <Button variant="outline" size="sm" onClick={handleDownloadBackupCodes}>
                                                <Download className="mr-2 h-3 w-3" />
                                                Download
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {backupCodes.map((code, index) => (
                                                <code key={index} className="text-xs bg-muted p-2 rounded">
                                                    {code}
                                                </code>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Save these codes in a safe place. Each code can only be used once.
                                        </p>
                                    </div>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="text-red-600">
                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                Disable 2FA
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will make your account less secure. Are you sure you want to continue?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDisable2FA}>
                                                    Disable 2FA
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Sessions & Devices</CardTitle>
                            <CardDescription>
                                Manage devices where you&apos;re currently logged in.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Linked Devices Map Placeholder */}
                            <div className="relative h-48 bg-muted/30 rounded-lg border flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping absolute top-1/2 left-1/2" />
                                    <div className="h-3 w-3 bg-blue-500 rounded-full relative" />
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                                        <MapPin className="mr-1 h-3 w-3" /> Sydney, Australia
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Laptop className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">MacBook Pro (Current)</p>
                                            <p className="text-xs text-muted-foreground">Sydney, AU • Chrome • Just now</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Smartphone className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">iPhone 13</p>
                                            <p className="text-xs text-muted-foreground">Sydney, AU • Safari • 2h ago</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">Revoke</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Preferences
                                </div>
                            </CardTitle>
                            <CardDescription>
                                Choose how and when you want to be notified about activity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-sm font-medium mb-4">Notification Channels</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>Email Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications via email
                                            </p>
                                        </div>
                                        <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>SMS Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications via SMS
                                            </p>
                                        </div>
                                        <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>Push Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive browser push notifications
                                            </p>
                                        </div>
                                        <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <p className="text-sm font-medium mb-4">Alert Preferences</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>Stock & Inventory Alerts</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Low stock, out of stock, and restock notifications
                                            </p>
                                        </div>
                                        <Switch checked={stockAlerts} onCheckedChange={setStockAlerts} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>Maintenance Alerts</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Scheduled maintenance and urgent repairs
                                            </p>
                                        </div>
                                        <Switch checked={maintenanceAlerts} onCheckedChange={setMaintenanceAlerts} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>Order Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                New orders and order status updates
                                            </p>
                                        </div>
                                        <Switch checked={orderAlerts} onCheckedChange={setOrderAlerts} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-5 w-5" />
                                            Recent Activity
                                        </div>
                                    </CardTitle>
                                    <CardDescription>
                                        Your recent actions and changes in the system.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={activityFilter} onValueChange={setActivityFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Activity</SelectItem>
                                            <SelectItem value="machine">Machines</SelectItem>
                                            <SelectItem value="inventory">Inventory</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="settings">Settings</SelectItem>
                                            <SelectItem value="order">Orders</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="sm" onClick={handleExportActivity}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {filteredActivity.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                        <div className={`h-2 w-2 rounded-full bg-${item.color}-500 mt-2`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-4">
                                View All Activity
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab (New) */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Account Analytics
                            </CardTitle>
                            <CardDescription>Insights into your usage and activity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 border rounded-lg bg-muted/20">
                                    <p className="text-sm font-medium text-muted-foreground">Total Logins</p>
                                    <p className="text-2xl font-bold">142</p>
                                    <p className="text-xs text-green-600">+12% this month</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-muted/20">
                                    <p className="text-sm font-medium text-muted-foreground">Actions Performed</p>
                                    <p className="text-2xl font-bold">1,204</p>
                                    <p className="text-xs text-green-600">+5% this month</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-muted/20">
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Session Time</p>
                                    <p className="text-2xl font-bold">18m</p>
                                    <p className="text-xs text-muted-foreground">Same as last month</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Activity by Type</p>
                                <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div className="h-full bg-blue-500 w-[40%]" title="Machines (40%)" />
                                    <div className="h-full bg-green-500 w-[30%]" title="Inventory (30%)" />
                                    <div className="h-full bg-yellow-500 w-[20%]" title="Maintenance (20%)" />
                                    <div className="h-full bg-purple-500 w-[10%]" title="Settings (10%)" />
                                </div>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Machines</div>
                                    <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500" /> Inventory</div>
                                    <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-500" /> Maintenance</div>
                                    <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-purple-500" /> Settings</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Tab */}
                <TabsContent value="data" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Download Your Data</CardTitle>
                            <CardDescription>
                                Export all your personal data in compliance with GDPR.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Download a copy of all your personal information, including profile data, activity logs, and settings.
                            </p>
                            <Button variant="outline" onClick={handleDownloadPersonalData}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Personal Data
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions & Access</CardTitle>
                            <CardDescription>
                                View your assigned permissions and access levels.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">View Dashboard</span>
                                    <Badge variant="secondary">Granted</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Manage Inventory</span>
                                    <Badge variant="secondary">Granted</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Manage Machines</span>
                                    <Badge variant="secondary">Granted</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">View Analytics</span>
                                    <Badge variant="secondary">Granted</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Manage Team</span>
                                    <Badge variant="outline">Restricted</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">System Settings</span>
                                    <Badge variant="outline">Restricted</Badge>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                Contact your administrator to request additional permissions.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                        <CardHeader>
                            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription className="text-red-600/80 dark:text-red-400/80">
                                Irreversible actions. Proceed with extreme caution.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-red-600 dark:text-red-400">Delete Account</Label>
                                    <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                        Permanently delete your account and all associated data.
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">Delete Account</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-600">
                                                Delete Account
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
