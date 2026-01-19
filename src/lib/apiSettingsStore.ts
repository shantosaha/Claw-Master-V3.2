/**
 * Shared API settings state that works both in client and server contexts.
 * In production, this reads from Firestore. In demo mode, this uses a shared in-memory store
 * that can be updated via the API.
 */

export interface ApiIntegrationSettings {
    jotformApiUrl: string;
    jotformFormId: string;
    isEnabled: boolean;
    lastSyncAt?: Date | string;
    lastSyncStatus?: 'success' | 'error';
    lastSyncMessage?: string;
    updatedBy?: string;
    updatedAt?: Date;
}

// Default settings
export const DEFAULT_API_SETTINGS: ApiIntegrationSettings = {
    jotformApiUrl: "",
    jotformFormId: "614",
    isEnabled: true,
    lastSyncAt: undefined,
    lastSyncStatus: undefined,
    lastSyncMessage: undefined,
    updatedBy: undefined,
    updatedAt: undefined,
};

// In-memory store for demo mode (shared across the app in the same process)
let demoApiSettings: ApiIntegrationSettings = { ...DEFAULT_API_SETTINGS };

/**
 * Get current API settings (for demo mode)
 */
export function getApiSettingsSync(): ApiIntegrationSettings {
    return demoApiSettings;
}

/**
 * Update API settings (for demo mode)
 */
export function updateApiSettingsSync(settings: Partial<ApiIntegrationSettings>): ApiIntegrationSettings {
    demoApiSettings = {
        ...demoApiSettings,
        ...settings,
        updatedAt: new Date(),
    };
    console.log("[ApiSettingsStore] Settings updated:", demoApiSettings);
    return demoApiSettings;
}

/**
 * Reset to default settings
 */
export function resetApiSettings(): void {
    demoApiSettings = { ...DEFAULT_API_SETTINGS };
}
