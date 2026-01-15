import { ArcadeMachine } from "@/types";

/**
 * Machine Type Utilities
 * Helper functions for determining machine type and capabilities
 */

/** The group name for claw machines that need inventory management */
export const CLAW_MACHINE_GROUP = "Group 4-Cranes";

/**
 * Check if a machine is a claw machine (Group 4-Cranes)
 * Claw machines have inventory features: slots, items, stock levels, JotForm settings
 * 
 * @param machine - The machine to check (can be partial with just group)
 * @returns true if the machine is a claw machine
 */
export function isCraneMachine(machine: { group?: string } | null | undefined): boolean {
    if (!machine) return false;
    return machine.group === CLAW_MACHINE_GROUP;
}

/**
 * Check if a machine needs inventory management features
 * Alias for isCraneMachine for semantic clarity
 */
export function hasInventoryFeatures(machine: { group?: string } | null | undefined): boolean {
    return isCraneMachine(machine);
}

/**
 * Check if a machine should have JotForm settings (claw settings)
 * Only claw machines have JotForm integration for C1-C4 settings, payout rate, etc.
 */
export function hasJotFormSettings(machine: { group?: string } | null | undefined): boolean {
    return isCraneMachine(machine);
}

/**
 * Check if a machine should have slots (playfield positions)
 * Only claw machines have slots for Top/Bottom, Main, etc.
 */
export function hasSlots(machine: { group?: string } | null | undefined): boolean {
    return isCraneMachine(machine);
}

/**
 * Check if a machine can have stock/items assigned
 * Only claw machines can have inventory items assigned
 */
export function canHaveStockAssigned(machine: { group?: string } | null | undefined): boolean {
    return isCraneMachine(machine);
}

/**
 * Get a display message for features not applicable to a machine type
 * @param featureName - The name of the feature (e.g., "Slots", "Stock Level")
 * @returns A user-friendly message
 */
export function getNotApplicableMessage(featureName: string): string {
    return `${featureName} not applicable for this machine type`;
}
