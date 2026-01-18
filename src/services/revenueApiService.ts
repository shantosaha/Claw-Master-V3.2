/**
 * Revenue API Service
 * Fetches POS/Teller revenue data from the Revenue API
 */

import { appSettingsService } from "./appSettingsService";
import { format } from "date-fns";

/**
 * Single revenue entry from API
 */
export interface RevenueItem {
    type: 'pos' | 'teller';
    name: string;
    cashRev: number;
    cardRev: number;
    refunds: number;
    total: number;
    date?: string; // Present in non-aggregated responses
}

/**
 * API Response wrapper
 */
export interface RevenueApiResponse {
    status: 'success' | 'error';
    response: RevenueItem[] | string;
}

/**
 * Aggregated revenue summary
 */
export interface RevenueSummary {
    totalCash: number;
    totalCard: number;
    totalRefunds: number;
    grandTotal: number;
    posTotals: {
        cash: number;
        card: number;
        total: number;
    };
    tellerTotals: {
        cash: number;
        card: number;
        total: number;
    };
}

/**
 * Fetch revenue data for a date range
 * Note: Production API requires both startdate and enddate
 */
async function fetchRevenue(
    options: {
        siteId?: string;
        startDate: Date;
        endDate: Date;
        aggregate?: boolean;
    },
    apiSettings?: any // Add optional settings parameter
): Promise<RevenueItem[]> {
    try {
        const settings = apiSettings || await appSettingsService.getApiSettings();

        if (!settings.isEnabled || !settings.revenueEnabled) {
            console.log("[RevenueService] API is disabled");
            return [];
        }

        const siteId = options.siteId || settings.jotformFormId;
        const startStr = format(options.startDate, "yyyy-MM-dd");
        const endStr = format(options.endDate, "yyyy-MM-dd");
        const aggregateParam = options.aggregate !== false ? 'true' : 'false';

        // Use our proxy route
        const endpoint = `/api/revenue/${siteId}?startdate=${startStr}&enddate=${endStr}&aggregate=${aggregateParam}`;

        console.log(`[RevenueService] Fetching from ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'GET',
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[RevenueService] Error: ${response.status}`);
            return [];
        }

        const data: RevenueApiResponse = await response.json();

        if (data.status === 'success' && Array.isArray(data.response)) {
            return data.response;
        } else if (data.status === 'error') {
            console.error(`[RevenueService] API Error: ${data.response}`);
            return [];
        }

        return [];
    } catch (error) {
        console.error("[RevenueService] Fetch error:", error);
        return [];
    }
}

/**
 * Fetch revenue for a single day
 */
async function fetchDailyRevenue(
    date: Date,
    siteId?: string,
    apiSettings?: any // Add optional settings parameter
): Promise<RevenueItem[]> {
    return fetchRevenue({
        siteId,
        startDate: date,
        endDate: date,
        aggregate: false, // Get individual items for a single day
    }, apiSettings);
}

/**
 * Fetch aggregated revenue for a date range
 */
async function fetchAggregatedRevenue(
    startDate: Date,
    endDate: Date,
    siteId?: string,
    apiSettings?: any // Add optional settings parameter
): Promise<RevenueItem[]> {
    return fetchRevenue({
        siteId,
        startDate,
        endDate,
        aggregate: true,
    }, apiSettings);
}

/**
 * Fetch today's revenue
 */
async function fetchTodayRevenue(siteId?: string, apiSettings?: any): Promise<RevenueItem[]> {
    const today = new Date();
    return fetchDailyRevenue(today, siteId, apiSettings);
}

/**
 * Calculate revenue summary from items
 */
function calculateSummary(items: RevenueItem[]): RevenueSummary {
    const summary: RevenueSummary = {
        totalCash: 0,
        totalCard: 0,
        totalRefunds: 0,
        grandTotal: 0,
        posTotals: { cash: 0, card: 0, total: 0 },
        tellerTotals: { cash: 0, card: 0, total: 0 },
    };

    for (const item of items) {
        summary.totalCash += item.cashRev;
        summary.totalCard += item.cardRev;
        summary.totalRefunds += item.refunds;
        summary.grandTotal += item.total;

        if (item.type === 'pos') {
            summary.posTotals.cash += item.cashRev;
            summary.posTotals.card += item.cardRev;
            summary.posTotals.total += item.total;
        } else if (item.type === 'teller') {
            summary.tellerTotals.cash += item.cashRev;
            summary.tellerTotals.card += item.cardRev;
            summary.tellerTotals.total += item.total;
        }
    }

    return summary;
}

/**
 * Get total revenue from items
 */
function getTotalRevenue(items: RevenueItem[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
}

/**
 * Get items by type
 */
function filterByType(items: RevenueItem[], type: 'pos' | 'teller'): RevenueItem[] {
    return items.filter(item => item.type === type);
}

export const revenueApiService = {
    fetchRevenue,
    fetchDailyRevenue,
    fetchAggregatedRevenue,
    fetchTodayRevenue,
    calculateSummary,
    getTotalRevenue,
    filterByType,
};
