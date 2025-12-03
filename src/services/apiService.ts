import { machineService } from "./index";
import { ArcadeMachine } from "@/types";
import { where } from "firebase/firestore";

const BASE_URL_PROD = "https://claw.kokoamusement.com.au";
const BASE_URL_LOCAL = "http://localhost:3001";

// Use production URL by default or env var
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || BASE_URL_PROD;

interface GameReportItem {
    Location: string;
    Group: string;
    SubGroup: string;
    Tag: string | number;
    Description: string;
    StandardPlay: number | null;
    Points: number | null;
    total_revenue: number | null;
    machine_status: string | null;
    last_service_date: string | null;
}

export const apiService = {
    fetchGameReport: async (startDate: string, endDate: string): Promise<GameReportItem[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/game_report?startdate=${startDate}&enddate=${endDate}`);
            if (!response.ok) throw new Error("Failed to fetch game report");
            return await response.json();
        } catch (error) {
            console.error("Error fetching game report:", error);
            return [];
        }
    },

    syncMachines: async (startDate: string, endDate: string) => {
        const reportData = await apiService.fetchGameReport(startDate, endDate);
        let syncedCount = 0;
        let createdCount = 0;

        for (const item of reportData) {
            if (!item.Tag) continue;

            const tagString = String(item.Tag);

            // Check if machine exists by Tag
            const existingMachines = await machineService.query(where("tag", "==", tagString));
            const existingMachine = existingMachines[0];

            const machineData: Partial<ArcadeMachine> = {
                name: item.Description || "Unknown Machine",
                location: item.Location,
                group: item.Group,
                subGroup: item.SubGroup,
                tag: tagString,
                status: (item.machine_status?.toLowerCase() as any) || 'active',
                playCount: item.StandardPlay || 0,
                revenue: item.total_revenue || 0,
                lastSyncedAt: new Date(),
            };

            if (existingMachine) {
                // Update
                await machineService.update(existingMachine.id, machineData);
                syncedCount++;
            } else {
                // Create
                await machineService.add({
                    ...machineData,
                    assetTag: `TAG-${tagString}`, // Temporary asset tag
                    slots: [], // Initialize empty slots
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as any);
                createdCount++;
            }
        }

        return { syncedCount, createdCount };
    }
};
