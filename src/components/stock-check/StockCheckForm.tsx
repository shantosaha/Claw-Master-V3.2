"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { maintenanceService, auditService, stockService, machineService, itemMachineSettingsService } from "@/services";
import { ArcadeMachine, ArcadeMachineSlot, StockItem, UpcomingStockItem, ItemMachineSettings } from "@/types";
import { useData } from "@/context/DataProvider";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/services/auditLogger";
import { where, orderBy, limit } from "firebase/firestore";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CheckCircle2,
    AlertCircle,
    Package,
    Search,
    ClipboardCheck,
    Clock,
    User,
    TrendingUp,
    TrendingDown,
    History,
    RefreshCw,
    MapPin,
    Printer,
    FileDown,
    ListOrdered,
    Calendar,
    AlertTriangle,
    ChevronRight,
    ChevronLeft,
    Box,
    X,
    ExternalLink,
    Zap,
    ZapOff,
    Wrench,
    XCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

// Types
interface ItemCheckData {
    verified: boolean;
    actualQty: number | null;
    issue: string;
    slotName: string;
    itemName: string;
    itemId: string;
    systemQty: number;
    itemImage?: string;
}

interface MachineCheckData {
    checked: boolean;
    note: string;
    status?: 'Online' | 'Offline' | 'Maintenance' | 'Error';
}

interface StockCheckReport {
    id: string;
    machineChecks: Record<string, MachineCheckData>;
    itemChecks: Record<string, Record<string, ItemCheckData>>;
    replacementItemChecks: Record<string, ItemCheckData>;
    submittedBy: string;
    submittedByName?: string;
    timestamp: Date | string;
    stats: {
        checkedMachines: number;
        totalMachines: number;
        verifiedItems: number;
        totalItems: number;
        issuesFound: number;
    };
}

interface LastCheckInfo {
    timestamp: Date | string;
    by: string;
}

interface SlotWithItem {
    slot: ArcadeMachineSlot;
    assignedItem: StockItem | null;
    queuedItems: (UpcomingStockItem & { itemDetails?: StockItem })[];
}

// Image Lightbox Component
function ImageLightbox({
    images,
    initialIndex = 0,
    onClose,
    itemName
}: {
    images: string[];
    initialIndex?: number;
    onClose: () => void;
    itemName?: string;
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </Button>

                {/* Image */}
                <div className="flex items-center justify-center">
                    <img
                        src={images[currentIndex]}
                        alt={itemName || 'Item image'}
                        className="max-h-[80vh] max-w-full object-contain rounded-lg"
                    />
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                            onClick={goPrev}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                            onClick={goNext}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}

                {/* Item Name */}
                {itemName && (
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        {itemName}
                    </div>
                )}
            </div>
        </div>
    );
}

// Status Icon Helper
function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'Online': return <Zap className="h-4 w-4 text-green-500" />;
        case 'Offline': return <ZapOff className="h-4 w-4 text-gray-500" />;
        case 'Maintenance': return <Wrench className="h-4 w-4 text-orange-500" />;
        case 'Error': return <XCircle className="h-4 w-4 text-red-500" />;
        default: return null;
    }
}

export function StockCheckForm() {
    const { user } = useAuth();
    const { machines, items, machinesLoading, itemsLoading, refreshMachines, refreshItems } = useData();
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("check");
    const printRef = useRef<HTMLDivElement>(null);

    // Lightbox State
    const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
    const [lightboxItemName, setLightboxItemName] = useState<string>("");

    // UI State
    const [searchQuery, setSearchQuery] = useState("");

    // Check State
    const [machineChecks, setMachineChecks] = useState<Record<string, MachineCheckData>>({});
    const [itemChecks, setItemChecks] = useState<Record<string, Record<string, ItemCheckData>>>({});
    const [replacementItemChecks, setReplacementItemChecks] = useState<Record<string, ItemCheckData>>({});

    // History State
    const [history, setHistory] = useState<StockCheckReport[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [lastCheckByMachine, setLastCheckByMachine] = useState<Record<string, LastCheckInfo>>({});

    // Synced Claw Settings State (keyed by itemId-machineId)
    const [allClawSettings, setAllClawSettings] = useState<Record<string, ItemMachineSettings>>({});

    // Build maps for quick lookups
    const itemsById = useMemo(() => {
        const map: Record<string, StockItem> = {};
        items.forEach(item => { map[item.id] = item; });
        return map;
    }, [items]);

    const itemsByMachine = useMemo(() => {
        const map: Record<string, StockItem[]> = {};
        items.forEach(item => {
            if (item.assignedMachineId) {
                if (!map[item.assignedMachineId]) map[item.assignedMachineId] = [];
                map[item.assignedMachineId].push(item);
            }
        });
        return map;
    }, [items]);

    const replacementItems = useMemo(() => {
        return items.filter(item =>
            item.assignmentType === 'Replacement' &&
            item.replacementMachines &&
            item.replacementMachines.length > 0
        );
    }, [items]);

    // Resolve slots with assigned items and queued items with details
    const getMachineSlotData = (machine: ArcadeMachine): SlotWithItem[] => {
        // Get all items assigned to this machine
        const allAssignedItems = items.filter(item => item.assignedMachineId === machine.id);

        // Strategy: 
        // 1. Look for 'Using' or 'Assigned' status for current item
        // 2. Look for 'Upcoming' or 'Queue' for queue items
        // 3. Fallback: First item is current, rest are queue

        let currentItem = allAssignedItems.find(i => i.assignedStatus === 'Using' || i.assignedStatus === 'Assigned');

        // Fallback if no specific status
        if (!currentItem && allAssignedItems.length > 0) {
            currentItem = allAssignedItems[0];
        }

        const pooledQueue = allAssignedItems
            .filter(i => i.id !== currentItem?.id)
            // Optional: Sort by something if needed, e.g. assignedAt
            .map(item => ({
                itemId: item.id,
                name: item.name,
                imageUrl: item.imageUrl,
                addedBy: "System",
                addedAt: new Date(),
                itemDetails: item
            } as UpcomingStockItem & { itemDetails: StockItem }));

        // Map to slots - for now we just map to the first slot since user said "we are not using as slots"
        // But we need to maintain the visual structure of slots if they exist physically.
        // If specific slot assignment exists, use it.

        return machine.slots.map((slot, index) => {
            // If item has specific slot assignment, use it. matches slot.id
            // Otherwise if index 0, place the main machine item here.

            let slotItem = currentItem;
            // logic can be refined: check i.assignedSlotId === slot.id

            // Create a queue specific to this slot if needed, or just show the machine queue on the first slot
            const slotQueue = index === 0 ? pooledQueue : [];

            return { slot, assignedItem: index === 0 ? (currentItem || null) : null, queuedItems: slotQueue };
        });
    };

    // Get all images for an item
    const getItemImages = (item: StockItem | null): string[] => {
        if (!item) return [];
        const images: string[] = [];
        if (item.imageUrl) images.push(item.imageUrl);
        if (item.imageUrls) images.push(...item.imageUrls.filter(url => url !== item.imageUrl));
        return images;
    };

    // Open lightbox
    const openLightbox = (images: string[], name: string) => {
        if (images.length > 0) {
            setLightboxImages(images);
            setLightboxItemName(name);
        }
    };

    // Initialize states
    useEffect(() => {
        if (machines.length > 0) { // Removed items dependency to strict init
            setMachineChecks(prev => {
                const initial: Record<string, MachineCheckData> = { ...prev };
                machines.forEach(m => {
                    if (!initial[m.id]) {
                        initial[m.id] = { checked: false, note: "", status: m.status };
                    }
                });
                return initial;
            });

            setItemChecks(prev => {
                const initial: Record<string, Record<string, ItemCheckData>> = { ...prev };
                machines.forEach(m => {
                    if (!initial[m.id]) initial[m.id] = {};

                    // We initialize state structure, but actual ITEM DATA comes from render
                    m.slots.forEach(slot => {
                        if (!initial[m.id][slot.id]) {
                            initial[m.id][slot.id] = {
                                verified: false,
                                actualQty: null,
                                issue: "",
                                slotName: slot.name,
                                itemName: "", // Deprecated in state, read from live item
                                itemId: "", // Deprecated/Syncing
                                systemQty: 0, // Deprecated/Syncing
                            };
                        }
                    });
                });
                return initial;
            });
        }
    }, [machines]); // Only machines structure triggers init

    // Initialize replacement items
    useEffect(() => {
        if (replacementItems.length > 0 && Object.keys(replacementItemChecks).length === 0) {
            const initialChecks: Record<string, ItemCheckData> = {};
            replacementItems.forEach(item => {
                const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || item.quantity || 0;
                initialChecks[item.id] = {
                    verified: false,
                    actualQty: null,
                    issue: "",
                    slotName: "Storage",
                    itemName: item.name,
                    itemId: item.id,
                    systemQty: totalQty,
                    itemImage: item.imageUrl
                };
            });
            setReplacementItemChecks(initialChecks);
        }
    }, [replacementItems]);

    // Load history
    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const logs = await auditService.query(
                where("entityType", "==", "stock"),
                where("action", "==", "create"),
                orderBy("timestamp", "desc"),
                limit(50)
            );

            const reports: StockCheckReport[] = logs
                .filter(log => log.entityId.startsWith("STK-CHK-"))
                .map(log => ({
                    id: log.id,
                    ...(log.newValue as Omit<StockCheckReport, 'id'>),
                    timestamp: log.timestamp
                }));

            setHistory(reports);

            const lastChecks: Record<string, LastCheckInfo> = {};
            reports.forEach(report => {
                if (report.machineChecks) {
                    Object.keys(report.machineChecks).forEach(machineId => {
                        if (!lastChecks[machineId]) {
                            lastChecks[machineId] = {
                                timestamp: report.timestamp,
                                by: report.submittedByName || report.submittedBy
                            };
                        }
                    });
                }
            });
            setLastCheckByMachine(lastChecks);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => { loadHistory(); }, []);
    useEffect(() => { if (activeTab === "history") loadHistory(); }, [activeTab]);

    // Load all claw settings
    useEffect(() => {
        const loadClawSettings = async () => {
            try {
                const settings = await itemMachineSettingsService.getAll();
                const map: Record<string, ItemMachineSettings> = {};
                settings.forEach(s => {
                    const key = `${s.itemId}-${s.machineId}`;
                    map[key] = s;
                });
                setAllClawSettings(map);
            } catch (error) {
                console.error("Failed to load claw settings:", error);
            }
        };
        loadClawSettings();
    }, []);

    // Helper: Get claw settings for a specific item-machine pair
    const getClawSettings = (itemId: string | undefined, machineId: string): ItemMachineSettings | null => {
        if (!itemId) return null;
        return allClawSettings[`${itemId}-${machineId}`] || null;
    };

    const filteredMachines = useMemo(() => {
        return machines.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.assetTag.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [machines, searchQuery]);

    const stats = useMemo(() => {
        const totalMachines = machines.length;
        const checkedMachines = Object.values(machineChecks).filter(m => m.checked).length;

        let totalItems = 0;
        let verifiedItems = 0;
        let issuesFound = 0;

        machines.forEach(m => {
            totalItems += m.slots.length;
            if (itemChecks[m.id]) {
                Object.values(itemChecks[m.id]).forEach(check => {
                    if (check.verified) verifiedItems++;
                    if (check.issue.trim()) issuesFound++;
                });
            }
        });

        totalItems += replacementItems.length;
        Object.values(replacementItemChecks).forEach(check => {
            if (check.verified) verifiedItems++;
            if (check.issue.trim()) issuesFound++;
        });

        return {
            machinePercent: totalMachines > 0 ? (checkedMachines / totalMachines) * 100 : 0,
            itemPercent: totalItems > 0 ? (verifiedItems / totalItems) * 100 : 0,
            checkedMachines,
            totalMachines,
            verifiedItems,
            totalItems,
            issuesFound
        };
    }, [machines, machineChecks, itemChecks, replacementItems, replacementItemChecks]);

    const handleMachineCheck = (machineId: string, checked: boolean) => {
        setMachineChecks(prev => ({
            ...prev,
            [machineId]: { ...prev[machineId], checked }
        }));
    };

    const handleMachineNote = (machineId: string, note: string) => {
        setMachineChecks(prev => ({
            ...prev,
            [machineId]: { ...prev[machineId], note }
        }));
    };

    const handleMachineStatus = (machineId: string, status: 'Online' | 'Offline' | 'Maintenance' | 'Error') => {
        setMachineChecks(prev => ({
            ...prev,
            [machineId]: { ...prev[machineId], status }
        }));
    };

    const handleItemCheck = (machineId: string, slotId: string, updates: Partial<ItemCheckData>) => {
        setItemChecks(prev => ({
            ...prev,
            [machineId]: {
                ...prev[machineId],
                [slotId]: { ...prev[machineId]?.[slotId], ...updates }
            }
        }));
    };

    const handleReplacementCheck = (itemId: string, updates: Partial<ItemCheckData>) => {
        setReplacementItemChecks(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], ...updates }
        }));
    };

    const handleSubmit = async () => {
        if (!user) {
            toast.error("Please log in to submit checks");
            return;
        }

        if (stats.checkedMachines === 0 && stats.verifiedItems === 0) {
            toast.error("Please check at least one machine or verify one item");
            return;
        }

        setSubmitting(true);
        try {
            // Reconstruct full item checks with live data
            const fullItemChecks: Record<string, Record<string, ItemCheckData>> = {};

            machines.forEach(m => {
                const slotData = getMachineSlotData(m);
                fullItemChecks[m.id] = {};

                slotData.forEach(({ slot, assignedItem }) => {
                    const check = itemChecks[m.id]?.[slot.id] || { verified: false, actualQty: null, issue: "" };

                    fullItemChecks[m.id][slot.id] = {
                        verified: check.verified,
                        actualQty: check.actualQty,
                        issue: check.issue, // User input
                        slotName: slot.name,
                        itemName: assignedItem?.name || "Empty Slot", // Live data
                        itemId: assignedItem?.id || "",
                        systemQty: assignedItem?.totalQuantity || 0,
                        itemImage: assignedItem?.imageUrl
                    };
                });
            });

            const report: Omit<StockCheckReport, 'id'> = {
                machineChecks,
                itemChecks: fullItemChecks,
                replacementItemChecks,
                submittedBy: user.uid,
                submittedByName: user.displayName || user.email || "Unknown",
                timestamp: new Date(),
                stats: {
                    checkedMachines: stats.checkedMachines,
                    totalMachines: stats.totalMachines,
                    verifiedItems: stats.verifiedItems,
                    totalItems: stats.totalItems,
                    issuesFound: stats.issuesFound
                }
            };

            await logAction(
                user.uid,
                "create",
                "stock",
                "STK-CHK-" + Date.now(),
                "Submitted Comprehensive Stock Check",
                null,
                report
            );

            let tasksCreated = 0;
            let stocksUpdated = 0;
            let machinesUpdated = 0;

            // Update machine statuses
            for (const [machineId, data] of Object.entries(machineChecks)) {
                if (data.status) {
                    const machine = machines.find(m => m.id === machineId);
                    if (machine && machine.status !== data.status) {
                        try {
                            await machineService.update(machineId, { status: data.status });
                            machinesUpdated++;
                        } catch (e) {
                            console.error(`Failed to update machine ${machineId} status:`, e);
                        }
                    }
                }

                if (data.note.trim() !== "") {
                    await maintenanceService.add({
                        machineId,
                        description: `[Stock Check] General: ${data.note}`,
                        priority: "medium",
                        status: "open",
                        createdBy: user.uid,
                        createdAt: new Date(),
                    } as any);
                    tasksCreated++;
                }
            }

            // Update stock quantities and create maintenance tasks
            for (const [machineId, checks] of Object.entries(fullItemChecks)) {
                for (const [slotId, check] of Object.entries(checks)) {
                    // Update stock quantity if actual differs from system
                    if (check.actualQty !== null && check.itemId && check.actualQty !== check.systemQty) {
                        try {
                            await stockService.update(check.itemId, { quantity: check.actualQty });
                            stocksUpdated++;
                        } catch (e) {
                            console.error(`Failed to update stock ${check.itemId}:`, e);
                        }
                    }

                    if (check.issue.trim() !== "") {
                        await maintenanceService.add({
                            machineId,
                            description: `[Stock Check] ${check.slotName} - ${check.itemName}: ${check.issue}`,
                            priority: "medium",
                            status: "open",
                            createdBy: user.uid,
                            createdAt: new Date(),
                        } as any);
                        tasksCreated++;
                    }
                }
            }

            // Update replacement item quantities
            for (const [itemId, check] of Object.entries(replacementItemChecks)) {
                if (check.actualQty !== null && check.actualQty !== check.systemQty) {
                    try {
                        await stockService.update(itemId, { quantity: check.actualQty });
                        stocksUpdated++;
                    } catch (e) {
                        console.error(`Failed to update replacement stock ${itemId}:`, e);
                    }
                }

                if (check.issue.trim() !== "") {
                    await maintenanceService.add({
                        machineId: "storage",
                        description: `[Stock Check] Replacement - ${check.itemName}: ${check.issue}`,
                        priority: "medium",
                        status: "open",
                        createdBy: user.uid,
                        createdAt: new Date(),
                    } as any);
                    tasksCreated++;
                }
            }

            // Refresh data
            if (refreshMachines) refreshMachines();
            if (refreshItems) refreshItems();

            toast.success(
                `Report submitted! ${stocksUpdated} stocks updated, ${machinesUpdated} machine statuses changed, ${tasksCreated} maintenance tasks created.`
            );

            // Reset form
            const resetMachineChecks: Record<string, MachineCheckData> = {};
            const resetItemChecks: Record<string, Record<string, ItemCheckData>> = {};

            machines.forEach(m => {
                resetMachineChecks[m.id] = { checked: false, note: "", status: m.status };
                resetItemChecks[m.id] = {};
                const slotData = getMachineSlotData(m);
                slotData.forEach(({ slot, assignedItem }) => {
                    resetItemChecks[m.id][slot.id] = {
                        verified: false,
                        actualQty: null,
                        issue: "",
                        slotName: slot.name,
                        itemName: assignedItem?.name || "Empty Slot",
                        itemId: assignedItem?.id || "",
                        systemQty: assignedItem?.totalQuantity || 0,
                        itemImage: assignedItem?.imageUrl
                    };
                });
            });

            setMachineChecks(resetMachineChecks);
            setItemChecks(resetItemChecks);

            const resetReplacementChecks: Record<string, ItemCheckData> = {};
            replacementItems.forEach(item => {
                const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || item.quantity || 0;
                resetReplacementChecks[item.id] = {
                    verified: false,
                    actualQty: null,
                    issue: "",
                    slotName: "Storage",
                    itemName: item.name,
                    itemId: item.id,
                    systemQty: totalQty,
                    itemImage: item.imageUrl
                };
            });
            setReplacementItemChecks(resetReplacementChecks);

            loadHistory();

        } catch (error) {
            console.error("Failed to submit stock check:", error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getDifferenceDisplay = (systemQty: number, actualQty: number | null) => {
        if (actualQty === null) return null;
        const diff = actualQty - systemQty;
        if (diff === 0) return <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Match</Badge>;
        if (diff > 0) return <Badge className="text-[10px] bg-blue-100 text-blue-700">+{diff}</Badge>;
        return <Badge variant="destructive" className="text-[10px]">{diff}</Badge>;
    };

    const handlePrint = () => window.print();

    if (machinesLoading || itemsLoading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
    );

    return (
        <>
            {/* Image Lightbox */}
            {lightboxImages && (
                <ImageLightbox
                    images={lightboxImages}
                    itemName={lightboxItemName}
                    onClose={() => setLightboxImages(null)}
                />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="check" className="gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Stock Check
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="check" className="space-y-4">
                    {/* Progress Card */}
                    <Card className="shadow-sm border-primary/10 bg-gradient-to-br from-background via-background to-primary/5">
                        <CardContent className="p-4 space-y-3">
                            <div className="grid gap-3 grid-cols-3">
                                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                                    <p className="text-3xl font-bold text-green-600">{stats.checkedMachines}</p>
                                    <p className="text-xs text-muted-foreground">Machines</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                                    <p className="text-3xl font-bold text-blue-600">{stats.verifiedItems}</p>
                                    <p className="text-xs text-muted-foreground">Items Verified</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                                    <p className="text-3xl font-bold text-orange-600">{stats.issuesFound}</p>
                                    <p className="text-xs text-muted-foreground">Issues</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search machines..."
                                    className="pl-10 h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Machines Grid */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredMachines.map((machine) => {
                            const machineData = machineChecks[machine.id] || { checked: false, note: "", status: machine.status };
                            const machineItemChecks = itemChecks[machine.id] || {};
                            const lastCheck = lastCheckByMachine[machine.id];
                            const verifiedCount = Object.values(machineItemChecks).filter(v => v.verified).length;
                            const slotData = getMachineSlotData(machine);

                            return (
                                <Card
                                    key={machine.id}
                                    className={`overflow-hidden transition-all hover:shadow-lg ${machineData.checked ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/30' : ''}`}
                                >
                                    {/* Header */}
                                    <div className="p-3 bg-muted/40 border-b">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Checkbox
                                                checked={machineData.checked}
                                                onCheckedChange={(checked) => handleMachineCheck(machine.id, checked as boolean)}
                                                className="h-5 w-5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/machines/${machine.id}`}
                                                    className="text-sm font-bold truncate hover:underline hover:text-primary flex items-center gap-1"
                                                >
                                                    {machine.name}
                                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                                </Link>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{machine.location}</span>
                                                    <span className="text-muted-foreground/50">•</span>
                                                    <span>#{machine.assetTag}</span>
                                                </div>
                                            </div>
                                            <Badge variant={verifiedCount === slotData.length ? "default" : "outline"} className="text-xs shrink-0">
                                                {verifiedCount}/{slotData.length}
                                            </Badge>
                                        </div>

                                        {/* Status Dropdown */}
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground">Status:</Label>
                                            <Select
                                                value={machineData.status || machine.status}
                                                onValueChange={(val) => handleMachineStatus(machine.id, val as any)}
                                            >
                                                <SelectTrigger className="h-7 text-xs flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Online">
                                                        <div className="flex items-center gap-2"><Zap className="h-3 w-3 text-green-500" /> Online</div>
                                                    </SelectItem>
                                                    <SelectItem value="Offline">
                                                        <div className="flex items-center gap-2"><ZapOff className="h-3 w-3 text-gray-500" /> Offline</div>
                                                    </SelectItem>
                                                    <SelectItem value="Maintenance">
                                                        <div className="flex items-center gap-2"><Wrench className="h-3 w-3 text-orange-500" /> Maintenance</div>
                                                    </SelectItem>
                                                    <SelectItem value="Error">
                                                        <div className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" /> Error</div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Slots */}
                                    <div className="p-3 space-y-2">
                                        {slotData.map(({ slot, assignedItem, queuedItems }) => {
                                            const check = machineItemChecks[slot.id] || { verified: false, actualQty: null, issue: "" };
                                            const systemQty = assignedItem?.totalQuantity || 0;
                                            const itemImages = getItemImages(assignedItem);

                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={`p-3 rounded-lg border transition-all ${check.verified ? 'bg-green-50 dark:bg-green-950/30 border-green-300' : 'bg-muted/20 hover:bg-muted/40'}`}
                                                >
                                                    {/* Current Item */}
                                                    <div className="flex items-start gap-3">
                                                        {/* Clickable Image */}
                                                        <div
                                                            className={`h-14 w-14 rounded-lg bg-background border-2 flex items-center justify-center overflow-hidden shrink-0 ${itemImages.length > 0 ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}`}
                                                            onClick={() => openLightbox(itemImages, assignedItem?.name || 'Item')}
                                                        >
                                                            {assignedItem?.imageUrl ? (
                                                                <img src={assignedItem.imageUrl} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Box className="h-6 w-6 text-muted-foreground/30" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <Badge variant="outline" className="text-[10px] shrink-0">{slot.name}</Badge>
                                                                {check.verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                            </div>
                                                            {/* Clickable Item Name */}
                                                            {assignedItem ? (
                                                                <Link
                                                                    href={`/inventory/${assignedItem.id}`}
                                                                    className="text-sm font-medium truncate hover:underline hover:text-primary flex items-center gap-1"
                                                                >
                                                                    {assignedItem.name}
                                                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                                                </Link>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground italic">No item assigned</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span>Qty: <strong className="text-foreground">{systemQty}</strong></span>
                                                                {check.actualQty !== null && getDifferenceDisplay(systemQty, check.actualQty)}
                                                            </div>
                                                            {/* Synced Claw Settings */}
                                                            {(() => {
                                                                const settings = getClawSettings(assignedItem?.id, machine.id);
                                                                if (!settings) return null;
                                                                return (
                                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                                                                        <span>C1:{settings.c1}</span>
                                                                        <span>C2:{settings.c2}</span>
                                                                        <span>C3:{settings.c3}</span>
                                                                        <span>C4:{settings.c4}</span>
                                                                        <span className="text-foreground font-medium">P:{settings.playPerWin}</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <Button
                                                            variant={check.verified ? "default" : "outline"}
                                                            size="sm"
                                                            className={`h-10 w-10 p-0 shrink-0 ${check.verified ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                                            onClick={() => handleItemCheck(machine.id, slot.id, { verified: !check.verified })}
                                                        >
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>

                                                    {/* Upcoming Queue - Always Show */}
                                                    <div className="mt-2 pt-2 border-t border-dashed">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <ListOrdered className="h-3.5 w-3.5 text-purple-500" />
                                                            <span className="text-[10px] text-purple-600 font-medium">Upcoming Queue:</span>
                                                        </div>
                                                        {queuedItems.length === 0 ? (
                                                            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded text-muted-foreground">
                                                                <Box className="h-4 w-4 opacity-40" />
                                                                <span className="text-[10px] italic">No Upcoming</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                {queuedItems.slice(0, 2).map((queued, idx) => {
                                                                    const queuedItemFull = queued.itemDetails;
                                                                    const queuedImages = queuedItemFull ? getItemImages(queuedItemFull) : [];
                                                                    const positionLabel = idx === 0 ? '1st in line' : '2nd in line';

                                                                    return (
                                                                        <div key={idx} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg px-2 py-1.5 border border-purple-200">
                                                                            {/* Position Badge */}
                                                                            <Badge variant="secondary" className="text-[9px] bg-purple-100 text-purple-700 shrink-0">
                                                                                {positionLabel}
                                                                            </Badge>
                                                                            {/* Clickable Image */}
                                                                            <div
                                                                                className={`h-8 w-8 rounded overflow-hidden shrink-0 border ${queuedImages.length > 0 ? 'cursor-pointer hover:ring-2 hover:ring-purple-500' : ''}`}
                                                                                onClick={() => queuedImages.length > 0 && openLightbox(queuedImages, queued.name)}
                                                                            >
                                                                                {queued.imageUrl || queuedItemFull?.imageUrl ? (
                                                                                    <img src={queued.imageUrl || queuedItemFull?.imageUrl} alt="" className="h-full w-full object-cover" />
                                                                                ) : (
                                                                                    <div className="h-full w-full bg-purple-200 flex items-center justify-center">
                                                                                        <Box className="h-4 w-4 text-purple-400" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {/* Item Details */}
                                                                            <div className="flex-1 min-w-0">
                                                                                {queuedItemFull ? (
                                                                                    <Link
                                                                                        href={`/inventory/${queuedItemFull.id}`}
                                                                                        className="text-xs font-medium truncate hover:underline text-purple-700 flex items-center gap-1"
                                                                                    >
                                                                                        {queued.name}
                                                                                        <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                                                                    </Link>
                                                                                ) : (
                                                                                    <span className="text-xs font-medium truncate text-purple-700 block">{queued.name}</span>
                                                                                )}
                                                                                <span className="text-[10px] text-purple-500">Qty: <strong>{queuedItemFull?.totalQuantity || 0}</strong></span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {queuedItems.length > 2 && (
                                                                    <div className="text-center">
                                                                        <Badge variant="outline" className="text-[9px] text-purple-600 border-purple-300">
                                                                            +{queuedItems.length - 2} more in queue
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Qty & Issue Inputs */}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex items-center gap-1 flex-1">
                                                            <Label className="text-[10px] text-muted-foreground shrink-0">Actual:</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                className="h-7 text-xs"
                                                                value={check.actualQty ?? ""}
                                                                onChange={(e) => handleItemCheck(machine.id, slot.id, {
                                                                    actualQty: e.target.value ? parseInt(e.target.value) : null
                                                                })}
                                                            />
                                                        </div>
                                                        <Input
                                                            placeholder="Add stock note"
                                                            className="h-7 text-xs flex-1"
                                                            value={check.issue || ""}
                                                            onChange={(e) => handleItemCheck(machine.id, slot.id, { issue: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Machine Note */}
                                        <Input
                                            placeholder="Add machine note..."
                                            className="h-8 text-xs"
                                            value={machineData.note}
                                            onChange={(e) => handleMachineNote(machine.id, e.target.value)}
                                        />
                                    </div>

                                    {/* Last Checked Footer */}
                                    {lastCheck && (
                                        <div className="px-3 py-2 bg-muted/50 border-t text-xs text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>
                                                Last: {formatDistanceToNow(typeof lastCheck.timestamp === 'string' ? new Date(lastCheck.timestamp) : lastCheck.timestamp, { addSuffix: true })}
                                            </span>
                                            <span className="text-muted-foreground/50">•</span>
                                            <span className="truncate">by {lastCheck.by}</span>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {filteredMachines.length === 0 && (
                        <div className="text-center p-12 bg-muted/20 rounded-lg border-2 border-dashed">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground">No machines found.</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 flex justify-center z-20">
                        <Button
                            size="lg"
                            className="w-full max-w-lg shadow-2xl gap-2 font-bold h-14 rounded-full text-base"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    Submitting & Updating...
                                </>
                            ) : (
                                <>
                                    <ClipboardCheck className="h-6 w-6" />
                                    Submit & Update ({stats.verifiedItems} items, {stats.issuesFound} issues)
                                </>
                            )}
                        </Button>
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4 pb-20">
                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Stock Check History
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={loadHistory} disabled={historyLoading}>
                                <RefreshCw className={`h-4 w-4 mr-1 ${historyLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No reports found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {history.map(report => {
                                        const timestamp = typeof report.timestamp === 'string'
                                            ? new Date(report.timestamp)
                                            : report.timestamp;

                                        return (
                                            <Dialog key={report.id}>
                                                <DialogTrigger asChild>
                                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <ClipboardCheck className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium">Stock Check Report</p>
                                                                    {report.stats?.issuesFound > 0 && (
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            {report.stats.issuesFound} issues
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {format(timestamp, "MMM d, yyyy h:mm a")}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="h-3 w-3" />
                                                                        {report.submittedByName || report.submittedBy}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-sm"><span className="font-bold text-lg">{report.stats?.checkedMachines || 0}</span> machines</p>
                                                                <p className="text-sm text-muted-foreground"><span className="font-bold">{report.stats?.verifiedItems || 0}</span> items</p>
                                                            </div>
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </DialogTrigger>

                                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                                    <DialogHeader className="pb-2">
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <ClipboardCheck className="h-5 w-5 text-primary" />
                                                            Stock Check Report Details
                                                        </DialogTitle>
                                                    </DialogHeader>

                                                    <div ref={printRef} className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:max-h-none">
                                                        {/* Stats Grid */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 print:grid-cols-4">
                                                            <div className="p-4 rounded-lg bg-primary/10 text-center">
                                                                <p className="text-3xl font-bold text-primary">{report.stats?.checkedMachines || 0}</p>
                                                                <p className="text-sm text-muted-foreground">Machines</p>
                                                            </div>
                                                            <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center">
                                                                <p className="text-3xl font-bold text-blue-600">{report.stats?.verifiedItems || 0}</p>
                                                                <p className="text-sm text-muted-foreground">Items Verified</p>
                                                            </div>
                                                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                                                <p className="text-3xl font-bold">{report.stats?.totalItems || 0}</p>
                                                                <p className="text-sm text-muted-foreground">Total Items</p>
                                                            </div>
                                                            <div className="p-4 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-center">
                                                                <p className="text-3xl font-bold text-orange-600">{report.stats?.issuesFound || 0}</p>
                                                                <p className="text-sm text-muted-foreground">Issues</p>
                                                            </div>
                                                        </div>

                                                        {/* Meta */}
                                                        <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-lg bg-muted/30">
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Submitted By</Label>
                                                                <p className="font-medium text-lg">{report.submittedByName || report.submittedBy}</p>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Date & Time</Label>
                                                                <p className="font-medium text-lg">{format(timestamp, "EEEE, MMMM d, yyyy")}</p>
                                                                <p className="text-sm text-muted-foreground">{format(timestamp, "h:mm a")}</p>
                                                            </div>
                                                        </div>

                                                        <Separator className="my-4" />

                                                        {/* Item Checks Table */}
                                                        {report.itemChecks && Object.keys(report.itemChecks).length > 0 && (
                                                            <div className="mb-4">
                                                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                                    <Package className="h-5 w-5" />
                                                                    Item Verification Details
                                                                </h3>
                                                                <div className="rounded-lg border overflow-hidden">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow className="bg-muted/50">
                                                                                <TableHead>Slot / Item</TableHead>
                                                                                <TableHead className="text-center w-20">System</TableHead>
                                                                                <TableHead className="text-center w-20">Actual</TableHead>
                                                                                <TableHead className="text-center w-20">Diff</TableHead>
                                                                                <TableHead className="text-center w-20">Status</TableHead>
                                                                                <TableHead>Issue</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {Object.entries(report.itemChecks).flatMap(([machineId, slots]) =>
                                                                                Object.entries(slots).map(([slotId, check]) => {
                                                                                    const diff = check.actualQty !== null ? check.actualQty - check.systemQty : null;
                                                                                    return (
                                                                                        <TableRow key={`${machineId}-${slotId}`}>
                                                                                            <TableCell>
                                                                                                <span className="font-medium">{check.slotName}</span>
                                                                                                <br />
                                                                                                <span className="text-sm text-muted-foreground">{check.itemName}</span>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-center font-medium">{check.systemQty}</TableCell>
                                                                                            <TableCell className="text-center">
                                                                                                {check.actualQty !== null ? check.actualQty : "-"}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-center">
                                                                                                {diff !== null && (
                                                                                                    <Badge variant={diff === 0 ? "secondary" : diff > 0 ? "default" : "destructive"}>
                                                                                                        {diff === 0 ? "✓" : diff > 0 ? `+${diff}` : diff}
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-center">
                                                                                                {check.verified ? (
                                                                                                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                                                                                ) : (
                                                                                                    <span className="text-muted-foreground">-</span>
                                                                                                )}
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                {check.issue ? (
                                                                                                    <span className="text-red-600 flex items-center gap-1">
                                                                                                        <AlertTriangle className="h-4 w-4" />
                                                                                                        {check.issue}
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="text-muted-foreground">-</span>
                                                                                                )}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Machine Notes */}
                                                        {report.machineChecks && Object.entries(report.machineChecks).some(([_, d]) => d.note) && (
                                                            <div>
                                                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                                    <AlertCircle className="h-5 w-5" />
                                                                    Machine Notes
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    {Object.entries(report.machineChecks)
                                                                        .filter(([_, d]) => d.note)
                                                                        .map(([machineId, data]) => (
                                                                            <div key={machineId} className="p-3 rounded-lg bg-muted/50">
                                                                                <span className="font-medium">{machineId}:</span> {data.note}
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <DialogFooter className="pt-4 border-t gap-2 print:hidden">
                                                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                                                            <FileDown className="h-4 w-4" />
                                                            Save as PDF
                                                        </Button>
                                                        <Button onClick={handlePrint} className="gap-2">
                                                            <Printer className="h-4 w-4" />
                                                            Print Report
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
