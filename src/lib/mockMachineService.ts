import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";

// Initial data provided by the user
const INITIAL_MACHINES: any[] = [
    {
        "id": "mac_tc_01_p1",
        "name": "Trend Catcher 1 P1",
        "assetTag": "1001",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "notes": "Left side unit containing Top and Bottom playfields",
        "slots": [
            {
                "id": "slot_tc_01_p1_top",
                "name": "Top",
                "status": "Online"
            },
            {
                "id": "slot_tc_01_p1_btm",
                "name": "Bottom",
                "status": "Online"
            }
        ]
    },
    {
        "id": "mac_tc_01_p2",
        "name": "Trend Catcher 1 P2",
        "assetTag": "1002",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "notes": "Right side unit containing Top and Bottom playfields",
        "slots": [
            {
                "id": "slot_tc_01_p2_top",
                "name": "Top",
                "status": "Online"
            },
            {
                "id": "slot_tc_01_p2_btm",
                "name": "Bottom",
                "status": "Online"
            }
        ]
    },
    {
        "id": "mac_tc_02_p1",
        "name": "Trend Catcher 2 P1",
        "assetTag": "1003",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_02_p1_top", "name": "Top" },
            { "id": "slot_tc_02_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_02_p2",
        "name": "Trend Catcher 2 P2",
        "assetTag": "1004",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_02_p2_top", "name": "Top" },
            { "id": "slot_tc_02_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_03_p1",
        "name": "Trend Catcher 3 P1",
        "assetTag": "1005",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Maintenance",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_03_p1_top", "name": "Top" },
            { "id": "slot_tc_03_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_03_p2",
        "name": "Trend Catcher 3 P2",
        "assetTag": "1006",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_03_p2_top", "name": "Top" },
            { "id": "slot_tc_03_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_04_p1",
        "name": "Trend Catcher 4 P1",
        "assetTag": "1007",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_04_p1_top", "name": "Top" },
            { "id": "slot_tc_04_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_04_p2",
        "name": "Trend Catcher 4 P2",
        "assetTag": "1008",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_04_p2_top", "name": "Top" },
            { "id": "slot_tc_04_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_05_p1",
        "name": "Trend Catcher 5 P1",
        "assetTag": "1486",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_05_p1_top", "name": "Top" },
            { "id": "slot_tc_05_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_05_p2",
        "name": "Trend Catcher 5 P2",
        "assetTag": "1487",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_05_p2_top", "name": "Top" },
            { "id": "slot_tc_05_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_06_p1",
        "name": "Trend Catcher 6 P1",
        "assetTag": "1011",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_06_p1_top", "name": "Top" },
            { "id": "slot_tc_06_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_06_p2",
        "name": "Trend Catcher 6 P2",
        "assetTag": "1012",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_06_p2_top", "name": "Top" },
            { "id": "slot_tc_06_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_07_p1",
        "name": "Trend Catcher 7 P1",
        "assetTag": "1013",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_07_p1_top", "name": "Top" },
            { "id": "slot_tc_07_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_07_p2",
        "name": "Trend Catcher 7 P2",
        "assetTag": "1014",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_07_p2_top", "name": "Top" },
            { "id": "slot_tc_07_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_08_p1",
        "name": "Trend Catcher 8 P1",
        "assetTag": "1015",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_08_p1_top", "name": "Top" },
            { "id": "slot_tc_08_p1_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tc_08_p2",
        "name": "Trend Catcher 8 P2",
        "assetTag": "1016",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "multi_dual_stack",
        "slots": [
            { "id": "slot_tc_08_p2_top", "name": "Top" },
            { "id": "slot_tc_08_p2_btm", "name": "Bottom" }
        ]
    },
    {
        "id": "mac_tb_p1",
        "name": "Trend Box P1",
        "assetTag": "2001",
        "type": "Trend Box",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_tb_p1", "name": "Main" }]
    },
    {
        "id": "mac_tb_p2",
        "name": "Trend Box P2",
        "assetTag": "2002",
        "type": "Trend Box",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_tb_p2", "name": "Main" }]
    },
    {
        "id": "mac_tb_p3",
        "name": "Trend Box P3",
        "assetTag": "2003",
        "type": "Trend Box",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_tb_p3", "name": "Main" }]
    },
    {
        "id": "mac_tb_p4",
        "name": "Trend Box P4",
        "assetTag": "2004",
        "type": "Trend Box",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_tb_p4", "name": "Main" }]
    },
    {
        "id": "mac_sk_p1",
        "name": "SKWEB P1",
        "assetTag": "3001",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_sk_p1", "name": "Main" }]
    },
    {
        "id": "mac_sk_p2",
        "name": "SKWEB P2",
        "assetTag": "3002",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_sk_p2", "name": "Main" }]
    },
    {
        "id": "mac_sk_p3",
        "name": "SKWEB P3",
        "assetTag": "3003",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_sk_p3", "name": "Main" }]
    },
    {
        "id": "mac_sk_p4",
        "name": "SKWEB P4",
        "assetTag": "3004",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Error",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_sk_p4", "name": "Main" }]
    },
    {
        "id": "mac_in_p1",
        "name": "INNIS P1",
        "assetTag": "4001",
        "type": "INNIS",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_in_p1", "name": "Main" }]
    },
    {
        "id": "mac_in_p2",
        "name": "INNIS P2",
        "assetTag": "4002",
        "type": "INNIS",
        "location": "Ground",
        "status": "Offline",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_in_p2", "name": "Main" }]
    },
    {
        "id": "mac_dc_01",
        "name": "Doll Castle 1",
        "assetTag": "5001",
        "type": "Doll Castle",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dc_01", "name": "Main" }]
    },
    {
        "id": "mac_dc_02",
        "name": "Doll Castle 2",
        "assetTag": "5002",
        "type": "Doll Castle",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dc_02", "name": "Main" }]
    },
    {
        "id": "mac_dc_03",
        "name": "Doll Castle 3",
        "assetTag": "5003",
        "type": "Doll Castle",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dc_03", "name": "Main" }]
    },
    {
        "id": "mac_dc_04",
        "name": "Doll Castle 4",
        "assetTag": "5004",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dc_04", "name": "Main" }]
    },
    {
        "id": "mac_dc_05",
        "name": "Doll Castle 5",
        "assetTag": "5005",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Maintenance",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dc_05", "name": "Main" }]
    },
    {
        "id": "mac_dc_06",
        "name": "Doll Castle 6",
        "assetTag": "5006",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dc_06", "name": "Main" }]
    },
    {
        "id": "mac_dh_01",
        "name": "Doll House 1",
        "assetTag": "5101",
        "type": "Doll House",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dh_01", "name": "Main" }]
    },
    {
        "id": "mac_dh_02",
        "name": "Doll House 2",
        "assetTag": "5102",
        "type": "Doll House",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dh_02", "name": "Main" }]
    },
    {
        "id": "mac_dh_03",
        "name": "Doll House 3",
        "assetTag": "5103",
        "type": "Doll House",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dh_03", "name": "Main" }]
    },
    {
        "id": "mac_dh_04",
        "name": "Doll House 4",
        "assetTag": "5104",
        "type": "Doll House",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dh_04", "name": "Main" }]
    },
    {
        "id": "mac_dh_05",
        "name": "Doll House 5",
        "assetTag": "5105",
        "type": "Doll House",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dh_05", "name": "Main" }]
    },
    {
        "id": "mac_dh_06",
        "name": "Doll House 6",
        "assetTag": "5106",
        "type": "Doll House",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_dh_06", "name": "Main" }]
    },
    {
        "id": "mac_big_claw",
        "name": "The Big Claw",
        "assetTag": "6001",
        "type": "Giant Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Big",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_big_claw", "name": "Main" }]
    },
    {
        "id": "mac_nano_01",
        "name": "Crazy Toy Nano 1",
        "assetTag": "7001",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_nano_01", "name": "Main" }]
    },
    {
        "id": "mac_nano_02",
        "name": "Crazy Toy Nano 2",
        "assetTag": "7002",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_nano_02", "name": "Main" }]
    },
    {
        "id": "mac_nano_03",
        "name": "Crazy Toy Nano 3",
        "assetTag": "7003",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_nano_03", "name": "Main" }]
    },
    {
        "id": "mac_nano_04",
        "name": "Crazy Toy Nano 4",
        "assetTag": "7004",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_nano_04", "name": "Main" }]
    },
    {
        "id": "mac_star_01",
        "name": "Crazy Star 1",
        "assetTag": "7101",
        "type": "Crazy Star",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_star_01", "name": "Main" }]
    },
    {
        "id": "mac_star_02",
        "name": "Crazy Star 2",
        "assetTag": "7102",
        "type": "Crazy Star",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_star_02", "name": "Main" }]
    },
    {
        "id": "mac_star_03",
        "name": "Crazy Star 3",
        "assetTag": "7103",
        "type": "Crazy Star",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_star_03", "name": "Main" }]
    },
    {
        "id": "mac_star_04",
        "name": "Crazy Star 4",
        "assetTag": "7104",
        "type": "Crazy Star",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_star_04", "name": "Main" }]
    },
    {
        "id": "mac_miya_01",
        "name": "Crazy Toy Miya 1",
        "assetTag": "8001",
        "type": "Crazy Toy Miya",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_miya_01", "name": "Main" }]
    },
    {
        "id": "mac_miya_02",
        "name": "Crazy Toy Miya 2",
        "assetTag": "8002",
        "type": "Crazy Toy Miya",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_miya_02", "name": "Main" }]
    },
    {
        "id": "mac_miya_03",
        "name": "Crazy Toy Miya 3",
        "assetTag": "8003",
        "type": "Crazy Toy Miya",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_miya_03", "name": "Main" }]
    },
    {
        "id": "mac_miya_04",
        "name": "Crazy Toy Miya 4",
        "assetTag": "8004",
        "type": "Crazy Toy Miya",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_miya_04", "name": "Main" }]
    },
    {
        "id": "mac_miya_05",
        "name": "Crazy Toy Miya 5",
        "assetTag": "8005",
        "type": "Crazy Toy Miya",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_miya_05", "name": "Main" }]
    },
    {
        "id": "mac_miya_20",
        "name": "Crazy Toy Miya 20",
        "assetTag": "8020",
        "type": "Crazy Toy Miya",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "slots": [{ "id": "slot_miya_20", "name": "Main" }]
    }
];

// Helper to map raw data to ArcadeMachine type
const mapToArcadeMachine = (data: any): ArcadeMachine => {
    // Use real arcade claw machine images from Unsplash
    const imageUrls = [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop", // Claw machine 1
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop", // Arcade 2
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop", // Arcade 3
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop", // Arcade 4
        "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&h=400&fit=crop", // Arcade 5
        "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&h=400&fit=crop", // Arcade 6
    ];

    // Use hash of ID to consistently assign images
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const imageIndex = hashCode(data.id) % imageUrls.length;

    return {
        ...data,
        physicalConfig: data.physicalConfiguration, // Map key
        slots: data.slots.map((slot: any) => ({
            ...slot,
            gameType: "Claw", // Default
            status: slot.status ? slot.status.toLowerCase() : "online",
            currentItem: null,
            upcomingQueue: [],
            stockLevel: "Good"
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: imageUrls[imageIndex]
    };
};

let inMemoryMachines: ArcadeMachine[] = [];
let initialized = false;

const STORAGE_KEY = 'claw_master_machines';

const initializeMachines = () => {
    if (initialized) return;

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
            } catch (e) {
                console.error("Failed to parse stored machines", e);
                inMemoryMachines = INITIAL_MACHINES.map(mapToArcadeMachine);
            }
        } else {
            inMemoryMachines = INITIAL_MACHINES.map(mapToArcadeMachine);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryMachines));
        }
    } else {
        inMemoryMachines = INITIAL_MACHINES.map(mapToArcadeMachine);
    }
    initialized = true;
};

const saveToStorage = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryMachines));
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
        let changed = false;
        inMemoryMachines.forEach(machine => {
            machine.slots.forEach(slot => {
                if (slot.currentItem) {
                    const freshItem = items.find(i => i.id === slot.currentItem!.id);
                    if (freshItem) {
                        // Check if changed (simple comparison)
                        if (JSON.stringify(slot.currentItem) !== JSON.stringify(freshItem)) {
                            slot.currentItem = freshItem;
                            changed = true;
                        }
                    }
                }
            });
        });
        if (changed) {
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
