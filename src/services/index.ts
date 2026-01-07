import { createFirestoreService } from "./firestoreService";
import {
    StockItem,
    ArcadeMachine,
    PlayfieldSetting,
    MaintenanceTask,
    ReorderRequest,
    AuditLog,
    RevenueEntry,
    Category,
    Vendor,
    StorageLocation,
    ItemMachineSettings,
    ItemAssignmentHistory
} from "@/types";
import { isFirebaseInitialized } from "@/lib/firebase";
import { mockInventoryService } from "@/lib/mockInventoryService";
import { mockMachineService } from "@/lib/mockMachineService";

// Use real Firestore services when Firebase is initialized, fallback to mock for demo mode
const firestoreStockService = createFirestoreService<StockItem>("stockItems");
const firestoreMachineService = createFirestoreService<ArcadeMachine>("machines");

// Export services - Firebase when available, mock for demo mode
export const stockService = isFirebaseInitialized ? firestoreStockService : mockInventoryService;
export const machineService = isFirebaseInitialized ? firestoreMachineService : mockMachineService;

// Core operational services
export const settingsService = createFirestoreService<PlayfieldSetting>("playfieldSettings");
export const maintenanceService = createFirestoreService<MaintenanceTask>("maintenanceTasks");
export const orderService = createFirestoreService<ReorderRequest>("reorderRequests");
export const auditService = createFirestoreService<AuditLog>("auditLogs");

// NEW: Lookup/Reference collections
export const categoryService = createFirestoreService<Category>("categories");
export const vendorService = createFirestoreService<Vendor>("vendors");
export const locationService = createFirestoreService<StorageLocation>("storageLocations");

// NEW: Machine-specific item settings (claw settings per item per machine)
export const itemMachineSettingsService = createFirestoreService<ItemMachineSettings>("itemMachineSettings");

// NEW: Assignment history (item-machine lifecycle tracking)
export const assignmentHistoryService = createFirestoreService<ItemAssignmentHistory>("itemAssignmentHistory");

// Revenue services
export { revenueService } from "./revenueService";
export { machineRevenueService } from "./machineRevenueService";
export { snapshotService } from "./snapshotService";
export { apiService } from "./apiService";

// Stock Check Approval Workflow Services
export { pendingStockCheckService } from "./pendingStockCheckService";
export { notificationService } from "./notificationService";
export { appSettingsService } from "./appSettingsService";
export { roleService } from "./roleService";
export { permissionService } from "./permissionService";

// Setup synchronization between services (only for mock mode)
if (!isFirebaseInitialized) {
    interface MockStockService {
        subscribe?: (callback: (items: StockItem[]) => void) => void;
    }
    interface MockMachineService {
        syncStockItems?: (items: StockItem[]) => void;
    }
    const mockStock = mockInventoryService as unknown as MockStockService;
    const mockMachine = mockMachineService as unknown as MockMachineService;

    if (typeof mockStock.subscribe === 'function' && typeof mockMachine.syncStockItems === 'function') {
        mockStock.subscribe((items: StockItem[]) => {
            mockMachine.syncStockItems?.(items);
        });
    }
}
