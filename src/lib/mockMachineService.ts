import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";
import { relinkMachineItems } from "@/utils/relinkMachineItems";
import migratedMachinesData from "../../mock_machines.json";

// All machines are now loaded from the single JSON source
const ALL_MACHINES: any[] = migratedMachinesData.map((m: any) => ({
    ...m,
    physicalConfiguration: m.physicalConfig || "single",
}));

// Helper to map raw data to ArcadeMachine type
const mapToArcadeMachine = (data: any): ArcadeMachine => {
    // Map machine types to their specific images
    const machineTypeImages: Record<string, string> = {
        "Trend Catcher": "/images/machines/trend_catcher.png",
        "Trend Box": "/images/machines/trend_box.png",
        "SKWEB": "/images/machines/skweb.png",
        "INNIS": "/images/machines/innis.png",
        "Doll Castle": "/images/machines/doll_castle.png",
        "Doll House": "/images/machines/doll_house.png",
        "Giant Claw": "/images/machines/giant_claw.png",
        "Crazy Toy Nano": "/images/machines/crazy_toy_nano.png",
        "Crazy Star": "/images/machines/crazy_star.png",
        "Crazy Toy Miya": "/images/machines/crazy_toy_miya.png",
        "Crazy Toy L-1": "/images/machines/crazy_toy_l1.png",
        "Handsome Man": "/images/machines/handsome_man.png",
        "Hex Claw": "/images/machines/hex_claw.png",
        "Crazy Toy Hip-Hop Elf": "/images/machines/hip_hop_elf.png"
    };

    // Get image URL based on machine type, fallback to default if type not found
    const imageUrl = machineTypeImages[data.type] || "/images/machines/trend_catcher.png";

    return {
        ...data,
        physicalConfig: data.physicalConfiguration || data.physicalConfig || "single",
        slots: (data.slots || []).map((slot: any) => ({
            ...slot,
            gameType: slot.gameType || "Claw",
            status: slot.status ? slot.status.toLowerCase() : "online",
            currentItem: slot.currentItem || null,
            upcomingQueue: slot.upcomingQueue || [],
            stockLevel: slot.stockLevel || "Good"
        })),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        imageUrl: data.imageUrl || imageUrl
    };
};

let inMemoryMachines: ArcadeMachine[] = [];
let initialized = false;

const STORAGE_KEY = 'claw_master_machines_v29'; // Bump version for clean slate with merged data

const initializeMachines = () => {
    if (initialized) return;

    console.log("Initializing machines... STORAGE_KEY:", STORAGE_KEY);

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                inMemoryMachines = parsed.map((m: any) => ({
                    ...m,
                    createdAt: new Date(m.createdAt),
                    updatedAt: new Date(m.updatedAt),
                    lastSyncedAt: m.lastSyncedAt ? new Date(m.lastSyncedAt) : undefined
                }));

                // Backfill advanced settings if missing in stored data
                inMemoryMachines = inMemoryMachines.map(m => {
                    if (!m.advancedSettings) {
                        return {
                            ...m,
                            advancedSettings: {
                                ...DEFAULT_ADVANCED_SETTINGS,
                                macId: `801F${Math.floor(Math.random() * 99999999).toString(16).toUpperCase()}`
                            }
                        };
                    }
                    return m;
                });

            } catch (e) {
                console.error("Failed to parse stored machines", e);
                inMemoryMachines = ALL_MACHINES.map(m => {
                    const machine = mapToArcadeMachine(m);
                    return {
                        ...machine,
                        advancedSettings: m.advancedSettings || {
                            ...DEFAULT_ADVANCED_SETTINGS,
                            macId: `801F${Math.floor(Math.random() * 99999999).toString(16).toUpperCase()}`
                        }
                    };
                });
            }
        } else {
            inMemoryMachines = ALL_MACHINES.map(m => {
                const machine = mapToArcadeMachine(m);
                return {
                    ...machine,
                    advancedSettings: m.advancedSettings || {
                        ...DEFAULT_ADVANCED_SETTINGS,
                        macId: `801F${Math.floor(Math.random() * 99999999).toString(16).toUpperCase()}`
                    }
                };
            });

            // Clean up old versions to free up space
            try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('claw_master_machines_v') && key !== STORAGE_KEY) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                console.log(`Cleaned up ${keysToRemove.length} old storage versions.`);
            } catch (e) {
                console.error("Failed to cleanup old storage", e);
            }

            saveToStorage();
        }
    } else {
        inMemoryMachines = ALL_MACHINES.map(m => {
            const machine = mapToArcadeMachine(m);
            return {
                ...machine,
                advancedSettings: m.advancedSettings || {
                    ...DEFAULT_ADVANCED_SETTINGS,
                    macId: `801F${Math.floor(Math.random() * 99999999).toString(16).toUpperCase()}`
                }
            };
        });
    }
    initialized = true;
};

// Default settings matching Intercard for mocks
const DEFAULT_ADVANCED_SETTINGS: ArcadeMachine['advancedSettings'] = {
    macId: "801F121992D6",
    mainCategory: "Group 4-Cranes",
    subCategory: "Medium",
    esrbRating: "NOT RATED",
    cardCashPlayPrice: 2.40,
    cardTokenPlayPrice: 0,
    creditCardPlayPrice: 0.00,
    coinValue: 1.00,
    vipDiscountedPrice: 2.30,
    readerModel: "iReader Series",
    gameInterface: "Crane",
    buttonConfiguration: "No Start Button",
    currencyDecimalPlace: "2 Decimal",
    debitOrder: "Cash First",
    ticketDispenserBridge: "Disabled",
    pulseWidth: 100,
    pulsePauseWidth: 100,
    pulsesToActuate: 1,
    hopperTimeOut: 100,
    rfidTapDelay: 1,
    coinsDispensedPerPulse: 1,

    // Feature Flags flattened
    allowBonusPlay: true,
    flipDisplay: false,
    pointsForPlay: false,
    depleteBalance: false,
    touchEnabled: false,
    eclipseFeature: false,
    enableMobileIReader: false,
};

const saveToStorage = () => {
    if (typeof window !== 'undefined') {
        try {
            const data = JSON.stringify(inMemoryMachines);
            localStorage.setItem(STORAGE_KEY, data);
        } catch (e) {
            if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                console.error("Storage quota exceeded. Attempting cleanup...", e);
                // Emergency cleanup: remove ALL old versions
                try {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('claw_master_machines_v') && key !== STORAGE_KEY) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));

                    // Try saving again after cleanup
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryMachines));
                    console.log("Storage successful after emergency cleanup.");
                } catch (retryError) {
                    console.error("Emergency cleanup failed to free enough space.", retryError);
                }
            } else {
                console.error("Failed to save to storage", e);
            }
        }
    }
};

// Listeners
let listeners: ((machines: ArcadeMachine[]) => void)[] = [];

const notifyListeners = () => {
    const machines = [...inMemoryMachines];
    listeners.forEach(listener => listener(machines));
};

export const mockMachineService = {
    getAll: async (): Promise<ArcadeMachine[]> => {
        initializeMachines();
        return [...inMemoryMachines];
    },

    subscribe: (callback: (machines: ArcadeMachine[]) => void) => {
        listeners.push(callback);
        // Initial call
        initializeMachines();
        callback([...inMemoryMachines]);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        };
    },

    syncStockItems: async (items: StockItem[]) => {
        initializeMachines();
        // Completely rebuild machine slot assignments from stock items
        const relinkedMachines = relinkMachineItems(inMemoryMachines, items);

        // Check if anything changed
        const changed = JSON.stringify(inMemoryMachines) !== JSON.stringify(relinkedMachines);

        if (changed) {
            inMemoryMachines = relinkedMachines;
            saveToStorage();
            notifyListeners();
        }
    },

    getById: async (id: string): Promise<ArcadeMachine | null> => {
        initializeMachines();
        const machine = inMemoryMachines.find(m => m.id === id);
        return machine || null;
    },

    add: async (data: Omit<ArcadeMachine, "id">): Promise<string> => {
        initializeMachines();
        const newId = `mac_${Date.now()}`;
        const newMachine = { ...data, id: newId } as ArcadeMachine;
        inMemoryMachines.push(newMachine);
        saveToStorage();
        notifyListeners();
        return newId;
    },

    set: async (id: string, data: Omit<ArcadeMachine, "id">): Promise<void> => {
        initializeMachines();
        const index = inMemoryMachines.findIndex(m => m.id === id);
        if (index >= 0) {
            inMemoryMachines[index] = { ...data, id } as ArcadeMachine;
        } else {
            inMemoryMachines.push({ ...data, id } as ArcadeMachine);
        }
        saveToStorage();
        notifyListeners();
    },

    update: async (id: string, data: Partial<ArcadeMachine>): Promise<void> => {
        initializeMachines();
        const index = inMemoryMachines.findIndex(m => m.id === id);
        if (index >= 0) {
            inMemoryMachines[index] = { ...inMemoryMachines[index], ...data };
            saveToStorage();
            notifyListeners();
        }
    },

    updateBatch: async (updates: { id: string; data: Partial<ArcadeMachine> }[]) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        initializeMachines();
        let changed = false;

        updates.forEach(({ id, data }) => {
            const index = inMemoryMachines.findIndex(m => m.id === id);
            if (index !== -1) {
                inMemoryMachines[index] = { ...inMemoryMachines[index], ...data };
                changed = true;
            }
        });

        if (changed) {
            saveToStorage();
            notifyListeners();
        }
    },

    remove: async (id: string): Promise<void> => {
        initializeMachines();
        inMemoryMachines = inMemoryMachines.filter(m => m.id !== id);
        saveToStorage();
        notifyListeners();
    },

    query: async (...constraints: any[]): Promise<ArcadeMachine[]> => {
        initializeMachines();
        // Basic mock query support if needed, for now return all
        return [...inMemoryMachines];
    }
};