"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";
import { machineService, stockService, settingsService } from "@/services";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ManageStockModal } from "./ManageStockModal";
import {
    Camera, RefreshCw, Image as ImageIcon, ChevronsUpDown,
    Package, Upload, X, Check
} from "lucide-react";
import { where, orderBy, limit } from "firebase/firestore";
import { toast } from "sonner";

const LOCATIONS = ["Ground", "Basement", "Level-1"];
const TYPES = [
    "Trend Catcher", "Trend Box", "SKWEB", "INNIS",
    "Doll Castle", "Doll House", "Giant Claw",
    "Crazy Toy Nano", "Crazy Star", "Crazy Toy Miya"
];

// Location code mappings for machine ID generation
const LOCATION_CODES: Record<string, string> = {
    "Ground": "gnd",
    "Basement": "bmt",
    "Level-1": "lv1",
    "Level-2": "lv2",
    "Level-3": "lv3",
    "Arcade Floor": "arc",
    "Storage": "str",
    "Warehouse": "whs",
    "Repair Shop": "rep",
};

// Type code mappings for machine ID generation
const TYPE_CODES: Record<string, string> = {
    "Trend Catcher": "tc",
    "Trend Box": "tb",
    "SKWEB": "sk",
    "INNIS": "in",
    "Doll Castle": "dc",
    "Doll House": "dh",
    "Giant Claw": "gc",
    "Crazy Toy Nano": "ctn",
    "Crazy Star": "cs",
    "Crazy Toy Miya": "ctm",
};

// Slot suffix codes for machine ID
const SLOT_CODES: Record<string, string> = {
    "P1": "p1",
    "P2": "p2",
    "P3": "p3",
    "P4": "p4",
    "Left": "l",
    "Right": "r",
    "Top": "t",
    "Bottom": "b",
    "": "m", // Main/single slot
};

// Generate a random 4-digit number
const generateAssetTag = () => {
    return String(Math.floor(1000 + Math.random() * 9000));
};

/**
 * Generate a structured, human-readable machine ID
 * Format: mac_{location}_{type}_{number}_{slot}
 * Example: mac_gnd_tc_01_p1 (Ground floor, Trend Catcher, #01, Player 1)
 */
const generateMachineId = (
    location: string,
    type: string,
    slotSuffix: string = "",
    existingMachines: { id: string }[] = []
): string => {
    // Get location code (default to first 3 chars lowercase if not mapped)
    const locCode = LOCATION_CODES[location] || location.substring(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Get type code (default to first 2 chars of each word if not mapped)
    let typeCode = TYPE_CODES[type];
    if (!typeCode && type) {
        // Generate code from type name: take first letter of each word
        typeCode = type
            .split(/\s+/)
            .map(word => word.charAt(0).toLowerCase())
            .join('')
            .substring(0, 3);
    }
    typeCode = typeCode || 'un'; // 'un' for unknown

    // Get slot code
    const slotCode = SLOT_CODES[slotSuffix] || slotSuffix.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 2) || 'm';

    // Find the next available number for this location+type+slot combo
    const prefix = `mac_${locCode}_${typeCode}_`;
    const suffix = `_${slotCode}`;

    // Find existing machines with similar IDs to determine next number
    const existingNumbers = existingMachines
        .map(m => m.id)
        .filter(id => id.startsWith(prefix) && id.endsWith(suffix))
        .map(id => {
            // Extract number from ID like mac_gnd_tc_01_p1
            const match = id.match(new RegExp(`${prefix}(\\d+)${suffix}`));
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const paddedNumber = String(nextNumber).padStart(2, '0');

    return `mac_${locCode}_${typeCode}_${paddedNumber}_${slotCode}`;
};

/**
 * Generate a slot ID based on machine ID
 * Format: slot_{location}_{type}_{number}_{slot}
 * Example: slot_gnd_tc_01_p1
 */
const generateSlotId = (machineId: string): string => {
    // Replace 'mac_' prefix with 'slot_'
    return machineId.replace(/^mac_/, 'slot_');
};

// Get slot count based on config
const getSlotCount = (config: string): number => {
    switch (config) {
        case "multi_4_slot": return 4;
        case "dual_module": return 2;
        case "multi_dual_stack": return 2;
        default: return 1;
    }
};

// Get slot suffixes based on config
const getSlotSuffixes = (config: string): string[] => {
    switch (config) {
        case "multi_4_slot": return ["P1", "P2", "P3", "P4"];
        case "dual_module": return ["Left", "Right"];
        case "multi_dual_stack": return ["Top", "Bottom"];
        default: return [""];
    }
};

// Generate slot name with machine name
const generateSlotName = (machineName: string, config: string, index: number): string => {
    const suffixes = getSlotSuffixes(config);
    const suffix = suffixes[index] || `P${index + 1}`;
    if (config === "single" || !suffix) {
        return machineName;
    }
    return `${machineName} ${suffix}`;
};

const machineSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    assetTag: z.string().optional(),
    location: z.string().min(1, "Location is required"),
    customLocation: z.string().optional(),
    status: z.enum(["Online", "Offline", "Maintenance", "Error"]),
    physicalConfig: z.enum(["single", "multi_4_slot", "dual_module", "multi_dual_stack"]),
    group: z.string().optional(),
    customGroup: z.string().optional(),
    prizeSize: z.string().optional(),
    notes: z.string().optional(),
    tag: z.string().optional(),
    subGroup: z.string().optional(),
    assetTagMode: z.enum(["shared", "separate"]).optional(),
    playfield: z.object({
        c1: z.coerce.number().optional(),
        c2: z.coerce.number().optional(),
        c3: z.coerce.number().optional(),
        c4: z.coerce.number().optional(),
        payoutRate: z.coerce.number().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.location === 'custom') {
        if (!data.customLocation || data.customLocation.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Custom location is required",
                path: ["customLocation"]
            });
        }
    }
    if (data.group === 'custom') {
        if (!data.customGroup || data.customGroup.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Custom type is required",
                path: ["customGroup"]
            });
        }
    }
});

interface AddMachineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    machineToEdit?: ArcadeMachine | null;
}

export function AddMachineDialog({ open, onOpenChange, onSuccess, machineToEdit }: AddMachineDialogProps) {
    const { user } = useAuth();
    const { machines, items: stockItems, refreshMachines, refreshItems } = useData();
    const [loading, setLoading] = useState(false);

    // Photo states
    const [cameraOpen, setCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Advanced section
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // Stock assignment modal state
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

    // Temporary machine for stock assignment (used during creation)
    const [tempMachine, setTempMachine] = useState<ArcadeMachine | null>(null);

    // Per-slot sizes (key is slot index)
    const [slotSizes, setSlotSizes] = useState<Record<number, string>>({});

    const form = useForm<any>({
        resolver: zodResolver(machineSchema),
        defaultValues: {
            name: "",
            assetTag: "",
            location: "",
            customLocation: "",
            status: "Online",
            physicalConfig: "single",
            group: "",
            customGroup: "",
            prizeSize: "",
            notes: "",
            tag: "",
            subGroup: "",
            assetTagMode: "shared",
            playfield: { c1: 0, c2: 0, c3: 0, c4: 0, payoutRate: 0 }
        },
    });

    const watchedLocation = form.watch("location");
    const watchedGroup = form.watch("group");
    const watchedConfig = form.watch("physicalConfig");
    const watchedName = form.watch("name");
    const watchedPrizeSize = form.watch("prizeSize");

    const slotCount = getSlotCount(watchedConfig);
    const slotSuffixes = getSlotSuffixes(watchedConfig);
    const isMultiSlot = slotCount > 1;

    // Camera Logic
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraOpen(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setCameraOpen(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Generate slots with proper names
    const generateSlots = (config: string, machineName: string): ArcadeMachineSlot[] => {
        const suffixes = getSlotSuffixes(config);
        const baseSlot = {
            gameType: "Standard",
            status: "online" as const,
            currentItem: null,
            upcomingQueue: [],
            stockLevel: "Out of Stock" as const,
        };

        if (config === "single") {
            return [{
                ...baseSlot,
                id: `slot-${Date.now()}-main`,
                name: "Main",
            }];
        }

        return suffixes.map((suffix, i) => ({
            ...baseSlot,
            id: `slot-${Date.now()}-${i}`,
            name: suffix, // Store just the suffix, display will combine with machine name
        }));
    };

    // Create a temporary machine object for the ManageStockModal
    const createTempMachineForSlot = (slotIndex: number): ArcadeMachine => {
        const machineName = watchedName || "New Machine";

        // If we already have a temp machine with slots, use those slot IDs
        const existingSlots = tempMachine?.slots || [];

        // Generate base slots only if we don't have existing slots or slot count changed
        const slotCount = getSlotCount(watchedConfig);
        const suffixes = getSlotSuffixes(watchedConfig);

        // Create or reuse slots with stable IDs
        const baseTimestamp = tempMachine?.id?.replace('temp-', '') || String(Date.now());

        const mergedSlots: ArcadeMachineSlot[] = suffixes.map((suffix, i) => {
            // Try to reuse existing slot if available
            const existing = existingSlots[i];
            const slotSize = slotSizes[i] || watchedPrizeSize;

            // Use existing slot ID or generate a stable one based on index
            const slotId = existing?.id || `slot-${baseTimestamp}-${i}`;
            const slotName = watchedConfig === 'single' && i === 0 ? 'Main' : suffix;

            return {
                id: slotId,
                name: slotName,
                gameType: existing?.gameType || "Standard",
                status: existing?.status || "online" as const,
                currentItem: existing?.currentItem || null,
                upcomingQueue: existing?.upcomingQueue || [],
                stockLevel: existing?.stockLevel || "Out of Stock" as const,
                size: slotSize,
            };
        });

        return {
            id: tempMachine?.id || `temp-${baseTimestamp}`,
            assetTag: form.getValues("assetTag") || generateAssetTag(),
            name: machineName,
            location: form.getValues("location") === "custom"
                ? form.getValues("customLocation")
                : form.getValues("location"),
            physicalConfig: watchedConfig as any,
            status: "Online",
            slots: mergedSlots,
            createdAt: new Date(),
            updatedAt: new Date(),
            prizeSize: watchedPrizeSize,
        };
    };

    // Open stock modal for a specific slot
    const openStockModalForSlot = (slotIndex: number) => {
        const machine = machineToEdit || createTempMachineForSlot(slotIndex);
        setTempMachine(machine);
        setActiveSlotIndex(slotIndex);
        setIsStockModalOpen(true);
    };

    // Handle stock modal close - update temp machine with any changes
    const handleStockModalClose = (isOpen: boolean) => {
        setIsStockModalOpen(isOpen);
        if (!isOpen && machineToEdit) {
            // Refresh the temp machine state from context if needed
            refreshMachines();
            refreshItems();
        }
    };

    // Handle stock selection from modal (for new machines that don't exist in Firestore yet)
    const handleStockSelected = (slotId: string, item: StockItem, mode: 'current' | 'replace') => {
        // Find slot index by slotId
        const currentMachine = tempMachine || createTempMachineForSlot(0);
        const slotIndex = currentMachine.slots.findIndex(s => s.id === slotId);

        if (slotIndex === -1) return;

        // Update the temp machine with the selected stock
        const updatedSlots = [...currentMachine.slots];

        if (mode === 'current') {
            updatedSlots[slotIndex] = {
                ...updatedSlots[slotIndex],
                currentItem: item,
            };
        } else {
            // Add to queue
            const newQueueItem = {
                itemId: item.id,
                name: item.name,
                sku: item.sku,
                imageUrl: item.imageUrl,
                addedBy: user?.uid || 'system',
                addedAt: new Date()
            };
            updatedSlots[slotIndex] = {
                ...updatedSlots[slotIndex],
                upcomingQueue: [...(updatedSlots[slotIndex].upcomingQueue || []), newQueueItem] as any,
            };
        }

        setTempMachine({
            ...currentMachine,
            slots: updatedSlots,
        });
    };

    // Get display name for slot
    const getSlotDisplayName = (slotIndex: number): string => {
        const machineName = watchedName || "Machine";
        const suffix = slotSuffixes[slotIndex];
        if (watchedConfig === "single" || !suffix) {
            return machineName;
        }
        return `${machineName} ${suffix}`;
    };

    // Get current item for a slot (from temp machine or editing machine)
    const getSlotCurrentItem = (slotIndex: number): StockItem | null => {
        const machine = machineToEdit || tempMachine;
        if (!machine || !machine.slots[slotIndex]) return null;
        return machine.slots[slotIndex].currentItem as StockItem | null;
    };

    // Cleanup camera on close and reset form
    useEffect(() => {
        if (open) {
            if (machineToEdit) {
                const isCustomLocation = !LOCATIONS.includes(machineToEdit.location);
                const isCustomType = machineToEdit.type && !TYPES.includes(machineToEdit.type);

                // Fetch existing playfield settings
                const fetchSettings = async () => {
                    try {
                        const settingsData = await settingsService.query(
                            where("machineId", "==", machineToEdit.id),
                            orderBy("timestamp", "desc"),
                            limit(1)
                        );
                        if (settingsData.length > 0) {
                            const latest = settingsData[0];
                            form.setValue("playfield", {
                                c1: (latest.c1 ?? latest.strengthSetting) || 0,
                                c2: latest.c2 || 0,
                                c3: latest.c3 || 0,
                                c4: latest.c4 || 0,
                                payoutRate: (latest.payoutRate ?? latest.payoutPercentage) || 0,
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching settings", e);
                    }
                };
                fetchSettings();

                form.reset({
                    name: machineToEdit.name,
                    assetTag: machineToEdit.assetTag,
                    location: isCustomLocation ? "custom" : machineToEdit.location,
                    customLocation: isCustomLocation ? machineToEdit.location : "",
                    status: machineToEdit.status,
                    physicalConfig: machineToEdit.physicalConfig as any,
                    group: isCustomType ? "custom" : machineToEdit.type,
                    customGroup: isCustomType ? machineToEdit.type : "",
                    prizeSize: machineToEdit.prizeSize || "",
                    notes: machineToEdit.notes || "",
                    tag: machineToEdit.tag || "",
                    subGroup: machineToEdit.subGroup || "",
                    assetTagMode: "shared",
                });
                setCapturedImage(machineToEdit.imageUrl || null);
                setTempMachine(null);

                // Load existing slot sizes from machine
                const existingSlotSizes: Record<number, string> = {};
                machineToEdit.slots.forEach((slot, i) => {
                    if (slot.size) existingSlotSizes[i] = slot.size;
                });
                setSlotSizes(existingSlotSizes);
            } else {
                form.reset({
                    name: "",
                    assetTag: "",
                    location: "",
                    customLocation: "",
                    status: "Online",
                    physicalConfig: "single",
                    group: "",
                    customGroup: "",
                    prizeSize: "",
                    notes: "",
                    tag: "",
                    subGroup: "",
                    assetTagMode: "shared",
                    playfield: { c1: 0, c2: 0, c3: 0, c4: 0, payoutRate: 0 }
                });
                setCapturedImage(null);
                setTempMachine(null);
                setSlotSizes({});
            }
            setActiveSlotIndex(0);
        } else {
            stopCamera();
            setCapturedImage(null);
            setIsAdvancedOpen(false);
            setTempMachine(null);
            setSlotSizes({});
        }
    }, [open, machineToEdit, form]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const finalLocation = data.location === 'custom' ? data.customLocation! : data.location;
            const finalType = data.group === 'custom' ? data.customGroup! : data.group;
            const finalAssetTag = data.assetTag?.trim() || generateAssetTag();

            let machineId = machineToEdit?.id;
            const commonData = {
                name: data.name,
                assetTag: finalAssetTag,
                location: finalLocation,
                status: data.status,
                physicalConfig: data.physicalConfig,
                type: finalType,
                prizeSize: data.prizeSize,
                notes: data.notes,
                tag: data.tag,
                subGroup: data.subGroup,
                imageUrl: capturedImage || undefined,
                updatedAt: new Date(),
            };

            if (machineToEdit) {
                await machineService.update(machineToEdit.id, commonData);
                machineId = machineToEdit.id;

                await logAction(
                    user?.uid || "system",
                    "update",
                    "machine",
                    machineToEdit.id,
                    `Updated machine: ${data.name}`,
                    { original: machineToEdit },
                    { updated: commonData }
                );
            } else {
                // Check if this is a multi-slot configuration
                const isMultiSlotConfig = getSlotCount(data.physicalConfig) > 1;

                if (isMultiSlotConfig) {
                    // MULTI-SLOT: Always create separate machines for each slot
                    // The only difference between "shared" and "separate" is the asset tag
                    const suffixes = getSlotSuffixes(data.physicalConfig);
                    const createdMachineIds: string[] = [];

                    // For shared mode, use one asset tag for all
                    // For separate mode, generate sequential tags (e.g., 1001, 1002, 1003, 1004)
                    const baseAssetTag = data.assetTag?.trim() || generateAssetTag();
                    const isSharedMode = data.assetTagMode === 'shared';

                    for (let i = 0; i < suffixes.length; i++) {
                        const suffix = suffixes[i];

                        // Shared mode: all use the same asset tag
                        // Separate mode: sequential tags based on base (1001, 1002, 1003...)
                        let slotAssetTag: string;
                        if (isSharedMode) {
                            slotAssetTag = baseAssetTag;
                        } else {
                            // Parse base tag as number and add index, or append index if not numeric
                            const baseNum = parseInt(baseAssetTag, 10);
                            if (!isNaN(baseNum)) {
                                slotAssetTag = String(baseNum + i);
                            } else {
                                // If not a number, append suffix like "TAG-1", "TAG-2"
                                slotAssetTag = `${baseAssetTag}-${i + 1}`;
                            }
                        }

                        const slotMachineName = `${data.name} ${suffix}`;

                        // Generate structured machine ID
                        // Combine existing machines with already created ones in this batch
                        const allExistingMachines = [
                            ...machines,
                            ...createdMachineIds.map(id => ({ id }))
                        ];
                        const newMachineId = generateMachineId(
                            finalLocation,
                            finalType,
                            suffix,
                            allExistingMachines
                        );

                        // Generate structured slot ID based on machine ID
                        const slotId = generateSlotId(newMachineId);

                        // Get slot data from temp machine if available
                        const tempSlot = tempMachine?.slots?.[i];

                        // Create a single-slot machine for this playfield side
                        const singleSlot: ArcadeMachineSlot = {
                            id: slotId,
                            name: 'Main',
                            gameType: tempSlot?.gameType || 'Standard',
                            status: tempSlot?.status || 'online',
                            currentItem: tempSlot?.currentItem || null,
                            upcomingQueue: tempSlot?.upcomingQueue || [],
                            stockLevel: tempSlot?.stockLevel || 'Out of Stock',
                            size: slotSizes[i] || data.prizeSize,
                        };

                        const separateMachine: Omit<ArcadeMachine, "id"> = {
                            name: slotMachineName,
                            assetTag: slotAssetTag,
                            location: finalLocation,
                            status: data.status,
                            physicalConfig: 'single', // Each is now an independent single machine
                            type: finalType,
                            prizeSize: slotSizes[i] || data.prizeSize,
                            notes: data.notes ? `${data.notes} (Part of ${data.name} - ${suffix})` : `Part of ${data.name} - ${suffix}`,
                            tag: data.tag ? `${data.tag}-${suffix}` : '',
                            subGroup: data.subGroup,
                            imageUrl: capturedImage || undefined,
                            slots: [singleSlot],
                            createdAt: new Date(),
                            lastSyncedAt: new Date(),
                            updatedAt: new Date(),
                            playCount: 0,
                            revenue: 0,
                            // Link to parent group for reference
                            group: data.name, // Store original machine name as group for linking
                        };

                        // Use set with structured ID instead of add with auto-generated ID
                        await machineService.set(newMachineId, separateMachine);
                        createdMachineIds.push(newMachineId);

                        await logAction(
                            user?.uid || "system",
                            "create",
                            "machine",
                            newMachineId,
                            `Created machine: ${slotMachineName} (ID: ${newMachineId})`,
                            null,
                            { ...separateMachine, id: newMachineId }
                        );

                        // Update stock items for this machine
                        if (singleSlot.currentItem) {
                            await stockService.update(singleSlot.currentItem.id, {
                                assignedMachineId: newMachineId,
                                assignedMachineName: slotMachineName,
                                assignedStatus: 'Assigned',
                            });
                        }
                        if (singleSlot.upcomingQueue && singleSlot.upcomingQueue.length > 0) {
                            for (const queueItem of singleSlot.upcomingQueue) {
                                await stockService.update(queueItem.itemId, {
                                    assignedMachineId: newMachineId,
                                    assignedMachineName: slotMachineName,
                                    assignedStatus: 'Assigned for Replacement',
                                });
                            }
                        }
                    }

                    // Use the first created machine ID for playfield settings
                    machineId = createdMachineIds[0];

                    const tagMode = data.assetTagMode === 'shared' ? 'shared asset tag' : 'separate asset tags';
                    toast.success(`Created ${createdMachineIds.length} machines with ${tagMode}`, {
                        description: suffixes.map((s) => `${data.name} ${s}`).join(', ')
                    });
                } else {
                    // SINGLE SLOT: Create one machine with one slot

                    // Generate structured machine ID for single slot (no suffix)
                    const newMachineId = generateMachineId(
                        finalLocation,
                        finalType,
                        "", // Empty suffix for single/main slot
                        machines
                    );

                    // Generate structured slot ID
                    const slotId = generateSlotId(newMachineId);

                    let slots: ArcadeMachineSlot[];

                    if (tempMachine && tempMachine.slots && tempMachine.slots.length > 0) {
                        slots = tempMachine.slots.map((slot, i) => ({
                            ...slot,
                            id: slotId, // Use structured slot ID
                            name: 'Main',
                            size: slotSizes[i] || data.prizeSize,
                        }));
                    } else {
                        slots = [{
                            id: slotId,
                            name: 'Main',
                            gameType: 'Standard',
                            status: 'online' as const,
                            currentItem: null,
                            upcomingQueue: [],
                            stockLevel: 'Out of Stock' as const,
                            size: slotSizes[0] || data.prizeSize,
                        }];
                    }

                    const newMachine: Omit<ArcadeMachine, "id"> = {
                        ...commonData,
                        slots,
                        createdAt: new Date(),
                        lastSyncedAt: new Date(),
                        playCount: 0,
                        revenue: 0,
                    };

                    // Use set with structured ID instead of add with auto-generated ID
                    await machineService.set(newMachineId, newMachine);
                    machineId = newMachineId;

                    await logAction(
                        user?.uid || "system",
                        "create",
                        "machine",
                        machineId,
                        `Created machine: ${data.name} (ID: ${machineId})`,
                        null,
                        { ...newMachine, id: machineId }
                    );

                    // Update stock items with the new machine ID
                    for (let i = 0; i < slots.length; i++) {
                        const slot = slots[i];
                        if (slot.currentItem) {
                            await stockService.update(slot.currentItem.id, {
                                assignedMachineId: machineId,
                                assignedMachineName: data.name,
                                assignedStatus: 'Assigned',
                            });
                        }
                        if (slot.upcomingQueue && slot.upcomingQueue.length > 0) {
                            for (const queueItem of slot.upcomingQueue) {
                                await stockService.update(queueItem.itemId, {
                                    assignedMachineId: machineId,
                                    assignedMachineName: data.name,
                                    assignedStatus: 'Assigned for Replacement',
                                });
                            }
                        }
                    }
                }
            }

            // Handle Playfield Settings
            if (data.playfield && machineId) {
                await settingsService.add({
                    machineId,
                    c1: data.playfield.c1 || 0,
                    c2: data.playfield.c2 || 0,
                    c3: data.playfield.c3 || 0,
                    c4: data.playfield.c4 || 0,
                    payoutRate: data.playfield.payoutRate || 0,
                    strengthSetting: data.playfield.c1 || 0,
                    payoutPercentage: data.playfield.payoutRate || 0,
                    timestamp: new Date(),
                    setBy: user?.uid || "system",
                    stockItemId: null,
                } as any);
            }

            refreshMachines();
            refreshItems();
            onSuccess();
            onOpenChange(false);
            toast.success(machineToEdit ? "Machine updated" : "Machine created");
        } catch (error) {
            console.error("Failed to save machine:", error);
            toast.error("Failed to save machine");
        } finally {
            setLoading(false);
        }
    };

    // Get the machine to pass to ManageStockModal
    const getMachineForModal = (): ArcadeMachine | null => {
        if (machineToEdit) {
            return machineToEdit;
        }
        return tempMachine || createTempMachineForSlot(activeSlotIndex);
    };

    const machineForModal = getMachineForModal();
    const activeSlotId = machineForModal?.slots[activeSlotIndex]?.id;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{machineToEdit ? "Edit Machine" : "Add New Machine"}</DialogTitle>
                        <DialogDescription>
                            {machineToEdit ? "Update machine details and configuration." : "Configure the new machine and assign stock."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Photo Section */}
                            <div className="border rounded-lg p-4 bg-muted/30">
                                <Label className="text-sm font-semibold mb-3 block">Machine Photo</Label>
                                <div className="flex items-center gap-4">
                                    {cameraOpen ? (
                                        <div className="relative w-full max-w-[300px] aspect-video">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover rounded-md"
                                            />
                                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                                                <Button type="button" size="sm" onClick={capturePhoto}>
                                                    <Camera className="mr-1 h-3 w-3" /> Capture
                                                </Button>
                                                <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : capturedImage ? (
                                        <div className="relative">
                                            <img
                                                src={capturedImage}
                                                alt="Machine"
                                                className="w-24 h-24 rounded-lg object-cover border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                onClick={() => setCapturedImage(null)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}

                                    {!cameraOpen && !capturedImage && (
                                        <div className="flex flex-col gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={startCamera}>
                                                <Camera className="mr-2 h-4 w-4" /> Take Photo
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="mr-2 h-4 w-4" /> From Gallery
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                        </div>
                                    )}
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Machine Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Trend Catcher 1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="assetTag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Tag</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Auto-generated if empty"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <p className="text-[10px] text-muted-foreground">
                                                Leave blank to auto-generate a 4-digit tag
                                            </p>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select location" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {LOCATIONS.map(loc => (
                                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                                        ))}
                                                        <SelectItem value="custom">Other...</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {watchedLocation === 'custom' && (
                                        <FormField
                                            control={form.control}
                                            name="customLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Enter custom location" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormField
                                        control={form.control}
                                        name="group"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {TYPES.map(type => (
                                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                                        ))}
                                                        <SelectItem value="custom">Other...</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {watchedGroup === 'custom' && (
                                        <FormField
                                            control={form.control}
                                            name="customGroup"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Enter custom type" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Online">Online</SelectItem>
                                                    <SelectItem value="Offline">Offline</SelectItem>
                                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                    <SelectItem value="Error">Error</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="physicalConfig"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Configuration</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select config" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="single">Single Unit</SelectItem>
                                                    <SelectItem value="multi_4_slot">4-Player Station (P1-P4)</SelectItem>
                                                    <SelectItem value="dual_module">Dual Module (Left/Right)</SelectItem>
                                                    <SelectItem value="multi_dual_stack">Dual Stack (Top/Bottom)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Multi-slot asset tag mode prompt */}
                            {isMultiSlot && !machineToEdit && (
                                <div className="border rounded-lg p-4 bg-amber-50/50 border-amber-200">
                                    <Label className="text-sm font-semibold mb-2 block text-amber-800">
                                        Multi-Slot Configuration
                                    </Label>
                                    <p className="text-xs text-amber-700 mb-3">
                                        This machine has {slotCount} slots: {slotSuffixes.map((s, i) => (
                                            <span key={s}>
                                                <strong>{watchedName || "Machine"} {s}</strong>
                                                {i < slotSuffixes.length - 1 ? ", " : ""}
                                            </span>
                                        ))}
                                    </p>
                                    <FormField
                                        control={form.control}
                                        name="assetTagMode"
                                        render={({ field }) => (
                                            <RadioGroup
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                className="flex flex-col gap-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="shared" id="tag-shared" />
                                                    <Label htmlFor="tag-shared" className="cursor-pointer text-sm">
                                                        <span className="font-medium">Shared Tag</span>
                                                        <span className="text-muted-foreground ml-1">– All slots share one asset tag</span>
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="separate" id="tag-separate" />
                                                    <Label htmlFor="tag-separate" className="cursor-pointer text-sm">
                                                        <span className="font-medium">Separate Tags</span>
                                                        <span className="text-muted-foreground ml-1">– Each slot tracked separately</span>
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        )}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="prizeSize"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prize Size</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select size" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Extra-Small">Extra-Small</SelectItem>
                                                    <SelectItem value="Small">Small</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Large">Large</SelectItem>
                                                    <SelectItem value="Big">Big</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional notes..." {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Stock Assignment Section */}
                            <div className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Stock Assignment</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {slotCount} slot{slotCount > 1 ? "s" : ""}
                                    </span>
                                </div>

                                <div className="grid gap-3">
                                    {Array.from({ length: slotCount }).map((_, index) => {
                                        const currentItem = getSlotCurrentItem(index);
                                        const slotDisplayName = getSlotDisplayName(index);
                                        const currentSlotSize = slotSizes[index] || watchedPrizeSize || "";

                                        return (
                                            <div
                                                key={index}
                                                className="p-3 border rounded-lg bg-card space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                            {currentItem?.imageUrl ? (
                                                                <img
                                                                    src={currentItem.imageUrl}
                                                                    alt={currentItem.name}
                                                                    className="w-full h-full object-cover rounded-lg"
                                                                />
                                                            ) : (
                                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{slotDisplayName}</p>
                                                            {currentItem ? (
                                                                <p className="text-xs text-green-600">{currentItem.name}</p>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground">No stock assigned</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant={currentItem ? "secondary" : "outline"}
                                                        size="sm"
                                                        onClick={() => openStockModalForSlot(index)}
                                                    >
                                                        {currentItem ? "Change" : "Assign Stock"}
                                                    </Button>
                                                </div>

                                                {/* Per-slot size selection */}
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Size:</Label>
                                                    <Select
                                                        value={currentSlotSize}
                                                        onValueChange={(value) => {
                                                            // Check if size is changing and stock assignment exists
                                                            const oldSize = slotSizes[index] || watchedPrizeSize;
                                                            const hasStockAssigned = !!currentItem;

                                                            // If size changes and stock exists, clear the stock assignment
                                                            if (hasStockAssigned && oldSize !== value) {
                                                                // Check if sizes are compatible (Small <-> Extra-Small)
                                                                const smallSizes = ['Small', 'Extra-Small'];
                                                                const isCompatible = smallSizes.includes(oldSize || '') && smallSizes.includes(value);

                                                                if (!isCompatible) {
                                                                    // Clear the stock assignment for this slot
                                                                    if (tempMachine) {
                                                                        const updatedSlots = [...tempMachine.slots];
                                                                        if (updatedSlots[index]) {
                                                                            updatedSlots[index] = {
                                                                                ...updatedSlots[index],
                                                                                currentItem: null,
                                                                                upcomingQueue: [],
                                                                            };
                                                                            setTempMachine({
                                                                                ...tempMachine,
                                                                                slots: updatedSlots,
                                                                            });
                                                                        }
                                                                    }
                                                                    toast.info(`Stock cleared - size changed from ${oldSize} to ${value}`);
                                                                }
                                                            }

                                                            setSlotSizes(prev => ({ ...prev, [index]: value }));
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-7 text-xs flex-1">
                                                            <SelectValue placeholder="Select size" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Extra-Small">Extra-Small</SelectItem>
                                                            <SelectItem value="Small">Small</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="Large">Large</SelectItem>
                                                            <SelectItem value="Big">Big</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {currentSlotSize && ['Small', 'Extra-Small'].includes(currentSlotSize) && (
                                                        <span className="text-[10px] text-blue-600 whitespace-nowrap">
                                                            Small ↔ Extra-Small compatible
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Advanced Settings */}
                            <Collapsible
                                open={isAdvancedOpen}
                                onOpenChange={setIsAdvancedOpen}
                                className="border rounded-lg"
                            >
                                <div className="flex items-center justify-between px-4 py-2">
                                    <h4 className="text-sm font-semibold text-muted-foreground">Advanced Settings</h4>
                                    <CollapsibleTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="w-9 p-0">
                                            <ChevronsUpDown className="h-4 w-4" />
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="px-4 pb-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="tag"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>API Tag / Primary Key</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Sync Identifier" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="subGroup"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sub Group</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Secondary grouping" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="border-t pt-4 space-y-3">
                                        <h5 className="text-sm font-medium">Playfield Settings</h5>
                                        <div className="grid grid-cols-3 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="playfield.c1"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">C1 (Catch)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="playfield.c2"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">C2 (Pickup)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="playfield.c3"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">C3 (Carry)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="playfield.c4"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">C4 (Prize)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="playfield.payoutRate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Payout Rate</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : machineToEdit ? "Update Machine" : "Create Machine"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ManageStockModal - Same as used in Machine page */}
            {machineForModal && (
                <ManageStockModal
                    open={isStockModalOpen}
                    onOpenChange={handleStockModalClose}
                    machine={machineForModal}
                    slotId={activeSlotId}
                    onStockSelected={!machineToEdit ? handleStockSelected : undefined}
                />
            )}
        </>
    );
}
