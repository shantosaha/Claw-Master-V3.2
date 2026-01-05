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

    // Dev Helper: Simulate data
    async generateSimulatedReadings(machineId: string, startDate: Date, endDate: Date) {
        const readings: MachineRevenueReading[] = [];
        const current = new Date(startDate);

        // Remove existing readings for this period to avoid duplicates? 
        // For simplicity, we just add. API would usually be upsert.

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
