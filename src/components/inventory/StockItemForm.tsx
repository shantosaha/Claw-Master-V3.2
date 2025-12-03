"use client";

import * as React from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PlusCircle, Trash2, Image as ImageIcon, XCircle, WandSparkles, Camera, Gamepad2, ChevronsUpDown, Check, AlertTriangle } from "lucide-react";
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

const ADD_NEW_CATEGORY_VALUE = "add_new_category_custom_value";
const NO_MACHINE_ASSIGNED_VALUE = "no_machine_assigned";
const ANY_SLOT_VALUE = "any_slot";

const addStockItemSchemaStep1 = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    category: z.string().min(1, { message: "Category is required." }),
    size: z.string().optional(),
    newCategoryName: z.string().optional(),
    imageUrl: z.any().optional(),
    imageUrls: z.array(z.any()).optional(),
    aiImageHint: z.string().optional(),

    quantity: z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : val),
        z.coerce.number().int().nonnegative({ message: "Quantity must be a non-negative integer." }).optional()
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
            quantity: z.preprocess(
                (val) => (String(val).trim() === '' ? undefined : val),
                z.coerce.number().int().nonnegative({ message: "Quantity must be a non-negative integer." }).optional()
            ),
        })
    ).min(1, { message: "At least one location with quantity must be specified." }),

    assignedMachineId: z.string().optional(),
    assignedSlotId: z.string().optional(),
    assignmentType: z.enum(["Using", "Replacement"]).optional(),

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
            code: z.ZodIssueCode.custom,
            path: ["assignedMachineId"],
            message: "A machine must be selected if a specific slot is chosen.",
        });
    }

    if (data.assignedMachineId && data.assignedMachineId !== NO_MACHINE_ASSIGNED_VALUE && !data.assignmentType) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["assignmentType"],
            message: "Please select an assignment type (Using or Replacement).",
        });
    }
});

const addStockItemSchemaIntermediate = addStockItemSchemaStep1.transform(data => {
    const numericLowStockThreshold = data.lowStockThreshold ?? 0;

    const numericLocationsParsed = (data.locations || []).map(loc => ({
        name: loc.name,
        quantity: loc.quantity ?? 0,
    }));

    const sumOfLocationQuantities = numericLocationsParsed.reduce((sum, loc) => sum + (loc.quantity || 0), 0);

    return {
        ...data,
        _numericLowStockThreshold: numericLowStockThreshold,
        _numericLocationsParsed: numericLocationsParsed,
        _parsedOverallNumericQuantity: data.quantity ?? 0,
        _sumOfLocationQuantities: sumOfLocationQuantities,
    };
});

const stockItemFormSchema = addStockItemSchemaIntermediate.superRefine((data, ctx) => {
    if (data.category === ADD_NEW_CATEGORY_VALUE && (!data.newCategoryName || data.newCategoryName.trim() === "")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New category name is required if 'Add New Category' is selected.", path: ["newCategoryName"] });
    }

    const { _numericLowStockThreshold, _parsedOverallNumericQuantity } = data;

    if (_parsedOverallNumericQuantity > 0 && _numericLowStockThreshold > _parsedOverallNumericQuantity) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Low stock threshold (${_numericLowStockThreshold} units) cannot exceed the overall described quantity (${_parsedOverallNumericQuantity} units).`,
            path: ["lowStockThreshold"],
        });
    }
    if (_parsedOverallNumericQuantity === 0 && _numericLowStockThreshold > 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Low stock threshold must be 0 if the overall quantity is 0. Consider increasing overall quantity or setting threshold to 0.`,
            path: ["lowStockThreshold"],
        });
    }
})
    .transform(data => {
        const transformedPayouts = (data.payouts || []).map(p => ({
            playCost: p.playCost,
            playsRequired: p.playsRequired,
        })).filter(p => p.playCost !== undefined && p.playsRequired !== undefined);

        return {
            name: data.name,
            category: data.category,
            newCategoryName: data.newCategoryName,
            imageUrl: data.imageUrl,
            imageUrls: data.imageUrls,
            aiImageHint: data.aiImageHint,
            quantity: data._parsedOverallNumericQuantity,
            lowStockThreshold: data._numericLowStockThreshold,
            description: data.description,
            size: data.size,
            cost: data.cost,
            value: data.value,
            locations: (data._numericLocationsParsed || []).map(loc => ({ name: loc.name, quantity: loc.quantity })),
            payouts: transformedPayouts.length > 0 ? transformedPayouts : undefined,
            assignedMachineId: data.assignedMachineId === NO_MACHINE_ASSIGNED_VALUE ? undefined : data.assignedMachineId,
            assignedSlotId: data.assignedSlotId,
            assignmentType: data.assignmentType,
            _parsedOverallNumericQuantity: data._parsedOverallNumericQuantity,
            _sumOfLocationQuantities: data._sumOfLocationQuantities,
        };
    });

type RawFormValues = z.input<typeof addStockItemSchemaStep1>;

interface StockItemFormProps {
    onSubmit: (data: StockItemFormOutputValues) => void;
    onCancel: () => void;
    categories: string[];
    sizes: string[];
    initialData?: StockItem;
    machines: ArcadeMachine[];
}

export function StockItemForm({ onSubmit, onCancel, categories, sizes, initialData, machines }: StockItemFormProps) {
    const [previewImages, setPreviewImages] = React.useState<string[]>(initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : []));
    const [isGeneratingNote, setIsGeneratingNote] = React.useState(false);
    const { toast } = useToast();
    const [categoryOpen, setCategoryOpen] = React.useState(false);
    const [sizeOpen, setSizeOpen] = React.useState(false);
    const [machineOpen, setMachineOpen] = React.useState(false);
    const [slotOpen, setSlotOpen] = React.useState(false);
    const [isValidationErrorDialogOpen, setIsValidationErrorDialogOpen] = React.useState(false);
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

    const generateDefaultFormValues = (item?: StockItem): RawFormValues => {
        if (!item) {
            return {
                name: "",
                category: "",
                size: "",
                newCategoryName: "",
                imageUrl: undefined,
                imageUrls: [],
                aiImageHint: "",
                quantity: 0,
                lowStockThreshold: 0,
                description: "",
                cost: '',
                value: '',
                locations: [{ name: "", quantity: 0 }],
                assignedMachineId: NO_MACHINE_ASSIGNED_VALUE,
                assignedSlotId: undefined,
                assignmentType: undefined,
                payouts: [{ playCost: '', playsRequired: '' }],
            };
        }

        return {
            name: item.name,
            category: item.category,
            size: item.size || "",
            newCategoryName: "",
            imageUrl: item.imageUrl || undefined,
            imageUrls: item.imageUrls || [],
            aiImageHint: item.aiImageHint || "",
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
            description: item.description || "",
            cost: item.cost !== undefined ? String(item.cost) : '',
            value: item.value !== undefined ? String(item.value) : '',
            locations: item.locations && item.locations.length > 0
                ? item.locations.map(loc => ({
                    name: loc.name,
                    quantity: loc.quantity,
                }))
                : [{ name: "", quantity: 0 }],
            assignedMachineId: item.assignedMachineId || NO_MACHINE_ASSIGNED_VALUE,
            assignedSlotId: item.assignedSlotId,
            assignmentType: item.assignmentType,
            payouts: item.payouts && Array.isArray(item.payouts) && item.payouts.length > 0 && typeof item.payouts[0] === 'object'
                ? (item.payouts as { playCost: number; playsRequired: number }[]).map(p => ({
                    playCost: p.playCost !== undefined ? String(p.playCost) : '',
                    playsRequired: p.playsRequired !== undefined ? String(p.playsRequired) : ''
                }))
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
            setPreviewImages(initialData.imageUrls || (initialData.imageUrl ? [initialData.imageUrl] : []));
        } else {
            form.reset(generateDefaultFormValues());
            setPreviewImages([]);
        }
    }, [initialData]);

    const watchCategory = form.watch("category");
    const watchName = form.watch("name");
    const watchExistingNote = form.watch("description");
    const watchedAssignedMachineId = form.watch("assignedMachineId");

    const availableSlots = React.useMemo(() => {
        if (!watchedAssignedMachineId || watchedAssignedMachineId === NO_MACHINE_ASSIGNED_VALUE) return [];
        const machine = machines.find(m => m.id === watchedAssignedMachineId);
        return machine?.slots || [];
    }, [watchedAssignedMachineId, machines]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newImages: File[] = Array.from(files);
            const currentImages = form.getValues("imageUrls") || [];
            form.setValue("imageUrls", [...currentImages, ...newImages]);

            const newPreviews = newImages.map(file => URL.createObjectURL(file));
            setPreviewImages(prev => [...prev, ...newPreviews]);

            if (currentImages.length === 0 && newImages.length > 0) {
                form.setValue("imageUrl", newImages[0]);
            }
        }
    };

    const removeImage = (index: number) => {
        const currentImages = form.getValues("imageUrls") || [];
        const newImages = [...currentImages];
        newImages.splice(index, 1);
        form.setValue("imageUrls", newImages);

        const newPreviews = [...previewImages];
        newPreviews.splice(index, 1);
        setPreviewImages(newPreviews);

        if (newImages.length > 0) {
            form.setValue("imageUrl", newImages[0]);
        } else {
            form.setValue("imageUrl", null);
        }
    };

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
                variant: "destructive",
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

    const onInvalid = (errors: FieldErrors<RawFormValues>) => {
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

    const handleValidSubmit = (data: any) => {
        onSubmit(data as StockItemFormOutputValues);
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
                    {/* Image Upload Section */}
                    <FormItem>
                        <FormLabel>Item Images (Optional)</FormLabel>
                        <div className="mt-2 flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                {previewImages.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img}
                                            alt={`Item preview ${index + 1}`}
                                            className="w-20 h-20 rounded-md object-cover aspect-square border"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://placehold.co/400x400?text=No+Image";
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(index)}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 rounded-b-md">
                                                Main
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center border border-dashed border-muted-foreground/50">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline" onClick={() => document.getElementById('imageUrlInput')?.click()} className="font-body text-sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Image
                                </Button>
                                <Button type="button" variant="outline" onClick={() => document.getElementById('cameraInput')?.click()} className="font-body text-sm">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Camera
                                </Button>
                            </div>
                            <FormControl>
                                <Input
                                    id="imageUrlInput"
                                    type="file"
                                    className="font-body sr-only"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    aria-hidden="true"
                                    tabIndex={-1}
                                />
                            </FormControl>
                            <FormControl>
                                <Input
                                    id="cameraInput"
                                    type="file"
                                    className="font-body sr-only"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageChange}
                                    aria-hidden="true"
                                    tabIndex={-1}
                                />
                            </FormControl>
                        </div>
                        <FormMessage>{form.formState.errors.imageUrls?.message as string}</FormMessage>
                    </FormItem>

                    {/* Item Name */}
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

                    {/* Quantity and Low Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 100"
                                            {...field}
                                            onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            value={(field.value as number) ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Total number of units available.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lowStockThreshold"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Low Stock Threshold</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 10"
                                            {...field}
                                            onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            value={(field.value as number) ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Alert when stock falls below this amount.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Category and Size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Category</FormLabel>
                                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={categoryOpen}
                                                    className={cn(
                                                        "w-full justify-between font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value || "Select category"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search category..." />
                                                <CommandList>
                                                    <CommandEmpty>No category found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {categories.map((category) => (
                                                            <CommandItem
                                                                key={category}
                                                                value={category}
                                                                onSelect={(currentValue) => {
                                                                    field.onChange(currentValue === field.value ? "" : currentValue);
                                                                    setCategoryOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        category.toLowerCase() === field.value?.toLowerCase()
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {category}
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
                            name="size"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Size</FormLabel>
                                    <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={sizeOpen}
                                                    className={cn(
                                                        "w-full justify-between font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value || "Select size"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search size..." />
                                                <CommandList>
                                                    <CommandEmpty>No size found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {["Small", "Medium", "Large", "Big", ...sizes.filter(s => !["Small", "Medium", "Large", "Big"].includes(s))].map((size) => (
                                                            <CommandItem
                                                                key={size}
                                                                value={size}
                                                                onSelect={(currentValue) => {
                                                                    field.onChange(currentValue === field.value ? "" : currentValue);
                                                                    setSizeOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        size.toLowerCase() === field.value?.toLowerCase()
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {size}
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

                    {/* Machine Assignment */}
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
                                        <Popover open={machineOpen} onOpenChange={setMachineOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={machineOpen}
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
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                                                    <CommandList>
                                                        <CommandEmpty>No machine found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value={NO_MACHINE_ASSIGNED_VALUE}
                                                                onSelect={() => {
                                                                    field.onChange(NO_MACHINE_ASSIGNED_VALUE);
                                                                    form.setValue("assignedSlotId", undefined);
                                                                    form.setValue("assignmentType", undefined);
                                                                    setMachineOpen(false);
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
                                                                        field.onChange(machine.id);
                                                                        form.setValue("assignedSlotId", ANY_SLOT_VALUE);
                                                                        setMachineOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", machine.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex items-center gap-2">
                                                                        {machine.imageUrl ?
                                                                            <Image src={machine.imageUrl} alt={machine.name} width={24} height={24} className="rounded object-cover" data-ai-hint="arcade machine" />
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
                            {watchedAssignedMachineId && watchedAssignedMachineId !== NO_MACHINE_ASSIGNED_VALUE && availableSlots.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="assignedSlotId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Slot</FormLabel>
                                            <Popover open={slotOpen} onOpenChange={setSlotOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={slotOpen}
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? availableSlots.find((slot) => slot.id === field.value)?.name || "Any Slot"
                                                                : "Select slot"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search slot..." />
                                                        <CommandList>
                                                            <CommandEmpty>No slot found.</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    value={ANY_SLOT_VALUE}
                                                                    onSelect={() => {
                                                                        field.onChange(ANY_SLOT_VALUE);
                                                                        setSlotOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === ANY_SLOT_VALUE ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    Any Slot
                                                                </CommandItem>
                                                                {availableSlots.map((slot) => (
                                                                    <CommandItem
                                                                        value={slot.name}
                                                                        key={slot.id}
                                                                        onSelect={() => {
                                                                            field.onChange(slot.id);
                                                                            setSlotOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                slot.id === field.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {slot.name} ({slot.status})
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
                            )}
                        </div>
                    </div>

                    {/* Locations */}
                    <div>
                        <Label className="text-sm font-medium">Locations & Specific Quantities (Units)</Label>
                        <div className="space-y-3 mt-2">
                            {locationFields.map((item, index) => (
                                <div key={item.id} className="flex items-end gap-2 p-3 border rounded-md bg-secondary/30">
                                    <FormField
                                        control={form.control}
                                        name={`locations.${index}.name`}
                                        render={({ field: itemField }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel className={cn(index !== 0 && "sr-only")}>
                                                    Location
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
                                                                    !itemField.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {itemField.value || "Select location"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search location..." />
                                                            <CommandList>
                                                                <CommandEmpty>No location found.</CommandEmpty>
                                                                <CommandGroup heading="Primary Locations">
                                                                    {["B-Plushy Room", "B-Capsule Room", "G-Storage Room", "L-Storage Room"].map((option) => (
                                                                        <CommandItem
                                                                            value={option}
                                                                            key={option}
                                                                            onSelect={(currentValue) => {
                                                                                itemField.onChange(currentValue);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    option.toLowerCase() === itemField.value?.toLowerCase()
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {option}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                                <CommandGroup heading="Secondary Locations">
                                                                    {["Staff Room", "R-Storage", "Drink Room", "Cleaner-Room", "Warehouse"].map((option) => (
                                                                        <CommandItem
                                                                            value={option}
                                                                            key={option}
                                                                            onSelect={(currentValue) => {
                                                                                itemField.onChange(currentValue);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    option.toLowerCase() === itemField.value?.toLowerCase()
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {option}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                                <CommandGroup heading="Custom">
                                                                    <div className="p-2">
                                                                        <Input
                                                                            placeholder="Type custom location..."
                                                                            value={itemField.value || ""}
                                                                            onChange={(e) => itemField.onChange(e.target.value)}
                                                                            className="h-8"
                                                                        />
                                                                    </div>
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
                                        name={`locations.${index}.quantity`}
                                        render={({ field: itemField }) => (
                                            <FormItem className="w-[140px]">
                                                <FormLabel className={cn(index !== 0 && "sr-only")}>
                                                    Quantity
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Qty"
                                                        {...itemField}
                                                        onChange={e => itemField.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                                        value={(itemField.value as number) ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(index)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendLocation({ name: "", quantity: undefined })}
                            className="mt-2 font-body text-foreground"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Location
                        </Button>
                        <FormMessage>{form.formState.errors.locations?.message || form.formState.errors?.locations?.root?.message}</FormMessage>
                    </div>

                    {/* Payout Rules */}
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
                                                        value={(itemField.value as string | number) ?? ''}
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
                                                        value={(itemField.value as string | number) ?? ''}
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

                    {/* Description */}
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

                    {/* Cost and Value */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cost (Unit Price, Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" className="font-body"
                                            {...field}
                                            onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                            value={(field.value as string | number) ?? ''}
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
                                    <FormLabel>Ticket Value (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" className="font-body"
                                            {...field}
                                            onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                            value={(field.value as string | number) ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="font-body">
                            Cancel
                        </Button>
                        <Button type="submit" className="font-body bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isGeneratingNote}>
                            {initialData ? "Update Item" : "Add Item"}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
