import { machineService } from "./index";
import { ArcadeMachine } from "@/types";
import { where } from "firebase/firestore";

const BASE_URL_PROD = "";
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
            // Check if we are in a browser environment to avoid SSR issues with fetch if applicable
            if (typeof window === 'undefined' && typeof fetch === 'undefined') return [];

            const url = `${API_BASE_URL}/game_report?startdate=${startDate}&enddate=${endDate}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`API Error: ${response.status} ${response.statusText}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            // Log as warning to avoid cluttering console with "Failed to fetch" stack traces during dev/offline
            console.warn("Could not fetch game report (Sync skipped):", error instanceof Error ? error.message : String(error));
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

            // Check if machines exist by Tag - get ALL matching machines (handles duplicates like Trend Top/Bottom)
            const existingMachines = await machineService.query(where("tag", "==", tagString));

            const apiStatus = (item.machine_status?.toLowerCase() === 'active' ? 'Online' : 'Offline') as ArcadeMachine['status'];

            if (existingMachines.length > 0) {
                // Update ALL machines with this tag (handles Trend #1 Top, Trend #1 Bottom, etc.)
                for (const existingMachine of existingMachines) {
                    const currentStatus = existingMachine.status || 'Online';

                    // Don't overwrite Maintenance or Error status from API sync - these are manual overrides
                    const isManualStatus = currentStatus === 'Maintenance' || currentStatus === 'Error';

                    const updateData: Partial<ArcadeMachine> = {
                        location: item.Location,
                        group: item.Group,
                        subGroup: item.SubGroup,
                        tag: tagString,
                        status: isManualStatus ? existingMachine.status : apiStatus,
                        playCount: item.StandardPlay || 0,
                        revenue: item.total_revenue || 0,
                        lastSyncedAt: new Date(),
                    };

                    await machineService.update(existingMachine.id, updateData);
                    syncedCount++;
                }
            } else {
                // Create new machine only if none exist with this tag
                const newMachineData = {
                    location: item.Location,
                    group: item.Group,
                    subGroup: item.SubGroup,
                    tag: tagString,
                    status: apiStatus,
                    playCount: item.StandardPlay || 0,
                    revenue: item.total_revenue || 0,
                    lastSyncedAt: new Date(),
                    name: item.Description || "Unknown Machine",
                    assetTag: `TAG-${tagString}`, // Temporary asset tag
                    physicalConfig: 'single' as const,
                    slots: [], // Initialize empty slots
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await machineService.add(newMachineData as Omit<ArcadeMachine, 'id'>);
                createdCount++;
            }
        }

        return { syncedCount, createdCount };
    }
};
