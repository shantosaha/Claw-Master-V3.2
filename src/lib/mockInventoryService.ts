import { StockItem } from "@/types";
import { sampleInventoryData } from "@/data/inventoryData";
import { generateMockStockItems } from "@/utils/generateMockData";

// Interface for sample data items with different structure
interface SampleDataItem {
    id: string;
    type?: string;
    category?: string;
    stockLocations?: { locationName: string; quantity: number }[];
    supplyChain?: { reorderPoint?: number };
    lastUpdateDate?: string;
    [key: string]: unknown;
}

// Helper to map sample data to StockItem type if needed
const normalizeItem = (item: SampleDataItem): StockItem => {
    return {
        ...item,
        category: item.type || item.category || '', // Map type to category for compatibility
        locations: item.stockLocations?.map((l) => ({ name: l.locationName, quantity: l.quantity })) || [],
        lowStockThreshold: item.supplyChain?.reorderPoint || 10, // Default or map
        createdAt: item.lastUpdateDate ? new Date(item.lastUpdateDate) : new Date(),
        updatedAt: item.lastUpdateDate ? new Date(item.lastUpdateDate) : new Date(),
    } as StockItem;
};

// Initialize in-memory items with normalized sample data
let inMemoryItems: StockItem[] = [
    ...sampleInventoryData.map(normalizeItem)
];

// Listeners for real-time updates
let listeners: ((items: StockItem[]) => void)[] = [];

// Counter to ensure unique IDs even when created at the same millisecond
const idCounter = 0;

const notifyListeners = () => {
    // Deduplicate items by ID to prevent React key errors
    const uniqueItems = Array.from(new Map(inMemoryItems.map(item => [item.id, item])).values());
    listeners.forEach(listener => listener(uniqueItems));
};

export const mockInventoryService = {
    getAll: async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Deduplicate items by ID
        const uniqueItems = Array.from(new Map(inMemoryItems.map(item => [item.id, item])).values());
        return uniqueItems;
    },

    subscribe: (callback: (items: StockItem[]) => void) => {
        listeners.push(callback);
        // Initial call
        callback([...inMemoryItems]);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        };
    },

    getById: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return inMemoryItems.find(i => i.id === id) || null;
    },

    add: async (item: Omit<StockItem, "id">) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Generate a truly unique ID using timestamp + random string
        const uniqueId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const newItem = {
            ...item,
            id: uniqueId,
            createdAt: new Date(),
            updatedAt: new Date()
        } as StockItem;
        inMemoryItems.push(newItem);
        notifyListeners();
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
            notifyListeners();
        }
    },

    remove: async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        inMemoryItems = inMemoryItems.filter(i => i.id !== id);
        notifyListeners();
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
    },

    seed: async (count: number) => {
        const newItems = generateMockStockItems(count);
        inMemoryItems = [...inMemoryItems, ...newItems];
        notifyListeners();
        return newItems.length;
    }
};
