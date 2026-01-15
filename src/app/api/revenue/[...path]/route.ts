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
    revenueEnabled: true,
};

interface ApiSettings {
    jotformApiUrl: string;
    jotformFormId: string;
    isEnabled: boolean;
    revenueEnabled?: boolean;
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
            console.log("[Revenue] Read from config file:", settings.jotformApiUrl);
            return settings;
        }
    } catch (error) {
        console.error("[Revenue] Error reading config file:", error);
    }
    console.log("[Revenue] Using default settings");
    return DEFAULT_SETTINGS;
}

/**
 * Build auth headers if configured
 */
function getAuthHeaders(settings: ApiSettings): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'ClawMaster/1.0',
    };

    if (settings.apiKey) {
        headers['X-API-Key'] = settings.apiKey;
    }
    if (settings.apiToken) {
        headers['Authorization'] = `Bearer ${settings.apiToken}`;
    }

    return headers;
}

/**
 * GET handler for Revenue API
 * Required params: startdate, enddate
 * Optional: aggregate (default true in production)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const settings = getApiSettings();

        console.log("[Revenue Proxy] Using:", {
            url: settings.jotformApiUrl,
            siteId: settings.jotformFormId,
        });

        if (!settings.isEnabled || settings.revenueEnabled === false) {
            return NextResponse.json(
                { error: "Revenue API integration is disabled" },
                { status: 503 }
            );
        }

        // Build the target URL
        const { path: pathSegments } = await params;
        // If path is just the site_id, use it; otherwise use form config
        const siteId = pathSegments?.[0] || settings.jotformFormId;
        const search = request.nextUrl.search;
        const targetUrl = `${settings.jotformApiUrl}/revenue/${siteId}${search}`;

        console.log(`[Revenue Proxy] GET from: ${targetUrl}`);

        // Fetch from the configured external API
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: getAuthHeaders(settings),
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[Revenue Proxy] Error: ${response.status}`);
            return NextResponse.json(
                { error: `Upstream API error: ${response.status}`, targetUrl },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Log response structure
        if (data.status === 'success') {
            const recordCount = Array.isArray(data.response) ? data.response.length : 'unknown';
            console.log(`[Revenue Proxy] Success - ${recordCount} records`);
        } else if (data.status === 'error') {
            console.log(`[Revenue Proxy] API Error: ${data.response}`);
        }

        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error("[Revenue Proxy] Error:", error);
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
        },
    });
}
