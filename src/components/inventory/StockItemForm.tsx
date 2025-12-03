"use client";

import * as React from "react";

/**
 * Placeholder component for the Add Item form.
 * The original, fully‑featured form has been removed per the user request.
 * It accepts the same props as before so that existing imports continue to work,
 * but it simply renders a minimal UI indicating that the form will be implemented later.
 */
interface StockItemFormProps {
    onSubmit?: (data: any) => void;
    onCancel?: () => void;
    categories?: string[];
    sizes?: string[];
    initialData?: any;
    machines?: any[];
}

export function StockItemForm({ onSubmit, onCancel, categories, sizes, initialData, machines }: StockItemFormProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <h2 className="text-xl font-semibold mb-2">Add Item Form Placeholder</h2>
            <p className="text-sm">The full StockItemForm will be implemented later.</p>
        </div>
    );
}
