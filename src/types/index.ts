export type Role = 'crew' | 'tech' | 'manager' | 'admin';

export interface UserProfile {
    uid: string;
    email: string;
    role: Role;
    displayName?: string;
    photoURL?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        layout?: Record<string, unknown>; // For saving page layouts
    };
}

export interface StockLocation {
    name: string;
    quantity: number;
}

export interface StockItem {
    id: string;
    sku: string;
    name: string;
    type?: string; // Make optional to fix build errors in other files
    category: string; // Revert to required or keep as is (was required)
    size?: string;
    subSize?: string;
    brand?: string;
    tags?: string[];
    stockStatus?: string;
    assignedStatus?: string;
    assignedMachineId?: string | null;
    assignedMachineName?: string | null;
    imageUrl?: string;
    imageUrls?: string[];
    aiImageHint?: string; // Added for AI image generation
    totalQuantity?: number;
    quantityText?: string;

    // Location handling
    stockLocations?: { locationName: string; quantity: number }[];
    locations: StockLocation[]; // Revert to required as existing code expects it

    technicalSpecs?: {
        weightGrams: number;
        dimensions: { lengthCm: number; widthCm: number; heightCm: number };
        recommendedClawStrength: string;
    };
    supplyChain?: {
        vendor: string;
        costPerUnit: number;
        reorderPoint: number;
    };
    playWinTarget?: number;
    lastUpdateDate?: string | Date;

    // Existing fields
    quantityDescription?: string;
    lowStockThreshold: number; // Was required
    cost?: number;
    value?: number;
    payouts?: { playCost: number; playsRequired: number }[] | number[]; // Updated to support object structure
    assignedSlotId?: string;
    createdAt: Date | string; // Was required Date
    updatedAt: Date | string; // Was required Date
    history?: AuditLog[];
    quantity?: number;
    description?: string;
    assignmentType?: 'Using' | 'Replacement';
}

export type MachineSlot = ArcadeMachineSlot;

export interface UpcomingStockItem {
    itemId: string;
    name: string;
    sku?: string;
    imageUrl?: string;
    addedBy: string; // User ID
    addedAt: Date;
}

export interface ArcadeMachineSlot {
    id: string; // Sub-unit ID
    name: string; // e.g., "Claw 1"
    gameType: string;
    status: 'online' | 'offline' | 'error';
    // Stock Management
    currentItem: StockItem | null; // Changed from assignedStockItemId to full object or null for better access
    upcomingQueue: UpcomingStockItem[];
    stockLevel: 'Full' | 'Good' | 'Low' | 'Empty';
}

export interface ArcadeMachine {
    id: string;
    assetTag: string;
    name: string;
    location: string;
    group?: string; // e.g., "Cranes"
    subGroup?: string;
    tag?: string; // For API Sync (Primary Key from Game Report)

    // Physical Configuration
    physicalConfig: 'single' | 'multi_4_slot' | 'dual_module' | 'multi_dual_stack';

    status: 'Online' | 'Offline' | 'Maintenance' | 'Error'; // Capitalized to match requirements
    slots: ArcadeMachineSlot[];

    playCount?: number;
    revenue?: number;
    lastSyncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    imageUrl?: string;
    prizeSize?: string; // e.g. "Small", "Medium", "Large"
    notes?: string;
    type?: string; // e.g. "Trend Catcher"

    history?: AuditLog[]; // Embedded history for quick access, or keep separate if too large
}

export interface PlayfieldSetting {
    id: string;
    machineId: string;
    slotId?: string; // If specific to a slot
    strengthSetting: number;
    voltage: number;
    payoutPercentage: number;
    timestamp: Date;
    setBy: string; // User ID
}

export interface MaintenanceTask {
    id: string;
    machineId: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in-progress' | 'resolved';
    assignedTo?: string; // User ID
    createdBy: string; // User ID
    createdAt: Date;
    resolvedAt?: Date;
    images?: string[];
}

export interface ReorderRequest {
    id: string;
    itemId?: string; // Optional if it's a request for a new item
    itemName: string; // Required for display
    itemCategory?: string;
    quantityRequested: number;
    quantityReceived?: number;
    requestedBy: string; // User ID
    status: 'submitted' | 'approved' | 'ordered' | 'fulfilled' | 'received' | 'rejected';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    id: string;
    action: string; // Changed from actionType to match provided code
    entityType: 'StockItem' | 'Machine' | 'Settings' | 'User' | 'stock' | 'machine' | 'settings' | 'user'; // Expanded to match provided code
    entityId: string;
    oldValue?: unknown;
    newValue?: unknown;
    userId: string;
    userRole?: string; // Added for history view
    timestamp: Date | string; // Allow string for flexibility
    details?: Record<string, unknown>; // Changed from string to Record for structured data
}

export type User = UserProfile; // Alias for compatibility

export interface AdjustStockFormValues {
    locationName: string;
    adjustmentType: "add" | "remove" | "set";
    selectedQuantity: string;
    customQuantity?: string;
    quantity: number;
    notes?: string;
}

export interface StockItemFormSubmitValues {
    name: string;
    category: string;
    newCategoryName?: string;
    imageUrl?: string | File;
    imageUrls?: (string | File)[];
    aiImageHint?: string;
    quantityDescription: string;
    lowStockThreshold: number;
    description?: string;
    cost?: number;
    value?: number;
    locations: { name: string; quantity: number }[];
    payouts?: { playCost: number; playsRequired: number }[];
    assignedMachineId?: string;
    assignedSlotId?: string;
    _parsedOverallNumericQuantity?: number;
    _sumOfLocationQuantities?: number;
}

// Interface for the flattened display item in Machine List
export interface MachineDisplayItem extends ArcadeMachine {
    isSlot: boolean;
    slotId?: string;
    slotName?: string;
    slotStatus?: ArcadeMachineSlot['status'];
    originalMachine: ArcadeMachine;
}
