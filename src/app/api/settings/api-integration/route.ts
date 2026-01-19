import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = 'force-dynamic';

// Path to the config file
const CONFIG_PATH = path.join(process.cwd(), 'api-config.json');

interface ApiUrlPreset {
    label: string;
    value: string;
}

interface ApiSettings {
    jotformApiUrl: string;
    jotformFormId: string;
    jotformEnabled: boolean;
    jotformApiKey?: string;
    jotformApiToken?: string;

    gameReportApiUrl: string;
    gameReportSiteId: string;
    gameReportEnabled: boolean;
    gameReportApiKey?: string;
    gameReportApiToken?: string;

    revenueApiUrl: string;
    revenueSiteId: string;
    revenueEnabled: boolean;
    revenueApiKey?: string;
    revenueApiToken?: string;

    // Legacy/Global
    isEnabled: boolean;
    apiKey?: string;
    apiToken?: string;

    urlPresets?: ApiUrlPreset[];
    updatedAt?: string;
    updatedBy?: string;
}

// Default settings
const DEFAULT_SETTINGS: ApiSettings = {
    jotformApiUrl: "",
    jotformFormId: "614",
    jotformEnabled: true,

    gameReportApiUrl: "",
    gameReportSiteId: "614",
    gameReportEnabled: true,

    revenueApiUrl: "",
    revenueSiteId: "614",
    revenueEnabled: true,

    isEnabled: true,
    urlPresets: [
        { label: "Local Server (127.0.0.1)", value: "http://127.0.0.1:8000" },
        { label: "Local Server (localhost)", value: "http://localhost:8000" },
    ]
};

/**
 * Read settings from config file
 */
function readSettings(): ApiSettings {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error("[API Settings] Error reading config:", error);
    }
    return DEFAULT_SETTINGS;
}

/**
 * Write settings to config file
 */
function writeSettings(settings: ApiSettings): void {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf-8');
        console.log("[API Settings] Config saved to:", CONFIG_PATH);
    } catch (error) {
        console.error("[API Settings] Error writing config:", error);
        throw error;
    }
}

/**
 * GET - Retrieve current API settings
 */
export async function GET() {
    const settings = readSettings();
    return NextResponse.json(settings);
}

/**
 * POST - Update API settings
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newSettings: ApiSettings = {
            // JotForm
            jotformApiUrl: body.jotformApiUrl || body.jotformApiUrl || DEFAULT_SETTINGS.jotformApiUrl,
            jotformFormId: body.jotformFormId || body.jotformFormId || DEFAULT_SETTINGS.jotformFormId,
            jotformEnabled: body.jotformEnabled !== undefined ? body.jotformEnabled : (body.isEnabled !== false),
            jotformApiKey: body.jotformApiKey || "",
            jotformApiToken: body.jotformApiToken || "",

            // Game Report
            gameReportApiUrl: body.gameReportApiUrl || body.jotformApiUrl || DEFAULT_SETTINGS.gameReportApiUrl,
            gameReportSiteId: body.gameReportSiteId || body.jotformFormId || DEFAULT_SETTINGS.gameReportSiteId,
            gameReportEnabled: body.gameReportEnabled !== undefined ? body.gameReportEnabled : (body.isEnabled !== false),
            gameReportApiKey: body.gameReportApiKey || "",
            gameReportApiToken: body.gameReportApiToken || "",

            // Revenue
            revenueApiUrl: body.revenueApiUrl || body.jotformApiUrl || DEFAULT_SETTINGS.revenueApiUrl,
            revenueSiteId: body.revenueSiteId || body.jotformFormId || DEFAULT_SETTINGS.revenueSiteId,
            revenueEnabled: body.revenueEnabled !== undefined ? body.revenueEnabled : (body.isEnabled !== false),
            revenueApiKey: body.revenueApiKey || "",
            revenueApiToken: body.revenueApiToken || "",

            // Shared/Legacy
            isEnabled: body.isEnabled !== false,
            apiKey: body.apiKey || "",
            apiToken: body.apiToken || "",

            urlPresets: body.urlPresets || DEFAULT_SETTINGS.urlPresets,
            updatedAt: new Date().toISOString(),
            updatedBy: body.updatedBy || "api",
        };

        writeSettings(newSettings);

        console.log("[API Settings] Updated:", newSettings);

        return NextResponse.json(newSettings);
    } catch (error) {
        console.error("[API Settings] Error updating:", error);
        return NextResponse.json(
            { error: "Failed to update settings", details: String(error) },
            { status: 500 }
        );
    }
}
