"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { maintenanceService, auditService } from "@/services";
import { ArcadeMachine, ArcadeMachineSlot, StockItem, AuditLog, UpcomingStockItem } from "@/types";
import { useData } from "@/context/DataProvider";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/services/auditLogger";
import { where, orderBy, limit } from "firebase/firestore";

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
    Minus,
    History,
    Eye,
    RefreshCw,
    Layers,
    MapPin,
    Printer,
    FileDown,
    ListOrdered,
    Calendar,
    AlertTriangle,
    ChevronRight,
    Box
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface ItemCheckData {
    verified: boolean;
    actualQty: number | null;
    issue: string;
    slotName: string;
    itemName: string;
    systemQty: number;
    itemImage?: string;
}

interface MachineCheckData {
    checked: boolean;
    note: string;
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

// Extended slot data with resolved item info
interface SlotWithItem {
    slot: ArcadeMachineSlot;
    assignedItem: StockItem | null;
    queuedItems: UpcomingStockItem[];
}

export function StockCheckForm() {
    const { user } = useAuth();
    const { machines, items, machinesLoading, itemsLoading } = useData();
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("check");
    const printRef = useRef<HTMLDivElement>(null);

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

    // Build a map of machineId -> assigned items (from items collection)
    const itemsByMachine = useMemo(() => {
        const map: Record<string, StockItem[]> = {};
        items.forEach(item => {
            if (item.assignedMachineId) {
                if (!map[item.assignedMachineId]) {
                    map[item.assignedMachineId] = [];
                }
                map[item.assignedMachineId].push(item);
            }
        });
        return map;
    }, [items]);

    // Get replacement items
    const replacementItems = useMemo(() => {
        return items.filter(item =>
            item.assignmentType === 'Replacement' &&
            item.replacementMachines &&
            item.replacementMachines.length > 0
        );
    }, [items]);

    // Resolve slots with assigned items
    const getMachineSlotData = (machine: ArcadeMachine): SlotWithItem[] => {
        const assignedItems = itemsByMachine[machine.id] || [];

        return machine.slots.map((slot, index) => {
            // Try to get item from slot.currentItem first
            let assignedItem = slot.currentItem;

            // If no currentItem, check if we have an assigned item for this machine
            if (!assignedItem && assignedItems.length > index) {
                assignedItem = assignedItems[index];
            }

            // If still no item, check if any item has this assigned by machine level logic
            if (!assignedItem) {
                assignedItem = assignedItems.find(item =>
                    item.assignedStatus === 'Assigned'
                ) || null;
            }

            return {
                slot,
                assignedItem,
                queuedItems: slot.upcomingQueue || []
            };
        });
    };

    // Initialize states
    useEffect(() => {
        if (machines.length > 0 && Object.keys(machineChecks).length === 0) {
            const initialItemChecks: Record<string, Record<string, ItemCheckData>> = {};
            const initialMachineChecks: Record<string, MachineCheckData> = {};

            machines.forEach(m => {
                initialMachineChecks[m.id] = { checked: false, note: "" };
                initialItemChecks[m.id] = {};

                const slotData = getMachineSlotData(m);
                slotData.forEach(({ slot, assignedItem }) => {
                    initialItemChecks[m.id][slot.id] = {
                        verified: false,
                        actualQty: null,
                        issue: "",
                        slotName: slot.name,
                        itemName: assignedItem?.name || "Empty Slot",
                        systemQty: assignedItem?.quantity || 0,
                        itemImage: assignedItem?.imageUrl
                    };
                });
            });

            setItemChecks(initialItemChecks);
            setMachineChecks(initialMachineChecks);
        }
    }, [machines, items]);

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

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (activeTab === "history") {
            loadHistory();
        }
    }, [activeTab]);

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
            const report: Omit<StockCheckReport, 'id'> = {
                machineChecks,
                itemChecks,
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

            for (const [machineId, checks] of Object.entries(itemChecks)) {
                for (const [slotId, check] of Object.entries(checks)) {
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

            for (const [itemId, check] of Object.entries(replacementItemChecks)) {
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

            for (const [machineId, data] of Object.entries(machineChecks)) {
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

            toast.success(`Report submitted! ${tasksCreated} maintenance tasks created.`);

            // Reset
            const resetMachineChecks: Record<string, MachineCheckData> = {};
            const resetItemChecks: Record<string, Record<string, ItemCheckData>> = {};

            machines.forEach(m => {
                resetMachineChecks[m.id] = { checked: false, note: "" };
                resetItemChecks[m.id] = {};
                const slotData = getMachineSlotData(m);
                slotData.forEach(({ slot, assignedItem }) => {
                    resetItemChecks[m.id][slot.id] = {
                        verified: false,
                        actualQty: null,
                        issue: "",
                        slotName: slot.name,
                        itemName: assignedItem?.name || "Empty Slot",
                        systemQty: assignedItem?.quantity || 0,
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

    const handlePrint = () => {
        window.print();
    };

    if (machinesLoading || itemsLoading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
    );

    return (
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
                                placeholder="Search machines by name, location, or asset tag..."
                                className="pl-10 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Machines Grid - BIGGER Cards */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredMachines.map((machine) => {
                        const machineData = machineChecks[machine.id] || { checked: false, note: "" };
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
                                <div className="p-3 bg-muted/40 border-b flex items-center gap-3">
                                    <Checkbox
                                        checked={machineData.checked}
                                        onCheckedChange={(checked) => handleMachineCheck(machine.id, checked as boolean)}
                                        className="h-5 w-5"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{machine.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span>{machine.location}</span>
                                            <span className="text-muted-foreground/50">•</span>
                                            <span>#{machine.assetTag}</span>
                                        </div>
                                    </div>
                                    <Badge variant={verifiedCount === slotData.length ? "default" : "outline"} className="text-xs">
                                        {verifiedCount}/{slotData.length}
                                    </Badge>
                                </div>

                                {/* Slots */}
                                <div className="p-3 space-y-2">
                                    {slotData.map(({ slot, assignedItem, queuedItems }) => {
                                        const check = machineItemChecks[slot.id] || { verified: false, actualQty: null, issue: "" };
                                        const systemQty = assignedItem?.quantity || 0;

                                        return (
                                            <div
                                                key={slot.id}
                                                className={`p-3 rounded-lg border transition-all ${check.verified ? 'bg-green-50 dark:bg-green-950/30 border-green-300' : 'bg-muted/20 hover:bg-muted/40'}`}
                                            >
                                                {/* Current Item */}
                                                <div className="flex items-start gap-3">
                                                    <div className="h-12 w-12 rounded-lg bg-background border-2 flex items-center justify-center overflow-hidden shrink-0">
                                                        {assignedItem?.imageUrl ? (
                                                            <img src={assignedItem.imageUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Box className="h-6 w-6 text-muted-foreground/30" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px] shrink-0">{slot.name}</Badge>
                                                            {check.verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                        </div>
                                                        <p className="text-sm font-medium truncate mt-0.5">
                                                            {assignedItem?.name || <span className="text-muted-foreground italic">No item assigned</span>}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>Qty: <strong>{systemQty}</strong></span>
                                                            {check.actualQty !== null && getDifferenceDisplay(systemQty, check.actualQty)}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant={check.verified ? "default" : "outline"}
                                                        size="sm"
                                                        className={`h-8 w-8 p-0 shrink-0 ${check.verified ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                                        onClick={() => handleItemCheck(machine.id, slot.id, { verified: !check.verified })}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Queued Items */}
                                                {queuedItems.length > 0 && (
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
                                                        <ListOrdered className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                                        <span className="text-[10px] text-purple-600 font-medium">Queue:</span>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {queuedItems.slice(0, 4).map((queued, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="h-6 w-6 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-200 flex items-center justify-center overflow-hidden"
                                                                    title={queued.name}
                                                                >
                                                                    {queued.imageUrl ? (
                                                                        <img src={queued.imageUrl} alt="" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[8px] text-purple-600">{idx + 1}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {queuedItems.length > 4 && (
                                                                <Badge variant="secondary" className="text-[9px] h-6">+{queuedItems.length - 4}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

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
                                                        placeholder="Report issue..."
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
                        <p className="text-muted-foreground">No machines found matching your search.</p>
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
                                Submitting...
                            </>
                        ) : (
                            <>
                                <ClipboardCheck className="h-6 w-6" />
                                Submit Report ({stats.verifiedItems} items, {stats.issuesFound} issues)
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
                                                            <p className="text-sm text-muted-foreground"><span className="font-bold">{report.stats?.verifiedItems || 0}</span> items verified</p>
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
                                                            <p className="text-sm text-muted-foreground">Machines Checked</p>
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
                                                            <p className="text-sm text-muted-foreground">Issues Found</p>
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
    );
}
