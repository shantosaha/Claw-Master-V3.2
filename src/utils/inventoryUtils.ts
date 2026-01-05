import { StockItem, StockItemLocation, StockLocation } from "@/types";

// ============================================================================
// Location Helpers - Handle both legacy (locations) and new (stockLocations)
// ============================================================================

/**
 * Get locations array from item, preferring new stockLocations over legacy locations
 * Returns array in StockLocation format { name, quantity } for backward compatibility
 */
export function getItemLocations(item: StockItem): StockLocation[] {
    // Prefer new stockLocations if available
    if (item.stockLocations && item.stockLocations.length > 0) {
        return item.stockLocations.map(sl => ({
            name: sl.locationName,
            quantity: sl.quantity
        }));
    }
    // Fall back to legacy locations
    return item.locations || [];
}

/**
 * Get total quantity across all locations
 */
export function getTotalQuantity(item: StockItem): number {
    const locations = getItemLocations(item);
    return locations.reduce((sum, loc) => sum + loc.quantity, 0);
}

// ============================================================================
// Stock Level Calculation
// ============================================================================

export type StockLevelStatus = "Out of Stock" | "Low Stock" | "Limited Stock" | "In Stock";

export interface StockLevelInfo {
    status: StockLevelStatus;
    label: string;
    colorClass: string;
}
export function calculateStockLevel(quantity: number, explicitStatus?: string): StockLevelInfo {
    // explicitStatus is ignored to enforce quantity-based stock levels as per new requirements.
    // If we need to support manual overrides again (e.g. for damaged stock not yet removed),
    // we can uncomment or restore logic here. For now, quantity is the single source of truth.


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
