import { machineService } from './index';
import { ArcadeMachine } from '@/types';

export interface MachineStatus {
    id: string;
    assetTag: string;
    name: string;
    location: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    lastPing: Date;
    telemetry: {
        voltage: number;
        playCountToday: number;
        winRate: number;
        temperature?: number;
        errorCode?: string;
    };
    imageUrl?: string;
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
            return this.transformMachineData(machines);
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
                voltage: (item.voltage as number) || 0,
                playCountToday: (item.playsToday as number) || Math.floor(Math.random() * 100),
                winRate: (item.winRate as number) || Math.floor(Math.random() * 30) + 10,
                temperature: item.temperature as number | undefined,
                errorCode: item.errorCode as string | undefined,
            },
        }));
    }

    private transformMachineData(machines: ArcadeMachine[]): MachineStatus[] {
        return machines.map(machine => ({
            id: machine.id,
            assetTag: machine.assetTag || '',
            name: machine.name,
            location: machine.location,
            status: this.determineStatusFromMachine(machine),
            lastPing: new Date(),
            imageUrl: machine.slots?.[0]?.currentItem?.imageUrl,
            telemetry: {
                voltage: 115 + Math.random() * 10,
                playCountToday: Math.floor(Math.random() * 150),
                winRate: Math.floor(Math.random() * 30) + 10,
            },
        }));
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

    startPolling(intervalMs: number = 30000): void {
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

            // Check for low voltage
            if (machine.telemetry.voltage < 100 && machine.telemetry.voltage > 0) {
                const existingAlert = this.alerts.find(
                    a => a.machineId === machine.id && a.message.includes('voltage')
                );
                if (!existingAlert) {
                    this.alerts.push({
                        id: Date.now().toString() + machine.id + 'voltage',
                        machineId: machine.id,
                        machineName: machine.name,
                        type: 'warning',
                        message: `Low voltage detected: ${machine.telemetry.voltage.toFixed(1)}V`,
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
        // In a real implementation, this would likely be an aggregated backend call.
        // For now, we will simulate this aggregation by fetching machines and combining with mock stats.

        try {
            const machines = await this.fetchMachineStatuses();

            return machines.map(machine => {
                // Simulate data based on machine hash/id for consistency
                const seed = machine.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                const random = (offset: number) => {
                    const x = Math.sin(seed + offset) * 10000;
                    return x - Math.floor(x);
                };

                const customerPlays = Math.floor(random(1) * 500) + 50;
                const payouts = Math.floor(customerPlays / (random(2) * 20 + 10)); // ~1/10 to 1/30 win rate
                const staffPlays = Math.floor(random(3) * 15);
                const payoutSettings = 10 + Math.floor(random(4) * 40); // Target plays

                // Calculate plays per payout
                const playsPerPayout = payouts > 0 ? Math.round((customerPlays + staffPlays) / payouts) : 0;

                // Calculate Payout Accuracy % (Target / Actual)
                // If Actual is 0 (no payouts), accuracy is effectively 0 for now (or handle as special case)
                // Use formula: (Target / Actual) * 100. 
                // Ex: Target 10, Actual 5 => 200%. Target 10, Actual 20 => 50%.
                const payoutAccuracy = playsPerPayout > 0 ? Math.round((payoutSettings / playsPerPayout) * 100) : 0;

                // Determine status using the new logic
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
                    settingsDate: new Date(Date.now() - random(5) * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
                    staffName: ['Daniel Valix', 'Shanto Saha', 'Tommy Wong'][Math.floor(random(6) * 3)],
                    c1: 15 + Math.floor(random(7) * 40),
                    c2: 10 + Math.floor(random(8) * 30),
                    c3: 5 + Math.floor(random(9) * 20),
                    c4: 20 + Math.floor(random(10) * 40),
                    imageUrl: machine.imageUrl,
                    remarks: random(11) > 0.8 ? (random(12) > 0.5 ? "Update settings" : "Low stock") : undefined,
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
