export type Role = string;

// System role IDs (built-in, cannot be deleted)
export const SYSTEM_ROLES = ['crew', 'claw_staff', 'tech', 'supervisor', 'manager', 'admin'] as const;

export interface UserProfile {
    uid: string;
    email: string;
    role: Role;
    displayName?: string;
    photoURL?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        layout?: Record<string, unknown>;
    };
    permissions?: {
        // Stock Check
        stockCheckSubmit?: boolean;      // Can submit stock checks for review
        stockCheckApprove?: boolean;     // Can approve/reject pending submissions
        stockCheckSettings?: boolean;    // Can configure queue settings
        // Inventory
        viewInventory?: boolean;
        editInventory?: boolean;
        // Machines
        viewMachines?: boolean;
        editMachines?: boolean;
        // Maintenance
        viewMaintenance?: boolean;
        editMaintenance?: boolean;
        // Admin
        viewRevenue?: boolean;
        viewAnalytics?: boolean;
        viewTeam?: boolean;
        editTeam?: boolean;
        editRoles?: boolean;        // Can create/edit/delete custom roles
        accessMigration?: boolean;  // Can access data migration tools
    };
}

/**
 * Custom role definition with default permissions
 */
export interface CustomRole {
    id: string;                    // Unique slug ID (e.g., "claw_staff")
    name: string;                  // Display name (e.g., "Claw Staff")
    description: string;           // Role description
    icon?: string;                 // Lucide icon name (e.g., "Shield", "Wrench")
    color?: 'default' | 'destructive' | 'secondary' | 'outline';
    isSystem?: boolean;            // true for built-in roles (cannot delete)
    permissions: UserProfile['permissions'];  // Default permissions for this role
    sortOrder: number;             // Display order (lower = first)
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Custom permission definition
 */
export interface PermissionDef {
    id: string;                    // Key used in code (e.g. 'edit_machine_name')
    name: string;                  // Display name (e.g. 'Edit Machine Name')
    description: string;           // Helper text
    isSystem: boolean;             // Cannot be deleted if true

    // Technical Configuration (for custom permissions)
    targetEntity?: 'machine' | 'inventory' | 'user' | 'maintenance' | 'revenue' | 'settings' | 'stockCheck' | 'custom';
    actionType?: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'configure' | 'custom';
    targetField?: string;          // Specific field being controlled (e.g., "name", "status", "settings")
    customAction?: string;         // For 'custom' action type, describe the specific action

    createdAt: Date | string;
    updatedAt: Date | string;
}

// ============================================================================
// NEW: Lookup/Reference Collections
// ============================================================================

/**
 * Category for stock items (e.g., "Plushy", "Keychain", "Figure")
 */
export interface Category {
    id: string;
    name: string;
    description?: string;
    parentId?: string;      // For sub-categories
    sortOrder: number;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Storage/Warehouse location for stock
 */
export interface StorageLocation {
    id: string;
    name: string;           // e.g., "Basement - Plushy Room"
    type: 'warehouse' | 'floor' | 'storage_room';
    floor?: string;
    zone?: string;
    capacity?: number;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Vendor/Supplier information
 */
export interface Vendor {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    website?: string;
    paymentTerms?: string;  // e.g., "Net 30"
    notes?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// ============================================================================
// NEW: Machine-Specific Item Settings (Claw Settings per Item per Machine)
// ============================================================================

/**
 * Claw settings for a specific item on a specific machine
 * Different machines may need different settings for the same item
 */
export interface ItemMachineSettings {
    id: string;

    // References
    itemId: string;
    itemName: string;        // Cached for display
    machineId: string;
    machineName: string;     // Cached for display
    slotId?: string;

    // Claw Grip Stages
    c1: number;              // Stage 1: Weak grip / Catch
    c2: number;              // Stage 2: Strong grip / Pickup
    c3: number;              // Stage 3: Retention / Carry to chute
    c4: number;              // Stage 4: Max strength when winning (varies: 24, 48, 64)

    // Profit Calculation
    playPrice: number;       // Price per play on this machine (e.g., $1.80)
    playPerWin: number;      // Target plays before a win
    expectedRevenue: number; // playPrice × playPerWin

    // Metadata
    notes?: string;
    lastUpdatedBy: string;
    lastUpdatedAt: Date | string;
    createdAt: Date | string;
}

// ============================================================================
// NEW: Assignment History (Track item-machine lifecycle with periods)
// ============================================================================

/**
 * Tracks each time an item is assigned/removed from a machine
 * Enables revenue per period analytics
 */
export interface ItemAssignmentHistory {
    id: string;

    // References
    itemId: string;
    itemName: string;
    machineId: string;
    machineName: string;
    slotId?: string;

    // Assignment Period
    assignedAt: Date | string;
    removedAt?: Date | string;  // null if currently assigned

    // Status during this period
    status: 'Using' | 'Replacement' | 'Queue';
    queuePosition: number;      // 1=current, 2=next replacement, 3=third...

    // Audit
    assignedBy: string;
    removedBy?: string;
    removalReason?: 'replaced' | 'sold_out' | 'stock_rotation' | 'maintenance' | 'removed';
}

// ============================================================================
// Stock Item Location (for quantity per warehouse)
// ============================================================================

/**
 * Stock quantity at a specific location
 */
export interface StockItemLocation {
    locationId?: string;     // FK → StorageLocation.id (optional for backward compat)
    locationName: string;    // Cached for display
    quantity: number;
}

/** @deprecated Use StockItemLocation instead */
export interface StockLocation {
    name: string;
    quantity: number;
}

// ============================================================================
// Machine Assignment (current assignments for an item)
// ============================================================================

/**
 * Current machine assignment for an item
 */
export interface MachineAssignment {
    machineId: string;
    machineName: string;
    slotId?: string;
    status: 'Using' | 'Replacement';
    queuePosition?: number;   // 1=current, 2=next, 3=third... (optional for backward compat)
    assignedAt: Date | string;
}

// ============================================================================
// STOCK ITEM - Main Entity
// ============================================================================

export interface StockItem {
    id: string;
    sku: string;             // Should be unique
    name: string;

    // Category - now supports both legacy string and new FK
    category: string;        // Category name (legacy) or categoryId
    categoryId?: string;     // FK → Category.id (new)

    type?: string;           // e.g., "Plushy"
    size?: string;           // "Extra-Small", "Small", "Medium", "Large", "Big"
    subSize?: string;        // "For Top", "For Bottom"
    brand?: string;
    tags?: string[];
    description?: string;

    // Images
    imageUrl?: string;
    imageUrls?: string[];
    aiImageHint?: string;

    // Stock Status (workflow state, NOT stock level)
    stockStatus?: 'Organized' | 'Arrived' | 'Ordered' | 'Requested' | string;

    // Quantity & Locations
    // NOTE: Stock level (In Stock, Low Stock, Out of Stock) is COMPUTED from sum of quantities

    // Legacy format - REQUIRED for backward compatibility
    locations: StockLocation[];

    // New format - optional, prefer this when available in new code
    stockLocations?: StockItemLocation[];

    lowStockThreshold: number;

    /** @deprecated Computed from locations/stockLocations */
    totalQuantity?: number;
    /** @deprecated Computed from locations/stockLocations */
    quantityText?: string;
    /** @deprecated Computed from locations/stockLocations */
    quantity?: number;
    quantityDescription?: string;

    // Machine Assignments - PRIMARY SOURCE OF TRUTH
    machineAssignments?: MachineAssignment[];  // Optional for backward compat

    /** @deprecated Computed from machineAssignments - use for read only */
    assignedStatus?: 'Not Assigned' | 'Assigned' | 'Assigned for Replacement' | string;
    /** @deprecated Use machineAssignments instead */
    assignedMachineId?: string | null;
    /** @deprecated Use machineAssignments instead */
    assignedMachineName?: string | null;
    /** @deprecated Use machineAssignments[].status instead */
    assignmentType?: 'Using' | 'Replacement';
    /** @deprecated Use machineAssignments instead */
    replacementMachines?: { id: string; name: string }[];

    // Technical Specifications
    technicalSpecs?: {
        weightGrams: number;
        dimensions: { lengthCm: number; widthCm: number; heightCm: number };
        recommendedClawStrength: 'Low' | 'Medium' | 'High' | string;
        // Low: Light items < 100g, easy grip
        // Medium: Standard items 100-150g
        // High: Heavy items > 150g or awkward shapes
    };

    // Supply Chain - now supports vendor FK
    supplyChain?: {
        vendorId?: string;       // FK → Vendor.id (new)
        vendor: string;          // Vendor name (legacy or cached)
        costPerUnit: number;     // BUYING COST from vendor
        reorderPoint: number;
        leadTimeDays?: number;
        minimumOrderQuantity?: number;
    };

    // Pricing
    value?: number;              // TARGET REVENUE needed for profit

    // Payout Configuration (per price point)
    // Supports both legacy (playCost/playsRequired) and new (playPrice/targetPlays) field names
    payouts?: {
        // New field names
        playPrice?: number;      // Machine play price (e.g., $1.80)
        targetPlays?: number;    // Plays needed to profit at this price
        profitMargin?: number;   // Expected profit per win
        // Legacy field names (backward compatibility)
        playCost?: number;       // @deprecated - use playPrice
        playsRequired?: number;  // @deprecated - use targetPlays
    }[] | number[];  // Also support simple number array for legacy
    /** @deprecated Use payouts[] or ItemMachineSettings */
    playWinTarget?: number;

    // Revenue Stats (cached)
    revenueStats?: {
        totalRevenue: number;
        totalPlays: number;
        lastUpdated?: Date | string;
    };

    // Timestamps
    createdAt: Date | string;
    updatedAt: Date | string;
    lastUpdateDate?: string | Date;

    /** @deprecated Use auditLogs collection instead */
    history?: AuditLog[];

    // Soft delete / Archive
    isArchived?: boolean;
    archivedAt?: Date | string;
    archivedBy?: string;
}

// ============================================================================
// Machine/Slot Types
// ============================================================================

export interface UpcomingStockItem {
    itemId: string;
    name: string;
    sku?: string;
    imageUrl?: string;
    addedBy: string;
    addedAt: Date;
}

export interface ArcadeMachineSlot {
    id: string;
    name: string;
    assetTag?: string;
    gameType: string;
    status: 'online' | 'offline' | 'error';
    size?: string;
    compatibleSizes?: string[];

    // Stock Management - NOW uses ID reference
    currentItemId?: string | null;   // FK → StockItem.id (NEW - ID only)
    /** @deprecated Use currentItemId and lookup item. Kept for backward compatibility during migration */
    currentItem?: StockItem | null;
    upcomingQueue: UpcomingStockItem[];
    stockLevel: 'Full' | 'Good' | 'Low' | 'Empty' | 'In Stock' | 'Limited Stock' | 'Low Stock' | 'Out of Stock';
}

export type MachineSlot = ArcadeMachineSlot;

export interface ArcadeMachine {
    id: string;
    assetTag: string;
    name: string;
    location: string;
    group?: string;
    subGroup?: string;
    tag?: string;

    physicalConfig: 'single' | 'multi_4_slot' | 'dual_module' | 'multi_dual_stack';
    status: 'Online' | 'Offline' | 'Maintenance' | 'Error';
    slots: ArcadeMachineSlot[];

    playCount?: number;
    revenue?: number;
    lastSyncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    imageUrl?: string;
    prizeSize?: string;
    notes?: string;
    type?: string;

    /** @deprecated Use auditLogs collection instead */
    history?: AuditLog[];

    // Advanced Configuration (Intercard Style)
    advancedSettings?: AdvancedMachineSettings;

    isArchived?: boolean;
    archivedAt?: Date | string;
    archivedBy?: string;
}

// ============================================================================
// Advanced Machine Settings (Intercard Integration)
// ============================================================================

export interface AdvancedMachineSettings {
    // Identity
    macId?: string;

    // Categorization
    mainCategory?: string;
    subCategory?: string;
    esrbRating?: string;

    // Pricing
    cardCashPlayPrice?: number;
    cardTokenPlayPrice?: number;
    creditCardPlayPrice?: number;
    coinValue?: number;
    vipDiscountedPrice?: number;

    // Hardware Configuration
    readerModel?: 'Fedelis' | 'Nano Series' | 'Impulse' | 'iReader 1' | 'iReader Series' | 'Impulse Tap' | string;
    gameInterface?: 'Video' | 'Redemption' | 'Crane' | 'Table Game' | 'Attractions' | 'Banked Points' | 'Balance Review' | 'Redemption Center' | 'Merchandiser' | 'Coin/Ticket Tracking' | 'Token Changer' | 'Ticket Eater' | 'Redemption Review' | 'MDB Vending' | 'Benchmark Ticket To Prize' | 'Deltronics Serial Ticket Eater' | 'Redemption with Hopper & Coin monitor' | 'Bay Tek Prize Hub' | 'Entry Gate/Locker' | 'Exit Gate/Locker' | 'Access Control' | 'Two Player Video' | 'Two Player Video Time Play Only' | 'Wizard of Oz Kiosk' | 'Laundry' | 'Benchmark Ticket Eater' | 'Midway Games' | 'MDB Coin Mech' | string;
    buttonConfiguration?: 'No Start Button' | 'Start Button';
    currencyDecimalPlace?: 'No Decimal' | '2 Decimal' | '3 Decimal';
    debitOrder?: 'Cash First' | 'Bonus Cash First';
    ticketDispenserBridge?: 'Enabled' | 'Disabled';

    // Motor / Technical Settings
    pulseWidth?: number;            // ms
    pulsePauseWidth?: number;       // ms
    pulsesToActuate?: number;
    hopperTimeOut?: number;         // sec
    rfidTapDelay?: number;          // sec
    coinsDispensedPerPulse?: number;

    // Feature Flags / Functions
    allowBonusPlay?: boolean;
    flipDisplay?: boolean;
    pointsForPlay?: boolean;
    depleteBalance?: boolean;
    touchEnabled?: boolean;
    eclipseFeature?: boolean;
    enableMobileIReader?: boolean;
}

// ============================================================================
// Settings & Operations
// ============================================================================

export interface PlayfieldSetting {
    id: string;
    machineId: string;
    slotId?: string;

    // Claw Settings
    c1?: number;
    c2?: number;
    c3?: number;
    c4?: number;
    payoutRate?: number;

    // Legacy
    strengthSetting?: number;
    voltage?: number;
    payoutPercentage?: number;

    // Context
    stockItemId?: string;
    stockItemName?: string;

    timestamp: Date;
    setBy: string;
}

export interface MaintenanceTask {
    id: string;
    machineId: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in-progress' | 'resolved';
    assignedTo?: string;
    createdBy: string;
    createdAt: Date;
    resolvedAt?: Date;
    images?: string[];
}

export interface ReorderRequest {
    id: string;
    itemId?: string;
    itemName: string;
    itemCategory?: string;
    quantityRequested: number;
    quantityReceived?: number;
    requestedBy: string;
    status: 'submitted' | 'approved' | 'ordered' | 'fulfilled' | 'received' | 'organized' | 'rejected';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    id: string;
    action: string;
    entityType: 'StockItem' | 'Machine' | 'Settings' | 'User' | 'Category' | 'Vendor' | 'Location' | 'stock' | 'machine' | 'settings' | 'user';
    entityId: string;
    oldValue?: unknown;
    newValue?: unknown;
    userId: string;
    userRole?: string;
    timestamp: Date | string;
    details?: Record<string, unknown>;
}

export type User = UserProfile;

// ============================================================================
// Form Values
// ============================================================================

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
    categoryId?: string;
    newCategoryName?: string;
    imageUrl?: string | File;
    imageUrls?: (string | File)[];
    aiImageHint?: string;
    quantityDescription: string;
    lowStockThreshold: number;
    description?: string;
    value?: number;
    locations: { name: string; quantity: number }[];
    stockLocations?: StockItemLocation[];
    payouts?: { playPrice: number; targetPlays: number; profitMargin?: number }[];
    assignedMachineId?: string;
    assignmentStatus?: 'Not Assigned' | 'Assigned' | 'Assigned for Replacement';
    _parsedOverallNumericQuantity?: number;
    _sumOfLocationQuantities?: number;
}

// ============================================================================
// Display Types
// ============================================================================

export interface MachineDisplayItem extends ArcadeMachine {
    isSlot: boolean;
    slotId?: string;
    slotName?: string;
    slotStatus?: ArcadeMachineSlot['status'];
    originalMachine: ArcadeMachine;
}

// ============================================================================
// Revenue Types
// ============================================================================

export interface RevenueEntry {
    id: string;
    itemId: string;
    itemName: string;
    machineId?: string;
    machineName?: string;
    assignmentPeriodId?: string;  // NEW: Links to specific ItemAssignmentHistory
    amount: number;
    playCount?: number;
    date: Date | string;
    notes?: string;
    createdBy: string;
    createdAt: Date | string;
}

export interface MachineRevenueReading {
    id: string;
    machineId: string;
    date: Date | string;
    revenue: number;
    playCount: number;
    source: 'api' | 'manual';
    createdAt: Date | string;
}

export interface AttributedRevenue {
    itemId: string;
    totalRevenue: number;
    totalPlays: number;
    breakdown: {
        machineId: string;
        machineName: string;
        periodStart: Date | string;
        periodEnd: Date | string;
        revenue: number;
        plays: number;
        days: number;
    }[];
}

// ============================================================================
// Snapshot Types
// ============================================================================

export interface Snapshot {
    id: string;
    entityType: 'stockItem' | 'machine';
    entityId: string;
    entityName: string;
    version: number;
    label?: string;
    data: Record<string, unknown>;
    createdBy: string;
    createdAt: Date | string;
}

// ============================================================================
// Stock Check Approval Workflow Types
// ============================================================================

/**
 * System state snapshot at time of stock check submission
 * Used for before/after comparison in approval view
 */
export interface SystemSnapshot {
    machines: {
        id: string;
        name: string;
        status: 'Online' | 'Offline' | 'Maintenance' | 'Error';
    }[];
    items: {
        id: string;
        name: string;
        quantity: number;
        assignedMachineId?: string | null;
    }[];
    capturedAt: Date | string;
}

/**
 * Pending stock check submission awaiting approval
 */
export interface PendingStockCheck {
    id: string;
    status: 'pending' | 'approved' | 'discarded';

    // Submission data (from StockCheckForm)
    report: {
        machineChecks: Record<string, {
            checked: boolean;
            note: string;
            status?: 'Online' | 'Offline' | 'Maintenance' | 'Error';
        }>;
        itemChecks: Record<string, Record<string, {
            verified: boolean;
            actualQty: number | null;
            issue: string;
            slotName: string;
            itemName: string;
            itemId: string;
            systemQty: number;
            itemImage?: string;
        }>>;
        replacementItemChecks: Record<string, {
            verified: boolean;
            actualQty: number | null;
            issue: string;
            itemName: string;
            itemId: string;
            systemQty: number;
        }>;
        stats: {
            checkedMachines: number;
            totalMachines: number;
            verifiedItems: number;
            totalItems: number;
            issuesFound: number;
        };
    };

    // Snapshot of system state at submission time
    snapshotBefore: SystemSnapshot;

    // Submission metadata
    submittedBy: string;
    submittedByName: string;
    submittedAt: Date | string;

    // Review data (populated on approve/discard)
    reviewedBy?: string;
    reviewedByName?: string;
    reviewedAt?: Date | string;
    rejectionReason?: string;

    // For 12-hour restore window
    discardedAt?: Date | string;
}

/**
 * In-app notification
 */
export interface AppNotification {
    id: string;
    userId: string;                    // Recipient
    type: 'stock_check_approved' | 'stock_check_rejected' | 'stock_check_pending' | 'general';
    title: string;
    message: string;
    data?: {
        submissionId?: string;
        link?: string;
    };
    read: boolean;
    createdAt: Date | string;
}

/**
 * App-wide settings for stock check queue behavior
 */
export interface StockCheckSettings {
    queueMode: 'allow_multiple' | 'block_until_resolved' | 'block_for_duration';
    blockDurationMinutes?: number;     // If mode is 'block_for_duration' (30, 60, 120, 240, 1440)
    lastSubmissionAt?: Date | string;  // Track for duration blocking
    updatedBy?: string;
    updatedAt?: Date | string;
}

// Service Report Interface
export interface ServiceReport {
    id: string;
    machineId: string;
    machineName: string; // "Tag" in the form context
    location: string;
    staffName: string;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    playsPerWin: number; // "Plays Per"
    inflowSku?: string;
    remarks?: string;
    imageUrl?: string;
    timestamp: Date;
}
