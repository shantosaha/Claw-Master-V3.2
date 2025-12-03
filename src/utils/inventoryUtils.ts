
export type StockLevelStatus = "Out of Stock" | "Low Stock" | "Limited Stock" | "In Stock";

export interface StockLevelInfo {
    status: StockLevelStatus;
    label: string;
    colorClass: string;
}

export function calculateStockLevel(quantity: number, explicitStatus?: string): StockLevelInfo {
    if (quantity <= 0) {
        return {
            status: "Out of Stock",
            label: "Out of Stock",
            colorClass: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-50"
        };
    }

    if (quantity <= 11) {
        return {
            status: "Low Stock",
            label: "Low Stock",
            colorClass: "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-50"
        };
    }
    if (quantity <= 25) {
        return {
            status: "Limited Stock",
            label: "Limited Stock",
            colorClass: "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-50"
        };
    }
    return {
        status: "In Stock",
        label: "In Stock",
        colorClass: "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
    };
}
