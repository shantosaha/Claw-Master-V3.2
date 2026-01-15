
import fs from "fs";
import path from "path";

// --- Types (Simplified for Script) ---
interface ArcadeMachine {
    id: string;
    tag?: string;
    assetTag: string;
    name: string;
    location: string;
    storeLocation?: string; // Added field
    group?: string;
    subGroup?: string;
    physicalConfig: string;
    status: string;
    slots: any[];
    playCount?: number;
    revenue?: number;
    lastSyncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    advancedSettings?: any;
    [key: string]: any;
}

interface GameReportEntry {
    tag: number;
    description: string;
    assetTag: string;
    location: string;
    group: string;
    subGroup: string;
    cashDebit: number;
    cashDebitBonus: number;
    points: number;
    standardPlays: number;
    empPlays: number;
}

// --- Mock Firestore Service Logic ---
const DEMO_MACHINES_PATH = path.join(process.cwd(), "src/lib/demoData.ts");
// Reading demoData.ts is hard because it's TS. 
// We will look for a potential localStorage backup file or just use empty if not found.
// Actually, since we want to act on the "real" repo data which might be in JSON files in /data?
// Wait, the user is using `src/services/firestoreService.ts` which uses `localStorage` for demo mode.
// We can't easily access the browser's localStorage from Node.
// HOWEVER, checking `firestoreService.ts` shows it creates/reads from `data/`? No, it uses `localStorage` OR real Firebase.
// If it's real Firebase, we can't run this script without proper env/config which seems missing or hard to setup.
// BUT, the `firestoreService.ts` code I read earlier handles `isFirebaseInitialized`.

// Let's assume we are in "Demo Mode" or "Mock Mode" for this task since `firestoreService` has a demo fallback.
// Since we are running in NODE, we don't have localStorage. 
// We should check if we can simulate the "Database" by reading/writing a JSON file in `data/machines.json` if it exists, or just `mock_machines.json`.

const DB_FILE = path.join(process.cwd(), "mock_machines.json");

// Helper to load DB
function loadDB(): ArcadeMachine[] {
    if (fs.existsSync(DB_FILE)) {
        return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }
    return [];
}

// Helper to save DB
function saveDB(machines: ArcadeMachine[]) {
    fs.writeFileSync(DB_FILE, JSON.stringify(machines, null, 2));
}

// --- Logic from GameReportService ---

function parseGameReportJSON(jsonData: unknown[]): GameReportEntry[] {
    return jsonData.map((item: unknown) => {
        const entry = item as Record<string, unknown>;
        return {
            tag: Number(entry.tag) || 0,
            description: String(entry.description || ''),
            assetTag: String(entry.assetTag || ''),
            location: String(entry.location || ''),
            group: String(entry.group || ''),
            subGroup: String(entry.subGroup || ''),
            cashDebit: Number(entry.cashDebit) || 0,
            cashDebitBonus: Number(entry.cashDebitBonus) || 0,
            points: Number(entry.points) || 0,
            standardPlays: Number(entry.standardPlays) || 0,
            empPlays: Number(entry.empPlays) || 0,
        };
    });
}

function createMachineFromEntry(entry: GameReportEntry): ArcadeMachine {
    const id = "mac_migrated_" + entry.tag + "_" + Math.random().toString(36).substr(2, 5);

    // Determine location based on suffix
    let location = "Basement"; // Default
    const desc = entry.description.trim();
    if (desc.endsWith("BM")) location = "Basement";
    else if (desc.endsWith("L1")) location = "Level-1";
    else if (desc.endsWith("G")) location = "Ground";

    return {
        id,
        name: entry.description,
        assetTag: String(entry.tag),
        tag: String(entry.tag),
        location,
        storeLocation: entry.location || "Unknown",
        group: entry.group,
        subGroup: entry.subGroup,
        physicalConfig: "single",
        status: "Online",
        slots: [
            {
                id: "slot_" + entry.tag + "_main",
                name: "Main",
                gameType: entry.subGroup || "Standard",
                status: "online",
                upcomingQueue: [],
                stockLevel: "Good"
            }
        ],
        playCount: 0,
        revenue: 0,
        advancedSettings: {
            cardCashPlayPrice: entry.cashDebit,
            cashDebitBonus: entry.cashDebitBonus,
            pointsPerPlay: entry.points,
            standardPlays: entry.standardPlays,
            empPlays: entry.empPlays,
        },
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// --- Main Execution ---

async function runSync() {
    console.log("Starting Machine Sync Data Import (Standalone)...");

    // 1. Load Source Data
    const sourcePath = path.join(process.cwd(), "src/scripts/source_game_report.json");
    if (!fs.existsSync(sourcePath)) {
        console.error("Source file not found:", sourcePath);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

    // Check key format
    let entries: GameReportEntry[] = [];
    if (Array.isArray(rawData)) {
        entries = parseGameReportJSON(rawData);
    } else {
        const allEntries: any[] = [];
        Object.values(rawData).forEach((dayEntries: any) => {
            if (Array.isArray(dayEntries)) {
                allEntries.push(...dayEntries);
            }
        });
        entries = parseGameReportJSON(allEntries);
    }

    // Filter unique
    const uniqueEntriesMap = new Map<number, GameReportEntry>();
    entries.forEach(e => {
        if (!uniqueEntriesMap.has(e.tag)) {
            uniqueEntriesMap.set(e.tag, e);
        }
    });
    const uniqueEntries = Array.from(uniqueEntriesMap.values());
    console.log(`Loaded ${uniqueEntries.length} unique machines from source.`);

    // 2. Load "Existing" Machines
    const rawUserExisting = [
        "1431", "1432", "1433", "1434", "1435", "1436", "1437", "1438", "1443", "1444", "1445", "1446", "1451", "1452", "1482", "1481",
        "244", "614", "696", "484", "1530", "690", "691", "210", "1531", "211-214", "1271", "149", "150", "1545", "1000-1058",
        "146", "147", "143", "144", "145", "1110", "1635", "1111", "547", "208", "209", "545", "492", "546", "544", "1430",
        "377", "378", "1535-1540", "142", "136", "139", "137", "138-141", "1502-1506", "1441", "1442", "159", "160", "96", "231",
        "1349-1352", "686-689", "1532", "1449", "1450", "1406", "1408", "1125", "1498-1501"
    ];

    const userExistingTags = new Set<string>();
    rawUserExisting.forEach(tag => {
        if (tag.includes('-')) {
            const [startStr, endStr] = tag.split('-');
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            for (let i = start; i <= end; i++) {
                userExistingTags.add(String(i));
            }
        } else {
            userExistingTags.add(tag);
        }
    });

    let existingMachines: ArcadeMachine[] = loadDB();
    console.log(`Loaded ${existingMachines.length} existing machines from local mock DB.`);

    const machineByTag = new Map<string, ArcadeMachine>();
    const machineByAssetTag = new Map<string, ArcadeMachine>();

    existingMachines.forEach(m => {
        if (m.tag) machineByTag.set(m.tag, m);
        if (m.assetTag) machineByAssetTag.set(m.assetTag, m);
    });

    // Merge User Provided Tags into the skip-set
    userExistingTags.forEach(tag => {
        if (!machineByTag.has(tag)) {
            // We don't have the full object, but we know it exists
            machineByTag.set(tag, { id: 'existing', tag, assetTag: tag } as any);
        }
    });

    const summary = {
        totalProcessed: uniqueEntries.length,
        foundExisting: 0,
        createdNew: 0,
        createdMachines: [] as string[]
    };

    for (const entry of uniqueEntries) {
        // Skip Group 4-Cranes as requested
        if (entry.group === "Group 4-Cranes") {
            continue;
        }

        const tagStr = String(entry.tag);
        const exists = machineByTag.has(tagStr) || machineByAssetTag.has(tagStr);

        if (exists) {
            summary.foundExisting++;
        } else {
            const newMachine = createMachineFromEntry(entry);
            existingMachines.push(newMachine);

            // Update maps
            machineByTag.set(String(newMachine.tag), newMachine);

            summary.createdNew++;
            summary.createdMachines.push(`- **${newMachine.name}** (Tag/Asset: ${newMachine.assetTag}, Loc: ${newMachine.location}, Store: ${newMachine.storeLocation})`);
        }
    }

    // Save DB
    saveDB(existingMachines);
    console.log(`Saved ${existingMachines.length} machines to ${DB_FILE}`);

    // Output and Report
    console.log("\n--- Sync Summary ---");
    console.log(`Total Source Entries: ${summary.totalProcessed}`);
    console.log(`Existing Machines Found: ${summary.foundExisting}`);
    console.log(`New Machines Created: ${summary.createdNew}`);

    if (summary.createdNew > 0) {
        const reportContent = `# Machine Creation Report - ${new Date().toISOString().split('T')[0]}\n
**Total Created:** ${summary.createdNew}
**Source Entries:** ${summary.totalProcessed}
**Found Existing:** ${summary.foundExisting}

## Created Machines
${summary.createdMachines.join("\n")}
`;
        fs.writeFileSync(path.join(process.cwd(), "created_machines_report.md"), reportContent);
        console.log("\nReport saved to created_machines_report.md");
    }
}

runSync().catch(console.error);
