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
        category: "Plush",
        lowStockThreshold: 10,
        locations: [{ name: "Zone A", quantity: 5 }, { name: "Storage Room 1", quantity: 20 }],
        imageUrl: "",
        payouts: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "demo-s2",
        sku: "ELEC-001",
        name: "Bluetooth Speaker",
        category: "Electronics",
        lowStockThreshold: 5,
        locations: [{ name: "Prize Counter", quantity: 25 }],
        imageUrl: "",
        payouts: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "demo-s3",
        sku: "CANDY-001",
        name: "Choco Bar",
        category: "Candy",
        lowStockThreshold: 50,
        locations: [{ name: "Zone C", quantity: 100 }],
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
    },
    {
        id: "demo-o2",
        itemId: "demo-s3",
        quantityRequested: 200,
        itemName: "Choco Bar",
        status: "approved",
        requestedBy: "demo-user",
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const DEMO_METRICS = {
    dailyPlays: 124,
    popularCategory: "Plush",
    activeMachines: 3,
    totalStockItems: 3,
    lowStockItems: 1,
    openTickets: 1,
    pendingOrders: 2
};

export const DEMO_ALERTS = [
    { id: "a1", type: "warning", message: "Low stock: Giant Teddy Bear", time: "10m ago" },
    { id: "a2", type: "error", message: "Stacker Giant: Coin Jam", time: "1h ago" },
    { id: "a3", type: "info", message: "New order received: Choco Bar", time: "2h ago" }
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


