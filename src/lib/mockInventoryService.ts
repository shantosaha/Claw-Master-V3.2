import { StockItem } from "@/types";
import { sampleInventoryData } from "@/data/inventoryData";

// Helper to map sample data to StockItem type if needed
const normalizeItem = (item: any): StockItem => {
    return {
        ...item,
        category: item.type, // Map type to category for compatibility
        locations: item.stockLocations?.map((l: any) => ({ name: l.locationName, quantity: l.quantity })) || [],
        lowStockThreshold: item.supplyChain?.reorderPoint || 10, // Default or map
        createdAt: item.lastUpdateDate ? new Date(item.lastUpdateDate) : new Date(),
        updatedAt: item.lastUpdateDate ? new Date(item.lastUpdateDate) : new Date(),
    };
};

// Initialize in-memory items with normalized sample data
let inMemoryItems: StockItem[] = sampleInventoryData.map(normalizeItem);

export const mockInventoryService = {
    getAll: async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...inMemoryItems];
    },

    getById: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return inMemoryItems.find(i => i.id === id) || null;
    },

    add: async (item: Omit<StockItem, "id">) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newItem = {
            ...item,
            id: `inv_new_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        } as StockItem;
        inMemoryItems.push(newItem);
        return newItem.id;
    },

    update: async (id: string, data: Partial<StockItem>) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = inMemoryItems.findIndex(i => i.id === id);
        if (index !== -1) {
            inMemoryItems[index] = {
                ...inMemoryItems[index],
                ...data,
                updatedAt: new Date()
            };
        }
    },

    remove: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        inMemoryItems = inMemoryItems.filter(i => i.id !== id);
    },

    getUniqueCategories: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const categories = inMemoryItems.map(item => item.category);
        return [...new Set(categories)];
    },

    getUniqueSizes: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const sizes = inMemoryItems.map(item => item.size).filter(Boolean) as string[];
        return [...new Set(sizes)];
    }
};
