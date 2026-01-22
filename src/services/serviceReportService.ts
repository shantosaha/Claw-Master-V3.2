import { ServiceReport } from "@/types";
import { appSettingsService } from "./appSettingsService";
import { isCraneMachine } from "@/utils/machineTypeUtils";
import { format } from "date-fns";

class ServiceReportService {
    // In a real app, this would fetch from a database or the JotForm API (if available via proxy)
    // For now, we simulate fetching stored reports
    /**
     * Fetches service reports, optionally filtered by date range
     */
    async getReports(machineId: string, options?: { from?: Date; to?: Date }): Promise<ServiceReport[]> {
        // Get the configured API endpoint
        const apiSettings = await appSettingsService.getApiSettings();

        if (!apiSettings.isEnabled) {
            console.log("[ServiceReport] JotForm API is disabled, using mock data");
            return this.getMockReports();
        }

        // Try to fetch from the local mock API via our Next.js proxy
        try {
            let endpoint = `/api/jotform/${apiSettings.jotformFormId}`;

            // PRODUCTION COMPLIANCE & UNIVERSAL RULE:
            // Always include a 'date' parameter. Default to current LOCAL date if not specified.
            const targetDate = options?.to || new Date();
            const dateStr = format(targetDate, "yyyy-MM-dd");
            endpoint += `?date=${dateStr}`;

            console.log(`[ServiceReport] Fetching from: ${endpoint}`);

            const response = await fetch(endpoint, {
                cache: 'no-store' // Disable caching for fresh data
            });

            if (response.ok) {
                const rawData = await response.json();
                console.log("Data received from API:", rawData);

                // The API returns { status: "success", response: [...] }
                // Extract the actual data array from the nested structure
                let dataArray: any[] = [];
                if (rawData && rawData.response && Array.isArray(rawData.response)) {
                    dataArray = rawData.response;
                } else if (Array.isArray(rawData)) {
                    dataArray = rawData;
                } else if (rawData && !rawData.status) {
                    dataArray = [rawData];
                }

                console.log("Extracted data array length:", dataArray.length);

                if (dataArray.length > 0) {
                    return dataArray.map((item: any, index: number) => {
                        // Very flexible field finder
                        const val = (keys: string[]) => {
                            for (const k of keys) {
                                // Try exact match
                                if (item[k] !== undefined) return item[k];
                                // Try case-insensitive and stripped match
                                const foundKey = Object.keys(item).find(ik =>
                                    ik.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase()
                                );
                                if (foundKey) return item[foundKey];
                            }
                            return undefined;
                        };

                        // Specific mapping based on curl output provided by user
                        // { submissionDate, tag, location, firstName, lastName, payoutSettings, C1...C4, imageUrl[], remarks }

                        // ID generation: no unique ID in response, so composite key
                        const tag = String(val(['tag', 'Tag', 'machineId', 'assetTag']) || "");
                        const dateStr = val(['submissionDate', 'timestamp', 'date', 'CreatedAt', 'Time']) as string;
                        const dateObj = dateStr ? new Date(dateStr) : new Date();

                        const id = val(['id', '_id', 'SubmissionID']) || `${tag}_${dateObj.getTime()}_${Math.floor(Math.random() * 1000)}`;

                        return {
                            id: String(id),
                            machineId: tag || machineId || "unknown",
                            machineName: tag ? `Machine ${tag}` : (String(val(['machineName', 'machine_name', 'Description', 'Name']) || "Unknown Machine")),
                            location: String(val(['location', 'StoreLocation', 'Store']) || "614"),
                            staffName: `${val(['firstName', 'first_name']) || ''} ${val(['lastName', 'last_name']) || ''}`.trim() || String(val(['staffName', 'staff_name', 'Staff']) || "Staff"),
                            c1: Number(val(['C1', 'c1', 'Catch']) || 0),
                            c2: Number(val(['C2', 'c2', 'Top']) || 0),
                            c3: Number(val(['C3', 'c3', 'Move']) || 0),
                            c4: Number(val(['C4', 'c4', 'MaxPower', 'Strength']) || 0),
                            strongTime: Number(val(['timeStrong', 'strongTime', 'strong_time', 'StrongTime']) || 0),
                            weakTime: Number(val(['timeWeak', 'weakTime', 'weak_time', 'WeakTime']) || 0),
                            playPerWin: Number(val(['payoutSettings', 'playsPerWin', 'plays_per_win', 'Target']) || 0),
                            playPrice: Number(val(['playPrice', 'play_price', 'Price']) || 0),
                            inflowSku: tag,
                            remarks: String(val(['remarks', 'notes', 'Review', 'Comment', 'Notes']) || ""),
                            // Handle imageUrl being an array or string
                            imageUrl: Array.isArray(val(['imageUrl', 'image_url', 'Image', 'Photo']))
                                ? val(['imageUrl', 'image_url', 'Image', 'Photo'])[0]
                                : val(['imageUrl', 'image_url', 'Image', 'Photo']) || null,
                            photo1: Array.isArray(val(['photo1', 'Photo', 'TakeaPhoto', 'FileUpload', 'Image']))
                                ? val(['photo1', 'Photo', 'TakeaPhoto', 'FileUpload', 'Image'])[0]
                                : val(['photo1', 'Photo', 'TakeaPhoto', 'FileUpload', 'Image']) || undefined,
                            timestamp: dateObj
                        };
                    });
                }
            } else {
                console.warn("JotForm API returned error status:", response.status);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        }

        // FALLBACK: Only if API fails or returns no data
        console.log("Using fallback mock data");
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock Data Generation
        if (machineId === "GLOBAL_FETCH") {
            // Return a wider range of reports for the global view
            return [
                {
                    id: "rep_001",
                    machineId: "mac_001",
                    machineName: "Panda Claw 1",
                    location: "Burwood",
                    staffName: "John Doe",
                    c1: 25,
                    c2: 15,
                    c3: 10,
                    c4: 30,
                    playPerWin: 20,
                    playPrice: 2,
                    inflowSku: "TAG-101",
                    remarks: "Adjusted C1 strength due to weak grip complaints.",
                    imageUrl: "https://picsum.photos/seed/claw1/200/200",
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
                },
                {
                    id: "rep_002",
                    machineId: "mac_002",
                    machineName: "UFO Catcher 3",
                    location: "Burwood",
                    staffName: "Jane Smith",
                    c1: 25,
                    c2: 15,
                    c3: 10,
                    c4: 30,
                    playPerWin: 20,
                    playPrice: 2,
                    inflowSku: "TAG-105",
                    remarks: "Routine cleaning and sensor check. All good.",
                    imageUrl: "https://picsum.photos/seed/claw2/200/200",
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
                },
                {
                    id: "rep_003",
                    machineId: "mac_003",
                    machineName: "Big Bear 2",
                    location: "Hurstville",
                    staffName: "Mike Lee",
                    c1: 40,
                    c2: 30,
                    c3: 20,
                    c4: 50,
                    playPerWin: 15,
                    playPrice: 2,
                    inflowSku: "TAG-202",
                    reviews: "Customer reported coin jam. Fixed.",
                    imageUrl: "https://picsum.photos/seed/claw3/200/200",
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
                }
            ] as any[];
        }

        return this.getMockReports();
    }

    /**
     * Returns mock data when API is disabled or unavailable
     */
    getMockReports(): ServiceReport[] {
        return [
            {
                id: "rep_001",
                machineId: "mock",
                machineName: "CLAW-001",
                location: "Burwood",
                staffName: "John Doe",
                c1: 25,
                c2: 15,
                c3: 10,
                c4: 30,
                playPerWin: 20,
                playPrice: 2,
                inflowSku: "mock",
                remarks: "Adjusted C1 strength due to weak grip complaints.",
                imageUrl: "https://picsum.photos/seed/claw1/200/200",
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            },
            {
                id: "rep_002",
                machineId: "mock",
                machineName: "CLAW-001",
                location: "Burwood",
                staffName: "Jane Smith",
                c1: 25,
                c2: 15,
                c3: 10,
                c4: 30,
                playPerWin: 20,
                playPrice: 2,
                inflowSku: "mock",
                remarks: "Routine cleaning and sensor check. All good.",
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            }
        ];
    }

    async submitReport(data: FormData | Omit<ServiceReport, "id" | "timestamp">): Promise<boolean> {
        console.log("[ServiceReport] Submitting report...");

        try {
            const isFormData = data instanceof FormData;
            const response = await fetch('/api/jotform/submit', {
                method: 'POST',
                headers: isFormData ? {} : {
                    'Content-Type': 'application/json',
                },
                body: isFormData ? data : JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                console.log("[ServiceReport] Submission successful:", result.message);
                return true;
            } else {
                console.error("[ServiceReport] Submission failed:", result.error);
                throw new Error(result.error || "Submission failed");
            }
        } catch (error) {
            console.error("[ServiceReport] Error submitting report:", error);
            throw error;
        }
    }

    /**
     * Syncs the latest C1-C4 and payout settings from JotForm submissions to machines.
     * For each unique machine tag, finds the most recent submission and updates PlayfieldSettings.
     * @returns Object with sync statistics
     */
    async syncLatestSettingsToMachines(): Promise<{ synced: number; errors: string[] }> {
        const errors: string[] = [];
        let synced = 0;

        try {
            // Import services dynamically to avoid circular dependencies
            const { machineService, settingsService, stockService, itemMachineSettingsService } = await import("@/services");

            // Fetch all reports
            const reports = await this.getReports("GLOBAL_FETCH");
            console.log(`[Sync] Fetched ${reports.length} reports`);

            if (reports.length === 0) {
                console.log("[Sync] No reports to sync");
                return { synced: 0, errors: [] };
            }

            // Fetch all items for stock assignment info
            const items = await stockService.getAll();

            // Sort by timestamp descending to get latest first
            const sortedReports = reports.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Group by tag (inflowSku) and keep only the latest for each
            const latestByTag = new Map<string, ServiceReport>();
            for (const report of sortedReports) {
                const tag = report.inflowSku || report.machineId;
                if (tag && tag !== "unknown" && !latestByTag.has(tag)) {
                    latestByTag.set(tag, report);
                }
            }

            console.log(`[Sync] Found ${latestByTag.size} unique machine tags:`, Array.from(latestByTag.keys()));

            // Get all machines to match tags - only sync settings to crane machines
            const allMachines = await machineService.getAll();
            const machines = allMachines.filter(m => isCraneMachine(m));
            console.log(`[Sync] Found ${machines.length} crane machines (out of ${allMachines.length} total)`);

            // Fetch all current settings once to avoid repeated calls in the loop
            const existingSettings = await settingsService.getAll();
            const allItemSettings = await itemMachineSettingsService.getAll();

            const tagToMachinesMap = new Map<string, { id: string; name: string }[]>();

            for (const machine of machines) {
                const addMachineToTag = (tag: string) => {
                    const existing = tagToMachinesMap.get(tag) || [];
                    tagToMachinesMap.set(tag, [...existing, { id: machine.id, name: machine.name }]);
                };

                if (machine.tag !== undefined) {
                    addMachineToTag(String(machine.tag));
                }
                if (machine.assetTag) {
                    addMachineToTag(machine.assetTag);
                }
            }

            console.log(`[Sync] Machine tag lookup map has ${tagToMachinesMap.size} unique keys`);

            // Track unmatched tags for debugging
            const unmatchedTags: string[] = [];

            // Sync each machine's settings
            for (const [tag, report] of latestByTag) {
                const machinesToUpdate = tagToMachinesMap.get(tag);
                if (!machinesToUpdate || machinesToUpdate.length === 0) {
                    unmatchedTags.push(tag);
                    continue;
                }

                for (const machine of machinesToUpdate) {
                    try {
                        // Get full machine data for assetTag and active stock
                        const fullMachine = machines.find(m => m.id === machine.id);
                        const assetTag = fullMachine?.assetTag || tag;

                        // Find active stock for this machine
                        const machineItems = items.filter((item: any) => item.assignedMachineId === machine.id);
                        const activeItem = machineItems.find((item: any) => item.assignedStatus === 'Assigned');

                        // 0. Check if this specific report has already been synced for this machine
                        const isAlreadySynced = existingSettings.some(s =>
                            (s as any).externalId === report.id && s.machineId === machine.id
                        );

                        if (isAlreadySynced) {
                            console.log(`[Sync] Report ${report.id} already synced for ${machine.name}, skipping history entry.`);
                        } else {
                            // 1. ADD to History (PlayfieldSettings) if new
                            const historyEntry = {
                                machineId: machine.id,
                                machineName: machine.name,
                                assetTag,
                                externalId: report.id, // Track unique source ID
                                c1: isNaN(report.c1) ? undefined : report.c1,
                                c2: isNaN(report.c2) ? undefined : report.c2,
                                c3: isNaN(report.c3) ? undefined : report.c3,
                                c4: isNaN(report.c4) ? undefined : report.c4,
                                strongTime: (report as any).strongTime !== undefined && !isNaN(Number((report as any).strongTime)) ? Number((report as any).strongTime) : undefined,
                                weakTime: (report as any).weakTime !== undefined && !isNaN(Number((report as any).weakTime)) ? Number((report as any).weakTime) : undefined,
                                payoutRate: isNaN(report.playPerWin) ? undefined : report.playPerWin,
                                imageUrl: report.photo1 || report.imageUrl,
                                stockItemId: activeItem?.id,
                                stockItemName: activeItem?.name,
                                timestamp: new Date(),
                                setBy: report.staffName || "JotForm Sync",
                                remarks: report.remarks
                            };

                            await settingsService.add(historyEntry);
                            console.log(`Added history setting for ${machine.name} (tag: ${tag})`);
                        }

                        // 2. UPSERT ItemMachineSettings if active stock exists
                        if (activeItem?.id) {
                            const existingItemSettings = allItemSettings.find(
                                (s: any) => s.itemId === activeItem.id && s.machineId === machine.id
                            );

                            const itemSettingsData = {
                                itemId: activeItem.id,
                                itemName: activeItem.name,
                                machineId: machine.id,
                                machineName: machine.name,
                                c1: isNaN(report.c1) ? undefined : report.c1,
                                c2: isNaN(report.c2) ? undefined : report.c2,
                                c3: isNaN(report.c3) ? undefined : report.c3,
                                c4: isNaN(report.c4) ? undefined : report.c4,
                                strongTime: (report as any).strongTime !== undefined && !isNaN(Number((report as any).strongTime)) ? Number((report as any).strongTime) : undefined,
                                weakTime: (report as any).weakTime !== undefined && !isNaN(Number((report as any).weakTime)) ? Number((report as any).weakTime) : undefined,
                                playPrice: 0, // Preserve or default? (0 means unchanged usually)
                                playPerWin: isNaN(report.playPerWin) ? undefined : report.playPerWin,
                                lastUpdatedBy: "JotForm Sync",
                                lastUpdatedAt: new Date().toISOString(),
                                createdAt: existingItemSettings?.createdAt || new Date().toISOString(),
                            };

                            if (existingItemSettings) {
                                await itemMachineSettingsService.update(existingItemSettings.id, itemSettingsData);
                                console.log(`Updated ItemMachineSettings for ${machine.name} / ${activeItem.name}`);
                            } else {
                                await itemMachineSettingsService.add(itemSettingsData as any);
                                console.log(`Created ItemMachineSettings for ${machine.name} / ${activeItem.name}`);
                            }
                        }

                        synced++;
                    } catch (err) {
                        const errorMsg = `Failed to sync ${machine.name}: ${err}`;
                        console.error(errorMsg);
                        errors.push(errorMsg);
                    }
                }
            }

            if (unmatchedTags.length > 0) {
                console.log(`[Sync] ${unmatchedTags.length} JotForm tags had no matching machine:`, unmatchedTags.slice(0, 10));
            }

            console.log(`[Sync] Complete: ${synced} machines updated`);
        } catch (error) {
            errors.push(`Sync failed: ${error}`);
            console.error("[Sync] Error:", error);
        }

        return { synced, errors };
    }
}

export const serviceReportService = new ServiceReportService();
