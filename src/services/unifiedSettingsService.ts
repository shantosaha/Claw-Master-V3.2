/**
 * Unified Machine Settings Service
 * Provides a single interface for getting claw settings with proper fallback priority
 * 
 * Priority Chain (highest to lowest):
 * 1. ItemMachineSettings (item + machine combo - most specific)
 * 2. PlayfieldSetting (machine/slot default)
 * 3. StockItem.technicalSpecs (item default)
 * 4. MachineType defaults (type baseline - most general)
 */

import { ItemMachineSettings, PlayfieldSetting, StockItem, MachineType } from "@/types";
import { itemMachineSettingsService, settingsService, machineTypeService } from "./index";
import { where } from "firebase/firestore";

export interface ClawSettings {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    payoutRate?: number;
    imageUrl?: string;
    source: 'item_machine' | 'playfield' | 'stock_item' | 'machine_type' | 'default';
}

const DEFAULT_CLAW_SETTINGS: ClawSettings = {
    c1: 32,
    c2: 32,
    c3: 32,
    c4: 48,
    payoutRate: 10,
    source: 'default',
};

/**
 * Get effective claw settings for an item on a machine with fallback priority
 */
export async function getEffectiveSettings(
    machineId: string,
    slotId?: string,
    itemId?: string,
    stockItem?: StockItem,
    machineTypeId?: string
): Promise<ClawSettings> {

    // Priority 1: Item + Machine combo settings
    if (itemId && machineId) {
        try {
            const itemMachineSettings = await itemMachineSettingsService.query(
                where("machineId", "==", machineId),
                where("itemId", "==", itemId)
            );

            if (itemMachineSettings.length > 0) {
                const s = itemMachineSettings[0];
                return {
                    c1: s.c1,
                    c2: s.c2,
                    c3: s.c3,
                    c4: s.c4,
                    payoutRate: s.playPerWin,
                    imageUrl: s.imageUrl,
                    source: 'item_machine',
                };
            }
        } catch (err) {
            console.warn("[UnifiedSettings] Error fetching item-machine settings:", err);
        }
    }

    // Priority 2: Playfield/slot settings
    if (machineId) {
        try {
            const playfieldSettings = await settingsService.query(
                where("machineId", "==", machineId)
            );

            // Find most recent setting for this slot (or any if no slotId)
            const relevantSettings = playfieldSettings
                .filter(s => !slotId || s.slotId === slotId)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (relevantSettings.length > 0) {
                const s = relevantSettings[0];
                return {
                    c1: s.c1 ?? DEFAULT_CLAW_SETTINGS.c1,
                    c2: s.c2 ?? DEFAULT_CLAW_SETTINGS.c2,
                    c3: s.c3 ?? DEFAULT_CLAW_SETTINGS.c3,
                    c4: s.c4 ?? DEFAULT_CLAW_SETTINGS.c4,
                    payoutRate: s.payoutRate,
                    imageUrl: s.imageUrl,
                    source: 'playfield',
                };
            }
        } catch (err) {
            console.warn("[UnifiedSettings] Error fetching playfield settings:", err);
        }
    }

    // Priority 3: Stock item technical specs
    if (stockItem?.technicalSpecs?.recommendedClawStrength) {
        const strength = stockItem.technicalSpecs.recommendedClawStrength;
        const strengthMap = {
            'Low': { c1: 24, c2: 24, c3: 24, c4: 32 },
            'Medium': { c1: 32, c2: 32, c3: 32, c4: 48 },
            'High': { c1: 48, c2: 48, c3: 48, c4: 64 },
        };

        const mapped = strengthMap[strength as keyof typeof strengthMap];
        if (mapped) {
            return {
                ...mapped,
                source: 'stock_item',
            };
        }
    }

    // Priority 4: Machine type defaults (TODO: when types are seeded)
    if (machineTypeId) {
        try {
            const machineType = await machineTypeService.getById(machineTypeId);
            // MachineType doesn't have claw settings yet, but we can extend it
            // For now, fall through to default
        } catch (err) {
            console.warn("[UnifiedSettings] Error fetching machine type:", err);
        }
    }

    // Fallback: System defaults
    return DEFAULT_CLAW_SETTINGS;
}

/**
 * Save item-machine specific settings (highest priority)
 */
export async function saveItemMachineSettings(
    settings: Omit<ItemMachineSettings, 'id' | 'createdAt'>
): Promise<ItemMachineSettings> {
    const existing = await itemMachineSettingsService.query(
        where("machineId", "==", settings.machineId),
        where("itemId", "==", settings.itemId)
    );

    if (existing.length > 0) {
        // Update existing
        await itemMachineSettingsService.update(existing[0].id, {
            ...settings,
            lastUpdatedAt: new Date(),
        });
        return { ...existing[0], ...settings };
    } else {
        // Create new
        const newSettings: ItemMachineSettings = {
            ...settings,
            id: `ims_${settings.machineId}_${settings.itemId}`,
            createdAt: new Date(),
        } as ItemMachineSettings;

        await itemMachineSettingsService.add(newSettings);
        return newSettings;
    }
}

/**
 * Get settings history for audit trail
 */
export async function getSettingsHistory(
    machineId: string,
    itemId?: string
): Promise<Array<PlayfieldSetting | ItemMachineSettings>> {
    const results: Array<PlayfieldSetting | ItemMachineSettings> = [];

    // Get playfield settings history
    const playfieldSettings = await settingsService.query(
        where("machineId", "==", machineId)
    );
    results.push(...playfieldSettings);

    // Get item-machine settings if itemId provided
    if (itemId) {
        const itemSettings = await itemMachineSettingsService.query(
            where("machineId", "==", machineId),
            where("itemId", "==", itemId)
        );
        results.push(...itemSettings);
    }

    return results;
}

export const unifiedSettingsService = {
    getEffectiveSettings,
    saveItemMachineSettings,
    getSettingsHistory,
    DEFAULT_CLAW_SETTINGS,
};
