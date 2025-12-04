"use client";

import * as React from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel as ShadcnSelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PlusCircle, Trash2, Image as ImageIcon, XCircle, WandSparkles, Camera, Gamepad2, ChevronsUpDown, Check, AlertTriangle, ChevronDown } from "lucide-react";
import Image from "next/image";
import type { StockItem, StockItemFormSubmitValues as StockItemFormOutputValues, ArcadeMachine } from "@/types";
import { cn } from "@/lib/utils";
import { generateStockItemNote } from "@/ai/flows/generate-stock-item-note-flow";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADD_NEW_CATEGORY_VALUE = "ADD_NEW";
const ADD_NEW_LOCATION_VALUE = "ADD_NEW_LOCATION";
const NO_MACHINE_ASSIGNED_VALUE = "NO_MACHINE";
const ANY_SLOT_VALUE = "ANY_SLOT";

const primaryStorageLocations = [
    "B-Plushy Room",
    "B-Capsule Room",
    "G-Storage Room",
    "L-Storage Room"
];

const secondaryStorageLocations = [
    "B-497 Room",
    "B-Harry Porter Room",
    "B-Staff Room",
    "G-Counter",
    "G-Amenities Room",
    "Warehouse Alpha",
    "Warehouse Bravo"
];

const sizeOptions = ["Small", "Medium", "Large", "Big"];

const parseNumericInput = (input: any): number => {
    if (typeof input === 'number') return input;
    if (typeof input === 'string') {
        const num = parseFloat(input.trim());
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

const addStockItemSchemaStep1 = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    category: z.string().min(1, { message: "Please select a category." }),
    newCategoryName: z.string().optional(),
    size: z.string().optional(),
    imageUrl: z.any().optional(),
    imageUrls: z.array(z.any()).optional(),

    overallQuantity: z.preprocess(
        (val) => {
            const str = String(val).trim();
            return str === '' ? undefined : val;
        },
        z.coerce.number().int().min(1, { message: "Overall quantity must be at least 1." }).optional()
    ),

    tags: z.string().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    weightGrams: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().nonnegative().optional()
    ),
    lengthCm: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().nonnegative().optional()
    ),
    widthCm: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().nonnegative().optional()
    ),
    heightCm: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().nonnegative().optional()
    ),

    // Supply Chain fields
    vendor: z.string().optional(),
    costPerUnit: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().nonnegative().optional()
    ),
    reorderPoint: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().int().nonnegative().optional()
    ),

    lowStockThreshold: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().int().nonnegative({ message: "Low stock threshold must be a non-negative integer." }).optional()
    ),

    description: z.string().optional(),
    cost: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().nonnegative({ message: "Cost must be a non-negative number." }).optional()
    ),
    value: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().int().nonnegative({ message: "Value must be a non-negative integer." }).optional()
    ),

    locations: z.array(
        z.object({
            name: z.string().min(1, { message: "Location name is required." }),
            isNewLocation: z.boolean().optional(),
            customLocationName: z.string().optional(),
            quantity: z.preprocess(
                (val) => (String(val).trim() === '' ? 0 : val),
                z.coerce.number().int().nonnegative({ message: "Quantity must be a non-negative integer." })
            ),
        })
    ).min(1, { message: "At least one location with quantity must be specified." }),

    assignedMachineId: z.string().optional(),
    assignedSlotId: z.string().optional(),

    payouts: z.array(
        z.object({
            playCost: z.preprocess(
                (val) => (String(val).trim() === '' ? undefined : val),
                z.coerce.number().positive({ message: "Play cost must be positive." }).optional()
            ),
            playsRequired: z.preprocess(
                (val) => (String(val).trim() === '' ? undefined : val),
                z.coerce.number().int().positive({ message: "Plays required must be a positive integer." }).optional()
            ),
        })
    ).optional(),
}).superRefine((data, ctx) => {
    if (data.assignedSlotId && data.assignedSlotId !== ANY_SLOT_VALUE && (!data.assignedMachineId || data.assignedMachineId === NO_MACHINE_ASSIGNED_VALUE)) {
        ctx.addIssue({
            path: ["assignedMachineId"],
            message: "A machine must be selected if a specific slot is chosen.",
            code: z.ZodIssueCode.custom
        });
    }

    // Real-time validation: Low stock threshold should not exceed overall quantity
    if (data.lowStockThreshold && data.overallQuantity && data.lowStockThreshold > data.overallQuantity) {
        ctx.addIssue({
            path: ["lowStockThreshold"],
            message: `Low stock threshold (${data.lowStockThreshold}) cannot exceed overall quantity (${data.overallQuantity}).`,
            code: z.ZodIssueCode.custom
        });
    }

    // Require overallQuantity
    if (!data.overallQuantity || data.overallQuantity < 1) {
        ctx.addIssue({
            path: ["overallQuantity"],
            message: "Overall quantity is required and must be at least 1.",
            code: z.ZodIssueCode.custom
        });
    }
});

const addStockItemSchemaIntermediate = addStockItemSchemaStep1.transform(data => {
    const numericLocationsParsed = (data.locations || []).map(loc => {
        const finalLocationName = loc.name === ADD_NEW_LOCATION_VALUE && loc.customLocationName
            ? loc.customLocationName
            : loc.name;

        return {
            name: finalLocationName,
            quantity: loc.quantity,
            _parsedNumericQuantity: loc.quantity
        };
    });

    const sumOfLocationQuantities = numericLocationsParsed.reduce((sum, loc) => sum + (loc._parsedNumericQuantity || 0), 0);

    return {
        ...data,
        _numericLocationsParsed: numericLocationsParsed,
        _parsedOverallNumericQuantity: data.overallQuantity || 0,
        _sumOfLocationQuantities: sumOfLocationQuantities,
    };
});

const stockItemFormSchema = addStockItemSchemaIntermediate.superRefine((data, ctx) => {
    if (data.category === ADD_NEW_CATEGORY_VALUE && (!data.newCategoryName || data.newCategoryName.trim() === "")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New category name is required if 'Add New Category' is selected.", path: ["newCategoryName"] });
    }

    (data.locations || []).forEach((loc, index) => {
        if (loc.name === ADD_NEW_LOCATION_VALUE && (!loc.customLocationName || loc.customLocationName.trim() === '')) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Location name is required if 'Add New Location' is selected.", path: [`locations.${index}.customLocationName`] });
        }
    });
})
    .transform(data => {
        const transformedPayouts = (data.payouts || []).map(p => ({
            playCost: p.playCost,
            playsRequired: p.playsRequired,
        })).filter(p => p.playCost !== undefined && p.playsRequired !== undefined);

        return {
            name: data.name,
            category: data.category === ADD_NEW_CATEGORY_VALUE && data.newCategoryName ? data.newCategoryName : data.category,
            newCategoryName: data.newCategoryName,
            size: data.size,
            imageUrl: data.imageUrl,
            imageUrls: data.imageUrls,
            quantityDescription: data.overallQuantity?.toString() || "1",
            lowStockThreshold: data.lowStockThreshold || 0,
            description: data.description,
            tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : undefined,
            brand: data.brand,
            sku: data.sku,
            technicalSpecs: (data.weightGrams || data.lengthCm || data.widthCm || data.heightCm) ? {
                weightGrams: data.weightGrams || 0,
                dimensions: {
                    lengthCm: data.lengthCm || 0,
                    widthCm: data.widthCm || 0,
                    heightCm: data.heightCm || 0,
                },
                recommendedClawStrength: ""
            } : undefined,
            supplyChain: (data.vendor || data.costPerUnit || data.reorderPoint) ? {
                vendor: data.vendor || "",
                costPerUnit: data.costPerUnit || 0,
                reorderPoint: data.reorderPoint || 0,
            } : undefined,
            cost: data.cost,
            value: data.value,
            locations: (data._numericLocationsParsed || []).map(loc => ({ name: loc.name, quantity: loc._parsedNumericQuantity })),
            payouts: transformedPayouts.length > 0 ? transformedPayouts : undefined,
            assignedMachineId: data.assignedMachineId === NO_MACHINE_ASSIGNED_VALUE ? undefined : data.assignedMachineId,
            assignedSlotId: data.assignedSlotId,
            _parsedOverallNumericQuantity: data._parsedOverallNumericQuantity,
            _sumOfLocationQuantities: data._sumOfLocationQuantities,
        };
    });

type RawFormValues = z.input<typeof addStockItemSchemaStep1>;

interface StockItemFormProps {
    onSubmit: (data: StockItemFormOutputValues) => void;
    onCancel: () => void;
    categories: string[];
    initialData?: StockItem;
    machines: ArcadeMachine[];
}

export function StockItemForm({ onSubmit, onCancel, categories, initialData, machines }: StockItemFormProps) {
    const [previewImages, setPreviewImages] = React.useState<string[]>(initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : []));
    const [isGeneratingNote, setIsGeneratingNote] = React.useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
    const { toast } = useToast();
    const [machineComboboxOpen, setMachineComboboxOpen] = React.useState(false);
    const [slotComboboxOpen, setSlotComboboxOpen] = React.useState(false);
    const [isValidationErrorDialogOpen, setIsValidationErrorDialogOpen] = React.useState(false);
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const cameraInputRef = React.useRef<HTMLInputElement>(null);

    // Image compression function
    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions
                    const maxWidth = 1200;
                    const maxHeight = 1200;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.85);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newPreviews: string[] = [];
            const compressedFiles: File[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const compressedFile = await compressImage(file);
                compressedFiles.push(compressedFile);
                newPreviews.push(URL.createObjectURL(compressedFile));
            }

            setPreviewImages(prev => [...prev, ...newPreviews]);

            // Store both single and multiple for backward compatibility
            if (compressedFiles.length === 1) {
                form.setValue("imageUrl", compressedFiles[0]);
            }
            const currentUrls = form.getValues("imageUrls") || [];
            form.setValue("imageUrls", [...currentUrls, ...compressedFiles]);
        }
    };

    const removeImage = (index: number) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        const currentUrls = form.getValues("imageUrls") || [];
        const updated = currentUrls.filter((_, i) => i !== index);
        form.setValue("imageUrls", updated);
        if (updated.length > 0) {
            form.setValue("imageUrl", updated[0]);
        } else {
            form.setValue("imageUrl", null);
        }
    };

    const generateDefaultFormValues = (item?: StockItem): RawFormValues => {
        if (!item) {
            return {
                name: "",
                category: "",
                newCategoryName: "",
                size: "",
                imageUrl: undefined,
                overallQuantity: 1,
                lowStockThreshold: undefined,
                tags: "",
                brand: "",
                sku: "",
                weightGrams: undefined,
                lengthCm: undefined,
                widthCm: undefined,
                heightCm: undefined,
                vendor: "",
                costPerUnit: undefined,
                reorderPoint: undefined,
                description: "",
                cost: '',
                value: '',
                locations: [{ name: primaryStorageLocations[0] || "", quantity: 0, isNewLocation: false, customLocationName: "" }],
                assignedMachineId: NO_MACHINE_ASSIGNED_VALUE,
                assignedSlotId: undefined,
                payouts: [{ playCost: '', playsRequired: '' }],
            };
        }

        const qtyValue = parseNumericInput(item.quantityDescription || item.quantity?.toString() || "0");

        return {
            name: item.name,
            category: item.category,
            newCategoryName: "",
            size: item.size || "",
            imageUrl: item.imageUrl || undefined,
            imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
            overallQuantity: qtyValue || 1,
            lowStockThreshold: item.lowStockThreshold !== undefined ? item.lowStockThreshold : undefined,
            description: item.description || "",
            tags: item.tags?.join(', ') || "",
            brand: item.brand || "",
            sku: item.sku || "",
            weightGrams: item.technicalSpecs?.weightGrams,
            lengthCm: item.technicalSpecs?.dimensions?.lengthCm,
            widthCm: item.technicalSpecs?.dimensions?.widthCm,
            heightCm: item.technicalSpecs?.dimensions?.heightCm,
            vendor: item.supplyChain?.vendor || "",
            costPerUnit: item.supplyChain?.costPerUnit,
            reorderPoint: item.supplyChain?.reorderPoint,
            cost: item.cost !== undefined ? String(item.cost) : '',
            value: item.value !== undefined ? String(item.value) : '',
            locations: item.locations && item.locations.length > 0
                ? item.locations.map(loc => ({
                    name: loc.name,
                    quantity: loc.quantity,
                    isNewLocation: false,
                    customLocationName: ""
                }))
                : [{ name: primaryStorageLocations[0] || "", quantity: 0, isNewLocation: false, customLocationName: "" }],
            assignedMachineId: item.assignedMachineId || NO_MACHINE_ASSIGNED_VALUE,
            assignedSlotId: item.assignedSlotId,
            payouts: item.payouts && item.payouts.length > 0
                ? item.payouts.map(p => {
                    if (typeof p === 'number') {
                        return { playCost: '', playsRequired: '' };
                    }
                    return {
                        playCost: p.playCost !== undefined ? String(p.playCost) : '',
                        playsRequired: p.playsRequired !== undefined ? String(p.playsRequired) : ''
                    };
                })
                : [{ playCost: '', playsRequired: '' }],
        };
    };

    const form = useForm<RawFormValues>({
        resolver: zodResolver(stockItemFormSchema) as any,
        defaultValues: generateDefaultFormValues(initialData),
        mode: "onChange",
    });

    const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
        control: form.control,
        name: "locations"
    });

    const { fields: payoutFields, append: appendPayout, remove: removePayout } = useFieldArray({
        control: form.control,
        name: "payouts"
    });

    React.useEffect(() => {
        if (initialData) {
            form.reset(generateDefaultFormValues(initialData));
            // Ensure previewImages are set from initialData
            if (initialData.imageUrls && initialData.imageUrls.length > 0) {
                setPreviewImages(initialData.imageUrls);
            } else if (initialData.imageUrl) {
                setPreviewImages([initialData.imageUrl]);
            } else {
                setPreviewImages([]);
            }
        } else {
            form.reset(generateDefaultFormValues());
            setPreviewImages([]);
        }
    }, [initialData, form]);

    // Auto-generate SKU based on Category and Size
    const watchCategoryForSku = useWatch({ control: form.control, name: "category" });
    const watchSize = useWatch({ control: form.control, name: "size" });
    const watchSku = useWatch({ control: form.control, name: "sku" });

    React.useEffect(() => {
        // Only generate if it's a new item (no initialData) and SKU is empty
        if (!initialData && !watchSku && watchCategoryForSku && watchSize && watchCategoryForSku !== ADD_NEW_CATEGORY_VALUE) {
            const catPrefix = watchCategoryForSku.substring(0, 3).toUpperCase();
            const sizePrefix = watchSize.substring(0, 3).toUpperCase();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const generatedSku = `${catPrefix}-${sizePrefix}-${random}`;
            form.setValue("sku", generatedSku);
        }
    }, [watchCategoryForSku, watchSize, watchSku, initialData, form]);

    const watchCategory = form.watch("category");
    const watchName = form.watch("name");
    const watchExistingNote = form.watch("description");
    const watchAssignedMachineId = form.watch("assignedMachineId");

    // Use useWatch for deep watching of field arrays to ensure instant updates
    const watchedOverallQuantity = useWatch({
        control: form.control,
        name: "overallQuantity",
        defaultValue: 0
    });

    const watchedLocations = useWatch({
        control: form.control,
        name: "locations",
        defaultValue: []
    });

    const availableSlots = React.useMemo(() => {
        if (!watchAssignedMachineId || watchAssignedMachineId === NO_MACHINE_ASSIGNED_VALUE) return [];
        const machine = machines.find(m => m.id === watchAssignedMachineId);
        return machine?.slots || [];
    }, [watchAssignedMachineId, machines]);

    const overallTargetQuantity = React.useMemo(() => {
        const qty = Number(watchedOverallQuantity);
        return isNaN(qty) ? 0 : qty;
    }, [watchedOverallQuantity]);

    const currentSumOfEnteredLocationQuantities = React.useMemo(() => {
        if (!watchedLocations || !Array.isArray(watchedLocations)) return 0;
        return watchedLocations.reduce((sum, loc) => {
            const qty = Number(loc?.quantity);
            return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
    }, [watchedLocations]);

    const overallRemainingToAllocate = React.useMemo(() => {
        return overallTargetQuantity - currentSumOfEnteredLocationQuantities;
    }, [overallTargetQuantity, currentSumOfEnteredLocationQuantities]);

    const handleGenerateDescription = async () => {
        const itemName = watchName;
        let itemCategoryValue = watchCategory;
        const newCategoryName = form.getValues("newCategoryName");
        const existingNote = watchExistingNote;

        if (itemCategoryValue === ADD_NEW_CATEGORY_VALUE && newCategoryName) {
            itemCategoryValue = newCategoryName;
        }

        if (!itemName || !itemCategoryValue || itemCategoryValue === ADD_NEW_CATEGORY_VALUE) {
            toast({
                title: "Missing Information",
                description: "Please enter an item name and select/enter a category before generating a description.",
            });
            return;
        }

        setIsGeneratingNote(true);
        try {
            const result = await generateStockItemNote({ itemName, itemCategory: itemCategoryValue, existingNote });
            form.setValue("description", result.generatedNote, { shouldValidate: true });
            toast({
                title: "Description Generated!",
                description: "The AI has suggested a description for your item.",
            });
        } catch (error) {
            console.error("Error generating stock item note:", error);
            toast({
                title: "Generation Failed",
                description: "Could not generate a description. Please try again or write one manually.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingNote(false);
        }
    };

    const onInvalid = (errors: any) => {
        const messages: string[] = [];
        const extractMessages = (obj: any) => {
            if (!obj) return;
            if (typeof obj.message === 'string') {
                messages.push(obj.message);
            }
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    if (typeof value === 'object') {
                        extractMessages(value);
                    }
                }
            }
        };
        extractMessages(errors);
        setValidationErrors(Array.from(new Set(messages)));
        setIsValidationErrorDialogOpen(true);
    };

    const handleValidSubmit = (data: RawFormValues) => {
        // Auto-allocate remaining quantity to B-Plushy Room
        const overallQty = typeof data.overallQuantity === 'number' ? data.overallQuantity : 0;
        const allocatedQty = (data.locations || []).reduce((sum: number, loc: any) => {
            const qty = typeof loc.quantity === 'number' ? loc.quantity : parseFloat(loc.quantity) || 0;
            return sum + qty;
        }, 0);

        const remaining = overallQty - allocatedQty;

        if (remaining > 0) {
            // Find B-Plushy Room
            const bPlushyIndex = data.locations?.findIndex((loc: any) => loc.name === "B-Plushy Room");

            if (bPlushyIndex !== undefined && bPlushyIndex >= 0) {
                // Update existing
                const currentQty = data.locations![bPlushyIndex].quantity || 0;
                const newQty = (typeof currentQty === 'number' ? currentQty : parseFloat(currentQty as any) || 0) + remaining;
                data.locations![bPlushyIndex].quantity = newQty;
            } else {
                // Add new
                if (!data.locations) data.locations = [];
                data.locations.push({
                    name: "B-Plushy Room",
                    quantity: remaining,
                    isNewLocation: false,
                    customLocationName: ""
                });
            }

            toast({
                title: "Auto-Allocation",
                description: `${remaining} unallocated items were assigned to B-Plushy Room.`,
            });
        }

        onSubmit(data as unknown as StockItemFormOutputValues);
    };

    return (
        <>
            <AlertDialog open={isValidationErrorDialogOpen} onOpenChange={setIsValidationErrorDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline flex items-center">
                            <AlertTriangle className="text-destructive mr-2 h-6 w-6" />
                            Form Incomplete
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-body pt-2 text-left">
                            Please correct the following errors before submitting:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <ul className="list-disc list-inside space-y-1.5 text-sm text-destructive font-body">
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsValidationErrorDialogOpen(false)} className="font-body">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleValidSubmit, onInvalid)} className="space-y-6">
                    <FormItem>
                        <FormLabel>Item Image(s) (Optional)</FormLabel>
                        <div className="mt-2">
                            <div className="flex items-start gap-2 flex-wrap">
                                {previewImages
                                    .filter(img => img && typeof img === 'string' && img.trim().length > 0)
                                    .map((img, index) => (
                                        <div key={`preview-${index}-${img.substring(0, 20)}`} className="relative">
                                            <Image
                                                src={img}
                                                alt={`Item preview ${index + 1}`}
                                                width={80}
                                                height={80}
                                                className="rounded-md object-cover aspect-square cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                                                onClick={() => removeImage(index)}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                <div
                                    className="w-20 h-20 rounded-md bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors border-2 border-dashed border-muted-foreground/20"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="font-body text-sm">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Choose Images
                                </Button>
                                <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()} className="font-body text-sm">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Camera
                                </Button>
                            </div>
                            <FormControl>
                                <div>
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        className="font-body sr-only"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        aria-hidden="true"
                                        tabIndex={-1}
                                    />
                                    <Input
                                        ref={cameraInputRef}
                                        type="file"
                                        className="font-body sr-only"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleImageChange}
                                        aria-hidden="true"
                                        tabIndex={-1}
                                    />
                                </div>
                            </FormControl>
                        </div>
                        <FormMessage>{form.formState.errors.imageUrl?.message as string}</FormMessage>
                    </FormItem>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Item Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Rainbow Unicorn Plush" {...field} className="font-body" value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            if (value !== ADD_NEW_CATEGORY_VALUE) {
                                                form.setValue("newCategoryName", "");
                                            }
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.filter(cat => cat.toLowerCase() !== 'all').map((category) => (
                                                <SelectItem key={category} value={category} className="font-body">
                                                    {category}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value={ADD_NEW_CATEGORY_VALUE} className="font-body font-semibold text-primary">
                                                -- Add New Category --
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Size (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select size" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sizeOptions.map((size) => (
                                                <SelectItem key={size} value={size} className="font-body">
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {watchCategory === ADD_NEW_CATEGORY_VALUE && (
                        <FormField
                            control={form.control}
                            name="newCategoryName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Category Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter new category name" {...field} className="font-body" value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="space-y-4 rounded-md border p-4">
                        <h3 className="text-md font-semibold leading-none tracking-tight flex items-center">
                            <Gamepad2 className="mr-2 h-5 w-5 text-primary" />
                            Machine Assignment (Optional)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="assignedMachineId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Machine</FormLabel>
                                        <Popover open={machineComboboxOpen} onOpenChange={setMachineComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                                    >
                                                        <span className="truncate">
                                                            {field.value && field.value !== NO_MACHINE_ASSIGNED_VALUE
                                                                ? machines.find((m) => m.id === field.value)?.name
                                                                : "[No Machine Assigned]"}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999] max-h-[300px]">
                                                <Command
                                                    filter={(value, search) => {
                                                        const machine = machines.find((m) => m.id === value);
                                                        if (!machine) return 0;
                                                        const nameMatch = machine.name.toLowerCase().includes(search.toLowerCase());
                                                        const tagMatch = machine.assetTag.toLowerCase().includes(search.toLowerCase());
                                                        return (nameMatch || tagMatch) ? 1 : 0;
                                                    }}
                                                >
                                                    <CommandInput placeholder="Search machines..." />
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        <CommandEmpty>No machine found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value={NO_MACHINE_ASSIGNED_VALUE}
                                                                onSelect={() => {
                                                                    form.setValue("assignedMachineId", NO_MACHINE_ASSIGNED_VALUE);
                                                                    form.setValue("assignedSlotId", undefined);
                                                                    setMachineComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value === NO_MACHINE_ASSIGNED_VALUE || !field.value ? "opacity-100" : "opacity-0")} />
                                                                [No Machine Assigned]
                                                            </CommandItem>
                                                            {machines.map((machine) => (
                                                                <CommandItem
                                                                    value={machine.id}
                                                                    key={machine.id}
                                                                    onSelect={() => {
                                                                        form.setValue("assignedMachineId", machine.id);
                                                                        form.setValue("assignedSlotId", undefined);
                                                                        setMachineComboboxOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", machine.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex items-center gap-2">
                                                                        {machine.imageUrl ?
                                                                            <Image src={machine.imageUrl} alt={machine.name} width={24} height={24} className="rounded object-cover" />
                                                                            : <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                                                                        }
                                                                        <div>
                                                                            <p className="text-sm font-medium">{machine.name}</p>
                                                                            <p className="text-xs text-muted-foreground">Tag: {machine.assetTag}</p>
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assignedSlotId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Slot</FormLabel>
                                        <Popover open={slotComboboxOpen} onOpenChange={setSlotComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        disabled={!watchAssignedMachineId || watchAssignedMachineId === NO_MACHINE_ASSIGNED_VALUE}
                                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? field.value === ANY_SLOT_VALUE
                                                                    ? "Any Slot / General"
                                                                    : availableSlots.find(s => s.id === field.value)?.name || "Select slot..."
                                                                : "Select slot..."}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999] max-h-[300px]">
                                                <Command>
                                                    <CommandInput placeholder="Search slots..." />
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        <CommandEmpty>No slots found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value={ANY_SLOT_VALUE}
                                                                onSelect={() => {
                                                                    form.setValue("assignedSlotId", ANY_SLOT_VALUE);
                                                                    setSlotComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value === ANY_SLOT_VALUE ? "opacity-100" : "opacity-0")} />
                                                                Any Slot / General
                                                            </CommandItem>
                                                            {availableSlots.map((slot) => (
                                                                <CommandItem
                                                                    value={slot.id}
                                                                    key={slot.id}
                                                                    onSelect={() => {
                                                                        form.setValue("assignedSlotId", slot.id);
                                                                        setSlotComboboxOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", slot.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                    {slot.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="overallQuantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overall Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Enter quantity"
                                            {...field}
                                            className="font-body"
                                            value={field.value ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === '' ? undefined : parseInt(val, 10));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lowStockThreshold"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Low Stock Threshold (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Alert threshold"
                                            {...field}
                                            className="font-body"
                                            value={field.value ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === '' ? undefined : parseInt(val, 10));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="p-3 border rounded-md bg-secondary/20 space-y-1 text-sm font-body">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Target Overall Quantity:</span>
                            <span className="font-semibold text-foreground">{overallTargetQuantity} units</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Allocated in Locations:</span>
                            <span className="font-semibold text-foreground">{currentSumOfEnteredLocationQuantities} units</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={cn(
                                "font-semibold",
                                overallRemainingToAllocate < 0 ? "text-destructive" :
                                    overallRemainingToAllocate === 0 && overallTargetQuantity > 0 ? "text-green-600" :
                                        "text-blue-600"
                            )}>
                                {overallRemainingToAllocate < 0
                                    ? `Over - allocated by ${Math.abs(overallRemainingToAllocate)} units`
                                    : overallRemainingToAllocate === 0 && overallTargetQuantity > 0 && currentSumOfEnteredLocationQuantities > 0
                                        ? "All items allocated"
                                        : overallRemainingToAllocate === 0 && (overallTargetQuantity === 0 || currentSumOfEnteredLocationQuantities === 0)
                                            ? (overallTargetQuantity === 0 ? "0 items to allocate" : "All items allocated (0 units)")
                                            : `${overallRemainingToAllocate} units remaining to allocate`}
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Locations &amp; Specific Quantities (Units)</Label>
                        <div className="space-y-3 mt-2">
                            {locationFields.map((item, index) => (
                                <div key={item.id} className="flex flex-col gap-3 p-3 border rounded-md bg-secondary/30">
                                    <div className="flex items-start gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`locations.${index}.name`}
                                            render={({ field: itemField }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">Location {index + 1}</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            itemField.onChange(value);
                                                            if (value !== ADD_NEW_LOCATION_VALUE) {
                                                                form.setValue(`locations.${index}.customLocationName`, "");
                                                            }
                                                        }}
                                                        value={itemField.value ?? ''}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="font-body bg-background text-sm h-10">
                                                                <SelectValue placeholder="Select location" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="max-h-[200px]">
                                                            <SelectGroup>
                                                                <ShadcnSelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Primary Storage</ShadcnSelectLabel>
                                                                {primaryStorageLocations.map(loc => (
                                                                    <SelectItem key={loc} value={loc} className="font-body">{loc}</SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                            <SelectGroup>
                                                                <ShadcnSelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Secondary Storage</ShadcnSelectLabel>
                                                                {secondaryStorageLocations.map(loc => (
                                                                    <SelectItem key={loc} value={loc} className="font-body">{loc}</SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                            <SelectItem value={ADD_NEW_LOCATION_VALUE} className="font-body font-semibold text-primary">
                                                                -- Add New Location --
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`locations.${index}.quantity`}
                                            render={({ field: itemField }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter quantity"
                                                            {...itemField}
                                                            className="font-body bg-background text-sm h-10"
                                                            value={itemField.value ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                itemField.onChange(val === '' ? undefined : parseInt(val, 10));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(index)} className="text-destructive hover:bg-destructive/10 mt-6">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {form.watch(`locations.${index}.name`) === ADD_NEW_LOCATION_VALUE && (
                                        <FormField
                                            control={form.control}
                                            name={`locations.${index}.customLocationName`}
                                            render={({ field: itemField }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel className="text-xs">New Location Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter location name" {...itemField} className="font-body bg-background text-sm h-10" value={itemField.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {overallRemainingToAllocate < 0 ? (
                                            <span className="text-destructive font-medium">
                                                Over-allocated by {Math.abs(overallRemainingToAllocate)} units
                                            </span>
                                        ) : overallRemainingToAllocate > 0 ? (
                                            <span className="text-amber-600 font-medium flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                {overallRemainingToAllocate} unallocated units will go to B-Plushy Room
                                            </span>
                                        ) : (
                                            <span className="text-green-600 font-medium flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                All units allocated
                                            </span>
                                        )}
                                    </p>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendLocation({ name: primaryStorageLocations[0] || "", quantity: 0, isNewLocation: false, customLocationName: "" })} className="font-body w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Another Location
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Payout Rules (Optional)</Label>
                        <div className="space-y-3 mt-2">
                            {payoutFields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md bg-secondary/30">
                                    <FormField
                                        control={form.control}
                                        name={`payouts.${index}.playCost`}
                                        render={({ field: itemField }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel className="text-xs">Play Cost ($)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="e.g., 2.00" className="font-body bg-background"
                                                        {...itemField}
                                                        onChange={e => itemField.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                        value={itemField.value as string | number | undefined ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`payouts.${index}.playsRequired`}
                                        render={({ field: itemField }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel className="text-xs">Plays Required</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g., 6" className="font-body bg-background"
                                                        {...itemField}
                                                        onChange={e => itemField.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                        value={itemField.value as string | number | undefined ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removePayout(index)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendPayout({ playCost: '', playsRequired: '' })}
                            className="mt-2 font-body text-foreground"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Payout Rule
                        </Button>
                        <FormMessage>{form.formState.errors.payouts?.message || form.formState.errors.payouts?.root?.message}</FormMessage>
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel>Item Notes/Description (Optional)</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateDescription}
                                        disabled={isGeneratingNote || !watchName || !watchCategory || watchCategory === ADD_NEW_CATEGORY_VALUE}
                                        className="font-body text-xs"
                                    >
                                        <WandSparkles className={cn("mr-2 h-4 w-4", isGeneratingNote && "animate-spin")} />
                                        {isGeneratingNote ? "Generating..." : "Generate Desc."}
                                    </Button>
                                </div>
                                {isGeneratingNote ? (
                                    <Skeleton className="h-24 w-full" />
                                ) : (
                                    <FormControl>
                                        <Textarea placeholder="Additional details about the item..." {...field} className="font-body" value={field.value ?? ''} />
                                    </FormControl>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="space-y-4 rounded-md border p-4 bg-secondary/10">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="flex w-full justify-between p-0 hover:bg-transparent">
                                <h3 className="text-md font-semibold leading-none tracking-tight">Advanced (Optional)</h3>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", isAdvancedOpen && "rotate-180")} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., PLU-001" {...field} className="font-body" value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="brand"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Disney" {...field} className="font-body" value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., popular, seasonal, limited (comma-separated)" {...field} className="font-body" value={field.value ?? ''} />
                                        </FormControl>
                                        <FormDescription className="text-xs">Separate tags with commas</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-semibold mb-3">Supply Chain</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="vendor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vendor/Supplier</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Acme Co." {...field} className="font-body" value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="costPerUnit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cost Per Unit</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        className="font-body"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : parseFloat(val));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="reorderPoint"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reorder Point</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="font-body"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : parseInt(val, 10));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">Alert when stock reaches this level</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-semibold mb-3">Physical Specifications</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="weightGrams"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Weight (g)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="font-body"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : parseFloat(val));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="lengthCm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Length (cm)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="font-body"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : parseFloat(val));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="widthCm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Width (cm)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="font-body"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : parseFloat(val));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="heightCm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Height (cm)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="font-body"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : parseFloat(val));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-semibold mb-3">Pricing</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cost (Unit Price)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="0.00" className="font-body"
                                                        {...field}
                                                        onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                        value={field.value as string | number | undefined ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ticket Value</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="0" className="font-body"
                                                        {...field}
                                                        onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                        value={field.value as string | number | undefined ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="font-body">
                            Cancel
                        </Button>
                        <Button type="submit" className="font-body bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isGeneratingNote}>
                            {initialData ? "Update Item" : "Add Item"}
                        </Button>
                    </div>
                </form >
            </Form >
        </>
    );
}
