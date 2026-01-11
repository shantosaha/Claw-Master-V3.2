import { createFirestoreService } from "./firestoreService";
import { MachineRevenueReading } from "@/types";
import { where, orderBy, query, getDocs } from "firebase/firestore";
import { generateId } from "@/lib/utils";

const baseService = createFirestoreService<MachineRevenueReading>("machineRevenueReadings");

export const machineRevenueService = {
    ...baseService,

    async getReadings(machineId: string, startDate: Date, endDate: Date): Promise<MachineRevenueReading[]> {
        try {
            // Use the exposed query method from baseService
            const readings = await baseService.query(
                where("machineId", "==", machineId),
                orderBy("date", "desc")
            );

            // Local filter for date range
            return readings.filter(r => {
                const d = new Date(r.date);
                return d >= startDate && d <= endDate;
            });
        } catch (error) {
            console.error("Error fetching machine revenue readings:", error);
            return [];
        }
    },

    /**
     * Get revenue readings by item ID (for item-attributed revenue)
     */
    async getReadingsByItem(itemId: string, startDate?: Date, endDate?: Date): Promise<MachineRevenueReading[]> {
        try {
            const readings = await baseService.query(
                where("itemId", "==", itemId),
                orderBy("date", "desc")
            );

            if (startDate && endDate) {
                return readings.filter(r => {
                    const d = new Date(r.date);
                    return d >= startDate && d <= endDate;
                });
            }

            return readings;
        } catch (error) {
            console.error("Error fetching item revenue readings:", error);
            return [];
        }
    },

    /**
     * Get revenue readings by slot ID
     */
    async getReadingsBySlot(slotId: string, startDate?: Date, endDate?: Date): Promise<MachineRevenueReading[]> {
        try {
            const readings = await baseService.query(
                where("slotId", "==", slotId),
                orderBy("date", "desc")
            );

            if (startDate && endDate) {
                return readings.filter(r => {
                    const d = new Date(r.date);
                    return d >= startDate && d <= endDate;
                });
            }

            return readings;
        } catch (error) {
            console.error("Error fetching slot revenue readings:", error);
            return [];
        }
    },

    /**
     * Calculate total revenue attributed to an item across all machines
     */
    async getItemTotalRevenue(itemId: string, startDate?: Date, endDate?: Date): Promise<{ revenue: number; playCount: number }> {
        const readings = await this.getReadingsByItem(itemId, startDate, endDate);

        return readings.reduce((acc, r) => ({
            revenue: acc.revenue + r.revenue,
            playCount: acc.playCount + r.playCount,
        }), { revenue: 0, playCount: 0 });
    },

    // Dev Helper: Simulate data with optional slotId and itemId
    async generateSimulatedReadings(
        machineId: string,
        startDate: Date,
        endDate: Date,
        slotId?: string,
        itemId?: string
    ) {
        const readings: MachineRevenueReading[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            // Random revenue between $50 and $200 with some variation
            const isWeekend = current.getDay() === 0 || current.getDay() === 6;
            const baseRevenue = isWeekend ? 150 : 80;
            const randomVar = Math.floor(Math.random() * 50);

            const revenue = baseRevenue + randomVar;
            const playCount = Math.floor(revenue / 2); // Avg $2 per play

            const reading: MachineRevenueReading = {
                id: generateId(),
                machineId,
                slotId,
                itemId,
                date: current.toISOString().split('T')[0],
                revenue,
                playCount,
                source: 'api',
                createdAt: new Date()
            };

            // Add to firestore
            await baseService.add(reading);
            readings.push(reading);

            current.setDate(current.getDate() + 1);
        }
        return readings;
    }
};
