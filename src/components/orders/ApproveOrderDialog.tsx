"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReorderRequest } from "@/types";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ApproveOrderDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    request: ReorderRequest & { itemName?: string };
    onSubmit: (approvedQty: number, rejectedQty: number, notes?: string) => void;
}

export function ApproveOrderDialog({ isOpen, onOpenChange, request, onSubmit }: ApproveOrderDialogProps) {
    const approveSchema = z.object({
        approvedQuantity: z.coerce.number().int().min(0, "Must be 0 or more").max(request.quantityRequested, `Cannot exceed ${request.quantityRequested}`),
        notes: z.string().optional(),
    });

    const form = useForm<any>({
        resolver: zodResolver(approveSchema),
        defaultValues: {
            approvedQuantity: request.quantityRequested,
            notes: "",
        },
    });

    // Reset form when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            form.reset({
                approvedQuantity: request.quantityRequested,
                notes: "",
            });
        }
    }, [isOpen, form, request.quantityRequested]);

    const watchApproved = form.watch("approvedQuantity");
    const approvedQty = typeof watchApproved === 'number' ? watchApproved : parseInt(String(watchApproved)) || 0;
    const rejectedQty = request.quantityRequested - approvedQty;

    const handleFormSubmit = (data: z.infer<typeof approveSchema>) => {
        const approved = data.approvedQuantity;
        const rejected = request.quantityRequested - approved;
        onSubmit(approved, rejected, data.notes);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Approve Order</DialogTitle>
                    <DialogDescription>
                        Review and approve the order for <strong>{request.itemName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        {/* Request Summary */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Requested Quantity</span>
                                <span className="font-bold text-lg">{request.quantityRequested}</span>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="approvedQuantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity to Approve</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                field.onChange(isNaN(val) ? 0 : Math.min(val, request.quantityRequested));
                                            }}
                                            min={0}
                                            max={request.quantityRequested}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Approval/Rejection Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Approved</span>
                                </div>
                                <p className="text-2xl font-bold text-green-700 mt-1">{approvedQty}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${rejectedQty > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                                <div className={`flex items-center gap-2 ${rejectedQty > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Rejected</span>
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${rejectedQty > 0 ? 'text-red-700' : 'text-gray-500'}`}>{rejectedQty}</p>
                            </div>
                        </div>

                        {/* Warning for partial approval */}
                        {rejectedQty > 0 && approvedQty > 0 && (
                            <Alert variant="default" className="bg-amber-50 border-amber-200">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">Partial Approval</AlertTitle>
                                <AlertDescription className="text-amber-700">
                                    {approvedQty} units will be approved and {rejectedQty} units will be rejected.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Full rejection warning */}
                        {approvedQty === 0 && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Full Rejection</AlertTitle>
                                <AlertDescription>
                                    The entire order of {request.quantityRequested} units will be rejected.
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes {rejectedQty > 0 && "(Reason for rejection)"}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={rejectedQty > 0 ? "Why was this (partially) rejected?" : "Optional notes..."}
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            {approvedQty === 0 ? (
                                <Button type="submit" variant="destructive">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject All
                                </Button>
                            ) : rejectedQty > 0 ? (
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve {approvedQty} / Reject {rejectedQty}
                                </Button>
                            ) : (
                                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve All
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
