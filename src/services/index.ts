import { createFirestoreService } from "./firestoreService";
import {
    StockItem,
    ArcadeMachine,
    PlayfieldSetting,
    MaintenanceTask,
    ReorderRequest,
    AuditLog
} from "@/types";
import { mockInventoryService } from "@/lib/mockInventoryService";
import { mockMachineService } from "@/lib/mockMachineService";

// export const stockService = createFirestoreService<StockItem>("stockItems");
export const stockService = mockInventoryService;

// export const machineService = createFirestoreService<ArcadeMachine>("machines");
export const machineService = mockMachineService;

export const settingsService = createFirestoreService<PlayfieldSetting>("playfieldSettings");
export const maintenanceService = createFirestoreService<MaintenanceTask>("maintenanceTasks");
export const orderService = createFirestoreService<ReorderRequest>("reorderRequests");
export const auditService = createFirestoreService<AuditLog>("auditLogs");
export { apiService } from "./apiService";

// Setup synchronization between services
// When inventory changes, update any machines that reference those items
if (typeof (mockInventoryService as any).subscribe === 'function' && typeof (mockMachineService as any).syncStockItems === 'function') {
    (mockInventoryService as any).subscribe((items: StockItem[]) => {
        (mockMachineService as any).syncStockItems(items);
    });
}
