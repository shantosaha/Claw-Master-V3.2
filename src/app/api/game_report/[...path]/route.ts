import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = 'force-dynamic';

// Path to the config file
const CONFIG_PATH = path.join(process.cwd(), 'api-config.json');

// Default settings
const DEFAULT_SETTINGS = {
    jotformApiUrl: "",
    jotformFormId: "614",
    isEnabled: true,
    gameReportEnabled: true,
};

interface ApiSettings {
    jotformApiUrl?: string;
    jotformFormId?: string;
    gameReportApiUrl?: string;
    gameReportSiteId?: string;
    gameReportEnabled?: boolean;
    gameReportApiKey?: string;
    gameReportApiToken?: string;
    // Legacy/Shared
    isEnabled: boolean;
    apiKey?: string;
    apiToken?: string;
}

/**
 * Read API settings from config file (fresh read every time)
 */
function getApiSettings(): ApiSettings {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const settings = JSON.parse(content);
            return settings;
        }
    } catch (error) {
        console.error("[GameReport] Error reading config file:", error);
    }
    return DEFAULT_SETTINGS;
}

/**
 * Build auth headers if configured
 */
function getAuthHeaders(settings: ApiSettings): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClawMaster/1.0',
    };

    const apiKey = settings.gameReportApiKey || settings.apiKey;
    const apiToken = settings.gameReportApiToken || settings.apiToken;

    if (apiKey) {
        headers['X-API-Key'] = apiKey;
    }
    if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
    }

    return headers;
}

/**
 * POST handler - Primary method for Production API
 * PRODUCTION COMPLIANCE:
 * - startdate and enddate required in URL
 * - Body contains ONLY 'groups' array
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const settings = getApiSettings();

        const gameReportUrl = settings.gameReportApiUrl || settings.jotformApiUrl || DEFAULT_SETTINGS.jotformApiUrl;
        const gameReportSiteId = settings.gameReportSiteId || settings.jotformFormId || DEFAULT_SETTINGS.jotformFormId;
        const isEnabled = settings.gameReportEnabled !== undefined ? settings.gameReportEnabled : settings.isEnabled;

        console.log("[GameReport Proxy] POST Using:", {
            url: gameReportUrl,
            siteId: gameReportSiteId,
        });

        if (!isEnabled) {
            return NextResponse.json(
                { error: "Game Report API integration is disabled" },
                { status: 503 }
            );
        }

        // PRODUCTION COMPLIANCE: Validate required URL params
        const startdate = request.nextUrl.searchParams.get('startdate');
        const enddate = request.nextUrl.searchParams.get('enddate');

        if (!startdate || !enddate) {
            return NextResponse.json(
                { error: "Missing required params: startdate and enddate" },
                { status: 400 }
            );
        }

        // Build the target URL (startdate, enddate, and aggregate allowed)
        const { path: pathSegments } = await params;
        const siteId = pathSegments?.[0] || gameReportSiteId;

        // Ensure no double slashes
        const baseUrl = gameReportUrl.endsWith('/') ? gameReportUrl.slice(0, -1) : gameReportUrl;
        const searchParams = new URLSearchParams();
        if (startdate) searchParams.set('startdate', startdate);
        if (enddate) searchParams.set('enddate', enddate);
        const aggregate = request.nextUrl.searchParams.get('aggregate');
        if (aggregate) searchParams.set('aggregate', aggregate);

        const targetUrl = `${baseUrl}/game_report/${siteId}?${searchParams.toString()}`;

        console.log(`[GameReport Proxy] POST to: ${targetUrl}`);

        // Get request body
        let inputBody: Record<string, unknown> = {};
        try {
            inputBody = await request.json();
        } catch {
            // Empty body is fine
        }

        // PRODUCTION COMPLIANCE: Body contains ONLY 'groups' array
        // Extract groups from input, default to all groups if not provided
        const ALL_GROUPS = [
            "Group 1-Video", "Group 2-Redemption", "Group 3-Driving",
            "Group 4-Cranes", "Group 5-Prize Games", "Group 6-Skill Tester",
            "Group 7-Music", "Group 8-Attractions", "Group 9-Coin Pushers",
            "Group 10-Sports", "Group 11-Others", "Not Assigned"
        ];

        const groups = Array.isArray(inputBody.groups) && inputBody.groups.length > 0
            ? inputBody.groups
            : (Array.isArray(inputBody.group) && inputBody.group.length > 0
                ? inputBody.group  // Handle legacy 'group' field
                : ALL_GROUPS);

        // Construct compliant body (ONLY groups allowed)
        const body = { groups };

        console.log(`[GameReport Proxy] Production compliant body:`, body);

        // Fetch from the configured external API
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: getAuthHeaders(settings),
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[GameReport Proxy] Error: ${response.status}`);
            return NextResponse.json(
                { error: `Upstream API error: ${response.status}`, targetUrl },
                { status: response.status }
            );
        }

        const data = await response.json();

        // PRODUCTION API NORMALIZATION:
        // 1. Production returns cashDebit + cashDebitBonus but NOT totalRev
        // 2. Production returns aggregated data without 'date' field
        // 3. Normalize to match expected frontend format
        const normalizeItem = (item: Record<string, unknown>) => ({
            ...item,
            // Compute totalRev if not present or zero (using component sum as fallback)
            totalRev: (item.totalRev as number) || ((item.cashDebit as number || 0) + (item.cashDebitBonus as number || 0)),
            // Add date if not present (use startdate from request for aggregated data)
            date: item.date ?? startdate,
        });

        let processedData: Record<string, unknown>[];
        if (data?.response && Array.isArray(data.response)) {
            // Production: unwrap and normalize - always return raw array
            processedData = data.response.map(normalizeItem);
        } else if (Array.isArray(data)) {
            // Local: just normalize
            processedData = data.map(normalizeItem);
        } else {
            // Unexpected format - return empty array
            console.warn('[GameReport Proxy] Unexpected response format:', typeof data);
            processedData = [];
        }

        console.log(`[GameReport Proxy] POST Success - ${processedData.length} records (normalized: totalRev + date, unwrapped)`);

        return NextResponse.json(processedData, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error("[GameReport Proxy] POST Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch", details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET handler - Fallback for Mock API
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const settings = getApiSettings();

        const gameReportUrl = settings.gameReportApiUrl || settings.jotformApiUrl || DEFAULT_SETTINGS.jotformApiUrl;
        const gameReportSiteId = settings.gameReportSiteId || settings.jotformFormId || DEFAULT_SETTINGS.jotformFormId;
        const isEnabled = settings.gameReportEnabled !== undefined ? settings.gameReportEnabled : settings.isEnabled;

        console.log("[GameReport Proxy] GET Using:", {
            url: gameReportUrl,
            siteId: gameReportSiteId,
        });

        if (!isEnabled) {
            return NextResponse.json(
                { error: "Game Report API integration is disabled" },
                { status: 503 }
            );
        }

        // Build the target URL
        const { path: pathSegments } = await params;
        const siteId = pathSegments?.[0] || gameReportSiteId;
        const search = request.nextUrl.search;

        // Ensure no double slashes
        const baseUrl = gameReportUrl.endsWith('/') ? gameReportUrl.slice(0, -1) : gameReportUrl;
        const targetUrl = `${baseUrl}/game_report/${siteId}${search}`;

        console.log(`[GameReport Proxy] GET from: ${targetUrl}`);

        // Fetch from the configured external API
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: getAuthHeaders(settings),
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[GameReport Proxy] Error: ${response.status}`);
            return NextResponse.json(
                { error: `Upstream API error: ${response.status}`, targetUrl },
                { status: response.status }
            );
        }

        const data = await response.json();

        const recordCount = Array.isArray(data) ? data.length : 'unknown';
        console.log(`[GameReport Proxy] GET Success - ${recordCount} records`);

        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error("[GameReport Proxy] GET Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch", details: String(error) },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
        },
    });
}
