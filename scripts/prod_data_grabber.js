const fs = require('fs');
const path = require('path');

/**
 * STANDALONE PRODUCTION DATA GRABBER
 * 
 * Features:
 * - All-in-one file storage for Game Reports and Revenue.
 * - Keyed by date for easy reading.
 * - Completely standalone (run from anywhere).
 * - Random delay (10-20s) to respect API limits.
 * - No aggregation in Game Report calls.
 */

// --- CONFIGURATION ---
const SITE_ID = '614';
const BASE_URL = 'https://api.kokoamusement.com.au';
const START_DATE_STR = '2022-01-01';
const BATCH_SIZE = 30; // Number of days to process per run

// File paths (relative to script location)
const SCRIPT_DIR = __dirname;
const GAME_REPORT_FILE = path.join(SCRIPT_DIR, 'all_game_reports.json');
const REVENUE_FILE = path.join(SCRIPT_DIR, 'all_revenue_reports.json');
const TRACKING_FILE = path.join(SCRIPT_DIR, 'history_tracking.json');

const GAME_REPORT_GROUPS = [
    "Group 1-Video", "Group 2-Redemption", "Group 3-Driving",
    "Group 4-Cranes", "Group 5-Prize Games", "Group 6-Skill Tester",
    "Group 7-Music", "Group 8-Attractions", "Group 9-Coin Pushers",
    "Group 10-Sports", "Group 11-Others", "Not Assigned"
];

// --- STORAGE HELPERS ---

function loadJsonFile(filePath, defaultValue = {}) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            console.error(`Error reading ${filePath}, starting fresh.`);
        }
    }
    return defaultValue;
}

function saveJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- API HELPERS ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchGameReport(dateStr) {
    // Note: Removal of &aggregate=true
    const url = `${BASE_URL}/game_report/${SITE_ID}?startdate=${dateStr}&enddate=${dateStr}`;
    console.log(`[GameReport] Calling: ${dateStr}`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groups: GAME_REPORT_GROUPS })
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`[GameReport] Error ${dateStr}:`, error.message);
        return null;
    }
}

async function fetchRevenue(dateStr) {
    const url = `${BASE_URL}/revenue/${SITE_ID}?startdate=${dateStr}&enddate=${dateStr}`;
    console.log(`[Revenue] Calling: ${dateStr}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`[Revenue] Error ${dateStr}:`, error.message);
        return null;
    }
}

// --- MAIN ENGINE ---

async function main() {
    console.log("=== Claw Master Data Grabber Starting ===");

    // 1. Initial Load
    const tracking = loadJsonFile(TRACKING_FILE, []);
    const gameStore = loadJsonFile(GAME_REPORT_FILE, {});
    const revStore = loadJsonFile(REVENUE_FILE, {});

    // 2. Generate Date Range
    const start = new Date(START_DATE_STR);
    const end = new Date();
    const pendingDates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!tracking.includes(dateStr)) {
            pendingDates.push(dateStr);
        }
    }

    console.log(`Status: ${tracking.length} days done. ${pendingDates.length} days pending.`);

    if (pendingDates.length === 0) {
        console.log("All data up to date!");
        return;
    }

    // 3. Process Batch
    const batch = pendingDates.slice(0, BATCH_SIZE);
    console.log(`Processing next ${batch.length} days...`);

    for (const dateStr of batch) {
        const gameData = await fetchGameReport(dateStr);
        const revData = await fetchRevenue(dateStr);

        // Update In-Memory Stores
        if (gameData) gameStore[dateStr] = gameData;
        if (revData) revStore[dateStr] = revData;

        // Save Everything Immediately (Safety First)
        saveJsonFile(GAME_REPORT_FILE, gameStore);
        saveJsonFile(REVENUE_FILE, revStore);

        tracking.push(dateStr);
        saveJsonFile(TRACKING_FILE, tracking);

        // 4. Random Throttling (10-20 seconds)
        const delay = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
        console.log(`Saved ${dateStr}. Waiting ${Math.round(delay / 1000)}s...\n`);
        await sleep(delay);
    }

    console.log("=== Batch Complete ===");
}

main().catch(err => console.error("Critical Failure:", err));
