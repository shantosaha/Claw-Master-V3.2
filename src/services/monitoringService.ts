import { machineService } from './index';
import { ArcadeMachine } from '@/types';
import { gameReportApiService } from './gameReportApiService';

export interface MachineStatus {
    id: string;
    assetTag: string;
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
    imageUrl?: string;
    remarks?: string;
    payoutStatus: 'Very High' | 'High' | 'OK' | 'Low' | 'Very Low';
    payoutAccuracy: number; // Percentage: (Target / Actual) * 100
    status: 'online' | 'offline' | 'error' | 'maintenance';
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
            const gameReportData = await gameReportApiService.fetchTodayReport();
            for (const item of gameReportData) {
                const tag = String(item.assetTag || item.tag).trim().toLowerCase();
                if (tag) {
                    gameDataByTag.set(tag, {
                        standard: item.standardPlays || 0,
                        emp: item.empPlays || 0,
                        payouts: item.points || 0
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to fetch game report data for monitoring:', error);
        }

        return machines.map(machine => {
            const machineTag = String(machine.assetTag || '').trim().toLowerCase();
            const stats = gameDataByTag.get(machineTag);
            const playCountToday = stats?.standard || 0;
            const staffPlaysToday = stats?.emp || 0;
            const payoutsToday = stats?.payouts || 0;

            return {
                id: machine.id,
                assetTag: machine.assetTag || '',
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

    private determinePayoutStatus(playsPerPayout: number, target: number): MonitoringReportItem['payoutStatus'] {
        const ratio = playsPerPayout / target;

        if (ratio < 0.5) return 'Very High';
        if (ratio < 0.8) return 'High';
        if (ratio <= 1.3) return 'OK';
        if (ratio <= 1.8) return 'Low';
        return 'Very Low';
    }

    async fetchMonitoringReport(startDate: Date, endDate: Date): Promise<MonitoringReportItem[]> {
        // Fetch real data from Game Report API and combine with machine/settings data

        try {
            const machines = await this.fetchMachineStatuses();

            // Import services
            const { settingsService } = await import('@/services');
            const { gameReportApiService } = await import('@/services/gameReportApiService');

            // Fetch real game report data for the date range
            const gameReportData = await gameReportApiService.fetchAggregatedReport(startDate, endDate);

            // Create a map of assetTag -> game report data
            const gameDataByTag = new Map<string, { standardPlays: number; empPlays: number; points: number; totalRev: number }>();
            for (const item of gameReportData) {
                const tag = String(item.assetTag || item.tag).trim().toLowerCase();
                if (tag) {
                    gameDataByTag.set(tag, {
                        standardPlays: item.standardPlays || 0,
                        empPlays: item.empPlays || 0,
                        points: item.points || 0,
                        totalRev: item.totalRev || 0,
                    });
                }
            }

            // Fetch settings for C1-C4 values
            const allSettings = await settingsService.getAll();

            // Create a map of machineId -> latest settings
            const settingsByMachine = new Map<string, { c1: number; c2: number; c3: number; c4: number; payoutRate: number; imageUrl?: string; staffName?: string; timestamp?: Date }>();

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
                        payoutRate: setting.payoutRate ?? setting.payoutPercentage ?? 0,
                        imageUrl: setting.imageUrl,
                        staffName: setting.setBy,
                        timestamp: new Date(setting.timestamp),
                    });
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

                // Get real game data by matching asset tag
                const machineTag = String(machine.assetTag || '').trim().toLowerCase();
                const gameData = gameDataByTag.get(machineTag);

                const customerPlays = gameData?.standardPlays ?? 0;
                const staffPlays = gameData?.empPlays ?? 0;
                const payouts = gameData?.points ?? 0;

                // Calculate plays per payout
                const playsPerPayout = payouts > 0 ? Math.round((customerPlays + staffPlays) / payouts) : 0;

                // Calculate Payout Accuracy % (Target / Actual)
                const payoutAccuracy = playsPerPayout > 0 && payoutSettings > 0
                    ? Math.round((payoutSettings / playsPerPayout) * 100)
                    : 0;

                // Determine status using the logic
                const payoutStatus = this.determinePayoutStatus(playsPerPayout, payoutSettings);

                return {
                    machineId: machine.id,
                    tag: machine.assetTag || 'N/A',
                    description: machine.name,
                    status: machine.status,
                    customerPlays,
                    staffPlays,
                    payouts,
                    playsPerPayout,
                    payoutSettings,
                    payoutAccuracy,
                    settingsDate: machineSettings?.timestamp || new Date(),
                    staffName: machineSettings?.staffName || 'Unknown',
                    c1,
                    c2,
                    c3,
                    c4,
                    imageUrl: machineSettings?.imageUrl || machine.imageUrl,
                    remarks: undefined,
                    payoutStatus,
                    lastUpdated: new Date()
                };
            });
        } catch (error) {
            console.error("Failed to fetch monitoring report", error);
            return [];
        }
    }
}

export const monitoringService = new MonitoringService();
