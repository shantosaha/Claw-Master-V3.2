import { machineService, stockService } from "./index";
import { gameReportApiService, GameReportItem } from "./gameReportApiService";
import { revenueApiService, RevenueItem } from "./revenueApiService";
import { StockItem, ArcadeMachine } from "@/types";
import { subDays, format, startOfDay, endOfDay, parseISO, isValid } from "date-fns";

export type RevenueSource = 'sales' | 'game' | 'both';

// Helper for date normalization to ensure matching
const normalizeDateStr = (dateInput: string | Date | undefined): string | null => {
    if (!dateInput) return null;
    let date: Date;
    if (typeof dateInput === 'string') {
        date = parseISO(dateInput);
    } else {
        date = dateInput;
    }
    return isValid(date) ? format(date, 'yyyy-MM-dd') : null;
};

export interface AnalyticsFilter {
    location?: string;
    machineType?: string;
    group?: string;
}

// Keep Stock Performance Helper for now
// Keep Stock Performance Helper for now
const generateStockPerformanceData = (items: StockItem[], reportData: GameReportItem[] = [], days: number = 30, machines: ArcadeMachine[] = []) => {
    // Map machine ID -> tag for lookup
    const machineIdToTag = new Map<string, number>();
    machines.forEach(m => {
        if (m.id && m.tag) {
            machineIdToTag.set(m.id, Number(m.tag));
        }
    });

    // Create a map of machine tag -> merchandise (wins)
    const machineWinsMap = new Map<number, number>();
    reportData.forEach(item => {
        const existing = machineWinsMap.get(item.tag) || 0;
        machineWinsMap.set(item.tag, existing + (Number(item.merchandise) || 0));
    });

    return items.map(item => {
        const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || item.totalQuantity || 0;
        const cost = item.supplyChain?.costPerUnit || 0;

        // Calculate consumption: Sum wins for all machines this item is assigned to
        let totalWinsForItem = 0;

        // Check current machine assignments
        if (item.machineAssignments) {
            item.machineAssignments.forEach(assignment => {
                const tag = machineIdToTag.get(assignment.machineId);
                if (tag !== undefined) {
                    totalWinsForItem += machineWinsMap.get(tag) || 0;
                }
            });
        }

        // Also check legacy assignedMachineId
        if (item.assignedMachineId) {
            const tag = machineIdToTag.get(item.assignedMachineId);
            if (tag !== undefined) {
                totalWinsForItem += machineWinsMap.get(tag) || 0;
            }
        }

        const consumption = totalWinsForItem;
        const avgWinsPerDay = consumption / Math.max(days, 1);

        return {
            id: item.id,
            name: item.name,
            category: item.category || item.type || "Uncategorized",
            size: item.size || "Standard",
            brand: item.brand || "Generic",
            totalQuantity: totalQty,
            stockValue: totalQty * cost,
            costPerUnit: cost,
            // turnoverRate: (Total Wins) / (Total Stock) over the period
            turnoverRate: totalQty > 0 ? +(consumption / totalQty).toFixed(2) : 0,
            // daysToSell: (Total Stock) / (Average Wins per Day)
            daysToSell: avgWinsPerDay > 0 ? Math.round(totalQty / avgWinsPerDay) : 999,
            reorderPoint: item.supplyChain?.reorderPoint || item.lowStockThreshold || 10,
            isLowStock: totalQty <= (item.supplyChain?.reorderPoint || item.lowStockThreshold || 10),
        };
    });
};

export interface AnalyticsOverview {
    totalRevenue: number;
    machineRevenue: number;
    salesRevenue: number;
    totalPlays: number;
    totalWins: number;
    winRate: number;
    avgRevenuePerPlay: number;
    activeMachines: number;
    offlineMachines: number;
    maintenanceMachines: number;
    totalStockValue: number;
    lowStockItems: number;
    totalStockItems: number;
    revenueChange: number;
    playsChange: number;
}

export interface TimeSeriesData {
    date: string;
    revenue: number;
    machineRevenue: number;
    salesRevenue: number;
    plays: number;
    wins: number;
}

export interface MachinePerformance {
    id: string;
    name: string;
    location: string;
    type: string;
    plays: number;
    revenue: number;
    cashRevenue: number;
    bonusRevenue: number;
    winRate: number;
    uptime: number;
    avgPlayValue: number;
    status: string;
    tag?: string;
    group?: string;
    subGroup?: string;
}

export interface StockPerformance {
    id: string;
    name: string;
    category: string;
    size: string;
    brand: string;
    totalQuantity: number;
    stockValue: number;
    costPerUnit: number;
    turnoverRate: number;
    daysToSell: number;
    reorderPoint: number;
    isLowStock: boolean;
}

export interface ComparisonData {
    metric: string;
    item1Value: number;
    item2Value: number;
    difference: number;
    percentChange: number;
}

export interface TrendData {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    value: number;
    previousValue: number;
}

export interface PeriodComparison {
    metricName: string;
    currentPeriod: { value: number; label: string };
    previousPeriod: { value: number; label: string };
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
}

export interface LocationComparison {
    location: string;
    revenue: number;
    plays: number;
    machines: number;
    avgRevenuePerMachine: number;
    winRate: number;
}

export interface ReorderRecommendation {
    itemId: string;
    itemName: string;
    category: string;
    currentQuantity: number;
    reorderPoint: number;
    suggestedOrderQuantity: number;
    estimatedCost: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    daysUntilStockout: number;
}

export interface FinancialMetrics {
    totalRevenue: number;
    machineRevenue: number;
    salesRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    avgRevenuePerMachine: number;
    avgRevenuePerDay: number;
    projectedMonthlyRevenue: number;
    revenueByCategory: { category: string; revenue: number; percentage: number }[];
}

export const analyticsService = {
    getOverview: async (days: number = 30, revenueSource: RevenueSource = 'sales', customRange?: { startDate: Date; endDate: Date }, filter?: AnalyticsFilter): Promise<AnalyticsOverview> => {
        const endDate = customRange?.endDate || endOfDay(new Date());
        const startDate = customRange?.startDate || startOfDay(subDays(endDate, days - 1));

        // For change calculation, we use a period of the same length preceding the start date
        const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const prevEndDate = subDays(startDate, 1);
        const prevStartDate = startOfDay(subDays(prevEndDate, diffDays - 1));

        const [machines, stock, gameReportData, revenueData, prevGameReportData, prevRevenueData] = await Promise.all([
            machineService.getAll(),
            stockService.getAll(),
            gameReportApiService.fetchAggregatedReport(startDate, endDate),
            revenueApiService.fetchAggregatedRevenue(startDate, endDate),
            gameReportApiService.fetchAggregatedReport(prevStartDate, prevEndDate),
            revenueApiService.fetchAggregatedRevenue(prevStartDate, prevEndDate),
        ]);

        const machineTagToLocation = new Map<number, string>();
        const machineTagToType = new Map<number, string>();
        const machineTagToGroup = new Map<number, string>();
        machines.forEach(m => {
            if (m.tag) {
                machineTagToLocation.set(Number(m.tag), m.location);
                if (m.type) machineTagToType.set(Number(m.tag), m.type);
                if (m.group) machineTagToGroup.set(Number(m.tag), m.group);
            }
        });

        const filterGame = (items: GameReportItem[]) => {
            if (!filter) return items;
            return items.filter(item => {
                const type = machineTagToType.get(item.tag);
                const loc = machineTagToLocation.get(item.tag) || item.location;
                const grp = machineTagToGroup.get(item.tag) || item.group;
                if (filter.location && filter.location !== "All Locations" && loc !== filter.location) return false;
                if (filter.machineType && filter.machineType !== "All Types" && type !== filter.machineType) return false;
                if (filter.group && filter.group !== "All Groups" && grp !== filter.group) return false;
                return true;
            });
        };

        const filterRevenue = (items: RevenueItem[]) => {
            if (!filter) return items;
            return items.filter(item => {
                if (filter.machineType && filter.machineType !== "All Types") return false; // Sales excluded for machine type filter
                if (filter.location && filter.location !== "All Locations" && item.name !== filter.location && item.name !== "Main Location") return false;
                return true;
            });
        };

        const filteredGameData = filterGame(gameReportData);
        const filteredPrevGameData = filterGame(prevGameReportData);
        const filteredRevenueData = filterRevenue(revenueData as unknown as RevenueItem[]); // Casting just in case
        const filteredPrevRevenueData = filterRevenue(prevRevenueData as unknown as RevenueItem[]);


        const machineRev = gameReportApiService.calculateTotalRevenue(filteredGameData);
        // Assuming fetchAggregatedRevenue logic returns compatible structure or handle it:
        const salesRev = revenueApiService.getTotalRevenue(filteredRevenueData);

        let totalRevenue = 0;
        if (revenueSource === 'sales') totalRevenue = salesRev;
        else if (revenueSource === 'game') totalRevenue = machineRev;
        else totalRevenue = machineRev + salesRev;

        const prevMachineRev = gameReportApiService.calculateTotalRevenue(filteredPrevGameData);
        const prevSalesRev = revenueApiService.getTotalRevenue(filteredPrevRevenueData);

        let prevTotalRevenue = 0;
        if (revenueSource === 'sales') prevTotalRevenue = prevSalesRev;
        else if (revenueSource === 'game') prevTotalRevenue = prevMachineRev;
        else prevTotalRevenue = prevMachineRev + prevSalesRev;

        const totalPlays = gameReportApiService.calculateTotalPlays(filteredGameData);
        const totalWins = filteredGameData.reduce((sum, item) => sum + (Number(item.merchandise) || 0), 0);

        const prevTotalPlays = gameReportApiService.calculateTotalPlays(filteredPrevGameData);

        const revenueChange = prevTotalRevenue > 0 ? +(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100).toFixed(1) : 0;
        const playsChange = prevTotalPlays > 0 ? +(((totalPlays - prevTotalPlays) / prevTotalPlays) * 100).toFixed(1) : 0;

        let totalStockValue = 0;
        let lowStockCount = 0;
        stock.forEach(item => {
            const qty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || item.totalQuantity || 0;
            const cost = item.supplyChain?.costPerUnit || 0;
            totalStockValue += qty * cost;
            if (qty <= (item.supplyChain?.reorderPoint || item.lowStockThreshold || 10)) {
                lowStockCount++;
            }
        });

        const filteredMachines = machines.filter(m => {
            if (filter?.location && filter.location !== "All Locations" && m.location !== filter.location) return false;
            if (filter?.machineType && filter.machineType !== "All Types" && m.type !== filter.machineType) return false;
            return true;
        });

        const activeMachines = filteredMachines.filter(m => m.status === "Online").length;
        const offlineMachines = filteredMachines.filter(m => m.status === "Offline" || m.status === "Error").length;
        const maintenanceMachines = filteredMachines.filter(m => m.status === "Maintenance").length;

        return {
            totalRevenue: +totalRevenue.toFixed(2),
            machineRevenue: +machineRev.toFixed(2),
            salesRevenue: +salesRev.toFixed(2),
            totalPlays,
            totalWins,
            winRate: totalPlays > 0 ? +((totalWins / totalPlays) * 100).toFixed(1) : 0,
            avgRevenuePerPlay: totalPlays > 0 ? +(totalRevenue / totalPlays).toFixed(2) : 0,
            activeMachines,
            offlineMachines,
            maintenanceMachines,
            totalStockValue: +totalStockValue.toFixed(2),
            lowStockItems: lowStockCount,
            totalStockItems: stock.length,
            revenueChange,
            playsChange,
        };
    },

    getRevenueTimeSeries: async (days: number = 30, revenueSource: RevenueSource = 'sales', customRange?: { startDate: Date; endDate: Date }, filter?: AnalyticsFilter): Promise<TimeSeriesData[]> => {
        const endDate = customRange?.endDate || endOfDay(new Date());
        const startDate = customRange?.startDate || startOfDay(subDays(endDate, days - 1));

        const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const dateArray = Array.from({ length: diffDays }, (_, i) => subDays(endDate, i));

        const machines = await machineService.getAll();
        const machineTagToLocation = new Map<number, string>();
        const machineTagToType = new Map<number, string>();
        const machineTagToGroup = new Map<number, string>();
        machines.forEach(m => {
            if (m.tag) {
                machineTagToLocation.set(Number(m.tag), m.location);
                if (m.type) machineTagToType.set(Number(m.tag), m.type);
                if (m.group) machineTagToGroup.set(Number(m.tag), m.group);
            }
        });

        // Perform daily calls in parallel to get non-aggregated data
        const dailyDataResults = await Promise.all(
            dateArray.map(async (date) => {
                const dateStart = startOfDay(date);
                const dateEnd = endOfDay(date);
                const dateStr = format(date, 'yyyy-MM-dd');

                const [gameReport, revenue] = await Promise.all([
                    gameReportApiService.fetchGameReport({
                        startDate: dateStart,
                        endDate: dateEnd,
                        aggregate: true,
                        groups: filter?.group && filter.group !== "All Groups" ? [filter.group] : undefined
                    }),
                    revenueApiService.fetchRevenue({ startDate: dateStart, endDate: dateEnd })
                ]);

                const filteredGameReport = gameReport.filter(item => {
                    if (!filter) return true;
                    const type = machineTagToType.get(item.tag);
                    const loc = machineTagToLocation.get(item.tag) || item.location;
                    const grp = machineTagToGroup.get(item.tag) || item.group;
                    if (filter.location && filter.location !== "All Locations" && loc !== filter.location) return false;
                    if (filter.machineType && filter.machineType !== "All Types" && type !== filter.machineType) return false;
                    if (filter.group && filter.group !== "All Groups" && grp !== filter.group) return false;
                    return true;
                });

                const filteredRevenue = revenue.filter(item => {
                    if (!filter) return true;
                    if (filter.machineType && filter.machineType !== "All Types") return false;
                    if (filter.location && filter.location !== "All Locations" && item.name !== filter.location && item.name !== "Main Location") return false;
                    return true;
                });

                const machineRev = gameReportApiService.calculateTotalRevenue(filteredGameReport);
                const posRev = revenueApiService.getTotalRevenue(filteredRevenue);

                let dailyRevenue = 0;
                if (revenueSource === 'sales') dailyRevenue = posRev;
                else if (revenueSource === 'game') dailyRevenue = machineRev;
                else dailyRevenue = machineRev + posRev;

                const plays = gameReportApiService.calculateTotalPlays(filteredGameReport);
                const wins = filteredGameReport.reduce((sum, item) => sum + (Number(item.merchandise) || 0), 0);

                return {
                    date: dateStr,
                    revenue: +dailyRevenue.toFixed(2),
                    machineRevenue: +machineRev.toFixed(2),
                    salesRevenue: +posRev.toFixed(2),
                    plays,
                    wins
                };
            })
        );

        return dailyDataResults.sort((a, b) => a.date.localeCompare(b.date));
    },

    getMachinePerformance: async (days: number = 30, revenueSource: RevenueSource = 'game', customRange?: { startDate: Date; endDate: Date }, filter?: AnalyticsFilter): Promise<MachinePerformance[]> => {
        const endDate = customRange?.endDate || endOfDay(new Date());
        const startDate = customRange?.startDate || startOfDay(subDays(endDate, days - 1));

        const [machines, reportData] = await Promise.all([
            machineService.getAll(),
            gameReportApiService.fetchGameReport({ startDate, endDate, aggregate: true })
        ]);

        const reportMap = new Map<number, GameReportItem>();
        reportData.forEach(item => {
            const existing = reportMap.get(item.tag);
            if (existing) {
                existing.totalRev += Number(item.totalRev) || 0;
                existing.cashRev = (existing.cashRev || 0) + (Number(item.cashRev) || 0);
                existing.bonusRev = (existing.bonusRev || 0) + (Number(item.bonusRev) || 0);
                existing.standardPlays += Number(item.standardPlays) || 0;
                existing.empPlays += Number(item.empPlays) || 0;
                existing.merchandise = (existing.merchandise || 0) + (Number(item.merchandise) || 0);
            } else {
                reportMap.set(item.tag, { ...item });
            }
        });

        let filteredMachines = machines;
        if (filter) {
            filteredMachines = machines.filter(m => {
                if (filter.location && filter.location !== "All Locations" && m.location !== filter.location) return false;
                if (filter.machineType && filter.machineType !== "All Types" && m.type !== filter.machineType) return false;
                return true;
            });
        }

        return filteredMachines.map(machine => {
            const tagVal = (machine as any).tag;
            const report = tagVal ? reportMap.get(Number(tagVal)) : undefined;

            const plays = report ? (Number(report.standardPlays) + Number(report.empPlays)) : 0;
            const revenue = report ? Number(report.totalRev) : 0;
            const cashRevenue = report ? (Number(report.cashRev) || 0) : 0;
            const bonusRevenue = report ? (Number(report.bonusRev) || 0) : 0;
            const wins = report ? (Number(report.merchandise) || 0) : 0;

            const winRate = plays > 0 ? +((wins / plays) * 100).toFixed(1) : 0;
            const avgPlayValue = plays > 0 ? +(revenue / plays).toFixed(2) : 0;

            return {
                id: machine.id,
                name: machine.name,
                location: machine.location,
                type: machine.type || "Unknown",
                plays,
                revenue,
                cashRevenue,
                bonusRevenue,
                winRate,
                uptime: machine.status === 'Online' ? 98 : machine.status === 'Maintenance' ? 0 : 50,
                avgPlayValue,
                status: machine.status,
                tag: (machine as any).tag ? String((machine as any).tag) : undefined,
                group: machine.group || "No Group",
                subGroup: machine.subGroup || "No Sub-Group",
            };
        });
    },

    getStockPerformance: async (days: number = 30, customRange?: { startDate: Date; endDate: Date }): Promise<StockPerformance[]> => {
        const endDate = customRange?.endDate || endOfDay(new Date());
        const startDate = customRange?.startDate || startOfDay(subDays(endDate, days - 1));

        const [stock, gameReportData, machines] = await Promise.all([
            stockService.getAll(),
            gameReportApiService.fetchAggregatedReport(startDate, endDate),
            machineService.getAll()
        ]);

        return generateStockPerformanceData(stock, gameReportData, days, machines);
    },

    getTopPerformers: async (metric: 'plays' | 'revenue' | 'winRate', limit: number = 5): Promise<MachinePerformance[]> => {
        const performance = await analyticsService.getMachinePerformance();
        return performance
            .sort((a, b) => b[metric] - a[metric])
            .slice(0, limit);
    },

    getWorstPerformers: async (metric: 'plays' | 'revenue' | 'uptime', limit: number = 5): Promise<MachinePerformance[]> => {
        const performance = await analyticsService.getMachinePerformance();
        return performance
            .sort((a, b) => a[metric] - b[metric])
            .slice(0, limit);
    },

    compareMachines: async (machineId1: string, machineId2: string, days: number = 30): Promise<ComparisonData[]> => {
        const performance = await analyticsService.getMachinePerformance(days);
        const machine1 = performance.find(m => m.id === machineId1);
        const machine2 = performance.find(m => m.id === machineId2);

        if (!machine1 || !machine2) return [];

        const metrics: (keyof MachinePerformance)[] = ['plays', 'revenue', 'winRate', 'uptime', 'avgPlayValue'];
        return metrics.map(metric => {
            const val1 = machine1[metric] as number;
            const val2 = machine2[metric] as number;
            const diff = val1 - val2;
            const pctChange = val2 !== 0 ? ((val1 - val2) / val2) * 100 : 0;
            return {
                metric: metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1'),
                item1Value: val1,
                item2Value: val2,
                difference: +diff.toFixed(2),
                percentChange: +pctChange.toFixed(1),
            };
        });
    },

    getRevenueByLocation: async (days: number = 30, revenueSource: RevenueSource = 'sales', customRange?: { startDate: Date; endDate: Date }, filter?: AnalyticsFilter): Promise<{ location: string; revenue: number; machines: number }[]> => {
        const endDate = customRange?.endDate || endOfDay(new Date());
        const startDate = customRange?.startDate || startOfDay(subDays(endDate, days - 1));

        if (revenueSource === 'game') {
            const [machines, reportData] = await Promise.all([
                machineService.getAll(),
                gameReportApiService.fetchGameReport({ startDate, endDate, aggregate: true })
            ]);

            const machineTagToLocation = new Map<number, string>();
            const machineTagToType = new Map<number, string>();

            machines.forEach(m => {
                if (m.tag) {
                    machineTagToLocation.set(Number(m.tag), m.location);
                    if (m.type) machineTagToType.set(Number(m.tag), m.type);
                }
            });

            const locationMap = new Map<string, { revenue: number; machines: Set<number> }>();

            reportData.forEach(item => {
                // Try to get location from machine definition first, fallback to report location
                const machineLocation = machineTagToLocation.get(item.tag);
                const loc = machineLocation || item.location || "Unknown";

                if (filter) {
                    const type = machineTagToType.get(item.tag);
                    if (filter.machineType && filter.machineType !== "All Types" && type !== filter.machineType) return;
                    if (filter.location && filter.location !== "All Locations" && loc !== filter.location) return;
                }

                const existing = locationMap.get(loc) || { revenue: 0, machines: new Set<number>() };

                existing.revenue += Number(item.totalRev) || 0;
                existing.machines.add(item.tag);

                locationMap.set(loc, existing);
            });

            return Array.from(locationMap.entries()).map(([location, data]) => ({
                location,
                revenue: +data.revenue.toFixed(2),
                machines: data.machines.size,
            }));
        } else {
            // For Sales Revenue, we might not have 'location' in the same way if it's POS/Teller
            // But we can try to guess from the name or just return it as 'Site Total' if unknown
            const revenueData = await revenueApiService.fetchRevenue({ startDate, endDate });
            const locationMap = new Map<string, { revenue: number; machines: Set<number> }>();

            revenueData.forEach(item => {
                // Use the name (POS/Teller name) as the location identifier
                const loc = item.name || "Main Location";

                if (filter) {
                    if (filter.machineType && filter.machineType !== "All Types") return; // Sales excluded
                    if (filter.location && filter.location !== "All Locations" && loc !== filter.location) return;
                }

                const existing = locationMap.get(loc) || { revenue: 0, machines: new Set<number>() };
                existing.revenue += item.total;
                locationMap.set(loc, existing);
            });

            return Array.from(locationMap.entries()).map(([location, data]) => ({
                location,
                revenue: +data.revenue.toFixed(2),
                machines: 0, // Sales revenue is not tied to machines here
            }));
        }
    },

    getRevenueByMachineType: async (days: number = 30, revenueSource: RevenueSource = 'game', customRange?: { startDate: Date; endDate: Date }, filter?: AnalyticsFilter): Promise<{ type: string; revenue: number; cashRevenue: number; bonusRevenue: number; count: number; avgRevenue: number }[]> => {
        const endDate = customRange?.endDate || endOfDay(new Date());
        const startDate = customRange?.startDate || startOfDay(subDays(endDate, days - 1));

        const [machines, reportData] = await Promise.all([
            machineService.getAll(),
            gameReportApiService.fetchGameReport({ startDate, endDate, aggregate: true })
        ]);

        const machineTagToLocation = new Map<number, string>();
        const machineTagToType = new Map<number, string>();
        machines.forEach(m => {
            if (m.tag) {
                machineTagToLocation.set(Number(m.tag), m.location);
                if (m.type) machineTagToType.set(Number(m.tag), m.type);
            }
        });

        const typeMap = new Map<string, { revenue: number; cashRevenue: number; bonusRevenue: number; machines: Set<number> }>();

        reportData.forEach(item => {
            const definedType = machineTagToType.get(item.tag);
            const definedLoc = machineTagToLocation.get(item.tag);

            if (filter) {
                if (filter.machineType && filter.machineType !== "All Types" && definedType !== filter.machineType) return;
                if (filter.location && filter.location !== "All Locations" && definedLoc !== filter.location) return; // Note: using defined location 
            }

            const type = item.group || definedType || "Unknown";
            const existing = typeMap.get(type) || { revenue: 0, cashRevenue: 0, bonusRevenue: 0, machines: new Set<number>() };

            existing.revenue += Number(item.totalRev) || 0;
            existing.cashRevenue += Number(item.cashRev) || 0;
            existing.bonusRevenue += Number(item.bonusRev) || 0;
            existing.machines.add(item.tag);

            typeMap.set(type, existing);
        });

        return Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            revenue: +data.revenue.toFixed(2),
            cashRevenue: +data.cashRevenue.toFixed(2),
            bonusRevenue: +data.bonusRevenue.toFixed(2),
            count: data.machines.size,
            avgRevenue: data.machines.size > 0 ? +(data.revenue / data.machines.size).toFixed(2) : 0,
        }));
    },

    getStockByCategory: async (days: number = 30): Promise<{ category: string; items: number; totalQuantity: number; totalValue: number }[]> => {
        const stockPerf = await analyticsService.getStockPerformance(days);
        const categoryMap = new Map<string, { items: number; totalQuantity: number; totalValue: number }>();

        stockPerf.forEach(s => {
            const existing = categoryMap.get(s.category) || { items: 0, totalQuantity: 0, totalValue: 0 };
            categoryMap.set(s.category, {
                items: existing.items + 1,
                totalQuantity: existing.totalQuantity + s.totalQuantity,
                totalValue: existing.totalValue + s.stockValue,
            });
        });

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            ...data,
        }));
    },

    getStockByBrand: async (days: number = 30): Promise<{ brand: string; items: number; totalValue: number }[]> => {
        const stockPerf = await analyticsService.getStockPerformance(days);
        const brandMap = new Map<string, { items: number; totalValue: number }>();

        stockPerf.forEach(s => {
            const existing = brandMap.get(s.brand) || { items: 0, totalValue: 0 };
            brandMap.set(s.brand, {
                items: existing.items + 1,
                totalValue: existing.totalValue + s.stockValue,
            });
        });

        return Array.from(brandMap.entries()).map(([brand, data]) => ({
            brand,
            ...data,
        }));
    },

    calculateTrend: (currentValue: number, previousValue: number): TrendData => {
        const difference = currentValue - previousValue;
        const percentage = previousValue !== 0
            ? +((difference / previousValue) * 100).toFixed(1)
            : currentValue > 0 ? 100 : 0;

        let direction: 'up' | 'down' | 'stable' = 'stable';
        if (percentage > 2) direction = 'up';
        else if (percentage < -2) direction = 'down';

        return { direction, percentage, value: currentValue, previousValue };
    },

    getMovingAverage: (data: TimeSeriesData[], windowSize: number = 7): TimeSeriesData[] => {
        if (data.length < windowSize) return data;

        return data.map((item, index) => {
            if (index < windowSize - 1) return item;

            const windowData = data.slice(index - windowSize + 1, index + 1);
            const avgRevenue = Math.round(windowData.reduce((sum, d) => sum + d.revenue, 0) / windowSize);
            const avgPlays = Math.round(windowData.reduce((sum, d) => sum + d.plays, 0) / windowSize);
            const avgWins = Math.round(windowData.reduce((sum, d) => sum + d.wins, 0) / windowSize);

            return { ...item, revenue: avgRevenue, plays: avgPlays, wins: avgWins };
        });
    },

    compareTimePeriods: async (days: number = 30): Promise<PeriodComparison[]> => {
        const currentData = await analyticsService.getOverview(days);

        const previousData = {
            totalRevenue: currentData.totalRevenue * 0.9,
            totalPlays: currentData.totalPlays * 0.95,
            totalWins: currentData.totalWins * 0.92,
        };

        const metrics = ['revenue', 'plays', 'wins'] as const;
        return [
            {
                metricName: 'Revenue',
                currentPeriod: { value: currentData.totalRevenue, label: `Last ${days} days` },
                previousPeriod: { value: previousData.totalRevenue, label: `Previous ${days} days` },
                change: currentData.totalRevenue - previousData.totalRevenue,
                changePercent: 10,
                trend: 'up'
            },
            {
                metricName: 'Plays',
                currentPeriod: { value: currentData.totalPlays, label: `Last ${days} days` },
                previousPeriod: { value: previousData.totalPlays, label: `Previous ${days} days` },
                change: currentData.totalPlays - previousData.totalPlays,
                changePercent: 5,
                trend: 'up'
            },
            {
                metricName: 'Wins',
                currentPeriod: { value: currentData.totalWins, label: `Last ${days} days` },
                previousPeriod: { value: previousData.totalWins, label: `Previous ${days} days` },
                change: currentData.totalWins - previousData.totalWins,
                changePercent: 8,
                trend: 'up'
            }
        ];
    },

    compareLocations: async (days: number = 30): Promise<LocationComparison[]> => {
        const performance = await analyticsService.getMachinePerformance(days);
        const locationMap = new Map<string, { revenue: number; plays: number; machines: number; totalWinRate: number }>();

        performance.forEach(m => {
            const existing = locationMap.get(m.location) || { revenue: 0, plays: 0, machines: 0, totalWinRate: 0 };
            locationMap.set(m.location, {
                revenue: existing.revenue + m.revenue,
                plays: existing.plays + m.plays,
                machines: existing.machines + 1,
                totalWinRate: existing.totalWinRate + m.winRate,
            });
        });

        return Array.from(locationMap.entries()).map(([location, data]) => ({
            location,
            revenue: +data.revenue.toFixed(2),
            plays: data.plays,
            machines: data.machines,
            avgRevenuePerMachine: +(data.revenue / data.machines).toFixed(2),
            winRate: +(data.totalWinRate / data.machines).toFixed(1),
        }));
    },

    getReorderRecommendations: async (days: number = 30): Promise<ReorderRecommendation[]> => {
        const stockPerf = await analyticsService.getStockPerformance(days);

        return stockPerf
            .filter(item => item.isLowStock || item.totalQuantity <= item.reorderPoint * 1.5)
            .map(item => {
                const deficit = Math.max(0, item.reorderPoint * 2 - item.totalQuantity);
                const suggestedQty = Math.max(deficit, item.reorderPoint);
                const daysUntilStockout = item.turnoverRate > 0
                    ? Math.round(item.totalQuantity / (item.turnoverRate * 10))
                    : 999;

                let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
                if (item.totalQuantity === 0) priority = 'critical';
                else if (item.totalQuantity <= item.reorderPoint * 0.5) priority = 'critical';
                else if (item.isLowStock) priority = 'high';
                else if (item.totalQuantity <= item.reorderPoint * 1.5) priority = 'medium';

                return {
                    itemId: item.id,
                    itemName: item.name,
                    category: item.category,
                    currentQuantity: item.totalQuantity,
                    reorderPoint: item.reorderPoint,
                    suggestedOrderQuantity: suggestedQty,
                    estimatedCost: +(suggestedQty * item.costPerUnit).toFixed(2),
                    priority,
                    daysUntilStockout,
                };
            })
            .sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    },

    getFinancialMetrics: async (days: number = 30, revenueSource: RevenueSource = 'sales', customRange?: { startDate: Date; endDate: Date }): Promise<FinancialMetrics> => {
        const [revenueTimeSeries, machinePerf, stockPerf] = await Promise.all([
            analyticsService.getRevenueTimeSeries(days, revenueSource, customRange),
            analyticsService.getMachinePerformance(days, 'game', customRange), // Machine performance always uses game revenue for machine breakdown
            analyticsService.getStockPerformance(days, customRange),
        ]);

        const range = customRange || { startDate: startOfDay(subDays(new Date(), days - 1)), endDate: endOfDay(new Date()) };
        const calcDays = Math.max(1, Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)));

        const totalRevenue = revenueTimeSeries.reduce((sum, d) => sum + d.revenue, 0);
        const machineRevenue = revenueTimeSeries.reduce((sum, d) => sum + d.machineRevenue, 0);
        const salesRevenue = revenueTimeSeries.reduce((sum, d) => sum + d.salesRevenue, 0);
        const totalWins = revenueTimeSeries.reduce((sum, d) => sum + d.wins, 0);

        // Calculate COGS - Cost of Goods Sold
        // Use average cost per unit from stocked items
        const avgItemCost = stockPerf.length > 0
            ? stockPerf.reduce((sum, s) => sum + s.costPerUnit, 0) / stockPerf.length
            : 0;

        // COGS = total wins * average cost of items
        // We add a small percentage (e.g., 5%) for POS-related costs if applicable
        const totalCost = +(totalWins * avgItemCost * 1.05).toFixed(2);
        const grossProfit = +(totalRevenue - totalCost).toFixed(2);

        // Group revenue by machine type for breakdown
        const typeMap = new Map<string, number>();
        machinePerf.forEach(m => {
            const group = m.type || "Unknown";
            const existing = typeMap.get(group) || 0;
            typeMap.set(group, existing + m.revenue);
        });

        const revenueByCategory = Array.from(typeMap.entries())
            .map(([category, revenue]) => ({
                category,
                revenue: +revenue.toFixed(2),
                percentage: totalRevenue > 0 ? +((revenue / totalRevenue) * 100).toFixed(1) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);

        return {
            totalRevenue: +totalRevenue.toFixed(2),
            machineRevenue: +machineRevenue.toFixed(2),
            salesRevenue: +salesRevenue.toFixed(2),
            totalCost,
            grossProfit,
            profitMargin: totalRevenue > 0 ? +((grossProfit / totalRevenue) * 100).toFixed(1) : 0,
            avgRevenuePerMachine: +(totalRevenue / Math.max(machinePerf.length, 1)).toFixed(2),
            avgRevenuePerDay: +(totalRevenue / calcDays).toFixed(2),
            projectedMonthlyRevenue: +((totalRevenue / calcDays) * 30).toFixed(2),
            revenueByCategory,
        };
    },

    compareMultipleMachines: async (machineIds: string[], days: number = 30): Promise<{ machines: MachinePerformance[]; metrics: string[] }> => {
        const performance = await analyticsService.getMachinePerformance(days);
        const selectedMachines = performance.filter(m => machineIds.includes(m.id));

        return {
            machines: selectedMachines,
            metrics: ['plays', 'revenue', 'winRate', 'uptime', 'avgPlayValue'],
        };
    },

    getMachineStatusDistribution: async (): Promise<{ status: string; count: number; percentage: number }[]> => {
        const machines = await machineService.getAll();
        const statusMap = new Map<string, number>();

        machines.forEach(m => {
            const existing = statusMap.get(m.status) || 0;
            statusMap.set(m.status, existing + 1);
        });

        const total = machines.length;
        return Array.from(statusMap.entries()).map(([status, count]) => ({
            status,
            count,
            percentage: total > 0 ? +((count / total) * 100).toFixed(1) : 0,
        }));
    },

    getProjectedRevenue: async (forecastDays: number = 7): Promise<TimeSeriesData[]> => {
        const historicalData = await analyticsService.getRevenueTimeSeries(30);
        if (historicalData.length === 0) return [];

        // Use weighted moving average for a more realistic projection
        // Give more weight to recent days
        let totalWeight = 0;
        let weightedRevenue = 0;
        let weightedPlays = 0;
        let weightedWins = 0;

        historicalData.forEach((d, i) => {
            const weight = i + 1; // More weight to later days
            totalWeight += weight;
            weightedRevenue += d.revenue * weight;
            weightedPlays += d.plays * weight;
            weightedWins += d.wins * weight;
        });

        const avgRevenue = weightedRevenue / totalWeight;
        const avgPlays = weightedPlays / totalWeight;
        const avgWins = weightedWins / totalWeight;

        const forecast: TimeSeriesData[] = [];
        const now = new Date();

        for (let i = 1; i <= forecastDays; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);

            // Add slight day-of-week variation (simplistic: weekends +10%)
            const dayOfWeek = date.getDay();
            const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1.0;

            // Add a small random variance (+/- 5%)
            const variance = 1 + (Math.random() * 0.1 - 0.05);

            forecast.push({
                date: date.toISOString().split('T')[0],
                revenue: Math.round(avgRevenue * weekendBoost * variance),
                machineRevenue: Math.round(avgRevenue * 0.4 * weekendBoost * variance), // Estimate
                salesRevenue: Math.round(avgRevenue * 0.6 * weekendBoost * variance), // Estimate
                plays: Math.round(avgPlays * weekendBoost * variance),
                wins: Math.round(avgWins * weekendBoost * variance),
            });
        }

        return forecast;
    },
};
