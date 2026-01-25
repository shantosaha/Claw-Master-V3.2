import { machineService } from './index';
import { ArcadeMachine } from '@/types';
import { gameReportApiService, GameReportItem } from './gameReportApiService';

export interface MachineStatus {
    id: string;
    assetTag: string;
    tag?: string;     // Numeric tag ID (for Production API matching)
    name: string;
    location: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    lastPing: Date;
    telemetry: {
        playCountToday: number;
        staffPlaysToday: number;
        payoutsToday: number;
        payoutAccuracy: number; // Calculated from settings vs actual
        errorCode?: string;
    };
    imageUrl?: string;
    group?: string;  // Machine group (e.g., "Group 4-Cranes")
    type?: string;   // Machine type (legacy, same as group)
}

export interface MonitoringAlert {
    id: string;
    machineId: string;
    machineName: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
}

export interface MonitoringReportItem {
    machineId: string;
    tag: string;
    description: string;
    customerPlays: number;
    staffPlays: number;
    payouts: number;
    playsPerPayout: number;
    payoutSettings: number; // Target plays per payout
    settingsDate: Date;
    staffName: string; // Who modified settings
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    strongTime?: number;
    weakTime?: number;
    imageUrl?: string;
    remarks?: string;
    payoutStatus: 'Very High' | 'High' | 'OK' | 'Low' | 'Very Low' | 'N/A';
    payoutAccuracy: number; // Percentage: (Target / Actual) * 100
    revenue: number; // Machine revenue (total)
    cashRevenue: number; // Cash portion of revenue
    bonusRevenue: number; // Bonus portion of revenue
    status: 'online' | 'offline' | 'error' | 'maintenance';
    group?: string;
    type?: string;
    lastUpdated?: Date;
}

type MachineStatusCallback = (data: MachineStatus[]) => void;
type AlertCallback = (alerts: MonitoringAlert[]) => void;

class MonitoringService {
    private subscribers: Map<string, MachineStatusCallback> = new Map();
    private alertSubscribers: Map<string, AlertCallback> = new Map();
    private pollingInterval: ReturnType<typeof setInterval> | null = null;
    private lastData: MachineStatus[] = [];
    private alerts: MonitoringAlert[] = [];
    private prefetchedGameData: GameReportItem[] | null = null;

    setPrefetchedGameData(data: GameReportItem[]): void {
        this.prefetchedGameData = data;
        // If we have existing data, we can update it immediately
        if (this.lastData.length > 0) {
            this.poll();
        }
    }

    async fetchMachineStatuses(): Promise<MachineStatus[]> {
        try {
            // Get from machine service
            const machines = await machineService.getAll();
            return await this.transformMachineData(machines);
        } catch (error) {
            console.error('Failed to fetch machine statuses:', error);
            throw error;
        }
    }

    private transformApiData(apiData: Record<string, unknown>[]): MachineStatus[] {
        return apiData.map(item => ({
            id: (item.id as string) || (item.assetTag as string) || String(Date.now()),
            assetTag: (item.assetTag as string) || '',
            name: (item.name as string) || 'Unknown Machine',
            location: (item.location as string) || 'Unknown',
            status: this.determineStatus(item),
            lastPing: new Date((item.lastUpdate as string) || Date.now()),
            telemetry: {
                playCountToday: (item.playsToday as number) || 0,
                staffPlaysToday: (item.staffPlaysToday as number) || 0,
                payoutsToday: (item.payoutsToday as number) || 0,
                payoutAccuracy: (item.payoutAccuracy as number) || 0,
                errorCode: item.errorCode as string | undefined,
            },
        }));
    }

    private async transformMachineData(machines: ArcadeMachine[]): Promise<MachineStatus[]> {
        // Fetch today's game report data for real play counts
        let gameDataByTag = new Map<string, { standard: number; emp: number; payouts: number }>();
        try {
            const gameReportData = this.prefetchedGameData || await gameReportApiService.fetchTodayReport();
            console.log(`[MonitoringService] Game Report items received: ${gameReportData.length}`);

            // Debug: Log first 3 items to see their structure
            if (gameReportData.length > 0) {
                console.log('[MonitoringService] Sample Game Report items:',
                    gameReportData.slice(0, 3).map(item => ({
                        tag: item.tag,
                        assetTag: item.assetTag,
                        description: item.description,
                        standardPlays: item.standardPlays,
                        empPlays: item.empPlays
                    }))
                );
            }

            for (const item of gameReportData) {
                // UNIVERSAL RULE: Always use 'tag' for identification. 
                // Do not use assetTag for data mapping.
                const numericTag = item.tag ? String(item.tag).trim() : null;

                const data = {
                    standard: item.standardPlays || 0,
                    emp: item.empPlays || 0,
                    payouts: item.points || 0
                };

                if (numericTag) {
                    gameDataByTag.set(numericTag, data);
                }
            }

            console.log(`[MonitoringService] gameDataByTag map size: ${gameDataByTag.size}`);
        } catch (error) {
            console.warn('Failed to fetch game report data for monitoring:', error);
        }

        return machines.map((machine, index) => {
            // UNIVERSAL RULE: Always use the machine's 'tag' property for API matching.
            const machineTag = machine.tag ? String(machine.tag).trim() : null;
            const stats = machineTag ? gameDataByTag.get(machineTag) : null;

            // Debug matching status
            if (index < 5) {
                console.log(`[MonitoringService] Machine: "${machine.name}" | Tag: ${machine.tag} | Match: ${!!(machineTag && gameDataByTag.has(machineTag))}`);
            }

            const playCountToday = stats?.standard || 0;
            const staffPlaysToday = stats?.emp || 0;
            const payoutsToday = stats?.payouts || 0;

            return {
                id: machine.id,
                assetTag: machine.assetTag || '',
                tag: machine.tag || '',  // Numeric tag for Production API matching
                name: machine.name,
                location: machine.location,
                status: this.determineStatusFromMachine(machine),
                lastPing: new Date(),
                imageUrl: machine.slots?.[0]?.currentItem?.imageUrl || machine.imageUrl,
                group: machine.group || machine.type,  // Include group for filtering
                type: machine.type || machine.group,   // Include type for backward compat
                telemetry: {
                    playCountToday,
                    staffPlaysToday,
                    payoutsToday,
                    payoutAccuracy: 0, // Will be calculated in report view
                },
            };
        });
    }

    private determineStatus(item: Record<string, unknown>): MachineStatus['status'] {
        if (item.errorCode) return 'error';
        if (item.maintenanceMode) return 'maintenance';
        const lastUpdate = new Date((item.lastUpdate as string) || 0);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (lastUpdate.getTime() < fiveMinutesAgo) return 'offline';
        return 'online';
    }

    private determineStatusFromMachine(machine: ArcadeMachine): MachineStatus['status'] {
        // ArcadeMachine uses capitalized status: 'Online' | 'Offline' | 'Maintenance' | 'Error'
        const statusLower = machine.status.toLowerCase();
        if (statusLower === 'error') return 'error';
        if (statusLower === 'maintenance') return 'maintenance';
        if (statusLower === 'offline') return 'offline';
        return 'online';
    }

    startPolling(intervalMs: number = 300000): void {
        if (this.pollingInterval) return;

        // Initial fetch
        this.poll();

        // Set up interval
        this.pollingInterval = setInterval(() => this.poll(), intervalMs);
    }

    stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    private async poll(): Promise<void> {
        try {
            const data = await this.fetchMachineStatuses();
            this.checkForAlerts(data);
            this.lastData = data;
            this.notifySubscribers(data);
        } catch {
            // Notify error state
            this.alerts.push({
                id: Date.now().toString(),
                machineId: 'system',
                machineName: 'System',
                type: 'error',
                message: 'Failed to fetch machine data',
                timestamp: new Date(),
                acknowledged: false,
            });
            this.notifyAlertSubscribers();
        }
    }

    private checkForAlerts(newData: MachineStatus[]): void {
        for (const machine of newData) {
            const previous = this.lastData.find(m => m.id === machine.id);

            // Check for status changes
            if (previous && previous.status !== machine.status) {
                if (machine.status === 'error' || machine.status === 'offline') {
                    this.alerts.push({
                        id: Date.now().toString() + machine.id,
                        machineId: machine.id,
                        machineName: machine.name,
                        type: machine.status === 'error' ? 'error' : 'warning',
                        message: `Machine ${machine.name} is now ${machine.status}`,
                        timestamp: new Date(),
                        acknowledged: false,
                    });
                }
            }
        }

        this.notifyAlertSubscribers();
    }

    subscribe(id: string, callback: MachineStatusCallback): () => void {
        this.subscribers.set(id, callback);
        // Send current data immediately
        if (this.lastData.length > 0) {
            callback(this.lastData);
        }
        return () => this.subscribers.delete(id);
    }

    subscribeToAlerts(id: string, callback: AlertCallback): () => void {
        this.alertSubscribers.set(id, callback);
        if (this.alerts.length > 0) {
            callback(this.alerts);
        }
        return () => this.alertSubscribers.delete(id);
    }

    private notifySubscribers(data: MachineStatus[]): void {
        this.subscribers.forEach(callback => callback(data));
    }

    private notifyAlertSubscribers(): void {
        this.alertSubscribers.forEach(callback => callback([...this.alerts]));
    }

    acknowledgeAlert(alertId: string): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.notifyAlertSubscribers();
        }
    }

    acknowledgeAllAlerts(): void {
        this.alerts.forEach(a => a.acknowledged = true);
        this.notifyAlertSubscribers();
    }

    clearAcknowledgedAlerts(): void {
        this.alerts = this.alerts.filter(a => !a.acknowledged);
        this.notifyAlertSubscribers();
    }

    getLastData(): MachineStatus[] {
        return this.lastData;
    }

    getAlerts(): MonitoringAlert[] {
        return this.alerts;
    }

    private determinePayoutStatus(playsPerPayout: number, target: number, totalPlays: number): MonitoringReportItem['payoutStatus'] {
        if (target <= 0) return 'N/A';

        // Special handling for 0 payouts
        if (playsPerPayout === 0) {
            // Only flag as "Very Low" if we've exceeded the target by 150% with no wins
            if (totalPlays > target * 1.5) return 'Very Low';

            // Otherwise, insufficient data to determine status
            return 'N/A';
        }

        const ratio = playsPerPayout / target;

        if (ratio < 0.5) return 'Very High';
        if (ratio < 0.8) return 'High';
        if (ratio <= 1.3) return 'OK';
        if (ratio <= 1.7) return 'Low';
        return 'Very Low';
    }

    async fetchMonitoringReport(startDate: Date, endDate: Date): Promise<MonitoringReportItem[]> {
        // Fetch real data from Game Report API and combine with machine/settings data

        try {
            const machines = await this.fetchMachineStatuses();

            // Import services
            const { settingsService } = await import('@/services');
            const { gameReportApiService } = await import('@/services/gameReportApiService');
            const { serviceReportService } = await import('@/services/serviceReportService');

            // Fetch service reports for remarks data (from JotForm)
            let serviceReports: any[] = [];
            try {
                serviceReports = await serviceReportService.getReports('');
            } catch (err) {
                console.warn('[MonitoringService] Failed to fetch service reports for remarks:', err);
            }

            // Create a map of machineId/tag -> latest remarks
            const remarksByTag = new Map<string, string>();
            for (const report of serviceReports) {
                const tag = String(report.inflowSku || report.machineId || '').trim();
                if (tag && report.remarks && !remarksByTag.has(tag)) {
                    remarksByTag.set(tag, report.remarks);
                }
            }

            // Fetch real game report data for the date range
            const gameReportData = await gameReportApiService.fetchAggregatedReport(startDate, endDate);

            // Create a map of tag -> game report data (support both Production and Local)
            // IMPORTANT: Aggregate data from multiple days when a date range is selected
            const gameDataByTag = new Map<string, {
                standardPlays: number;
                empPlays: number;
                points: number;
                totalRev: number;
                cashDebit: number;
                cashDebitBonus: number;
                c1?: number;
                c2?: number;
                c3?: number;
                c4?: number;
                payoutSettings?: number;
                strongTime?: number;
                weakTime?: number;
                imageUrl?: string;
                remarks?: string;
                staffName?: string;
                timestamp?: Date;
            }>();

            for (const item of gameReportData) {
                // UNIVERSAL RULE: Always use 'tag' for identification.
                // Do not use assetTag for data mapping.
                const numericTag = item.tag ? String(item.tag).trim() : null;

                // Field name helper for various API formats
                const val = (keys: string[]) => {
                    const obj = item as any;
                    for (const k of keys) {
                        if (obj[k] !== undefined) return obj[k];
                        const foundKey = Object.keys(obj).find(ik =>
                            ik.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase()
                        );
                        if (foundKey) return obj[foundKey];
                    }
                    return undefined;
                };

                // Helper to ensure we get a valid number
                const safeNum = (v: any) => {
                    const n = Number(v);
                    return isNaN(n) ? 0 : n;
                };

                const newData = {
                    standardPlays: safeNum(item.standardPlays || val(['standardPlays', 'StandardPlay', 'plays']) || 0),
                    empPlays: safeNum(item.empPlays || val(['empPlays', 'EmpPlay', 'staff_plays']) || 0),
                    points: safeNum(item.merchandise || item.points || val(['merchandise', 'points', 'wins']) || 0),
                    totalRev: safeNum(item.totalRev || val(['totalRev', 'total_revenue', 'revenue']) || 0),
                    cashDebit: safeNum(item.cashDebit || val(['cashDebit', 'cash_debit', 'cash']) || 0),
                    cashDebitBonus: safeNum(item.cashDebitBonus || val(['cashDebitBonus', 'cash_bonus', 'bonus']) || 0),
                    // Pull settings if present in API response
                    c1: val(['C1', 'c1']) !== undefined ? safeNum(val(['C1', 'c1'])) : undefined,
                    c2: val(['C2', 'c2']) !== undefined ? safeNum(val(['C2', 'c2'])) : undefined,
                    c3: val(['C3', 'c3']) !== undefined ? safeNum(val(['C3', 'c3'])) : undefined,
                    c4: val(['C4', 'c4']) !== undefined ? safeNum(val(['C4', 'c4'])) : undefined,
                    payoutSettings: val(['payoutSettings', 'playPerWin', 'Target']) !== undefined ? safeNum(val(['payoutSettings', 'playPerWin', 'Target'])) : undefined,
                    strongTime: val(['timeStrong', 'strongTime']) !== undefined ? safeNum(val(['timeStrong', 'strongTime'])) : undefined,
                    weakTime: val(['timeWeak', 'weakTime']) !== undefined ? safeNum(val(['timeWeak', 'weakTime'])) : undefined,
                    imageUrl: val(['imageUrl', 'image_url', 'image']),
                    remarks: val(['remarks', 'notes', 'comment']),
                    staffName: val(['firstName', 'lastName']) !== undefined ? `${val(['firstName', 'first_name']) || ''} ${val(['lastName', 'last_name']) || ''}`.trim() : val(['staffName', 'staff_name', 'staff']),
                    timestamp: val(['submissionDate', 'timestamp', 'date']) ? new Date(val(['submissionDate', 'timestamp', 'date'])) : undefined
                };

                // Helper function to aggregate data
                const aggregateToMap = (key: string) => {
                    const existing = gameDataByTag.get(key);
                    if (existing) {
                        gameDataByTag.set(key, {
                            ...existing,
                            standardPlays: existing.standardPlays + newData.standardPlays,
                            empPlays: existing.empPlays + newData.empPlays,
                            points: existing.points + newData.points,
                            totalRev: existing.totalRev + newData.totalRev,
                            cashDebit: existing.cashDebit + newData.cashDebit,
                            cashDebitBonus: existing.cashDebitBonus + newData.cashDebitBonus,
                            // Settings (take latest/existing if available)
                            c1: newData.c1 ?? existing.c1,
                            c2: newData.c2 ?? existing.c2,
                            c3: newData.c3 ?? existing.c3,
                            c4: newData.c4 ?? existing.c4,
                            payoutSettings: newData.payoutSettings ?? existing.payoutSettings,
                            strongTime: newData.strongTime ?? existing.strongTime,
                            weakTime: newData.weakTime ?? existing.weakTime,
                            imageUrl: newData.imageUrl || existing.imageUrl,
                            remarks: newData.remarks || existing.remarks,
                            staffName: newData.staffName || existing.staffName,
                            timestamp: newData.timestamp || existing.timestamp
                        });
                    } else {
                        gameDataByTag.set(key, { ...newData });
                    }
                };

                if (numericTag) {
                    aggregateToMap(numericTag);
                }
            }

            // Fetch settings for C1-C4 values
            const allSettings = await settingsService.getAll();

            // Create a map of machineId -> latest settings
            const settingsByMachine = new Map<string, { c1: number; c2: number; c3: number; c4: number; strongTime?: number; weakTime?: number; payoutRate: number; imageUrl?: string; staffName?: string; timestamp?: Date; remarks?: string }>();

            const sortedSettings = [...allSettings].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            for (const setting of sortedSettings) {
                if (!settingsByMachine.has(setting.machineId)) {
                    settingsByMachine.set(setting.machineId, {
                        c1: setting.c1 ?? setting.strengthSetting ?? 0,
                        c2: setting.c2 ?? 0,
                        c3: setting.c3 ?? 0,
                        c4: setting.c4 ?? 0,
                        strongTime: (setting as any).strongTime,
                        weakTime: (setting as any).weakTime,
                        payoutRate: Number(setting.payoutRate ?? setting.payoutPercentage ?? 0),
                        imageUrl: setting.imageUrl,
                        staffName: setting.setBy,
                        timestamp: new Date(setting.timestamp),
                        remarks: setting.remarks,
                    });
                }
            }

            // Also integrate data from service reports for any missing settings or more recent updates
            for (const report of serviceReports) {
                const tag = String(report.inflowSku || report.machineId || '').trim();
                // FIX: Use filter instead of find to handle multiple machines with same tag (e.g. Trend Top/Bottom)
                const matchingMachines = machines.filter(m =>
                    (m as any).tag && String((m as any).tag).trim() === tag ||
                    m.id === report.machineId ||
                    m.assetTag === tag
                );

                for (const machine of matchingMachines) {
                    const existing = settingsByMachine.get(machine.id);
                    // Only override if more recent or missing
                    if (!existing || new Date(report.timestamp).getTime() > existing.timestamp!.getTime()) {
                        settingsByMachine.set(machine.id, {
                            c1: report.c1 ?? 0,
                            c2: report.c2 ?? 0,
                            c3: report.c3 ?? 0,
                            c4: report.c4 ?? 0,
                            strongTime: report.strongTime,
                            weakTime: report.weakTime,
                            payoutRate: report.playPerWin ?? 0,
                            imageUrl: report.imageUrl,
                            staffName: report.staffName,
                            timestamp: new Date(report.timestamp),
                            remarks: report.remarks
                        });
                    }
                }
            }

            return machines.map(machine => {
                // Get real settings if available
                const machineSettings = settingsByMachine.get(machine.id);
                const c1 = machineSettings?.c1 ?? 0;
                const c2 = machineSettings?.c2 ?? 0;
                const c3 = machineSettings?.c3 ?? 0;
                const c4 = machineSettings?.c4 ?? 0;
                const payoutSettings = machineSettings?.payoutRate ?? 0;

                // UNIVERSAL RULE: Always use 'tag' for mapping API data
                const machineTag = (machine as any).tag ? String((machine as any).tag).trim() : null;
                const gameData = machineTag ? gameDataByTag.get(machineTag) : null;

                const safeNum = (v: any) => {
                    const n = Number(v);
                    return isNaN(n) ? 0 : n;
                };

                const customerPlays = safeNum(gameData?.standardPlays ?? 0);
                const staffPlays = safeNum(gameData?.empPlays ?? 0);
                const payouts = safeNum(gameData?.points ?? 0);

                // Decide revenue multiplier based on group
                const isCrane = machine.group?.toLowerCase().includes('crane') ||
                    machine.type?.toLowerCase().includes('crane') ||
                    (machine.group && machine.group.includes('Group 4'));
                const multiplier = isCrane ? 3.6 : 1.8;
                // Calculate plays per payout - protected against NaN
                const playsPerPayout = payouts > 0 ? Math.round((customerPlays + staffPlays) / payouts) : 0;

                // Calculate Payout Accuracy % (Target / Actual)
                const payoutAccuracy = playsPerPayout > 0 && payoutSettings > 0
                    ? Math.round((payoutSettings / playsPerPayout) * 100)
                    : 0;

                // Determine settings source for this machine (Game Data might have newer info in some environments)
                const c1Final = gameData?.c1 ?? c1;
                const c2Final = gameData?.c2 ?? c2;
                const c3Final = gameData?.c3 ?? c3;
                const c4Final = gameData?.c4 ?? c4;
                const payoutSettingsFinal = gameData?.payoutSettings ?? payoutSettings;
                const strongTimeFinal = gameData?.strongTime ?? machineSettings?.strongTime;
                const weakTimeFinal = gameData?.weakTime ?? machineSettings?.weakTime;
                const settingsDateFinal = gameData?.timestamp || machineSettings?.timestamp || new Date();
                const staffNameFinal = gameData?.staffName || machineSettings?.staffName || 'Unknown';
                const imageUrlFinal = gameData?.imageUrl || machineSettings?.imageUrl || machine.imageUrl;

                // Determine status using the logic
                const totalPlays = customerPlays + staffPlays;
                const payoutStatus = this.determinePayoutStatus(playsPerPayout, payoutSettings, totalPlays);

                // Revenue breakdown from API data
                const cashRevenue = gameData?.cashDebit ?? 0;
                const bonusRevenue = gameData?.cashDebitBonus ?? 0;
                const totalRevenue = (gameData?.totalRev || (cashRevenue + bonusRevenue));

                return {
                    machineId: machine.id,
                    tag: (machine as any).tag || 'N/A',
                    description: machine.name,
                    status: machine.status,
                    customerPlays,
                    staffPlays,
                    payouts,
                    playsPerPayout,
                    payoutSettings: payoutSettingsFinal,
                    payoutAccuracy,
                    settingsDate: settingsDateFinal,
                    staffName: staffNameFinal,
                    c1: c1Final,
                    c2: c2Final,
                    c3: c3Final,
                    c4: c4Final,
                    strongTime: strongTimeFinal,
                    weakTime: weakTimeFinal,
                    imageUrl: imageUrlFinal,
                    remarks: (machineTag ? (remarksByTag.get(machineTag) || gameData?.remarks) : undefined) || machineSettings?.remarks,
                    payoutStatus,
                    revenue: totalRevenue,
                    cashRevenue,
                    bonusRevenue,
                    group: machine.group,
                    type: machine.type,
                    lastUpdated: new Date()
                };
            });
        } catch (error) {
            console.error("Failed to fetch monitoring report", error);
            return [];
        }
    }

    /**
     * Fetch daily trend data for the last N days
     * Returns aggregated totals per day for charting
     */
    async fetchDailyTrend(days: number = 7, tags?: string[]): Promise<{
        date: string;
        name: string;
        totalPlays: number;
        customerPlays: number;
        staffPlays: number;
        revenue: number;
        cashRevenue: number;
        bonusRevenue: number;
        payouts: number;
    }[]> {
        try {
            const { gameReportApiService } = await import('@/services/gameReportApiService');
            const { subDays, format } = await import('date-fns');

            const endDate = new Date();
            const results: {
                date: string;
                name: string;
                totalPlays: number;
                customerPlays: number;
                staffPlays: number;
                revenue: number;
                cashRevenue: number;
                bonusRevenue: number;
                payouts: number;
            }[] = [];

            // Convert tags to a Set for faster lookup
            const tagSet = tags ? new Set(tags.map(t => String(t).trim())) : null;

            // Fetch each day's data
            for (let i = days - 1; i >= 0; i--) {
                const date = subDays(endDate, i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const displayName = format(date, 'MMM d');

                try {
                    let dayData = await gameReportApiService.fetchDailyReport(date);

                    // Filter by tags if provided
                    if (tagSet) {
                        dayData = dayData.filter(item => {
                            const itemTag = item.tag ? String(item.tag).trim() : null;
                            return itemTag && tagSet.has(itemTag);
                        });
                    }

                    // Aggregate machines for this day
                    const totalPlays = dayData.reduce((sum, item) => sum + (Number(item.standardPlays) || 0) + (Number(item.empPlays) || 0), 0);
                    const customerPlays = dayData.reduce((sum, item) => sum + (Number(item.standardPlays) || 0), 0);
                    const staffPlays = dayData.reduce((sum, item) => sum + (Number(item.empPlays) || 0), 0);

                    const cashRevenue = dayData.reduce((sum, item) => sum + (Number(item.cashDebit || item.cashRev) || 0), 0);
                    const bonusRevenue = dayData.reduce((sum, item) => sum + (Number(item.cashDebitBonus || item.bonusRev) || 0), 0);
                    const revenue = dayData.reduce((sum, item) => {
                        const machineCash = Number(item.cashDebit || item.cashRev || 0);
                        const machineBonus = Number(item.cashDebitBonus || item.bonusRev || 0);
                        return sum + (Number(item.totalRev) || (machineCash + machineBonus));
                    }, 0);

                    // UNIVERSAL RULE: Wins/Payouts only count for Crane/Claw machines
                    const payouts = dayData.reduce((sum, item) => {
                        const isCrane = item.group?.toLowerCase().includes('crane') ||
                            item.group?.includes('Group 4');
                        return sum + (isCrane ? (item.points || item.merchandise || 0) : 0);
                    }, 0);

                    results.push({
                        date: dateStr,
                        name: displayName,
                        totalPlays,
                        customerPlays,
                        staffPlays,
                        revenue,
                        cashRevenue,
                        bonusRevenue,
                        payouts,
                    });
                } catch (err) {
                    console.warn(`[MonitoringService] Failed to fetch data for ${dateStr}:`, err);
                    // Push zero data for failed days
                    results.push({
                        date: dateStr,
                        name: displayName,
                        totalPlays: 0,
                        customerPlays: 0,
                        staffPlays: 0,
                        revenue: 0,
                        cashRevenue: 0,
                        bonusRevenue: 0,
                        payouts: 0,
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('[MonitoringService] Failed to fetch daily trend:', error);
            return [];
        }
    }
}

export const monitoringService = new MonitoringService();
