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
    isEnabled: boolean;
    urlPresets?: ApiUrlPreset[];
    updatedAt?: string;
    updatedBy?: string;
}

// Default settings
const DEFAULT_SETTINGS: ApiSettings = {
    jotformApiUrl: "http://claw.kokoamusement.com.au",
    jotformFormId: "614",
    isEnabled: true,
    urlPresets: [
        { label: "Production (Remote)", value: "http://claw.kokoamusement.com.au" },
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
            jotformApiUrl: body.jotformApiUrl || DEFAULT_SETTINGS.jotformApiUrl,
            jotformFormId: body.jotformFormId || DEFAULT_SETTINGS.jotformFormId,
            isEnabled: body.isEnabled !== false,
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
