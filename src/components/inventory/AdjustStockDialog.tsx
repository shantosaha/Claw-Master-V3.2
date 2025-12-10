"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Not directly used, but good to keep if needed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel as ShadcnSelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { StockItem, AdjustStockFormValues, User, ReorderRequest } from "@/types";
import { PackagePlus, PackageMinus, PackageCheck, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Changed from use-toast to sonner

const SELECT_OTHER_VALUE = "__SELECT_OTHER__";

const criticalNumericOptionsForSelect = [
    "5 units (Critical)",
    "10 units (Critical)",
    "15 units (Critical)",
];

const commonNumericOptionsForSelect = [
    "1 unit",
    "20 units",
    "30 units (1 Bucket)",
    "60 units (2 Buckets)",
    "100 units (1 Week)",
    "200 units (Full Stock)",
    "Few pieces (Approx 3 Units)"
];

const groupedQuantityOptionsForSelect = [
    { label: "Critical Values", options: criticalNumericOptionsForSelect },
    { label: "Common Values", options: commonNumericOptionsForSelect }
];

const parseNumericInput = (input: any): number => {
    if (typeof input === 'number') return input;
    if (typeof input === 'string') {
        const trimmed = input.trim().toLowerCase();
        const firstNumericPart = trimmed.match(/\d+/);
        if (firstNumericPart && firstNumericPart[0]) {
            const num = parseInt(firstNumericPart[0], 10);
            // Check if the string primarily represents this number
            if (trimmed.startsWith(num.toString()) || trimmed.includes(`${num} unit`)) {
                return num;
            }
        }
        if (trimmed.includes("critical")) {
            if (firstNumericPart && firstNumericPart[0]) return parseInt(firstNumericPart[0], 10);
            return 1;
        }
        if (trimmed.includes("few pieces")) return 3;
        if (trimmed.includes("full stock") || trimmed.includes("2 weeks") || trimmed.includes("two weeks")) return 200;
        if (trimmed.includes("1 week") || trimmed.includes("one week")) return 100;
        const bucketMatch = trimmed.match(/^(\d+)\s*bucket(s)?/);
        if (bucketMatch && bucketMatch[1]) return parseInt(bucketMatch[1], 10) * 30;
        if (trimmed.includes("one bucket") || trimmed.includes("1 bucket")) return 30;

        if (firstNumericPart && firstNumericPart[0]) return parseInt(firstNumericPart[0], 10);
        return 0;
    }
    return 0;
};


const adjustStockSchemaStep1 = z.object({
    locationName: z.string().min(1, "Location is required."),
    adjustmentType: z.enum(["add", "remove", "set"]),
    selectedQuantity: z.string().min(1, { message: "Please select or specify the quantity." }),
    customQuantity: z.string().optional(),
    notes: z.string().optional(),
});


const createAdjustStockSchema = (requestToReceive?: ReorderRequest | null) => {
    return adjustStockSchemaStep1.superRefine((data, ctx) => {
        if (data.selectedQuantity === SELECT_OTHER_VALUE && (!data.customQuantity || data.customQuantity.trim() === "")) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Custom quantity is required if 'Other (Specify)' is selected.",
                path: ["customQuantity"],
            });
        }
    }).transform(data => {
        const numericQuantity = parseNumericInput(
            data.selectedQuantity === SELECT_OTHER_VALUE && data.customQuantity
                ? data.customQuantity
                : data.selectedQuantity
        );
        return {
            ...data,
            quantity: numericQuantity,
        };
    }).superRefine((data, ctx) => {
        if (requestToReceive) {
            const remainingToReceive = requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0);
            if (data.quantity > remainingToReceive) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["selectedQuantity"],
                    message: `Cannot receive more than the ${remainingToReceive} units remaining for this order.`,
                });
            }
        }
    });
};


interface AdjustStockDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: StockItem | null;
    onSubmit: (itemId: string, values: AdjustStockFormValues) => void;
    user: User | null;
    requestToReceive?: ReorderRequest | null;
}

export function AdjustStockDialog({ isOpen, onOpenChange, item, onSubmit, user, requestToReceive }: AdjustStockDialogProps) {
    // const { toast } = useToast(); // Removed hook

    const defaultLocation = item?.locations?.[0]?.name || (item ? `${item.name} (Main Stock)` : "");
    const defaultQuantityOption = commonNumericOptionsForSelect[0] || "";

    const form = useForm<z.infer<typeof adjustStockSchemaStep1>>({
        resolver: async (data, context, options) => {
            const schema = createAdjustStockSchema(requestToReceive);
            return zodResolver(schema)(data, context, options);
        },
        defaultValues: {
            locationName: defaultLocation,
            adjustmentType: "add",
            selectedQuantity: defaultQuantityOption,
            customQuantity: "",
            notes: "",
        },
    });

    const watchSelectedQuantity = form.watch("selectedQuantity");
    const watchCustomQuantity = form.watch("customQuantity");
    const watchAdjustmentType = form.watch("adjustmentType");
    const watchLocationName = form.watch("locationName");

    const currentItemQuantityAtLocation = React.useMemo(() => {
        if (!item || !watchLocationName) return 0;
        const loc = item.locations?.find(l => l.name === watchLocationName);
        return loc?.quantity || 0;
    }, [item, watchLocationName]);

    const quantityToAdjust = React.useMemo(() => {
        return parseNumericInput(
            watchSelectedQuantity === SELECT_OTHER_VALUE && watchCustomQuantity
                ? watchCustomQuantity
                : watchSelectedQuantity
        );
    }, [watchSelectedQuantity, watchCustomQuantity]);

    const [discrepancy, setDiscrepancy] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (requestToReceive) {
            const remainingToReceive = requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0);
            const diff = remainingToReceive - quantityToAdjust;
            setDiscrepancy(diff);
        } else {
            setDiscrepancy(null);
        }
    }, [quantityToAdjust, requestToReceive]);

    const newQuantityAfterAdjustment = React.useMemo(() => {
        let newQty = currentItemQuantityAtLocation;
        switch (watchAdjustmentType) {
            case 'add':
                newQty += quantityToAdjust;
                break;
            case 'remove':
                newQty -= quantityToAdjust;
                break;
            case 'set':
                newQty = quantityToAdjust;
                break;
        }
        return Math.max(0, newQty); // Quantity cannot be negative
    }, [currentItemQuantityAtLocation, quantityToAdjust, watchAdjustmentType]);


    React.useEffect(() => {
        if (item && isOpen) {
            const currentUserName = user?.displayName || user?.email || "System"; // Changed from user.name
            const currentTime = new Date().toLocaleString();

            const quantityFromRequest = requestToReceive
                ? requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0)
                : undefined;

            const defaultNotes = requestToReceive
                ? `Receiving order for request #${requestToReceive.id}.`
                : `Stock adjusted by ${currentUserName} on ${currentTime}. Reason: `;

            form.reset({
                locationName: item.locations?.[0]?.name || `${item.name} (Main Stock)`,
                adjustmentType: "add",
                selectedQuantity: quantityFromRequest ? SELECT_OTHER_VALUE : (commonNumericOptionsForSelect[0] || ""),
                customQuantity: quantityFromRequest ? String(quantityFromRequest) : "",
                notes: defaultNotes,
            });
        }
    }, [item, isOpen, form, user, requestToReceive]);

    if (!item) return null;

    const handleSubmit = (data: z.infer<typeof adjustStockSchemaStep1>) => {
        const schema = createAdjustStockSchema(requestToReceive);
        const result = schema.safeParse(data);

        if (result.success) {
            const processedData = result.data;
            if (requestToReceive) {
                const currentUserName = user?.displayName || user?.email || "System";
                const currentTime = new Date().toLocaleString();
                const remainingToReceive = requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0);
                const discrepancyValue = remainingToReceive - processedData.quantity;

                const baseNote = `Received by ${currentUserName} on ${currentTime}.`;

                if (discrepancyValue > 0 && processedData.quantity > 0) {
                    processedData.notes = `Partial Receipt: Received ${processedData.quantity} of ${remainingToReceive} remaining units from request #${requestToReceive.id}. ${baseNote}`;
                } else if (processedData.quantity > 0) {
                    processedData.notes = `Final Receipt: Received remaining ${processedData.quantity} units from request #${requestToReceive.id}. ${baseNote}`;
                } else {
                    processedData.notes = data.notes;
                }
            }

            onSubmit(item.id, processedData);
            onOpenChange(false);
        } else {
            toast.error("Validation Error", {
                description: "Please check the form for errors.",
            });
        }
    };

    const locationOptions = item.locations && item.locations.length > 0
        ? item.locations
        : [{ name: `${item.name} (Main Stock)`, quantity: 0 }];


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">Adjust Stock for: {item.name}</DialogTitle>
                    <DialogDescription className="font-body">
                        Modify the quantity for a specific location.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="locationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select a location" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {locationOptions.map((loc) => (
                                                <SelectItem key={loc.name} value={loc.name} className="font-body">
                                                    {loc.name} (Current: {item.locations?.find(l => l.name === loc.name)?.quantity || 0} units)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="adjustmentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!requestToReceive}>
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select adjustment type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="add" className="font-body flex items-center"><PackagePlus className="mr-2 h-4 w-4" /> Add to Stock</SelectItem>
                                            <SelectItem value="remove" className="font-body flex items-center"><PackageMinus className="mr-2 h-4 w-4" /> Remove from Stock</SelectItem>
                                            <SelectItem value="set" className="font-body flex items-center"><PackageCheck className="mr-2 h-4 w-4" /> Set New Quantity</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="selectedQuantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity to Adjust / Set</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            if (value !== SELECT_OTHER_VALUE) {
                                                form.setValue("customQuantity", "");
                                            }
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select or specify quantity" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {groupedQuantityOptionsForSelect.map((group) => (
                                                <SelectGroup key={group.label}>
                                                    <ShadcnSelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{group.label}</ShadcnSelectLabel>
                                                    {group.options.map(opt => (
                                                        <SelectItem key={opt} value={opt} className="font-body">{opt}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                            <SelectItem value={SELECT_OTHER_VALUE} className="font-body font-semibold text-primary">
                                                -- Other (Specify) --
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {watchSelectedQuantity === SELECT_OTHER_VALUE && (
                            <FormField
                                control={form.control}
                                name="customQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Custom Quantity</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter number or description" {...field} className="font-body" />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground pt-1">Enter a number e.g., 7 or description '1 bucket'.</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {requestToReceive && discrepancy !== null && discrepancy !== 0 && (
                            <Alert variant={discrepancy > 0 ? "default" : "destructive"} className={cn(discrepancy > 0 && "bg-blue-50 border-blue-200 text-blue-800")}>
                                <AlertTriangle className={cn("h-4 w-4", discrepancy > 0 ? "text-blue-500" : "text-destructive")} />
                                <AlertTitle>{discrepancy > 0 ? "Partial Receipt" : "Over Receipt"}</AlertTitle>
                                <AlertDescription>
                                    You are about to receive {Math.abs(discrepancy)} {discrepancy > 0 ? "fewer" : "more"} units than remaining. This will be logged.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="text-sm font-body text-muted-foreground">
                            Current at location: <span className="font-semibold text-foreground">{currentItemQuantityAtLocation} units</span>.
                            New quantity will be: <span className="font-semibold text-foreground">{newQuantityAfterAdjustment} units</span>.
                        </div>


                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Reason for adjustment..." {...field} className="font-body" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-body">Cancel</Button>
                            <Button type="submit" className="font-body bg-primary text-primary-foreground">Apply Adjustment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
