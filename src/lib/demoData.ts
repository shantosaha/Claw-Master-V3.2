import { ArcadeMachine, StockItem, ReorderRequest, MaintenanceTask } from "@/types";

export const DEMO_MACHINES: ArcadeMachine[] = [
    {
        id: "demo-m1",
        name: "Claw Master 3000",
        location: "Zone A",
        group: "Premium",
        subGroup: "Plush",
        tag: "TAG-101",
        assetTag: "AST-101",
        status: "Online",
        physicalConfig: "multi_4_slot",
        playCount: 1250,
        revenue: 2500,
        slots: [
            {
                id: "s1",
                name: "Left Claw",
                gameType: "Plush Mix",
                status: "online",
                currentItem: {
                    id: "demo-s1",
                    sku: "PLUSH-001",
                    name: "Giant Teddy Bear",
                    category: "Plush",
                    lowStockThreshold: 10,
                    locations: [{ name: "Zone A", quantity: 5 }],
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                upcomingQueue: [],
                stockLevel: "Low"
            },
            {
                id: "s2",
                name: "Right Claw",
                gameType: "Plush Mix",
                status: "online",
                currentItem: null,
                upcomingQueue: [],
                stockLevel: "Empty"
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
    },
    {
        id: "demo-m2",
        name: "Stacker Giant",
        location: "Zone B",
        group: "Redemption",
        subGroup: "Skill",
        tag: "TAG-102",
        assetTag: "AST-102",
        status: "Maintenance",
        physicalConfig: "single",
        playCount: 800,
        revenue: 1600,
        slots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
    },
    {
        id: "demo-m3",
        name: "Ticket Circus",
        location: "Zone C",
        group: "Redemption",
        subGroup: "Coin Pusher",
        tag: "TAG-103",
        assetTag: "AST-103",
        status: "Online",
        physicalConfig: "single",
        playCount: 5000,
        revenue: 10000,
        slots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date()
    }
];

export const DEMO_STOCK: StockItem[] = [
    {
        id: "demo-s1",
        sku: "PLUSH-001",
        name: "Giant Teddy Bear",
        category: "Plushy",
        lowStockThreshold: 10,
        locations: [{ name: "Zone A", quantity: 5 }, { name: "Storage Room 1", quantity: 20 }],
        imageUrl: "",
        payouts: [],
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const DEMO_ORDERS: ReorderRequest[] = [
    {
        id: "demo-o1",
        itemId: "demo-s1",
        quantityRequested: 50,
        itemName: "Giant Teddy Bear",
        status: "submitted",
        requestedBy: "demo-user",
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const DEMO_METRICS = {
    dailyPlays: 124,
    popularCategory: "Plushy",
    activeMachines: 3,
    totalStockItems: 1,
    lowStockItems: 0,
    openTickets: 1,
    pendingOrders: 1
};

export const DEMO_ALERTS = [
    { id: "a1", type: "warning", message: "Low stock: Giant Teddy Bear", time: "10m ago" },
    { id: "a2", type: "error", message: "Stacker Giant: Coin Jam", time: "1h ago" }
];

export const DEMO_MAINTENANCE: MaintenanceTask[] = [
    {
        id: "demo-mt1",
        machineId: "demo-m2",
        description: "Coin acceptor is jammed in Stacker Giant.",
        priority: "high",
        status: "open",
        assignedTo: "Tech 1",
        createdBy: "Staff 1",
        createdAt: new Date(),
    }
];


export const DEMO_ITEM_MACHINE_SETTINGS: any[] = [
    {
        id: "ims-1",
        itemId: "inv_plu_014",
        itemName: "Disney - Angel (Pink)",
        machineId: "mac_tc_01_p1_top",
        machineName: "Trend #1 P1 - Top",
        c1: 24,
        c2: 18,
        c3: 12,
        c4: 24,
        playPrice: 1.80,
        playPerWin: 12,
        expectedRevenue: 21.60,
        lastUpdatedBy: "system",
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    },
    {
        id: "ims-2",
        itemId: "inv_plu_003",
        itemName: "Kirby - Standard Pink (12cm)",
        machineId: "mac_tc_02_p1_top",
        machineName: "Trend #2 P1 - Top",
        c1: 20,
        c2: 15,
        c3: 10,
        c4: 24,
        playPrice: 1.80,
        playPerWin: 10,
        expectedRevenue: 18.00,
        lastUpdatedBy: "system",
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    }
];
