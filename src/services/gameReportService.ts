/**
 * Game Report Sync Service
 * Handles importing revenue/play data from Intercard game reports
 */

import { createFirestoreService } from "./firestoreService";
import { MachineRevenueReading, ArcadeMachine } from "@/types";
import { generateId } from "@/lib/utils";

const revenueReadingService = createFirestoreService<MachineRevenueReading>("machineRevenueReadings");

/**
 * Game report entry from API/JSON
 */
export interface GameReportEntry {
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

/**
 * Daily game report from API
 */
export interface DailyGameReport {
    date: string;  // YYYY-MM-DD
    storeLocation: string;
    entries: GameReportEntry[];
    totalRevenue: number;
}

/**
 * Map game report entry to machine update data
 */
function mapReportToMachineUpdate(entry: GameReportEntry): Partial<ArcadeMachine> {
    return {
        tag: entry.tag,
        storeLocation: entry.location,
        group: entry.group,
        subGroup: entry.subGroup,
        advancedSettings: {
            cardCashPlayPrice: entry.cashDebit,
            cashDebitBonus: entry.cashDebitBonus,
            pointsPerPlay: entry.points,
            standardPlays: entry.standardPlays,
            empPlays: entry.empPlays,
        },
        lastSyncedAt: new Date(),
    };
}

/**
 * Calculate revenue from game report entries
 */
function calculateRevenue(entry: GameReportEntry): number {
    // Revenue = (cashDebit + cashDebitBonus) × standardPlays
    const pricePerPlay = entry.cashDebit + entry.cashDebitBonus;
    return pricePerPlay * entry.standardPlays;
}

/**
 * Import a daily game report
 */
export async function importGameReport(
    report: DailyGameReport,
    machineService: { getAll: () => Promise<ArcadeMachine[]>; update: (id: string, data: Partial<ArcadeMachine>) => Promise<void> }
): Promise<{
    machinesUpdated: number;
    revenueRecordsCreated: number;
    errors: string[];
}> {
    const result = {
        machinesUpdated: 0,
        revenueRecordsCreated: 0,
        errors: [] as string[],
    };

    try {
        // Get all machines to match by tag or description
        const machines = await machineService.getAll();
        const machineByTag = new Map<number, ArcadeMachine>();
        const machineByName = new Map<string, ArcadeMachine>();

        machines.forEach(m => {
            if (m.tag) machineByTag.set(m.tag, m);
            machineByName.set(m.name.toLowerCase(), m);
        });

        for (const entry of report.entries) {
            try {
                // Find matching machine
                let machine = machineByTag.get(entry.tag);
                if (!machine) {
                    machine = machineByName.get(entry.description.toLowerCase());
                }

                if (!machine) {
                    result.errors.push(`No matching machine for tag ${entry.tag}: ${entry.description}`);
                    continue;
                }

                // Update machine with API data
                const updateData = mapReportToMachineUpdate(entry);
                await machineService.update(machine.id, updateData);
                result.machinesUpdated++;

                // Create revenue reading
                const revenue = calculateRevenue(entry);
                const reading: MachineRevenueReading = {
                    id: generateId(),
                    machineId: machine.id,
                    date: report.date,
                    revenue,
                    playCount: entry.standardPlays,
                    source: 'api',
                    createdAt: new Date(),
                };

                await revenueReadingService.add(reading);
                result.revenueRecordsCreated++;

            } catch (err) {
                result.errors.push(`Error processing ${entry.description}: ${err}`);
            }
        }

    } catch (err) {
        result.errors.push(`Import failed: ${err}`);
    }

    return result;
}

/**
 * Parse JSON game report file
 */
export function parseGameReportJSON(jsonData: unknown[]): GameReportEntry[] {
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

export const gameReportService = {
    importGameReport,
    parseGameReportJSON,
    mapReportToMachineUpdate,
    calculateRevenue,
};
