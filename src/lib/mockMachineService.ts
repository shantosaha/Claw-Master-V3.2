import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";
import { relinkMachineItems } from "@/utils/relinkMachineItems";

// Initial data provided by the user
const INITIAL_MACHINES: any[] = [
    {
        "id": "mac_tc_01_p1_top",
        "name": "Trend #1 P1 - Top",
        "assetTag": "1431",
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
                "currentItem": {
                    "id": "inv_plu_014",
                    "name": "Disney - Angel (Pink)",
                    "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_38",
                        "name": "Penguin - Emperor",
                        "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_01_p1_btm",
        "name": "Trend #1 P1 - Bottom",
        "assetTag": "1431",
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
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_01_p2_top",
        "name": "Trend #1 P2 - Top",
        "assetTag": "1432",
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
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_01_p2_btm",
        "name": "Trend #1 P2 - Bottom",
        "assetTag": "1432",
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
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_034",
                        "name": "Bluey - Standard",
                        "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_02_p1_top",
        "name": "Trend #2 P1 - Top",
        "assetTag": "1433",
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
                "currentItem": {
                    "id": "inv_plu_003",
                    "name": "Kirby - Standard Pink (12cm)",
                    "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_004",
                        "name": "Kirby - Sleepy Blue (12cm)",
                        "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_02_p1_btm",
        "name": "Trend #2 P1 - Bottom",
        "assetTag": "1433",
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
                "currentItem": {
                    "id": "inv_plu_38",
                    "name": "Penguin - Emperor",
                    "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_02_p2_top",
        "name": "Trend #2 P2 - Top",
        "assetTag": "1434",
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
                "currentItem": {
                    "id": "inv_plu_018",
                    "name": "Spy x Family - Bond (Dog)",
                    "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_02_p2_btm",
        "name": "Trend #2 P2 - Bottom",
        "assetTag": "1434",
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
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_03_p1_top",
        "name": "Trend #3 P1 - Top",
        "assetTag": "1435",
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
                "currentItem": {
                    "id": "inv_plu_026",
                    "name": "Capybara w/ Orange",
                    "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_03_p1_btm",
        "name": "Trend #3 P1 - Bottom",
        "assetTag": "1435",
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
                "currentItem": {
                    "id": "inv_plu_017",
                    "name": "Spy x Family - Anya (Uniform)",
                    "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_028",
                        "name": "Gengar - Grinning",
                        "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_03_p2_top",
        "name": "Trend #3 P2 - Top",
        "assetTag": "1436",
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
                "currentItem": {
                    "id": "inv_plu_029",
                    "name": "Eevee - Sitting",
                    "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_004",
                        "name": "Kirby - Sleepy Blue (12cm)",
                        "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_03_p2_btm",
        "name": "Trend #3 P2 - Bottom",
        "assetTag": "1436",
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
                "currentItem": {
                    "id": "inv_plu_38",
                    "name": "Penguin - Emperor",
                    "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_04_p1_top",
        "name": "Trend #4 P1 - Top",
        "assetTag": "1437",
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
                "currentItem": {
                    "id": "inv_plu_020",
                    "name": "Among Us - Red Crewmate",
                    "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_003",
                        "name": "Kirby - Standard Pink (12cm)",
                        "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_04_p1_btm",
        "name": "Trend #4 P1 - Bottom",
        "assetTag": "1437",
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
                "currentItem": {
                    "id": "inv_plu_034",
                    "name": "Bluey - Standard",
                    "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_38",
                        "name": "Penguin - Emperor",
                        "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_008",
                        "name": "Sanrio - Cinnamoroll",
                        "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_04_p2_top",
        "name": "Trend #4 P2 - Top",
        "assetTag": "1438",
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
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_004",
                        "name": "Kirby - Sleepy Blue (12cm)",
                        "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_04_p2_btm",
        "name": "Trend #4 P2 - Bottom",
        "assetTag": "1438",
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
                "currentItem": {
                    "id": "inv_plu_001",
                    "name": "Pokémon - Pikachu Winking (15cm)",
                    "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_05_p1_top",
        "name": "Trend #5 P1 G",
        "assetTag": "1443",
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
                "currentItem": {
                    "id": "inv_plu_026",
                    "name": "Capybara w/ Orange",
                    "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_05_p1_btm",
        "name": "Trend #5 P1 - Bottom",
        "assetTag": "1443",
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
                "currentItem": {
                    "id": "inv_plu_003",
                    "name": "Kirby - Standard Pink (12cm)",
                    "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_05_p2_top",
        "name": "Trend #5 P2 G",
        "assetTag": "1444",
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
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_003",
                        "name": "Kirby - Standard Pink (12cm)",
                        "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_05_p2_btm",
        "name": "Trend #5 P2 - Bottom",
        "assetTag": "1444",
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
                "currentItem": {
                    "id": "inv_plu_012",
                    "name": "Minecraft - TNT Block",
                    "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_06_p1_top",
        "name": "Trend #6 P1 - Top",
        "assetTag": "1445",
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
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_006",
                        "name": "Sanrio - My Melody",
                        "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_06_p1_btm",
        "name": "Trend #6 P1 - Bottom",
        "assetTag": "1445",
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
                "currentItem": {
                    "id": "inv_plu_020",
                    "name": "Among Us - Red Crewmate",
                    "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_06_p2_top",
        "name": "Trend #6 P2 - Top",
        "assetTag": "1446",
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
                "currentItem": {
                    "id": "inv_plu_026",
                    "name": "Capybara w/ Orange",
                    "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_06_p2_btm",
        "name": "Trend #6 P2 - Bottom",
        "assetTag": "1446",
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
                "currentItem": {
                    "id": "inv_plu_001",
                    "name": "Pokémon - Pikachu Winking (15cm)",
                    "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_07_p1_top",
        "name": "Trend #7 P1 G",
        "assetTag": "1451",
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
                "currentItem": {
                    "id": "inv_plu_027",
                    "name": "Capybara w/ Backpack",
                    "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_07_p1_btm",
        "name": "Trend #7 P1 - Bottom",
        "assetTag": "1451",
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
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_07_p2_top",
        "name": "Trend #7 P2 G",
        "assetTag": "1452",
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
                "currentItem": {
                    "id": "inv_plu_005",
                    "name": "Sanrio - Hello Kitty Red Bow",
                    "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_40",
                        "name": "Axolotl - Pink",
                        "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_07_p2_btm",
        "name": "Trend #7 P2 - Bottom",
        "assetTag": "1452",
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
                "currentItem": {
                    "id": "inv_plu_010",
                    "name": "Generic - Bubble Tea Plush (Brown)",
                    "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_08_p1_top",
        "name": "Trend #8 P1 G",
        "assetTag": "1482",
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
                "currentItem": {
                    "id": "inv_plu_017",
                    "name": "Spy x Family - Anya (Uniform)",
                    "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_028",
                        "name": "Gengar - Grinning",
                        "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_08_p1_btm",
        "name": "Trend #8 P1 - Bottom",
        "assetTag": "1482",
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
                "currentItem": {
                    "id": "inv_plu_010",
                    "name": "Generic - Bubble Tea Plush (Brown)",
                    "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_tc_08_p2_top",
        "name": "Trend #8 P2 G",
        "assetTag": "1481",
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
                "currentItem": {
                    "id": "inv_plu_002",
                    "name": "Pokémon - Snorlax Sleeping (15cm)",
                    "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ],
        "group": "Group 4-Cranes",
        "subGroup": "Small"
    },
    {
        "id": "mac_tc_08_p2_btm",
        "name": "Trend #8 P2 - Bottom",
        "assetTag": "1481",
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
                "currentItem": {
                    "id": "inv_plu_026",
                    "name": "Capybara w/ Orange",
                    "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_clip_story_black_p1_bm",
        "name": "Clip Story Black P1 BM",
        "assetTag": "244",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Blindbox",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_clip_story_black_p1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_011",
                    "name": "Minecraft - Creeper (Small)",
                    "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_key_14",
                        "name": "Bleach Hollow Mask Keychain",
                        "imageUrl": "/stock-images/inv_key_14_1.jpg",
                        "category": "Key Chain",
                        "size": "Extra-Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_clip_story_black_p2_bm",
        "name": "Clip Story Black P2 BM",
        "assetTag": "614",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Blindbox",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_clip_story_black_p2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_007",
                    "name": "Sanrio - Kuromi (Purple)",
                    "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_003",
                        "name": "Kirby - Standard Pink (12cm)",
                        "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_clip_story_white_single_bm",
        "name": "Clip Story White Single BM",
        "assetTag": "696",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_clip_story_white_single_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_10",
                    "name": "Pop Mart - Zimomo Animals",
                    "imageUrl": "/stock-images/inv_bbox_10_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_8",
                        "name": "Pop Mart - Pucky Sleeping Babies",
                        "imageUrl": "/stock-images/inv_bbox_8_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_color_star_p1_g",
        "name": "Color Star P1 G",
        "assetTag": "484",
        "type": "Crazy Star",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_color_star_p1_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_38",
                        "name": "Penguin - Emperor",
                        "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_color_star_p2_g",
        "name": "Color Star P2 G",
        "assetTag": "1530",
        "type": "Crazy Star",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_color_star_p2_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_40",
                    "name": "Axolotl - Pink",
                    "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_40",
                        "name": "Axolotl - Pink",
                        "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_color_star_p3_g",
        "name": "Color Star P3 G",
        "assetTag": "690",
        "type": "Crazy Star",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_color_star_p3_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_029",
                    "name": "Eevee - Sitting",
                    "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_010",
                        "name": "Generic - Bubble Tea Plush (Brown)",
                        "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_color_star_p4_g",
        "name": "Color Star P4 G",
        "assetTag": "691",
        "type": "Crazy Star",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_color_star_p4_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_stars_3_p1_bm",
        "name": "Crazy Stars 3 P1 BM",
        "assetTag": "210",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_stars_3_p1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_7",
                    "name": "Pop Mart - Hirono City",
                    "imageUrl": "/stock-images/inv_bbox_7_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_022",
                        "name": "Korilakkuma - White Bear (30cm)",
                        "imageUrl": "/stock-images/inv_plu_022_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_stars_3_p2_bm",
        "name": "Crazy Stars 3 P2 BM",
        "assetTag": "1531",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_stars_3_p2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_plu_030",
                    "name": "Kuromi - Black Goth",
                    "imageUrl": "/stock-images/inv_plu_030_1.jpg",
                    "category": "Plushy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_pop_9",
                        "name": "Funko Pop - Game of Thrones - Daenerys",
                        "imageUrl": "/stock-images/inv_pop_9_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_001",
                        "name": "Pop Mart - Skullpanda Series 1",
                        "imageUrl": "/stock-images/inv_bbox_001_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_stars_3_p3_bm",
        "name": "Crazy Stars 3 P3 BM",
        "assetTag": "211",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_stars_3_p3_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_011",
                    "name": "Minecraft - Creeper (Small)",
                    "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_stars_3_p4_bm",
        "name": "Crazy Stars 3 P4 BM",
        "assetTag": "212",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_stars_3_p4_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_004",
                    "name": "One Piece - WCF Figures",
                    "imageUrl": "/stock-images/inv_bbox_004_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_7",
                        "name": "Pop Mart - Hirono City",
                        "imageUrl": "/stock-images/inv_bbox_7_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_stars_3_p5_bm",
        "name": "Crazy Stars 3 P5 BM",
        "assetTag": "213",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_stars_3_p5_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_002",
                    "name": "Pop Mart - Dimoo Zodiac",
                    "imageUrl": "/stock-images/inv_bbox_002_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_8",
                        "name": "Pop Mart - Pucky Sleeping Babies",
                        "imageUrl": "/stock-images/inv_bbox_8_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_5",
                        "name": "Pop Mart - Molly Space Series",
                        "imageUrl": "/stock-images/inv_bbox_5_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_stars_3_p6_bm",
        "name": "Crazy Stars 3 P6 BM",
        "assetTag": "214",
        "type": "Crazy Star",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_stars_3_p6_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_003",
                    "name": "Kirby - Standard Pink (12cm)",
                    "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_2_bm",
        "name": "Crazy Toy 2 BM",
        "assetTag": "1271",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_5",
                    "name": "Funko Pop - Disney - Mickey Mouse",
                    "imageUrl": "/stock-images/inv_pop_5_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_5",
                        "name": "Pop Mart - Molly Space Series",
                        "imageUrl": "/stock-images/inv_bbox_5_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_pop_9",
                        "name": "Funko Pop - Game of Thrones - Daenerys",
                        "imageUrl": "/stock-images/inv_pop_9_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_double_lhs_bm",
        "name": "Crazy Toy Double LHS BM",
        "assetTag": "149",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_double_lhs_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_7",
                    "name": "Funko Pop - The Office - Michael Scott",
                    "imageUrl": "/stock-images/inv_pop_7_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_022",
                        "name": "Korilakkuma - White Bear (30cm)",
                        "imageUrl": "/stock-images/inv_plu_022_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_toy_4",
                        "name": "Spinning Top LED",
                        "imageUrl": "/stock-images/inv_toy_4_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_double_rhs_bm",
        "name": "Crazy Toy Double RHS BM",
        "assetTag": "150",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_double_rhs_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_13",
                    "name": "Pop Mart - Vita Little Monsters",
                    "imageUrl": "/stock-images/inv_bbox_13_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_9",
                        "name": "Pop Mart - Dimoo World",
                        "imageUrl": "/stock-images/inv_bbox_9_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_toy_2",
                        "name": "Foam Airplane Glider",
                        "imageUrl": "/stock-images/inv_toy_2_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_l1",
        "name": "Crazy Toy L1",
        "assetTag": "1545",
        "type": "Crazy Toy L-1",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_034",
                    "name": "Bluey - Standard",
                    "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1000_bm",
        "name": "Crazy Toy Miya 1000 BM",
        "assetTag": "1000",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1000_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1001_bm",
        "name": "Crazy Toy Miya 1001 BM",
        "assetTag": "1001",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1001_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_002",
                    "name": "Pokémon - Snorlax Sleeping (15cm)",
                    "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_035",
                        "name": "Bingo - Standard",
                        "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1002_bm",
        "name": "Crazy Toy Miya 1002 BM",
        "assetTag": "1002",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1002_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_40",
                    "name": "Axolotl - Pink",
                    "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1003_bm",
        "name": "Crazy Toy Miya 1003 BM",
        "assetTag": "1003",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1003_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1004_bm",
        "name": "Crazy Toy Miya 1004 BM",
        "assetTag": "1004",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1004_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_010",
                    "name": "Generic - Bubble Tea Plush (Brown)",
                    "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1005_bm",
        "name": "Crazy Toy Miya 1005 BM",
        "assetTag": "1005",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1005_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_017",
                    "name": "Spy x Family - Anya (Uniform)",
                    "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1006_bm",
        "name": "Crazy Toy Miya 1006 BM",
        "assetTag": "1006",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1006_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_017",
                    "name": "Spy x Family - Anya (Uniform)",
                    "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1007_bm",
        "name": "Crazy Toy Miya 1007 BM",
        "assetTag": "1007",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1007_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_008",
                    "name": "Sanrio - Cinnamoroll",
                    "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1008_bm",
        "name": "Crazy Toy Miya 1008 BM",
        "assetTag": "1008",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1008_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_014",
                    "name": "Disney - Angel (Pink)",
                    "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_008",
                        "name": "Sanrio - Cinnamoroll",
                        "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1009_bm",
        "name": "Crazy Toy Miya 1009 BM",
        "assetTag": "1009",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1009_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_008",
                    "name": "Sanrio - Cinnamoroll",
                    "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1010_bm",
        "name": "Crazy Toy Miya 1010 BM",
        "assetTag": "1010",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1010_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_005",
                    "name": "Sanrio - Hello Kitty Red Bow",
                    "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_38",
                        "name": "Penguin - Emperor",
                        "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1011_bm",
        "name": "Crazy Toy Miya 1011 BM",
        "assetTag": "1011",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1011_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_006",
                    "name": "Sanrio - My Melody",
                    "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1012_bm",
        "name": "Crazy Toy Miya 1012 BM",
        "assetTag": "1012",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1012_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_006",
                    "name": "Sanrio - My Melody",
                    "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1013_bm",
        "name": "Crazy Toy Miya 1013 BM",
        "assetTag": "1013",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1013_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1014_bm",
        "name": "Crazy Toy Miya 1014 BM",
        "assetTag": "1014",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1014_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_010",
                    "name": "Generic - Bubble Tea Plush (Brown)",
                    "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1015_bm",
        "name": "Crazy Toy Miya 1015 BM",
        "assetTag": "1015",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1015_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_029",
                    "name": "Eevee - Sitting",
                    "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1016_bm",
        "name": "Crazy Toy Miya 1016 BM",
        "assetTag": "1016",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1016_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_003",
                    "name": "Kirby - Standard Pink (12cm)",
                    "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_38",
                        "name": "Penguin - Emperor",
                        "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1017_bm",
        "name": "Crazy Toy Miya 1017 BM",
        "assetTag": "1017",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1017_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_005",
                    "name": "Sanrio - Hello Kitty Red Bow",
                    "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_004",
                        "name": "Kirby - Sleepy Blue (12cm)",
                        "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1018_bm",
        "name": "Crazy Toy Miya 1018 BM",
        "assetTag": "1018",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1018_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1019_bm",
        "name": "Crazy Toy Miya 1019 BM",
        "assetTag": "1019",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1019_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_035",
                    "name": "Bingo - Standard",
                    "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1020_bm",
        "name": "Crazy Toy Miya 1020 BM",
        "assetTag": "1020",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1020_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_035",
                        "name": "Bingo - Standard",
                        "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1021_bm",
        "name": "Crazy Toy Miya 1021 BM",
        "assetTag": "1021",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1021_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_015",
                        "name": "Generic - Octupus Reversible (Red/Blue)",
                        "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1022_bm",
        "name": "Crazy Toy Miya 1022 BM",
        "assetTag": "1022",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1022_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_007",
                    "name": "Sanrio - Kuromi (Purple)",
                    "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_015",
                        "name": "Generic - Octupus Reversible (Red/Blue)",
                        "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1023_bm",
        "name": "Crazy Toy Miya 1023 BM",
        "assetTag": "1023",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1023_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_018",
                    "name": "Spy x Family - Bond (Dog)",
                    "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1024_bm",
        "name": "Crazy Toy Miya 1024 BM",
        "assetTag": "1024",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1024_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1025_bm",
        "name": "Crazy Toy Miya 1025 BM",
        "assetTag": "1025",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1025_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_016",
                    "name": "Generic - Avocado Cute",
                    "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_40",
                        "name": "Axolotl - Pink",
                        "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1026_bm",
        "name": "Crazy Toy Miya 1026 BM",
        "assetTag": "1026",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1026_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1027_bm",
        "name": "Crazy Toy Miya 1027 BM",
        "assetTag": "1027",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1027_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1028_bm",
        "name": "Crazy Toy Miya 1028 BM",
        "assetTag": "1028",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1028_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_027",
                    "name": "Capybara w/ Backpack",
                    "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1029_bm",
        "name": "Crazy Toy Miya 1029 BM",
        "assetTag": "1029",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1029_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_026",
                    "name": "Capybara w/ Orange",
                    "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1030_bm",
        "name": "Crazy Toy Miya 1030 BM",
        "assetTag": "1030",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1030_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_019",
                        "name": "Chainsaw Man - Pochita",
                        "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1031_bm",
        "name": "Crazy Toy Miya 1031 BM",
        "assetTag": "1031",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1031_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1032_bm",
        "name": "Crazy Toy Miya 1032 BM",
        "assetTag": "1032",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1032_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_010",
                    "name": "Generic - Bubble Tea Plush (Brown)",
                    "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_019",
                        "name": "Chainsaw Man - Pochita",
                        "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1033_bm",
        "name": "Crazy Toy Miya 1033 BM",
        "assetTag": "1033",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1033_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1034_bm",
        "name": "Crazy Toy Miya 1034 BM",
        "assetTag": "1034",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1034_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_035",
                    "name": "Bingo - Standard",
                    "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_003",
                        "name": "Kirby - Standard Pink (12cm)",
                        "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1035_bm",
        "name": "Crazy Toy Miya 1035 BM",
        "assetTag": "1035",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1035_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1036_bm",
        "name": "Crazy Toy Miya 1036 BM",
        "assetTag": "1036",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1036_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_010",
                    "name": "Generic - Bubble Tea Plush (Brown)",
                    "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_034",
                        "name": "Bluey - Standard",
                        "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1037_bm",
        "name": "Crazy Toy Miya 1037 BM",
        "assetTag": "1037",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1037_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1038_bm",
        "name": "Crazy Toy Miya 1038 BM",
        "assetTag": "1038",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1038_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_008",
                        "name": "Sanrio - Cinnamoroll",
                        "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1039_bm",
        "name": "Crazy Toy Miya 1039 BM",
        "assetTag": "1039",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1039_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_001",
                    "name": "Pokémon - Pikachu Winking (15cm)",
                    "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_019",
                        "name": "Chainsaw Man - Pochita",
                        "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1040_bm",
        "name": "Crazy Toy Miya 1040 BM",
        "assetTag": "1040",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1040_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_016",
                    "name": "Generic - Avocado Cute",
                    "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_035",
                        "name": "Bingo - Standard",
                        "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1041_bm",
        "name": "Crazy Toy Miya 1041 BM",
        "assetTag": "1041",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1041_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_38",
                    "name": "Penguin - Emperor",
                    "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1042_bm",
        "name": "Crazy Toy Miya 1042 BM",
        "assetTag": "1042",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1042_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_014",
                    "name": "Disney - Angel (Pink)",
                    "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1043_bm",
        "name": "Crazy Toy Miya 1043 BM",
        "assetTag": "1043",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1043_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_020",
                    "name": "Among Us - Red Crewmate",
                    "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1044_bm",
        "name": "Crazy Toy Miya 1044 BM",
        "assetTag": "1044",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1044_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_034",
                    "name": "Bluey - Standard",
                    "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_034",
                        "name": "Bluey - Standard",
                        "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1045_bm",
        "name": "Crazy Toy Miya 1045 BM",
        "assetTag": "1045",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1045_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_020",
                    "name": "Among Us - Red Crewmate",
                    "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_028",
                        "name": "Gengar - Grinning",
                        "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1046_bm",
        "name": "Crazy Toy Miya 1046 BM",
        "assetTag": "1046",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1046_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_016",
                    "name": "Generic - Avocado Cute",
                    "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1047_bm",
        "name": "Crazy Toy Miya 1047 BM",
        "assetTag": "1047",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1047_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_035",
                        "name": "Bingo - Standard",
                        "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1048_bm",
        "name": "Crazy Toy Miya 1048 BM",
        "assetTag": "1048",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1048_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1049_bm",
        "name": "Crazy Toy Miya 1049 BM",
        "assetTag": "1049",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1049_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_028",
                    "name": "Gengar - Grinning",
                    "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_016",
                        "name": "Generic - Avocado Cute",
                        "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1050_bm",
        "name": "Crazy Toy Miya 1050 BM",
        "assetTag": "1050",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1050_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_015",
                        "name": "Generic - Octupus Reversible (Red/Blue)",
                        "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1051_bm",
        "name": "Crazy Toy Miya 1051 BM",
        "assetTag": "1051",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1051_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_40",
                    "name": "Axolotl - Pink",
                    "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1052_bm",
        "name": "Crazy Toy Miya 1052 BM",
        "assetTag": "1052",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1052_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1053_bm",
        "name": "Crazy Toy Miya 1053 BM",
        "assetTag": "1053",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1053_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_002",
                    "name": "Pokémon - Snorlax Sleeping (15cm)",
                    "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1054_bm",
        "name": "Crazy Toy Miya 1054 BM",
        "assetTag": "1054",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1054_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_1058_bm",
        "name": "Crazy Toy Miya 1058 BM",
        "assetTag": "1058",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_1058_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_006",
                    "name": "Sanrio - My Melody",
                    "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_003",
                        "name": "Kirby - Standard Pink (12cm)",
                        "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_979_bm",
        "name": "Crazy Toy Miya 979 BM",
        "assetTag": "979",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_979_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_980_bm",
        "name": "Crazy Toy Miya 980 BM",
        "assetTag": "980",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_980_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_002",
                    "name": "Pokémon - Snorlax Sleeping (15cm)",
                    "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_981_bm",
        "name": "Crazy Toy Miya 981 BM",
        "assetTag": "981",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_981_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_027",
                    "name": "Capybara w/ Backpack",
                    "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_015",
                        "name": "Generic - Octupus Reversible (Red/Blue)",
                        "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_982_bm",
        "name": "Crazy Toy Miya 982 BM",
        "assetTag": "982",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_982_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_983_bm",
        "name": "Crazy Toy Miya 983 BM",
        "assetTag": "983",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_983_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_984_bm",
        "name": "Crazy Toy Miya 984 BM",
        "assetTag": "984",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_984_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_40",
                    "name": "Axolotl - Pink",
                    "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_985_bm",
        "name": "Crazy Toy Miya 985 BM",
        "assetTag": "985",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_985_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_007",
                    "name": "Sanrio - Kuromi (Purple)",
                    "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_986_bm",
        "name": "Crazy Toy Miya 986 BM",
        "assetTag": "986",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_986_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_005",
                    "name": "Sanrio - Hello Kitty Red Bow",
                    "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_009",
                        "name": "Generic - Bubble Tea Plush (Pink)",
                        "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_987_bm",
        "name": "Crazy Toy Miya 987 BM",
        "assetTag": "987",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_987_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_028",
                    "name": "Gengar - Grinning",
                    "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_010",
                        "name": "Generic - Bubble Tea Plush (Brown)",
                        "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_988_bm",
        "name": "Crazy Toy Miya 988 BM",
        "assetTag": "988",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_988_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_002",
                    "name": "Pokémon - Snorlax Sleeping (15cm)",
                    "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_008",
                        "name": "Sanrio - Cinnamoroll",
                        "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_004",
                        "name": "Kirby - Sleepy Blue (12cm)",
                        "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_989_bm",
        "name": "Crazy Toy Miya 989 BM",
        "assetTag": "989",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_989_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_003",
                        "name": "Kirby - Standard Pink (12cm)",
                        "imageUrl": "/stock-images/inv_plu_003_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_990_bm",
        "name": "Crazy Toy Miya 990 BM",
        "assetTag": "990",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_990_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_017",
                    "name": "Spy x Family - Anya (Uniform)",
                    "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_991_bm",
        "name": "Crazy Toy Miya 991 BM",
        "assetTag": "991",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_991_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_012",
                    "name": "Minecraft - TNT Block",
                    "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_029",
                        "name": "Eevee - Sitting",
                        "imageUrl": "/stock-images/inv_plu_029_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_992_bm",
        "name": "Crazy Toy Miya 992 BM",
        "assetTag": "992",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_992_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_027",
                    "name": "Capybara w/ Backpack",
                    "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_993_bm",
        "name": "Crazy Toy Miya 993 BM",
        "assetTag": "993",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_993_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_008",
                        "name": "Sanrio - Cinnamoroll",
                        "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_034",
                        "name": "Bluey - Standard",
                        "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_994_bm",
        "name": "Crazy Toy Miya 994 BM",
        "assetTag": "994",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_994_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_006",
                        "name": "Sanrio - My Melody",
                        "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_995_bm",
        "name": "Crazy Toy Miya 995 BM",
        "assetTag": "995",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_995_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_38",
                    "name": "Penguin - Emperor",
                    "imageUrl": "/stock-images/inv_plu_38_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_015",
                        "name": "Generic - Octupus Reversible (Red/Blue)",
                        "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_996_bm",
        "name": "Crazy Toy Miya 996 BM",
        "assetTag": "996",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_996_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_997_bm",
        "name": "Crazy Toy Miya 997 BM",
        "assetTag": "997",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_997_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_40",
                    "name": "Axolotl - Pink",
                    "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_019",
                        "name": "Chainsaw Man - Pochita",
                        "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_998_bm",
        "name": "Crazy Toy Miya 998 BM",
        "assetTag": "998",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_998_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_014",
                    "name": "Disney - Angel (Pink)",
                    "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazy_toy_miya_999_bm",
        "name": "Crazy Toy Miya 999 BM",
        "assetTag": "999",
        "type": "Crazy Toy Miya",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazy_toy_miya_999_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_016",
                    "name": "Generic - Avocado Cute",
                    "imageUrl": "/stock-images/inv_plu_016_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_006",
                        "name": "Sanrio - My Melody",
                        "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazytoy_nano_1_bm",
        "name": "CrazyToy Nano #1 BM",
        "assetTag": "146",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazytoy_nano_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_026",
                    "name": "Capybara w/ Orange",
                    "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crazytoy_nano_2_bm",
        "name": "CrazyToy Nano #2 BM",
        "assetTag": "147",
        "type": "Crazy Toy Nano",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crazytoy_nano_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crystal_house_1_bm",
        "name": "Crystal House #1 BM",
        "assetTag": "143",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crystal_house_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_004",
                    "name": "One Piece - WCF Figures",
                    "imageUrl": "/stock-images/inv_bbox_004_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_11",
                        "name": "Pop Mart - Crybaby Sad Club",
                        "imageUrl": "/stock-images/inv_bbox_11_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_9",
                        "name": "Pop Mart - Dimoo World",
                        "imageUrl": "/stock-images/inv_bbox_9_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crystal_house_2_bm",
        "name": "Crystal House #2 BM",
        "assetTag": "144",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crystal_house_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_5",
                    "name": "Magic Cube 3x3",
                    "imageUrl": "/stock-images/inv_toy_5_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_pop_4",
                        "name": "Funko Pop - Harry Potter - Hedwig",
                        "imageUrl": "/stock-images/inv_pop_4_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_toy_8",
                        "name": "Dart Gun Foam",
                        "imageUrl": "/stock-images/inv_toy_8_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_crystal_house_3_bm",
        "name": "Crystal House #3 BM",
        "assetTag": "145",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_crystal_house_3_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_7",
                    "name": "Pop Mart - Hirono City",
                    "imageUrl": "/stock-images/inv_bbox_7_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_8",
                        "name": "Pop Mart - Pucky Sleeping Babies",
                        "imageUrl": "/stock-images/inv_bbox_8_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_doll_castle_1_bm",
        "name": "Doll Castle # 1 BM",
        "assetTag": "1110",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Prize",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_doll_castle_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_10",
                    "name": "Chainsaw Man - Denji",
                    "imageUrl": "/stock-images/inv_fig_10_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_8",
                        "name": "Spy x Family - Yor Forger",
                        "imageUrl": "/stock-images/inv_fig_8_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_doll_castle_6_bm",
        "name": "Doll Castle 6 BM",
        "assetTag": "1635",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Large",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_doll_castle_6_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_002",
                    "name": "Demon Slayer - Tanjiro",
                    "imageUrl": "/stock-images/inv_fig_002_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_001",
                        "name": "Dragon Ball Z - Goku Super Saiyan",
                        "imageUrl": "/stock-images/inv_fig_001_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    },
                    {
                        "id": "inv_fig_10",
                        "name": "Chainsaw Man - Denji",
                        "imageUrl": "/stock-images/inv_fig_10_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_doll_castle_lhs_bm",
        "name": "Doll Castle LHS BM",
        "assetTag": "1111",
        "type": "Doll Castle",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Large",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_doll_castle_lhs_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_001",
                    "name": "Dragon Ball Z - Goku Super Saiyan",
                    "imageUrl": "/stock-images/inv_fig_001_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_003",
                        "name": "Hatsune Miku - Seasonal",
                        "imageUrl": "/stock-images/inv_fig_003_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    },
                    {
                        "id": "inv_fig_003",
                        "name": "Hatsune Miku - Seasonal",
                        "imageUrl": "/stock-images/inv_fig_003_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_doll_house_2_bm",
        "name": "Doll House #2 BM",
        "assetTag": "547",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Large",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_doll_house_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_7",
                    "name": "My Hero Academia - Deku",
                    "imageUrl": "/stock-images/inv_fig_7_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_8",
                        "name": "Spy x Family - Yor Forger",
                        "imageUrl": "/stock-images/inv_fig_8_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    },
                    {
                        "id": "inv_fig_004",
                        "name": "Jujutsu Kaisen - Gojo",
                        "imageUrl": "/stock-images/inv_fig_004_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_doll_house_3_bm",
        "name": "Doll House #3 BM",
        "assetTag": "208",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Large",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_doll_house_3_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_003",
                    "name": "Hatsune Miku - Seasonal",
                    "imageUrl": "/stock-images/inv_fig_003_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_001",
                        "name": "Dragon Ball Z - Goku Super Saiyan",
                        "imageUrl": "/stock-images/inv_fig_001_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    },
                    {
                        "id": "inv_fig_10",
                        "name": "Chainsaw Man - Denji",
                        "imageUrl": "/stock-images/inv_fig_10_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_doll_house_rhs_bm",
        "name": "Doll House RHS BM",
        "assetTag": "209",
        "type": "Doll House",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Large",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_doll_house_rhs_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_6",
                    "name": "One Piece - Luffy Gear 5",
                    "imageUrl": "/stock-images/inv_fig_6_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_002",
                        "name": "Demon Slayer - Tanjiro",
                        "imageUrl": "/stock-images/inv_fig_002_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    },
                    {
                        "id": "inv_fig_10",
                        "name": "Chainsaw Man - Denji",
                        "imageUrl": "/stock-images/inv_fig_10_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_eclaw_lhs_bm",
        "name": "Eclaw LHS BM",
        "assetTag": "545",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_eclaw_lhs_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_plu_023",
                    "name": "Kiiroitori - Yellow Bird (25cm)",
                    "imageUrl": "/stock-images/inv_plu_023_1.jpg",
                    "category": "Plushy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_036",
                        "name": "Long Cat Pillow (50cm)",
                        "imageUrl": "/stock-images/inv_plu_036_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_plu_021",
                        "name": "Rilakkuma - Standard Bear (30cm)",
                        "imageUrl": "/stock-images/inv_plu_021_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_eclaw_lhs_g",
        "name": "Eclaw LHS G",
        "assetTag": "492",
        "type": "Claw Machine",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_eclaw_lhs_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_6",
                    "name": "Funko Pop - Stranger Things - Eleven",
                    "imageUrl": "/stock-images/inv_pop_6_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_14",
                        "name": "Pop Mart - Bunny Kingdom",
                        "imageUrl": "/stock-images/inv_bbox_14_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_18",
                        "name": "Pop Mart - Nori Family",
                        "imageUrl": "/stock-images/inv_bbox_18_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_eclaw_rhs_bm",
        "name": "Eclaw RHS BM",
        "assetTag": "546",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_eclaw_rhs_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_5",
                    "name": "Magic Cube 3x3",
                    "imageUrl": "/stock-images/inv_toy_5_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_037",
                        "name": "Goose - White w/ Knife",
                        "imageUrl": "/stock-images/inv_plu_037_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_eclaw_rhs_g",
        "name": "Eclaw RHS G",
        "assetTag": "544",
        "type": "Claw Machine",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_eclaw_rhs_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_plu_031",
                    "name": "Pompompurin - Pudding Dog",
                    "imageUrl": "/stock-images/inv_plu_031_1.jpg",
                    "category": "Plushy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_037",
                        "name": "Goose - White w/ Knife",
                        "imageUrl": "/stock-images/inv_plu_037_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_future_fields_l1",
        "name": "Future Fields L1",
        "assetTag": "1430",
        "type": "Claw Machine",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_future_fields_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_7",
                    "name": "Funko Pop - The Office - Michael Scott",
                    "imageUrl": "/stock-images/inv_pop_7_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_13",
                        "name": "Pop Mart - Vita Little Monsters",
                        "imageUrl": "/stock-images/inv_bbox_13_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_handsome_man_bm",
        "name": "Handsome Man BM",
        "assetTag": "377",
        "type": "Handsome Man",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_handsome_man_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_8",
                    "name": "Funko Pop - Friends - Chandler",
                    "imageUrl": "/stock-images/inv_pop_8_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_7",
                        "name": "Pop Mart - Hirono City",
                        "imageUrl": "/stock-images/inv_bbox_7_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_7",
                        "name": "Pop Mart - Hirono City",
                        "imageUrl": "/stock-images/inv_bbox_7_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_handsome_man_l1",
        "name": "Handsome Man L1",
        "assetTag": "378",
        "type": "Handsome Man",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_handsome_man_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_9",
                    "name": "Funko Pop - Game of Thrones - Daenerys",
                    "imageUrl": "/stock-images/inv_pop_9_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_pop_5",
                        "name": "Funko Pop - Disney - Mickey Mouse",
                        "imageUrl": "/stock-images/inv_pop_5_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_toy_3",
                        "name": "Wind-up Robot",
                        "imageUrl": "/stock-images/inv_toy_3_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hexclaw_p1_g",
        "name": "Hexclaw P1 G",
        "assetTag": "1535",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hexclaw_p1_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_19",
                    "name": "Pop Mart - Baby Three Ocean",
                    "imageUrl": "/stock-images/inv_bbox_19_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_toy_9",
                        "name": "Slinky Spring",
                        "imageUrl": "/stock-images/inv_toy_9_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_9",
                        "name": "Pop Mart - Dimoo World",
                        "imageUrl": "/stock-images/inv_bbox_9_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hexclaw_p2_g",
        "name": "Hexclaw P2 G",
        "assetTag": "1534",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hexclaw_p2_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_10",
                    "name": "Bubble Wand",
                    "imageUrl": "/stock-images/inv_toy_10_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_030",
                        "name": "Kuromi - Black Goth",
                        "imageUrl": "/stock-images/inv_plu_030_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hexclaw_p3_g",
        "name": "Hexclaw P3 G",
        "assetTag": "1533",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hexclaw_p3_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_14",
                    "name": "Pop Mart - Bunny Kingdom",
                    "imageUrl": "/stock-images/inv_bbox_14_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_19",
                        "name": "Pop Mart - Baby Three Ocean",
                        "imageUrl": "/stock-images/inv_bbox_19_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hexclaw_p4_g",
        "name": "Hexclaw P4 G",
        "assetTag": "1536",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hexclaw_p4_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_19",
                    "name": "Pop Mart - Baby Three Ocean",
                    "imageUrl": "/stock-images/inv_bbox_19_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_11",
                        "name": "Pop Mart - Crybaby Sad Club",
                        "imageUrl": "/stock-images/inv_bbox_11_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_plu_022",
                        "name": "Korilakkuma - White Bear (30cm)",
                        "imageUrl": "/stock-images/inv_plu_022_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hexclaw_p5_g",
        "name": "Hexclaw P5 G",
        "assetTag": "1537",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hexclaw_p5_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_plu_022",
                    "name": "Korilakkuma - White Bear (30cm)",
                    "imageUrl": "/stock-images/inv_plu_022_1.jpg",
                    "category": "Plushy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_002",
                        "name": "Pop Mart - Dimoo Zodiac",
                        "imageUrl": "/stock-images/inv_bbox_002_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_plu_022",
                        "name": "Korilakkuma - White Bear (30cm)",
                        "imageUrl": "/stock-images/inv_plu_022_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hexclaw_p6_g",
        "name": "Hexclaw P6 G",
        "assetTag": "1540",
        "type": "Hex Claw",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hexclaw_p6_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_1",
                    "name": "RC Mini Car Red",
                    "imageUrl": "/stock-images/inv_toy_1_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_toy_6",
                        "name": "Building Blocks Set",
                        "imageUrl": "/stock-images/inv_toy_6_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_blue_1_bm",
        "name": "Hip Pop Elf (Blue) #1 BM",
        "assetTag": "142",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_blue_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_6",
                    "name": "Funko Pop - Stranger Things - Eleven",
                    "imageUrl": "/stock-images/inv_pop_6_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_10",
                        "name": "Pop Mart - Zimomo Animals",
                        "imageUrl": "/stock-images/inv_bbox_10_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_blue_2_bm",
        "name": "Hip Pop Elf (Blue) #2 BM",
        "assetTag": "136",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_blue_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_7",
                    "name": "Yo-Yo Classic",
                    "imageUrl": "/stock-images/inv_toy_7_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_16",
                        "name": "Pop Mart - Sank Feelings",
                        "imageUrl": "/stock-images/inv_bbox_16_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_pink_1_bm",
        "name": "Hip Pop Elf (Pink) #1 BM",
        "assetTag": "139",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_pink_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_10",
                    "name": "Bubble Wand",
                    "imageUrl": "/stock-images/inv_toy_10_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_pop_4",
                        "name": "Funko Pop - Harry Potter - Hedwig",
                        "imageUrl": "/stock-images/inv_pop_4_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_pink_2_bm",
        "name": "Hip Pop Elf (Pink) #2 BM",
        "assetTag": "137",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_pink_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_11",
                    "name": "Pop Mart - Crybaby Sad Club",
                    "imageUrl": "/stock-images/inv_bbox_11_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_pop_4",
                        "name": "Funko Pop - Harry Potter - Hedwig",
                        "imageUrl": "/stock-images/inv_pop_4_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_pop_1",
                        "name": "Funko Pop - Marvel - Spider-Man",
                        "imageUrl": "/stock-images/inv_pop_1_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_yellow_1_bm",
        "name": "Hip Pop Elf (Yellow) #1 BM",
        "assetTag": "138",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_yellow_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_plu_021",
                    "name": "Rilakkuma - Standard Bear (30cm)",
                    "imageUrl": "/stock-images/inv_plu_021_1.jpg",
                    "category": "Plushy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_13",
                        "name": "Pop Mart - Vita Little Monsters",
                        "imageUrl": "/stock-images/inv_bbox_13_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_bbox_10",
                        "name": "Pop Mart - Zimomo Animals",
                        "imageUrl": "/stock-images/inv_bbox_10_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_yellow_2_bm",
        "name": "Hip Pop Elf (Yellow) #2 BM",
        "assetTag": "140",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_yellow_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_toy_3",
                    "name": "Wind-up Robot",
                    "imageUrl": "/stock-images/inv_toy_3_1.jpg",
                    "category": "Toy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_8",
                        "name": "Pop Mart - Pucky Sleeping Babies",
                        "imageUrl": "/stock-images/inv_bbox_8_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_plu_033",
                        "name": "No Face - Spirited Away",
                        "imageUrl": "/stock-images/inv_plu_033_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_hip_pop_elf_yellow_3_bm",
        "name": "Hip Pop Elf (Yellow) #3 BM",
        "assetTag": "141",
        "type": "Crazy Toy Hip-Hop Elf",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Medium",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_hip_pop_elf_yellow_3_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_pop_10",
                    "name": "Funko Pop - Pokemon - Pikachu",
                    "imageUrl": "/stock-images/inv_pop_10_1.jpg",
                    "category": "Pop Vinyl",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_036",
                        "name": "Long Cat Pillow (50cm)",
                        "imageUrl": "/stock-images/inv_plu_036_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_innis_4_p1_l1",
        "name": "Innis 4 P1 L1",
        "assetTag": "1502",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_innis_4_p1_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_005",
                        "name": "Sanrio - Hello Kitty Red Bow",
                        "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_innis_4_p2_l1",
        "name": "Innis 4 P2 L1",
        "assetTag": "1503",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_innis_4_p2_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_034",
                    "name": "Bluey - Standard",
                    "imageUrl": "/stock-images/inv_plu_034_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_027",
                        "name": "Capybara w/ Backpack",
                        "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_innis_4_p3_l1",
        "name": "Innis 4 P3 L1",
        "assetTag": "1504",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_innis_4_p3_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_007",
                    "name": "Sanrio - Kuromi (Purple)",
                    "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_39",
                        "name": "Corgi - Sleeping",
                        "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_innis_4_p4_l1",
        "name": "Innis 4 P4 L1",
        "assetTag": "1506",
        "type": "INNIS",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_innis_4_p4_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_008",
                    "name": "Sanrio - Cinnamoroll",
                    "imageUrl": "/stock-images/inv_plu_008_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_40",
                        "name": "Axolotl - Pink",
                        "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_019",
                        "name": "Chainsaw Man - Pochita",
                        "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_ins_balloon_1_l1",
        "name": "Ins Balloon #1 L1",
        "assetTag": "1441",
        "type": "Claw Machine",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_ins_balloon_1_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_035",
                    "name": "Bingo - Standard",
                    "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_028",
                        "name": "Gengar - Grinning",
                        "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_ins_balloon_2_l1",
        "name": "Ins Balloon #2 L1",
        "assetTag": "1442",
        "type": "Claw Machine",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_ins_balloon_2_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_013",
                    "name": "Disney - Stitch (Blue)",
                    "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_002",
                        "name": "Pokémon - Snorlax Sleeping (15cm)",
                        "imageUrl": "/stock-images/inv_plu_002_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_035",
                        "name": "Bingo - Standard",
                        "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_meow_meow_house_1_bm",
        "name": "Meow Meow House #1 BM",
        "assetTag": "159",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_meow_meow_house_1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_027",
                    "name": "Capybara w/ Backpack",
                    "imageUrl": "/stock-images/inv_plu_027_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_014",
                        "name": "Disney - Angel (Pink)",
                        "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_meow_meow_house_2_bm",
        "name": "Meow Meow House #2 BM",
        "assetTag": "160",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_meow_meow_house_2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_035",
                    "name": "Bingo - Standard",
                    "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_013",
                        "name": "Disney - Stitch (Blue)",
                        "imageUrl": "/stock-images/inv_plu_013_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_meow_meow_house_3_bm",
        "name": "Meow Meow House #3 BM",
        "assetTag": "96",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_meow_meow_house_3_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_028",
                    "name": "Gengar - Grinning",
                    "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_012",
                        "name": "Minecraft - TNT Block",
                        "imageUrl": "/stock-images/inv_plu_012_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_meow_meow_house_4_bm",
        "name": "Meow Meow House #4 BM",
        "assetTag": "231",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_meow_meow_house_4_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_014",
                    "name": "Disney - Angel (Pink)",
                    "imageUrl": "/stock-images/inv_plu_014_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_010",
                        "name": "Generic - Bubble Tea Plush (Brown)",
                        "imageUrl": "/stock-images/inv_plu_010_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_015",
                        "name": "Generic - Octupus Reversible (Red/Blue)",
                        "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_party_plus_p1_bm",
        "name": "Party Plus P1 BM",
        "assetTag": "1349",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_party_plus_p1_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_39",
                    "name": "Corgi - Sleeping",
                    "imageUrl": "/stock-images/inv_plu_39_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_party_plus_p2_bm",
        "name": "Party Plus P2 BM",
        "assetTag": "1350",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_party_plus_p2_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_006",
                    "name": "Sanrio - My Melody",
                    "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_party_plus_p3_bm",
        "name": "Party Plus P3 BM",
        "assetTag": "1351",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_party_plus_p3_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_006",
                        "name": "Sanrio - My Melody",
                        "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_40",
                        "name": "Axolotl - Pink",
                        "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_party_plus_p4_bm",
        "name": "Party Plus P4 BM",
        "assetTag": "1352",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_party_plus_p4_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_004",
                    "name": "Kirby - Sleepy Blue (12cm)",
                    "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_004",
                        "name": "Kirby - Sleepy Blue (12cm)",
                        "imageUrl": "/stock-images/inv_plu_004_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_skewb_p1_l1",
        "name": "SKEWB P1 L1",
        "assetTag": "686",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_skewb_p1_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_035",
                    "name": "Bingo - Standard",
                    "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_020",
                        "name": "Among Us - Red Crewmate",
                        "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_026",
                        "name": "Capybara w/ Orange",
                        "imageUrl": "/stock-images/inv_plu_026_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_skewb_p2_l1",
        "name": "SKEWB P2 L1",
        "assetTag": "687",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_skewb_p2_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_009",
                    "name": "Generic - Bubble Tea Plush (Pink)",
                    "imageUrl": "/stock-images/inv_plu_009_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_001",
                        "name": "Pokémon - Pikachu Winking (15cm)",
                        "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    },
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_skewb_p3_l1",
        "name": "SKEWB P3 L1",
        "assetTag": "688",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_skewb_p3_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_028",
                        "name": "Gengar - Grinning",
                        "imageUrl": "/stock-images/inv_plu_028_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_skewb_p4_l1",
        "name": "SKEWB P4 L1",
        "assetTag": "689",
        "type": "SKWEB",
        "location": "Level-1",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_skewb_p4_l1",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_015",
                    "name": "Generic - Octupus Reversible (Red/Blue)",
                    "imageUrl": "/stock-images/inv_plu_015_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_006",
                        "name": "Sanrio - My Melody",
                        "imageUrl": "/stock-images/inv_plu_006_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_the_big_one_claw_bm",
        "name": "The Big One Claw BM",
        "assetTag": "1532",
        "type": "Giant Claw",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Large",
        "group": "Group 4-Cranes",
        "subGroup": "Large",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_the_big_one_claw_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Large",
                "currentItem": {
                    "id": "inv_fig_9",
                    "name": "Attack on Titan - Levi",
                    "imageUrl": "/stock-images/inv_fig_9_1.jpg",
                    "category": "Figurine",
                    "size": "Large"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_fig_9",
                        "name": "Attack on Titan - Levi",
                        "imageUrl": "/stock-images/inv_fig_9_1.jpg",
                        "category": "Figurine",
                        "size": "Large"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_the_clena_p1_g",
        "name": "The Clena P1 G",
        "assetTag": "1449",
        "type": "Claw Machine",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_the_clena_p1_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_12",
                    "name": "Pop Mart - Kenneth Fox",
                    "imageUrl": "/stock-images/inv_bbox_12_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_037",
                        "name": "Goose - White w/ Knife",
                        "imageUrl": "/stock-images/inv_plu_037_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_the_clena_p2_g",
        "name": "The Clena P2 G",
        "assetTag": "1450",
        "type": "Claw Machine",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_the_clena_p2_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_plu_036",
                    "name": "Long Cat Pillow (50cm)",
                    "imageUrl": "/stock-images/inv_plu_036_1.jpg",
                    "category": "Plushy",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_pop_9",
                        "name": "Funko Pop - Game of Thrones - Daenerys",
                        "imageUrl": "/stock-images/inv_pop_9_1.jpg",
                        "category": "Pop Vinyl",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_ufo_catcher_p1_g",
        "name": "UFO Catcher P1 G",
        "assetTag": "1406",
        "type": "Claw Machine",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_ufo_catcher_p1_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_10",
                    "name": "Pop Mart - Zimomo Animals",
                    "imageUrl": "/stock-images/inv_bbox_10_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_toy_9",
                        "name": "Slinky Spring",
                        "imageUrl": "/stock-images/inv_toy_9_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_toy_10",
                        "name": "Bubble Wand",
                        "imageUrl": "/stock-images/inv_toy_10_1.jpg",
                        "category": "Toy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_ufo_catcher_p2_g",
        "name": "UFO Catcher P2 G",
        "assetTag": "1408",
        "type": "Claw Machine",
        "location": "Ground",
        "status": "Online",
        "prizeSize": "Medium",
        "group": "Group 4-Cranes",
        "subGroup": "Pops",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_ufo_catcher_p2_g",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Medium",
                "currentItem": {
                    "id": "inv_bbox_6",
                    "name": "Pop Mart - Labubu Forest",
                    "imageUrl": "/stock-images/inv_bbox_6_1.jpg",
                    "category": "Blind Box",
                    "size": "Medium"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_bbox_9",
                        "name": "Pop Mart - Dimoo World",
                        "imageUrl": "/stock-images/inv_bbox_9_1.jpg",
                        "category": "Blind Box",
                        "size": "Medium"
                    },
                    {
                        "id": "inv_plu_037",
                        "name": "Goose - White w/ Knife",
                        "imageUrl": "/stock-images/inv_plu_037_1.jpg",
                        "category": "Plushy",
                        "size": "Medium"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_virgo_bm",
        "name": "Virgo BM",
        "assetTag": "1125",
        "type": "Claw Machine",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_virgo_bm",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_005",
                    "name": "Sanrio - Hello Kitty Red Bow",
                    "imageUrl": "/stock-images/inv_plu_005_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_40",
                        "name": "Axolotl - Pink",
                        "imageUrl": "/stock-images/inv_plu_40_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_trendboxp1g_367",
        "name": "Trend Box P1 G",
        "assetTag": "1498",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_mac_trendboxp1g_367",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_019",
                    "name": "Chainsaw Man - Pochita",
                    "imageUrl": "/stock-images/inv_plu_019_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_017",
                        "name": "Spy x Family - Anya (Uniform)",
                        "imageUrl": "/stock-images/inv_plu_017_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_trendboxp2g_998",
        "name": "Trend Box P2 G",
        "assetTag": "1499",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_mac_trendboxp2g_998",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_020",
                    "name": "Among Us - Red Crewmate",
                    "imageUrl": "/stock-images/inv_plu_020_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_007",
                        "name": "Sanrio - Kuromi (Purple)",
                        "imageUrl": "/stock-images/inv_plu_007_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_trendboxp3g_980",
        "name": "Trend Box P3 G",
        "assetTag": "1500",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_mac_trendboxp3g_980",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_035",
                    "name": "Bingo - Standard",
                    "imageUrl": "/stock-images/inv_plu_035_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_018",
                        "name": "Spy x Family - Bond (Dog)",
                        "imageUrl": "/stock-images/inv_plu_018_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    },
    {
        "id": "mac_trendboxp4g_455",
        "name": "Trend Box P4 G",
        "assetTag": "1501",
        "type": "Trend Catcher",
        "location": "Basement",
        "status": "Online",
        "prizeSize": "Small",
        "group": "Group 4-Cranes",
        "subGroup": "Small",
        "physicalConfiguration": "single",
        "notes": "",
        "slots": [
            {
                "id": "slot_mac_trendboxp4g_455",
                "name": "Main",
                "gameType": "Claw",
                "status": "Online",
                "size": "Small",
                "currentItem": {
                    "id": "inv_plu_001",
                    "name": "Pokémon - Pikachu Winking (15cm)",
                    "imageUrl": "/stock-images/inv_plu_001_1.jpg",
                    "category": "Plushy",
                    "size": "Small"
                },
                "upcomingQueue": [
                    {
                        "id": "inv_plu_011",
                        "name": "Minecraft - Creeper (Small)",
                        "imageUrl": "/stock-images/inv_plu_011_1.jpg",
                        "category": "Plushy",
                        "size": "Small"
                    }
                ],
                "stockLevel": "Good"
            }
        ]
    }
];
;
;
;
;
;
;
;
;

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
            currentItem: slot.currentItem || null,
            upcomingQueue: slot.upcomingQueue || [],
            stockLevel: slot.stockLevel || "Good"
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: imageUrl
    };
};

let inMemoryMachines: ArcadeMachine[] = [];
let initialized = false;

const STORAGE_KEY = 'claw_master_machines_v26';

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
                inMemoryMachines = INITIAL_MACHINES.map(m => {
                    const machine = mapToArcadeMachine(m);
                    return {
                        ...machine,
                        advancedSettings: {
                            ...DEFAULT_ADVANCED_SETTINGS,
                            macId: `801F${Math.floor(Math.random() * 99999999).toString(16).toUpperCase()}`
                        }
                    };
                });
            }
        } else {
            inMemoryMachines = INITIAL_MACHINES.map(m => {
                const machine = mapToArcadeMachine(m);
                return {
                    ...machine,
                    advancedSettings: {
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
        inMemoryMachines = INITIAL_MACHINES.map(m => {
            const machine = mapToArcadeMachine(m);
            return {
                ...machine,
                advancedSettings: {
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
    coinsDispensedPerPulse: 1, // Added missing field

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
