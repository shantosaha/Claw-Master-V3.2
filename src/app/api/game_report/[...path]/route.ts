import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = 'force-dynamic';

// Path to the config file
const CONFIG_PATH = path.join(process.cwd(), 'api-config.json');

// Default settings
const DEFAULT_SETTINGS = {
    jotformApiUrl: "https://claw.kokoamusement.com.au",
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
 * Supports filtering by group, tag, date range, and aggregation
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

        // Build the target URL
        const { path: pathSegments } = await params;
        // If path is just the site_id, use it; otherwise use form config
        const siteId = pathSegments?.[0] || gameReportSiteId;
        const search = request.nextUrl.search;
        const targetUrl = `${gameReportUrl}/game_report/${siteId}${search}`;

        console.log(`[GameReport Proxy] POST to: ${targetUrl}`);

        // Get request body
        let body: Record<string, unknown> = {};
        try {
            body = await request.json();
        } catch {
            // Empty body is fine
        }

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

        const recordCount = Array.isArray(data) ? data.length : 'unknown';
        console.log(`[GameReport Proxy] POST Success - ${recordCount} records`);

        return NextResponse.json(data, {
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
        const targetUrl = `${gameReportUrl}/game_report/${siteId}${search}`;

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
