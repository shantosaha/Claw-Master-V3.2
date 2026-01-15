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
};

interface ApiSettings {
    jotformApiUrl: string;
    jotformFormId: string;
    isEnabled: boolean;
}

/**
 * Read API settings from config file (fresh read every time)
 */
function getApiSettings(): ApiSettings {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const settings = JSON.parse(content);
            console.log("[JotForm] Read from config file:", settings.jotformApiUrl);
            return settings;
        }
    } catch (error) {
        console.error("[JotForm] Error reading config file:", error);
    }
    console.log("[JotForm] Using default settings");
    return DEFAULT_SETTINGS;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        // Read settings from config file (fresh read)
        const settings = getApiSettings();

        console.log("[JotForm Proxy] Using:", {
            url: settings.jotformApiUrl,
            formId: settings.jotformFormId,
        });

        if (!settings.isEnabled) {
            return NextResponse.json(
                { error: "JotForm API integration is disabled" },
                { status: 503 }
            );
        }

        // Build the full URL with query parameters preserved
        const { path: pathSegments } = await params;
        const pathString = pathSegments.join('/');
        const search = request.nextUrl.search;
        const targetUrl = `${settings.jotformApiUrl}/jotform/${pathString}${search}`;

        console.log(`[JotForm Proxy] Fetching from: ${targetUrl}`);

        // Fetch from the configured external API
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ClawMaster/1.0',
            },
            cache: 'no-store', // Next.js level no-store
        });

        if (!response.ok) {
            console.error(`[JotForm Proxy] Error: ${response.status}`);
            return NextResponse.json(
                { error: `Upstream API error: ${response.status}`, targetUrl },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('Content-Type') || 'application/json';
        const isImage = contentType.startsWith('image/');

        // If it's an image, we can return the blob directly with aggressive caching
        if (isImage) {
            const blob = await response.blob();
            return new NextResponse(blob, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=604800, immutable', // 7 days
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const data = await response.json();

        const recordCount = Array.isArray(data?.response)
            ? data.response.length
            : (Array.isArray(data) ? data.length : 'unknown');
        console.log(`[JotForm Proxy] Success - ${recordCount} records`);

        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            },
        });
    } catch (error) {
        console.error("[JotForm Proxy] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch", details: String(error) },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params;
    const pathString = pathSegments.join('/');

    if (pathString !== 'submit') {
        return NextResponse.json({ error: "Use /api/jotform/submit" }, { status: 400 });
    }

    const body = await request.json();
    console.log("[JotForm] Submit:", body);

    return NextResponse.json({ success: true, data: body });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
