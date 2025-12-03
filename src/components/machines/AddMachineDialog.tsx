"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArcadeMachine, ArcadeMachineSlot } from "@/types";
import { machineService } from "@/services";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, RefreshCw, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const LOCATIONS = ["Ground", "Basement", "Level-1"];
const TYPES = [
    "Trend Catcher", "Trend Box", "SKWEB", "INNIS",
    "Doll Castle", "Doll House", "Giant Claw",
    "Crazy Toy Nano", "Crazy Star", "Crazy Toy Miya"
];

const machineSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    assetTag: z.string().min(2, "Asset Tag is required"),
    location: z.string().min(1, "Location is required"),
    customLocation: z.string().optional(),
    status: z.enum(["Online", "Offline", "Maintenance", "Error"]),
    physicalConfig: z.enum(["single", "multi_4_slot", "dual_module", "multi_dual_stack"]),
    group: z.string().optional(), // Used for Type
    customGroup: z.string().optional(),
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

type MachineFormValues = z.infer<typeof machineSchema>;

interface AddMachineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    machineToEdit?: ArcadeMachine | null;
}

export function AddMachineDialog({ open, onOpenChange, onSuccess, machineToEdit }: AddMachineDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const form = useForm<MachineFormValues>({
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
        },
    });

    const watchedLocation = form.watch("location");
    const watchedGroup = form.watch("group");

    // Camera Logic
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraOpen(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
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
                const dataUrl = canvas.toDataURL("image/jpeg");
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    // Cleanup camera on close and reset form
    useEffect(() => {
        if (open) {
            if (machineToEdit) {
                const isCustomLocation = !LOCATIONS.includes(machineToEdit.location);
                const isCustomType = machineToEdit.type && !TYPES.includes(machineToEdit.type);

                form.reset({
                    name: machineToEdit.name,
                    assetTag: machineToEdit.assetTag,
                    location: isCustomLocation ? "custom" : machineToEdit.location,
                    customLocation: isCustomLocation ? machineToEdit.location : "",
                    status: machineToEdit.status,
                    physicalConfig: machineToEdit.physicalConfig as any,
                    group: isCustomType ? "custom" : machineToEdit.type,
                    customGroup: isCustomType ? machineToEdit.type : "",
                });
                setCapturedImage(machineToEdit.imageUrl || null);
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
                });
                setCapturedImage(null);
            }
        } else {
            stopCamera();
            setCapturedImage(null);
        }
    }, [open, machineToEdit, form]);

    const generateSlots = (config: string): ArcadeMachineSlot[] => {
        const baseSlot = {
            gameType: "Standard",
            status: "online" as const,
            currentItem: null,
            upcomingQueue: [],
            stockLevel: "Empty" as const,
        };

        if (config === "multi_4_slot") {
            return Array.from({ length: 4 }).map((_, i) => ({
                ...baseSlot,
                id: `slot-${Date.now()}-${i}`,
                name: `Station ${i + 1}`,
            }));
        } else if (config === "dual_module") {
            return [
                { ...baseSlot, id: `slot-${Date.now()}-L`, name: "Left Module" },
                { ...baseSlot, id: `slot-${Date.now()}-R`, name: "Right Module" },
            ];
        } else if (config === "multi_dual_stack") {
            return [
                { ...baseSlot, id: `slot-${Date.now()}-T`, name: "Top" },
                { ...baseSlot, id: `slot-${Date.now()}-B`, name: "Bottom" },
            ];
        } else {
            return []; // Single machine doesn't strictly need sub-slots, or could have 1 default slot
        }
    };

    const onSubmit = async (data: MachineFormValues) => {
        setLoading(true);
        try {
            const finalLocation = data.location === 'custom' ? data.customLocation! : data.location;
            const finalType = data.group === 'custom' ? data.customGroup! : data.group;

            if (machineToEdit) {
                await machineService.update(machineToEdit.id, {
                    ...data,
                    location: finalLocation,
                    type: finalType,
                    imageUrl: capturedImage || undefined,
                });

                await logAction(
                    user?.uid || "system",
                    "update",
                    "machine",
                    machineToEdit.id,
                    `Updated machine: ${data.name}`,
                    {
                        name: machineToEdit.name,
                        status: machineToEdit.status,
                        location: machineToEdit.location
                    },
                    { ...data, location: finalLocation, type: finalType }
                );
            } else {
                const slots = generateSlots(data.physicalConfig);
                const newMachine: Omit<ArcadeMachine, "id"> = {
                    ...data,
                    location: finalLocation,
                    type: finalType, // Map group to type
                    slots,
                    imageUrl: capturedImage || undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastSyncedAt: new Date(),
                    playCount: 0,
                    revenue: 0,
                };

                const id = await machineService.add(newMachine);

                await logAction(
                    user?.uid || "system",
                    "create",
                    "machine",
                    id,
                    `Created machine: ${data.name}`,
                    null,
                    newMachine
                );
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save machine:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Machine</DialogTitle>
                    <DialogDescription>
                        Configure the new machine and its physical layout.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="photo">Photo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Machine Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Claw Master 3000" {...field} />
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
                                                    <Input placeholder="e.g. AST-001" {...field} />
                                                </FormControl>
                                                <FormMessage />
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
                                                    <FormLabel>Location</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                                <FormLabel>Initial Status</FormLabel>
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
                                                <FormMessage />
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
                                                        <SelectItem value="multi_4_slot">4-Player Station</SelectItem>
                                                        <SelectItem value="dual_module">Dual Module (L/R)</SelectItem>
                                                        <SelectItem value="multi_dual_stack">Multi Dual Stack (Top/Btm)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="photo" className="space-y-4 py-4">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 min-h-[300px] bg-muted/50">
                            {cameraOpen ? (
                                <div className="relative w-full h-full max-h-[400px]">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                    <Button
                                        onClick={capturePhoto}
                                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                                    >
                                        <Camera className="mr-2 h-4 w-4" /> Capture
                                    </Button>
                                </div>
                            ) : capturedImage ? (
                                <div className="relative w-full max-h-[400px] flex justify-center">
                                    <Image
                                        src={capturedImage}
                                        alt="Captured"
                                        width={400}
                                        height={300}
                                        className="rounded-md object-contain"
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => setCapturedImage(null)}
                                    >
                                        <RefreshCw className="h-4 w-4" /> Retake
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="flex justify-center">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">
                                        Take a photo of the machine setup for reference.
                                    </p>
                                    <Button onClick={startCamera}>
                                        <Camera className="mr-2 h-4 w-4" /> Start Camera
                                    </Button>
                                </div>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                        {loading ? "Creating..." : "Create Machine"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
