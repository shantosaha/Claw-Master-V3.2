/**
 * Seed data for MachineType lookup table
 * Run this once to populate the machineTypes collection
 */

import { MachineType } from "@/types";

export const MACHINE_TYPE_SEED_DATA: Omit<MachineType, 'createdAt' | 'updatedAt'>[] = [
    {
        id: "trend_catcher",
        name: "Trend Catcher",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Small", "Extra Small"],
        hasTopBottom: true,
        defaultPricing: {
            cardCashPlayPrice: 2.40,
            cardTokenPlayPrice: 2.00,
        },
        isActive: true,
    },
    {
        id: "doll_castle",
        name: "Doll Castle",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Large"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 3.20,
            cardTokenPlayPrice: 3.00,
        },
        isActive: true,
    },
    {
        id: "doll_house",
        name: "Doll House",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Large"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 3.20,
            cardTokenPlayPrice: 3.00,
        },
        isActive: true,
    },
    {
        id: "crazy_toy_nano",
        name: "Crazy Toy Nano",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Medium"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 2.80,
            cardTokenPlayPrice: 2.50,
        },
        isActive: true,
    },
    {
        id: "crazy_star",
        name: "Crazy Star",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Medium"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 2.80,
            cardTokenPlayPrice: 2.50,
        },
        isActive: true,
    },
    {
        id: "crazy_toy_miya",
        name: "Crazy Toy Miya",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Small"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 2.40,
            cardTokenPlayPrice: 2.00,
        },
        isActive: true,
    },
    {
        id: "the_big_claw",
        name: "The Big Claw",
        manufacturer: "Unknown",
        defaultSlotCount: 1,
        compatiblePrizeSizes: ["Large", "Big"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 3.50,
            cardTokenPlayPrice: 3.00,
        },
        isActive: true,
    },
    {
        id: "innis",
        name: "Innis",
        manufacturer: "Unknown",
        defaultSlotCount: 4,
        compatiblePrizeSizes: ["Small"],
        hasTopBottom: false,
        defaultPricing: {
            cardCashPlayPrice: 1.80,
            cardTokenPlayPrice: 1.50,
        },
        isActive: true,
    },
];

/**
 * Seed the machineTypes collection
 */
export async function seedMachineTypes(
    machineTypeService: { add: (data: MachineType) => Promise<MachineType> }
): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const typeData of MACHINE_TYPE_SEED_DATA) {
        try {
            await machineTypeService.add({
                ...typeData,
                createdAt: now,
                updatedAt: now,
            } as MachineType);
            count++;
            console.log(`[Seed] Created machine type: ${typeData.name}`);
        } catch (err) {
            console.error(`[Seed] Failed to create ${typeData.name}:`, err);
        }
    }

    return count;
}
