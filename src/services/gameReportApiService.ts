/**
 * Game Report API Service
 * Fetches machine performance data (plays, revenue) from the Game Report API
 */

import { appSettingsService } from "./appSettingsService";
import { format } from "date-fns";

/**
 * Single game report entry from API
 */
export interface GameReportItem {
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
    totalRev: number;
    merchandise?: number; // Wins
    cashRev?: number;     // Breakdown: Cash
    bonusRev?: number;    // Breakdown: Bonus
    date?: string; // Present in non-aggregated responses
}

/**
 * Available groups for filtering
 */
export const GAME_REPORT_GROUPS = [
    "Group 1-Video",
    "Group 2-Redemption",
    "Group 3-Driving",
    "Group 4-Cranes",
    "Group 5-Prize Games",
    "Group 6-Skill Tester",
    "Group 7-Music",
    "Group 8-Attractions",
    "Group 9-Coin Pushers",
    "Group 10-Sports",
    "Group 11-Others",
    "Not Assigned"
] as const;

export type GameReportGroup = typeof GAME_REPORT_GROUPS[number];

/**
 * Request body for Game Report API (POST)
 */
export interface GameReportRequest {
    startdate?: string;
    enddate?: string;
    tag?: number;
    group?: string[];      // Local mock API field
    groups?: string[];     // Production API field (preferred)
    subGroup?: string[];
    location?: string[];
    fields?: string[];
    aggregate?: boolean;
}

/**
 * Fetch game report data with optional filters
 * PRODUCTION COMPLIANCE:
 * - Uses POST method
 * - startdate/enddate in URL (required)
 * - Body contains ONLY 'groups' array
 */
async function fetchGameReport(
    options: {
        siteId?: string;
        startDate?: Date;
        endDate?: Date;
        groups?: string[];
        tag?: number;          // Filter by specific machine tag
        aggregate?: boolean;   // If true, return aggregated data; if false, daily data
    } = {}
): Promise<GameReportItem[]> {
    try {
        const settings = await appSettingsService.getApiSettings();

        if (!settings.isEnabled || !settings.gameReportEnabled) {
            console.log("[GameReportService] API is disabled");
            return [];
        }

        const siteId = options.siteId || settings.gameReportSiteId || settings.jotformFormId;

        // PRODUCTION COMPLIANCE: startdate/enddate required in URL
        const today = new Date();
        const startStr = options.startDate ? format(options.startDate, "yyyy-MM-dd") : format(today, "yyyy-MM-dd");
        const endStr = options.endDate ? format(options.endDate, "yyyy-MM-dd") : format(today, "yyyy-MM-dd");

        // PRODUCTION COMPLIANCE: Body contains ONLY 'groups' array
        const body = {
            groups: (options.groups && options.groups.length > 0)
                ? options.groups
                : [...GAME_REPORT_GROUPS]
        };

        // Build endpoint with dates in URL
        let endpoint = `/api/game_report/${siteId}?startdate=${startStr}&enddate=${endStr}`;
        if (options.aggregate !== undefined) {
            endpoint += `&aggregate=${options.aggregate}`;
        }


        console.log(`[GameReportService] Fetching from ${endpoint}`, body);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[GameReportService] Error: ${response.status}`);
            return [];
        }

        const rawData = await response.json();

        // Handle both array and {response: [...]} formats, and {status: "success", response: [...]}
        let dataArray: any[] = [];
        if (rawData && rawData.response && Array.isArray(rawData.response)) {
            dataArray = rawData.response;
        } else if (Array.isArray(rawData)) {
            dataArray = rawData;
        } else if (rawData && !rawData.status && !Array.isArray(rawData)) {
            // Single object response
            dataArray = [rawData];
        } else if (rawData && rawData.data && Array.isArray(rawData.data)) {
            // Fallback for some APIs that use 'data' instead of 'response'
            dataArray = rawData.data;
        }

        // Helper to normalize field names from various API formats
        const normalizeItem = (item: any): GameReportItem => {
            const val = (keys: string[]) => {
                for (const k of keys) {
                    if (item[k] !== undefined) return item[k];
                    const foundKey = Object.keys(item).find(ik =>
                        ik.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')
                    );
                    if (foundKey) return item[foundKey];
                }
                return undefined;
            };

            return {
                tag: Number(val(['tag', 'Tag']) || 0),
                description: String(val(['description', 'Description']) || ''),
                assetTag: String(val(['assetTag', 'asset_tag']) || val(['tag', 'Tag']) || ''),
                location: String(val(['location', 'Location']) || ''),
                group: String(val(['group', 'Group']) || ''),
                subGroup: String(val(['subGroup', 'SubGroup', 'sub_group']) || ''),
                cashDebit: Number(val(['cashDebit', 'cash_debit', 'CardCashPlayPrice']) || 0),
                cashDebitBonus: Number(val(['cashDebitBonus', 'cash_bonus', 'CashDebitBonus']) || 0),
                points: Number(val(['points', 'Points', 'merchandise', 'PointsPerPlay']) || 0),
                standardPlays: Number(val(['standardPlays', 'standard_plays', 'StandardPlay']) || 0),
                empPlays: Number(val(['empPlays', 'emp_plays', 'EmpPlay']) || 0),
                totalRev: Number(val(['totalRev', 'total_revenue', 'total_rev']) || 0),
                merchandise: Number(val(['merchandise', 'points', 'wins']) || 0),
                cashRev: Number(val(['cashRev', 'cash_revenue', 'cash_rev', 'cashDebit', 'CardCashPlayPrice']) || 0),
                bonusRev: Number(val(['bonusRev', 'bonus_revenue', 'bonus_rev', 'cashDebitBonus', 'CashDebitBonus']) || 0),
                date: val(['date', 'submissionDate', 'timestamp', 'CreatedAt'])
            };
        };

        let results: GameReportItem[] = dataArray.map(normalizeItem);

        // Client-side filtering by tag if provided
        // PRODUCTION COMPLIANCE: Upstream doesn't support tag filtering in body, so we must filter here.
        if (options.tag !== undefined && results.length > 0) {
            const requestedTag = String(options.tag);
            results = results.filter(item => String(item.tag) === requestedTag);
            console.log(`[GameReportService] Client-side filtered by tag ${requestedTag}: ${results.length} items remain`);
        }

        return results;
    } catch (error) {
        console.error("[GameReportService] Fetch error:", error);
        return [];
    }
}

/**
 * Fetch aggregated report for a date range
 * Note: Production always returns aggregated data
 */
async function fetchAggregatedReport(
    startDate: Date,
    endDate: Date,
    options: {
        siteId?: string;
        groups?: string[];
        aggregate?: boolean;
    } = {}
): Promise<GameReportItem[]> {
    return fetchGameReport({
        ...options,
        startDate,
        endDate,
    });
}

/**
 * Fetch report for a single day
 * Note: Production always returns aggregated data
 */
async function fetchDailyReport(
    date: Date,
    options: {
        siteId?: string;
        groups?: string[];
    } = {}
): Promise<GameReportItem[]> {
    return fetchGameReport({
        ...options,
        startDate: date,
        endDate: date,
        aggregate: false // Daily reports should not be aggregated if we want per-machine data
    });
}

/**
 * Fetch report for a specific machine by tag
 * NOTE: Production API does not support tag filtering.
 * This function fetches data for the provided date range.
 * If group is provided, it limits the upstream fetch to that group.
 * Client-side filtering by tag is performed after fetching.
 */
async function fetchMachineReport(
    tag: number,
    startDate: Date,
    endDate: Date,
    options: {
        siteId?: string;
        group?: string;
    } = {}
): Promise<GameReportItem[]> {
    // Fetch data, limiting by group if available to minimize traffic
    const allData = await fetchGameReport({
        siteId: options.siteId,
        startDate,
        endDate,
        groups: options.group ? [options.group] : undefined
    });
    // Client-side filter by tag
    return allData.filter(item => String(item.tag) === String(tag));
}

/**
 * Fetch today's report
 */
async function fetchTodayReport(siteId?: string): Promise<GameReportItem[]> {
    const today = new Date();
    return fetchDailyReport(today, { siteId });
}

/**
 * Calculate total plays from report
 */
function calculateTotalPlays(items: GameReportItem[]): number {
    return items.reduce((sum, item) => sum + item.standardPlays + item.empPlays, 0);
}

/**
 * Calculate total revenue from report
 */
function calculateTotalRevenue(items: GameReportItem[]): number {
    return items.reduce((sum, item) => sum + item.totalRev, 0);
}

/**
 * Get most popular group by plays
 */
function getMostPopularGroup(items: GameReportItem[]): string | null {
    const groupPlays = new Map<string, number>();

    for (const item of items) {
        const current = groupPlays.get(item.group) || 0;
        groupPlays.set(item.group, current + item.standardPlays);
    }

    let maxGroup: string | null = null;
    let maxPlays = 0;

    for (const [group, plays] of groupPlays) {
        if (plays > maxPlays) {
            maxPlays = plays;
            maxGroup = group;
        }
    }

    return maxGroup;
}

export const gameReportApiService = {
    fetchGameReport,
    fetchAggregatedReport,
    fetchDailyReport,
    fetchMachineReport,
    fetchTodayReport,
    calculateTotalPlays,
    calculateTotalRevenue,
    getMostPopularGroup,
    GAME_REPORT_GROUPS,
};
