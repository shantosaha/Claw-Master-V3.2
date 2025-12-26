/**
 * Centralized String Normalization Utility
 * 
 * Handles naming variations across the system:
 * - Sizes: "Extra-Small" vs "Extra Small" vs "xs"
 * - Statuses: "Assigned" vs "Using" vs "in use"
 * - Categories: "Plushy" vs "Plush" vs "Plushies"
 * - Locations: "B-Plushy Room" vs "B Plushy Room"
 */

// =============================================================================
// TYPES
// =============================================================================

export type NormalizationDomain = 'size' | 'status' | 'category' | 'location';

export type CanonicalSize = 'Extra-Small' | 'Small' | 'Medium' | 'Large' | 'Big';

// =============================================================================
// ALIAS MAPS - Add new variations here as they are discovered
// =============================================================================

const SIZE_ALIASES: Record<string, CanonicalSize> = {
    // Extra-Small variations
    'extra-small': 'Extra-Small',
    'extra small': 'Extra-Small',
    'extrasmall': 'Extra-Small',
    'xs': 'Extra-Small',
    'x-small': 'Extra-Small',
    'xsmall': 'Extra-Small',
    'x-s': 'Extra-Small',
    'extra_small': 'Extra-Small',

    // Small variations
    'small': 'Small',
    's': 'Small',
    'sm': 'Small',
    'sml': 'Small',

    // Medium variations
    'medium': 'Medium',
    'm': 'Medium',
    'med': 'Medium',
    'md': 'Medium',

    // Large variations
    'large': 'Large',
    'l': 'Large',
    'lg': 'Large',
    'lrg': 'Large',

    // Big variations (Extra Large)
    'big': 'Big',
    'xl': 'Big',
    'x-large': 'Big',
    'x large': 'Big',
    'xlarge': 'Big',
    'extra-large': 'Big',
    'extra large': 'Big',
    'extralarge': 'Big',
    'xxl': 'Big',
};

const STATUS_ALIASES: Record<string, string> = {
    // Using/Assigned variations
    'using': 'Using',
    'in use': 'Using',
    'inuse': 'Using',
    'assigned': 'Assigned',
    'active': 'Using',
    'current': 'Using',

    // Replacement variations
    'replacement': 'Replacement',
    'repl': 'Replacement',
    'queued': 'Replacement',
    'in queue': 'Replacement',
    'assigned for replacement': 'Replacement',
    'assignedforreplacement': 'Replacement',

    // Not Assigned variations
    'not assigned': 'Not Assigned',
    'notassigned': 'Not Assigned',
    'unassigned': 'Not Assigned',
    'available': 'Not Assigned',
    'none': 'Not Assigned',
};

const CATEGORY_ALIASES: Record<string, string> = {
    // Plush variations
    'plush': 'Plush',
    'plushy': 'Plush',
    'plushies': 'Plush',
    'plushie': 'Plush',
    'stuffed': 'Plush',
    'stuffed animal': 'Plush',
    'stuffed toy': 'Plush',

    // Capsule variations
    'capsule': 'Capsule',
    'capsules': 'Capsule',
    'gacha': 'Capsule',
    'gachapon': 'Capsule',

    // Figure variations
    'figure': 'Figure',
    'figures': 'Figure',
    'figurine': 'Figure',
    'figurines': 'Figure',
    'statue': 'Figure',
};

// =============================================================================
// CORE NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Normalizes a string for comparison by:
 * - Converting to lowercase
 * - Removing extra spaces
 * - Replacing hyphens and underscores with spaces
 * - Trimming whitespace
 */
export function normalizeString(input: string | undefined | null): string {
    if (!input) return '';
    return input
        .toLowerCase()
        .trim()
        .replace(/[-_]/g, ' ')  // Replace hyphens/underscores with spaces
        .replace(/\s+/g, ' ');   // Collapse multiple spaces
}

/**
 * Check if two strings are equivalent (ignoring case, hyphens, spaces)
 */
export function stringsMatch(
    a: string | undefined | null,
    b: string | undefined | null
): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return normalizeString(a) === normalizeString(b);
}

/**
 * Normalize a value using domain-specific aliases
 */
export function normalizeValue(
    input: string | undefined | null,
    domain: NormalizationDomain
): string {
    if (!input) return '';

    const normalized = normalizeString(input);

    switch (domain) {
        case 'size':
            return SIZE_ALIASES[normalized] || input;
        case 'status':
            return STATUS_ALIASES[normalized] || input;
        case 'category':
            return CATEGORY_ALIASES[normalized] || input;
        case 'location':
            // For locations, just normalize but don't alias
            return input.trim();
        default:
            return input;
    }
}

/**
 * Check if two values match within a specific domain
 */
export function valuesMatch(
    a: string | undefined | null,
    b: string | undefined | null,
    domain: NormalizationDomain
): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;

    const normalizedA = normalizeValue(a, domain);
    const normalizedB = normalizeValue(b, domain);

    return normalizedA === normalizedB;
}

// =============================================================================
// SIZE-SPECIFIC FUNCTIONS
// =============================================================================

/**
 * Get the canonical size name for any size input
 */
export function getCanonicalSize(size: string | undefined | null): CanonicalSize | null {
    if (!size) return null;
    const normalized = normalizeString(size);
    return SIZE_ALIASES[normalized] || null;
}

/**
 * Check if two sizes are equal (handles all variations)
 */
export function sizesAreEqual(
    size1: string | undefined | null,
    size2: string | undefined | null
): boolean {
    if (!size1 && !size2) return true;
    if (!size1 || !size2) return false;

    const canonical1 = getCanonicalSize(size1);
    const canonical2 = getCanonicalSize(size2);

    // If both have canonical forms, compare them
    if (canonical1 && canonical2) {
        return canonical1 === canonical2;
    }

    // Fallback to normalized string comparison
    return normalizeString(size1) === normalizeString(size2);
}

/**
 * Check if a machine size and item size are compatible
 * - Small and Extra-Small are interchangeable
 * - Exact matches are always compatible
 */
export function areSizesCompatible(
    machineSize: string | undefined | null,
    itemSize: string | undefined | null
): boolean {
    // If either is missing, consider compatible (no restriction)
    if (!machineSize || !itemSize) return true;

    const machineCanonical = getCanonicalSize(machineSize);
    const itemCanonical = getCanonicalSize(itemSize);

    // If we can't determine canonical sizes, compare normalized strings
    if (!machineCanonical || !itemCanonical) {
        return normalizeString(machineSize) === normalizeString(itemSize);
    }

    // Exact match
    if (machineCanonical === itemCanonical) return true;

    // Small and Extra-Small are compatible
    const smallSizes: CanonicalSize[] = ['Small', 'Extra-Small'];
    if (smallSizes.includes(machineCanonical) && smallSizes.includes(itemCanonical)) {
        return true;
    }

    return false;
}

/**
 * Get sort priority for size matching (lower = better match)
 * 0 = exact match, 1 = compatible, 2 = incompatible
 */
export function getSizeMatchPriority(
    machineSize: string | undefined | null,
    itemSize: string | undefined | null
): number {
    if (!machineSize || !itemSize) return 1; // No size info

    const machineCanonical = getCanonicalSize(machineSize);
    const itemCanonical = getCanonicalSize(itemSize);

    if (!machineCanonical || !itemCanonical) return 1;

    // Exact match = highest priority
    if (machineCanonical === itemCanonical) return 0;

    // Small/Extra-Small compatible
    const smallSizes: CanonicalSize[] = ['Small', 'Extra-Small'];
    if (smallSizes.includes(machineCanonical) && smallSizes.includes(itemCanonical)) {
        return 1;
    }

    return 2; // Incompatible
}

/**
 * Get the display name for a size (canonical form)
 */
export function getSizeDisplayName(size: string | undefined | null): string {
    if (!size) return 'Unknown';
    return getCanonicalSize(size) || size;
}

/**
 * Check if a size input is valid/recognized
 */
export function isValidSize(size: string | undefined | null): boolean {
    if (!size) return false;
    return getCanonicalSize(size) !== null;
}

// =============================================================================
// UTILITY EXPORTS FOR COMMON USE CASES
// =============================================================================

/**
 * Quick check: do these sizes represent the same thing?
 * Handles: "Extra-Small" === "Extra Small" === "xs" === "XS"
 */
export const isSameSize = sizesAreEqual;

/**
 * Quick check: can this item go in this machine slot?
 */
export const canItemFitMachine = areSizesCompatible;
