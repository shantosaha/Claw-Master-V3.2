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
        const endpoint = `/api/game_report/${siteId}?startdate=${startStr}&enddate=${endStr}`;

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

        const data = await response.json();

        // Handle both array and {response: [...]} formats
        if (Array.isArray(data)) {
            return data;
        } else if (data.response && Array.isArray(data.response)) {
            return data.response;
        }

        return [];
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
    });
}

/**
 * Fetch report for a specific machine by tag
 * NOTE: Production API does not support tag filtering.
 * This function fetches all data for the date range.
 * Client-side filtering by tag should be done after fetching.
 */
async function fetchMachineReport(
    tag: number,
    startDate: Date,
    endDate: Date,
    siteId?: string
): Promise<GameReportItem[]> {
    // Fetch all data, then filter client-side by tag
    const allData = await fetchGameReport({
        siteId,
        startDate,
        endDate,
    });
    // Client-side filter by tag
    return allData.filter(item => item.tag === tag);
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
