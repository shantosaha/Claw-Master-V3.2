import { ArcadeMachine } from "@/types";

/**
 * Machine Type Utilities
 * Helper functions for determining machine type and capabilities
 */

/** The group name for claw machines that need inventory management */
export const CLAW_MACHINE_GROUP = "Group 4-Cranes";

/** All machine groups from Game Report API */
export const MACHINE_GROUPS = [
    "Group 1-Video",
    "Group 2-Redemption",
    "Group 3-Driving",
    "Group 4-Cranes",
    "Group 5-Prize Games",
    "Group 6-Skill Tester",
    "Group 7-Music",
    "Group 8-Attractions",
    "Group 9-Coin Pushers",
    "Group 10-Sports",
    "Group 11-Others",
] as const;

export type MachineGroup = typeof MACHINE_GROUPS[number];

/** SubGroups mapped to each machine group */
export const GROUP_SUBGROUPS: Record<string, string[]> = {
    "Group 1-Video": ["Video", "Fighting", "Shooting"],
    "Group 2-Redemption": ["Redemption", "Physical Redemption", "Shooting"],
    "Group 3-Driving": ["Video", "Attractions", "Premium"],
    "Group 4-Cranes": ["Small", "Medium", "Large", "Pops", "Blindbox"],
    "Group 5-Prize Games": ["Capsules", "Major Prize", "Prize", "Blindbox", "Pops", "Miner", "Other"],
    "Group 6-Skill Tester": ["Major Prize", "Pops", "Other"],
    "Group 7-Music": ["Music", "Premium"],
    "Group 8-Attractions": ["Attractions", "Photobooth", "Shooting"],
    "Group 9-Coin Pushers": ["Andamiro", "Elaut", "Golden Railroad", "Other"],
    "Group 10-Sports": ["Air Hockey", "Hammer/Punch", "Other"],
    "Group 11-Others": ["Other"],
};

/** Categories (Machine Type) for each group, currently primarily for Cranes */
export const GROUP_CATEGORIES: Record<string, string[]> = {
    "Group 4-Cranes": [
        "Trend Catcher",
        "Trend Box",
        "Innis",
        "Skweb",
        "Crazy Toy Miya",
        "Crazy Toy -> Medium",
        "Crazy Toy Nano",
        "Crazy Star",
        "Doll Castle",
        "The Big Claw",
        "Hip-Hop Elf",
        "Clip Story",
        "E-Claw",
        "Meow Meow",
        "Clena",
        "UFO Catcher",
        "HexClaw",
        "Custom",
    ],
};

/**
 * Check if a group string represents a claw machine group
 */
export function isCraneGroup(group: string | undefined | null): boolean {
    return group === CLAW_MACHINE_GROUP;
}

/**
 * Check if a machine is a claw machine (Group 4-Cranes)
 * Claw machines have inventory features: slots, items, stock levels, JotForm settings
 * 
 * @param machine - The machine to check (can be partial with just group or type)
 * @returns true if the machine is a claw machine
 */
export function isCraneMachine(machine: { group?: string; type?: string } | null | undefined): boolean {
    if (!machine) return false;
    // Check both group and type for backward compatibility
    return machine.group === CLAW_MACHINE_GROUP || machine.type === CLAW_MACHINE_GROUP;
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
