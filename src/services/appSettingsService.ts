"use client";

import {
    doc,
    getDoc,
    setDoc,
    Timestamp,
} from "firebase/firestore";
import { db, isFirebaseInitialized } from "@/lib/firebase";
import { StockCheckSettings } from "@/types";

const COLLECTION_NAME = "appSettings";
const STOCK_CHECK_DOC_ID = "stockCheckSettings";

// Default settings
const DEFAULT_SETTINGS: StockCheckSettings = {
    queueMode: "allow_multiple",
    blockDurationMinutes: undefined,
    lastSubmissionAt: undefined,
    updatedBy: undefined,
    updatedAt: undefined,
};

// Demo data for when Firebase is not initialized
let demoSettings: StockCheckSettings = { ...DEFAULT_SETTINGS };

function getDocRef() {
    if (!isFirebaseInitialized || !db) {
        throw new Error("Firebase not initialized");
    }
    return doc(db, COLLECTION_NAME, STOCK_CHECK_DOC_ID);
}

/**
 * Get stock check queue settings
 */
async function getStockCheckSettings(): Promise<StockCheckSettings> {
    if (!isFirebaseInitialized || !db) {
        return demoSettings;
    }

    try {
        const docSnap = await getDoc(getDocRef());
        if (!docSnap.exists()) {
            return DEFAULT_SETTINGS;
        }
        return docSnap.data() as StockCheckSettings;
    } catch (error) {
        console.error("Failed to get stock check settings:", error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Update stock check queue settings
 */
async function updateStockCheckSettings(
    settings: Partial<StockCheckSettings>,
    updatedBy: string
): Promise<StockCheckSettings> {
    const current = await getStockCheckSettings();
    const updated: StockCheckSettings = {
        ...current,
        ...settings,
        updatedBy,
        updatedAt: new Date(),
    };

    if (!isFirebaseInitialized || !db) {
        demoSettings = updated;
        return updated;
    }

    await setDoc(getDocRef(), {
        ...updated,
        updatedAt: Timestamp.now(),
        lastSubmissionAt: updated.lastSubmissionAt
            ? Timestamp.fromDate(
                typeof updated.lastSubmissionAt === "string"
                    ? new Date(updated.lastSubmissionAt)
                    : updated.lastSubmissionAt
            )
            : null,
    });

    return updated;
}

/**
 * Record a new submission timestamp (for duration blocking)
 */
async function recordSubmission(): Promise<void> {
    const current = await getStockCheckSettings();

    if (!isFirebaseInitialized || !db) {
        demoSettings = {
            ...current,
            lastSubmissionAt: new Date(),
        };
        console.log("[AppSettings] Recorded submission at:", demoSettings.lastSubmissionAt);
        return;
    }

    await setDoc(
        getDocRef(),
        {
            ...current,
            lastSubmissionAt: Timestamp.now(),
        },
        { merge: true }
    );
    console.log("[AppSettings] Recorded submission timestamp to Firestore");
}

/**
 * Check if new submissions are currently blocked
 */
async function isSubmissionBlocked(): Promise<{ blocked: boolean; reason?: string; unblockAt?: Date }> {
    const settings = await getStockCheckSettings();

    console.log("[AppSettings] Checking block status with settings:", {
        queueMode: settings.queueMode,
        blockDurationMinutes: settings.blockDurationMinutes,
        lastSubmissionAt: settings.lastSubmissionAt
    });

    if (settings.queueMode === "allow_multiple") {
        console.log("[AppSettings] Mode: allow_multiple - not blocked");
        return { blocked: false };
    }

    if (settings.queueMode === "block_until_resolved") {
        // Check if there are pending submissions
        // This check is done in the component using pendingStockCheckService
        console.log("[AppSettings] Mode: block_until_resolved - delegating to component");
        return { blocked: false, reason: "Check pending submissions" };
    }

    if (settings.queueMode === "block_for_duration") {
        if (!settings.lastSubmissionAt || !settings.blockDurationMinutes) {
            console.log("[AppSettings] Mode: block_for_duration but no timestamp/duration set - not blocked");
            return { blocked: false };
        }

        const lastSubmission =
            typeof settings.lastSubmissionAt === "string"
                ? new Date(settings.lastSubmissionAt)
                : settings.lastSubmissionAt;

        const unblockAt = new Date(
            lastSubmission.getTime() + settings.blockDurationMinutes * 60 * 1000
        );

        const now = Date.now();
        const isBlocked = now < unblockAt.getTime();

        console.log("[AppSettings] Duration check:", {
            lastSubmission: lastSubmission.toISOString(),
            unblockAt: unblockAt.toISOString(),
            now: new Date(now).toISOString(),
            isBlocked
        });

        if (isBlocked) {
            return {
                blocked: true,
                reason: `Submissions blocked until ${unblockAt.toLocaleTimeString()}`,
                unblockAt,
            };
        }
    }

    console.log("[AppSettings] Not blocked");
    return { blocked: false };
}

export const appSettingsService = {
    getStockCheckSettings,
    updateStockCheckSettings,
    recordSubmission,
    isSubmissionBlocked,
};
