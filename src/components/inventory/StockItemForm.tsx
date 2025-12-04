"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Camera, Image as ImageIcon, Check, ChevronsUpDown, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateStockItemNote } from "@/ai/flows/generate-stock-item-note-flow";
import { toast } from "sonner";
import { ArcadeMachine } from "@/types";

// --- Schema Definition ---

const stockItemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    category: z.string().min(1, "Category is required"),
    size: z.string().optional(),
    totalQuantity: z.coerce.number().min(0, "Quantity cannot be negative"),
    lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
    cost: z.coerce.number().optional(),
    ticketValue: z.coerce.number().optional(),
    description: z.string().optional(),
    assignedMachineId: z.string().optional(),
    assignedSlotId: z.string().optional(),
    locations: z.array(z.object({
        name: z.string().min(1, "Location name is required"),
        quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
    })),
    payouts: z.array(z.object({
        playCost: z.coerce.number().min(0),
        playsRequired: z.coerce.number().min(1),
    })).optional(),
    imageUrls: z.array(z.string()).optional(),
});

type StockItemFormValues = z.infer<typeof stockItemSchema>;

interface StockItemFormProps {
    onSubmit?: (data: any) => void;
    onCancel?: () => void;
    categories?: string[];
    sizes?: string[];
    initialData?: any;
    machines?: ArcadeMachine[];
}

export function StockItemForm({
    onSubmit,
    onCancel,
    categories = [],
    sizes = ["Small", "Medium", "Large", "Big"],
    initialData,
    machines = [],
}: StockItemFormProps) {
    const [isGeneratingNote, setIsGeneratingNote] = React.useState(false);
    const [previewImages, setPreviewImages] = React.useState<string[]>(initialData?.imageUrls || []);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const cameraInputRef = React.useRef<HTMLInputElement>(null);

    // Default values
    const defaultValues: Partial<StockItemFormValues> = {
        name: initialData?.name || "",
        category: initialData?.category || "",
        size: initialData?.size || "",
        totalQuantity: initialData?.quantity || 0,
        lowStockThreshold: initialData?.lowStockThreshold || 10,
        cost: initialData?.cost || undefined,
        ticketValue: initialData?.value || undefined,
        description: initialData?.description || "",
        assignedMachineId: initialData?.assignedMachineId || "none",
        assignedSlotId: initialData?.assignedSlotId || "any",
        locations: initialData?.locations || [{ name: "Warehouse", quantity: 0 }],
        payouts: initialData?.payouts || [],
        imageUrls: initialData?.imageUrls || [],
    };

    const form = useForm<StockItemFormValues>({
        resolver: zodResolver(stockItemSchema) as any,
        defaultValues,
    });

    const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
        control: form.control,
        name: "locations",
    });

    const { fields: payoutFields, append: appendPayout, remove: removePayout } = useFieldArray({
        control: form.control,
        name: "payouts",
    });

    // --- Sync Quantity Logic ---
    const locations = form.watch("locations");
    const totalQuantity = form.watch("totalQuantity");

    // Update totalQuantity when locations change
    React.useEffect(() => {
        const sum = locations.reduce((acc, loc) => acc + (Number(loc.quantity) || 0), 0);
        if (sum !== totalQuantity) {
            form.setValue("totalQuantity", sum);
        }
    }, [locations, form.setValue]);

    // Update first location when totalQuantity changes (if it was manual input)
    // This is tricky because of the circular dependency. 
    // We'll rely on the user editing the locations for precise control, 
    // and if they edit totalQuantity, we update the first location.
    const handleTotalQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTotal = Number(e.target.value);
        form.setValue("totalQuantity", newTotal);

        const currentLocations = form.getValues("locations");
        if (currentLocations.length > 0) {
            // Update the first location to absorb the difference or set it?
            // Let's just set the first location to the new total if it's the only one,
            // or if there are multiple, we might need a better strategy.
            // For simplicity: If 1 location, update it. If multiple, warn or disable?
            // Let's just update the first location.
            const diff = newTotal - (currentLocations.reduce((sum, loc, idx) => idx === 0 ? sum : sum + (Number(loc.quantity) || 0), 0));
            // Actually, simpler: Set first location = newTotal - sum(others)
            const otherSum = currentLocations.slice(1).reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0);
            const newFirstQty = Math.max(0, newTotal - otherSum);

            const newLocations = [...currentLocations];
            newLocations[0].quantity = newFirstQty;
            form.setValue("locations", newLocations);
        } else {
            // No locations, add one
            form.setValue("locations", [{ name: "Warehouse", quantity: newTotal }]);
        }
    };

    // --- Image Handling ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newImages: string[] = [];
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        newImages.push(event.target.result as string);
                        if (newImages.length === files.length) {
                            setPreviewImages(prev => [...prev, ...newImages]);
                            form.setValue("imageUrls", [...previewImages, ...newImages]);
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        const newImages = previewImages.filter((_, i) => i !== index);
        setPreviewImages(newImages);
        form.setValue("imageUrls", newImages);
    };

    // --- AI Generation ---

    const handleGenerateDescription = async () => {
        const name = form.getValues("name");
        const category = form.getValues("category");

        if (!name || !category) {
            toast.error("Missing Information", { description: "Please enter Item Name and Category first." });
            return;
        }

        setIsGeneratingNote(true);
        try {
            const result = await generateStockItemNote({ itemName: name, itemCategory: category });
            form.setValue("description", result.generatedNote);
            toast.success("Description Generated");
        } catch (error) {
            toast.error("Generation Failed", { description: "Could not generate description." });
        } finally {
            setIsGeneratingNote(false);
        }
    };

    // --- Submission ---

    const handleSubmit = (data: StockItemFormValues) => {
        // Transform data if necessary
        const formattedData = {
            ...data,
            assignedMachineId: data.assignedMachineId === "none" ? null : data.assignedMachineId,
            assignedSlotId: data.assignedSlotId === "any" ? null : data.assignedSlotId,
            // Ensure numbers are numbers
            totalQuantity: Number(data.totalQuantity),
            lowStockThreshold: Number(data.lowStockThreshold),
            cost: data.cost ? Number(data.cost) : undefined,
            ticketValue: data.ticketValue ? Number(data.ticketValue) : undefined,
        };
        onSubmit?.(formattedData);
    };

    // --- Machine & Slot Logic ---
    const selectedMachineId = form.watch("assignedMachineId");
    const selectedMachine = machines.find(m => m.id === selectedMachineId);
    const machineSlots = selectedMachine?.slots || [];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

                {/* 1. Media and Core Item Data */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Media & Core Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <FormLabel>Images</FormLabel>
                            <div className="flex flex-wrap gap-4">
                                {previewImages.map((img, index) => (
                                    <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                        <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5">
                                                Main
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-24 h-24 flex flex-col items-center justify-center gap-2 border-dashed"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Add Image</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-24 h-24 flex flex-col items-center justify-center gap-2 border-dashed"
                                        onClick={() => cameraInputRef.current?.click()}
                                    >
                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Camera</span>
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                                <input
                                    type="file"
                                    ref={cameraInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>

                        {/* Core Fields */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item Name <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Red Dragon Plush" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="totalQuantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e); // Update form state
                                                        handleTotalQuantityChange(e); // Trigger sync
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
                                            <FormLabel>Low Stock Alert</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* 2. Categorization */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Categorization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => {
                                const [open, setOpen] = React.useState(false);
                                const [searchValue, setSearchValue] = React.useState("");

                                return (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Category</FormLabel>
                                        <Popover open={open} onOpenChange={setOpen} modal={true}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={open}
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? categories.find((category) => category === field.value) || field.value
                                                            : "Select category"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search category..."
                                                        value={searchValue}
                                                        onValueChange={setSearchValue}
                                                    />
                                                    <CommandList className="max-h-[200px] overflow-y-auto">
                                                        <CommandEmpty className="py-2 px-2">
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start text-sm h-8"
                                                                onClick={() => {
                                                                    field.onChange(searchValue);
                                                                    setOpen(false);
                                                                    setSearchValue("");
                                                                }}
                                                            >
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create "{searchValue}"
                                                            </Button>
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {categories.map((category) => (
                                                                <CommandItem
                                                                    key={category}
                                                                    value={category}
                                                                    onSelect={(currentValue) => {
                                                                        // If the value matches an existing category (case-insensitive usually), select it.
                                                                        // Note: CommandItem value is usually lowercase. We want the original casing from 'category'.
                                                                        field.onChange(category);
                                                                        setOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            category === field.value ? "opacity-100" : "opacity-0"
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
                                );
                            }}
                        />

                        <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Size</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select size" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sizes.map((size) => (
                                                <SelectItem key={size} value={size}>
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
                </div>

                <Separator />

                {/* 3. Location and Machine Assignment */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Location & Assignment</h3>

                    {/* Machine & Slot */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="assignedMachineId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Machine</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            form.setValue("assignedSlotId", "any");
                                        }}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select machine" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">No Machine Assigned</SelectItem>
                                            {machines.map((machine) => (
                                                <SelectItem key={machine.id} value={machine.id}>
                                                    {machine.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedMachineId && selectedMachineId !== "none" && (
                            <FormField
                                control={form.control}
                                name="assignedSlotId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Slot</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select slot" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="any">Any Slot</SelectItem>
                                                {machineSlots.map((slot) => (
                                                    <SelectItem key={slot.id} value={slot.id}>
                                                        {slot.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    {/* Locations List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>Locations & Quantities</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendLocation({ name: "", quantity: 0 })}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Location
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {locationFields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-start">
                                    <FormField
                                        control={form.control}
                                        name={`locations.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    {/* Using a simple input for now, but could be a combobox if we had a list of locations */}
                                                    <Input placeholder="Location Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`locations.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem className="w-24">
                                                <FormControl>
                                                    <Input type="number" placeholder="Qty" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLocation(index)}
                                        className="mt-0.5"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* 4. Payout Rules and Financial Data */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Financials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit Cost ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ticketValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ticket Value</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Payout Rules */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>Payout Rules</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendPayout({ playCost: 2, playsRequired: 10 })}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Rule
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {payoutFields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-center">
                                    <div className="flex-1 flex gap-2 items-center">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">Cost: $</span>
                                        <FormField
                                            control={form.control}
                                            name={`payouts.${index}.playCost`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input type="number" step="0.5" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 flex gap-2 items-center">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">Plays:</span>
                                        <FormField
                                            control={form.control}
                                            name={`payouts.${index}.playsRequired`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removePayout(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* 5. Description */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>Description / Notes</FormLabel>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingNote}
                            className="text-primary"
                        >
                            {isGeneratingNote ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            Generate Desc.
                        </Button>
                    </div>
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter item description or notes..."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? "Update Item" : "Add Item"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
