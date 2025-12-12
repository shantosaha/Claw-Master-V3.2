import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";

// Initial data provided by the user
const INITIAL_MACHINES: any[] = [
    {
        "id": "mac_tc_01_p1_top",
        "name": "Trend Catcher 1 P1 - Top",
        "assetTag": "1001",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Left side unit containing Top and Bottom playfields",
        "slots": [
            {
                "id": "slot_tc_01_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_01_p1_btm",
        "name": "Trend Catcher 1 P1 - Bottom",
        "assetTag": "1001",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "Left side unit containing Top and Bottom playfields",
        "slots": [
            {
                "id": "slot_tc_01_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_01_p2_top",
        "name": "Trend Catcher 1 P2 - Top",
        "assetTag": "1002",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Right side unit containing Top and Bottom playfields",
        "slots": [
            {
                "id": "slot_tc_01_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_01_p2_btm",
        "name": "Trend Catcher 1 P2 - Bottom",
        "assetTag": "1002",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "Right side unit containing Top and Bottom playfields",
        "slots": [
            {
                "id": "slot_tc_01_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_02_p1_top",
        "name": "Trend Catcher 2 P1 - Top",
        "assetTag": "1003",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_02_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_02_p1_btm",
        "name": "Trend Catcher 2 P1 - Bottom",
        "assetTag": "1003",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_02_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_02_p2_top",
        "name": "Trend Catcher 2 P2 - Top",
        "assetTag": "1004",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_02_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_02_p2_btm",
        "name": "Trend Catcher 2 P2 - Bottom",
        "assetTag": "1004",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_02_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_03_p1_top",
        "name": "Trend Catcher 3 P1 - Top",
        "assetTag": "1005",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Maintenance",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_03_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_03_p1_btm",
        "name": "Trend Catcher 3 P1 - Bottom",
        "assetTag": "1005",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Maintenance",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_03_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_03_p2_top",
        "name": "Trend Catcher 3 P2 - Top",
        "assetTag": "1006",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_03_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_03_p2_btm",
        "name": "Trend Catcher 3 P2 - Bottom",
        "assetTag": "1006",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_03_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_04_p1_top",
        "name": "Trend Catcher 4 P1 - Top",
        "assetTag": "1007",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_04_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_04_p1_btm",
        "name": "Trend Catcher 4 P1 - Bottom",
        "assetTag": "1007",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_04_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_04_p2_top",
        "name": "Trend Catcher 4 P2 - Top",
        "assetTag": "1008",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_04_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_04_p2_btm",
        "name": "Trend Catcher 4 P2 - Bottom",
        "assetTag": "1008",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_04_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_05_p1_top",
        "name": "Trend Catcher 5 P1 - Top",
        "assetTag": "1486",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_05_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_05_p1_btm",
        "name": "Trend Catcher 5 P1 - Bottom",
        "assetTag": "1486",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_05_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_05_p2_top",
        "name": "Trend Catcher 5 P2 - Top",
        "assetTag": "1487",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_05_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_05_p2_btm",
        "name": "Trend Catcher 5 P2 - Bottom",
        "assetTag": "1487",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_05_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_06_p1_top",
        "name": "Trend Catcher 6 P1 - Top",
        "assetTag": "1011",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_06_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_06_p1_btm",
        "name": "Trend Catcher 6 P1 - Bottom",
        "assetTag": "1011",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_06_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_06_p2_top",
        "name": "Trend Catcher 6 P2 - Top",
        "assetTag": "1012",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_06_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_06_p2_btm",
        "name": "Trend Catcher 6 P2 - Bottom",
        "assetTag": "1012",
        "type": "Trend Catcher",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_06_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_07_p1_top",
        "name": "Trend Catcher 7 P1 - Top",
        "assetTag": "1013",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_07_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_07_p1_btm",
        "name": "Trend Catcher 7 P1 - Bottom",
        "assetTag": "1013",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_07_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_07_p2_top",
        "name": "Trend Catcher 7 P2 - Top",
        "assetTag": "1014",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_07_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_07_p2_btm",
        "name": "Trend Catcher 7 P2 - Bottom",
        "assetTag": "1014",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_07_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_08_p1_top",
        "name": "Trend Catcher 8 P1 - Top",
        "assetTag": "1015",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_08_p1_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_08_p1_btm",
        "name": "Trend Catcher 8 P1 - Bottom",
        "assetTag": "1015",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_08_p1_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_08_p2_top",
        "name": "Trend Catcher 8 P2 - Top",
        "assetTag": "1016",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_08_p2_top",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_08_p2_btm",
        "name": "Trend Catcher 8 P2 - Bottom",
        "assetTag": "1016",
        "type": "Trend Catcher",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Extra Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_tc_08_p2_btm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Extra Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_dc_01",
        "name": "Doll Castle 1",
        "assetTag": "5001",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dc_01",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dc_02",
        "name": "Doll Castle 2",
        "assetTag": "5002",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dc_02",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dc_03",
        "name": "Doll Castle 3",
        "assetTag": "5003",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dc_03",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dc_04",
        "name": "Doll Castle 4",
        "assetTag": "5004",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dc_04",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dc_05",
        "name": "Doll Castle 5",
        "assetTag": "5005",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Maintenance",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dc_05",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dc_06",
        "name": "Doll Castle 6",
        "assetTag": "5006",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dc_06",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dh_01",
        "name": "Doll House 1",
        "assetTag": "5101",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dh_01",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dh_02",
        "name": "Doll House 2",
        "assetTag": "5102",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dh_02",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dh_03",
        "name": "Doll House 3",
        "assetTag": "5103",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dh_03",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dh_04",
        "name": "Doll House 4",
        "assetTag": "5104",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dh_04",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dh_05",
        "name": "Doll House 5",
        "assetTag": "5105",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dh_05",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_dh_06",
        "name": "Doll House 6",
        "assetTag": "5106",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_dh_06",
                "name": "Main",
                "size": "Large"
            }
        ]
    },
    {
        "id": "mac_big_claw",
        "name": "The Big Claw",
        "assetTag": "6001",
        "type": "Giant Claw",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Big",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_big_claw",
                "name": "Main",
                "size": "Big"
            }
        ]
    },
    {
        "id": "mac_nano_01",
        "name": "Crazy Toy Nano 1",
        "assetTag": "7001",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_nano_01",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_nano_02",
        "name": "Crazy Toy Nano 2",
        "assetTag": "7002",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_nano_02",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_nano_03",
        "name": "Crazy Toy Nano 3",
        "assetTag": "7003",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_nano_03",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_nano_04",
        "name": "Crazy Toy Nano 4",
        "assetTag": "7004",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_nano_04",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_star_01",
        "name": "Crazy Star 1",
        "assetTag": "7101",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_star_01",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_star_02",
        "name": "Crazy Star 2",
        "assetTag": "7102",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_star_02",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_star_03",
        "name": "Crazy Star 3",
        "assetTag": "7103",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_star_03",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_star_04",
        "name": "Crazy Star 4",
        "assetTag": "7104",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_star_04",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_miya_01",
        "name": "Crazy Toy Miya 1",
        "assetTag": "8001",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_01",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_02",
        "name": "Crazy Toy Miya 2",
        "assetTag": "8002",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_02",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_03",
        "name": "Crazy Toy Miya 3",
        "assetTag": "8003",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_03",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_04",
        "name": "Crazy Toy Miya 4",
        "assetTag": "8004",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_04",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_05",
        "name": "Crazy Toy Miya 5",
        "assetTag": "8005",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_05",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_06",
        "name": "Crazy Toy Miya 6",
        "assetTag": "8006",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_06",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_07",
        "name": "Crazy Toy Miya 7",
        "assetTag": "8007",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_07",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_08",
        "name": "Crazy Toy Miya 8",
        "assetTag": "8008",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_08",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_09",
        "name": "Crazy Toy Miya 9",
        "assetTag": "8009",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_09",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_10",
        "name": "Crazy Toy Miya 10",
        "assetTag": "8010",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_10",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_11",
        "name": "Crazy Toy Miya 11",
        "assetTag": "8011",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_11",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_12",
        "name": "Crazy Toy Miya 12",
        "assetTag": "8012",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_12",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_13",
        "name": "Crazy Toy Miya 13",
        "assetTag": "8013",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_13",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_14",
        "name": "Crazy Toy Miya 14",
        "assetTag": "8014",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_14",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_15",
        "name": "Crazy Toy Miya 15",
        "assetTag": "8015",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_15",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_16",
        "name": "Crazy Toy Miya 16",
        "assetTag": "8016",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_16",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_17",
        "name": "Crazy Toy Miya 17",
        "assetTag": "8017",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_17",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_18",
        "name": "Crazy Toy Miya 18",
        "assetTag": "8018",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_18",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_19",
        "name": "Crazy Toy Miya 19",
        "assetTag": "8019",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_19",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_20",
        "name": "Crazy Toy Miya 20",
        "assetTag": "8020",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_20",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_21",
        "name": "Crazy Toy Miya 21",
        "assetTag": "8021",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_21",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_22",
        "name": "Crazy Toy Miya 22",
        "assetTag": "8022",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_22",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_23",
        "name": "Crazy Toy Miya 23",
        "assetTag": "8023",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_23",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_24",
        "name": "Crazy Toy Miya 24",
        "assetTag": "8024",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_24",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_25",
        "name": "Crazy Toy Miya 25",
        "assetTag": "8025",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_25",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_miya_26",
        "name": "Crazy Toy Miya 26",
        "assetTag": "8026",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Extra-Small",
        "physicalConfiguration": "single",
        "notes": "Compatible with Extra-Small and Small sized items",
        "slots": [
            {
                "id": "slot_miya_26",
                "name": "Main",
                "size": "Extra-Small",
                "compatibleSizes": [
                    "Extra-Small",
                    "Small"
                ]
            }
        ]
    },
    {
        "id": "mac_ctl1_01",
        "name": "Crazy Toy L-1",
        "assetTag": "9001",
        "type": "Crazy Toy L-1",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_ctl1_01",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_hm_01",
        "name": "Handsome Man",
        "assetTag": "9101",
        "type": "Handsome Man",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_hm_01",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_hhe_01",
        "name": "Crazy Toy Hip-Hop Elf 1",
        "assetTag": "9301",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_hhe_01",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_hhe_02",
        "name": "Crazy Toy Hip-Hop Elf 2",
        "assetTag": "9302",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_hhe_02",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_hhe_03",
        "name": "Crazy Toy Hip-Hop Elf 3",
        "assetTag": "9303",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_hhe_03",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_hhe_04",
        "name": "Crazy Toy Hip-Hop Elf 4",
        "assetTag": "9304",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "slots": [
            {
                "id": "slot_hhe_04",
                "name": "Main",
                "size": "Medium"
            }
        ]
    },
    {
        "id": "mac_tb_01_p1",
        "name": "Trend Box P1",
        "assetTag": "2001",
        "type": "Trend Box",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from Trend Box",
        "slots": [
            {
                "id": "slot_tb_p1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tb_01_p2",
        "name": "Trend Box P2",
        "assetTag": "2002",
        "type": "Trend Box",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from Trend Box",
        "slots": [
            {
                "id": "slot_tb_p2",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tb_01_p3",
        "name": "Trend Box P3",
        "assetTag": "2003",
        "type": "Trend Box",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from Trend Box",
        "slots": [
            {
                "id": "slot_tb_p3",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tb_01_p4",
        "name": "Trend Box P4",
        "assetTag": "2004",
        "type": "Trend Box",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from Trend Box",
        "slots": [
            {
                "id": "slot_tb_p4",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_sk_01_p1",
        "name": "SKWEB P1",
        "assetTag": "3001",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from SKWEB",
        "slots": [
            {
                "id": "slot_sk_p1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_sk_01_p2",
        "name": "SKWEB P2",
        "assetTag": "3002",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from SKWEB",
        "slots": [
            {
                "id": "slot_sk_p2",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_sk_01_p3",
        "name": "SKWEB P3",
        "assetTag": "3003",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from SKWEB",
        "slots": [
            {
                "id": "slot_sk_p3",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_sk_01_p4",
        "name": "SKWEB P4",
        "assetTag": "3004",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from SKWEB",
        "slots": [
            {
                "id": "slot_sk_p4",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_in_01_p1",
        "name": "INNIS P1",
        "assetTag": "4001",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from INNIS",
        "slots": [
            {
                "id": "slot_in_p1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_in_01_p2",
        "name": "INNIS P2",
        "assetTag": "4002",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from INNIS",
        "slots": [
            {
                "id": "slot_in_p2",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_in_01_p3",
        "name": "INNIS P3",
        "assetTag": "4003",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from INNIS",
        "slots": [
            {
                "id": "slot_in_p3",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_in_01_p4",
        "name": "INNIS P4",
        "assetTag": "4004",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "physicalConfiguration": "single",
        "notes": "Split from INNIS",
        "slots": [
            {
                "id": "slot_in_p4",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hex_01_p1",
        "name": "Hex Claw P1",
        "assetTag": "9201",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "notes": "Split from Hex Claw",
        "slots": [
            {
                "id": "slot_hex_p1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hex_01_p2",
        "name": "Hex Claw P2",
        "assetTag": "9202",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "notes": "Split from Hex Claw",
        "slots": [
            {
                "id": "slot_hex_p2",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hex_01_p3",
        "name": "Hex Claw P3",
        "assetTag": "9203",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "notes": "Split from Hex Claw",
        "slots": [
            {
                "id": "slot_hex_p3",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hex_01_p4",
        "name": "Hex Claw P4",
        "assetTag": "9204",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "notes": "Split from Hex Claw",
        "slots": [
            {
                "id": "slot_hex_p4",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hex_01_p5",
        "name": "Hex Claw P5",
        "assetTag": "9205",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "notes": "Split from Hex Claw",
        "slots": [
            {
                "id": "slot_hex_p5",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hex_01_p6",
        "name": "Hex Claw P6",
        "assetTag": "9206",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "physicalConfiguration": "single",
        "notes": "Split from Hex Claw",
        "slots": [
            {
                "id": "slot_hex_p6",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": null,
                "upcomingQueue": [],
                "stockLevel": "Good"
            }
        ]
    }
];

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
        imageUrl: imageUrl
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
