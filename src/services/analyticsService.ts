import { machineService, stockService } from "./index";
import { ArcadeMachine, StockItem } from "@/types";

// Generate mock revenue data for analytics
const generateMockRevenueData = (days: number = 30) => {
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split('T')[0],
            revenue: Math.floor(Math.random() * 3000) + 1500,
            plays: Math.floor(Math.random() * 800) + 300,
            wins: Math.floor(Math.random() * 150) + 50,
        });
    }
    return data;
};

// Generate mock machine performance data
const generateMachinePerformanceData = (machines: ArcadeMachine[]) => {
    return machines.map(machine => ({
        id: machine.id,
        name: machine.name,
        location: machine.location,
        type: machine.type || "Unknown",
        plays: Math.floor(Math.random() * 500) + 100,
        revenue: Math.floor(Math.random() * 2000) + 500,
        winRate: Math.floor(Math.random() * 20) + 5,
        uptime: Math.floor(Math.random() * 30) + 70,
        avgPlayValue: +(Math.random() * 2 + 1).toFixed(2),
        status: machine.status,
    }));
};

// Generate mock stock performance data
const generateStockPerformanceData = (items: StockItem[]) => {
    return items.map(item => {
        const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || item.totalQuantity || 0;
        const cost = item.supplyChain?.costPerUnit || 0;
        return {
            id: item.id,
            name: item.name,
            category: item.category || item.type || "Uncategorized",
            size: item.size || "Standard",
            brand: item.brand || "Generic",
            totalQuantity: totalQty,
            stockValue: totalQty * cost,
            costPerUnit: cost,
            turnoverRate: +(Math.random() * 3 + 0.5).toFixed(2),
            daysToSell: Math.floor(Math.random() * 30) + 5,
            reorderPoint: item.supplyChain?.reorderPoint || item.lowStockThreshold || 10,
            isLowStock: totalQty <= (item.supplyChain?.reorderPoint || item.lowStockThreshold || 10),
        };
    });
};

export interface AnalyticsOverview {
    totalRevenue: number;
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
    winRate: number;
    uptime: number;
    avgPlayValue: number;
    status: string;
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
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    avgRevenuePerMachine: number;
    avgRevenuePerDay: number;
    projectedMonthlyRevenue: number;
    revenueByCategory: { category: string; revenue: number; percentage: number }[];
}

export const analyticsService = {
    getOverview: async (days: number = 30): Promise<AnalyticsOverview> => {
        const [machines, stock] = await Promise.all([
            machineService.getAll(),
            stockService.getAll(),
        ]);

        const revenueData = generateMockRevenueData(days);
        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
        const totalPlays = revenueData.reduce((sum, d) => sum + d.plays, 0);
        const totalWins = revenueData.reduce((sum, d) => sum + d.wins, 0);

        // Calculate stock value
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

        // Machine status counts
        const activeMachines = machines.filter(m => m.status === "Online").length;
        const offlineMachines = machines.filter(m => m.status === "Offline" || m.status === "Error").length;
        const maintenanceMachines = machines.filter(m => m.status === "Maintenance").length;

        return {
            totalRevenue,
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
            revenueChange: +(Math.random() * 20 - 5).toFixed(1),
            playsChange: +(Math.random() * 15 - 3).toFixed(1),
        };
    },

    getRevenueTimeSeries: async (days: number = 30): Promise<TimeSeriesData[]> => {
        return generateMockRevenueData(days);
    },

    getMachinePerformance: async (): Promise<MachinePerformance[]> => {
        const machines = await machineService.getAll();
        return generateMachinePerformanceData(machines);
    },

    getStockPerformance: async (): Promise<StockPerformance[]> => {
        const stock = await stockService.getAll();
        return generateStockPerformanceData(stock);
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

    compareMachines: async (machineId1: string, machineId2: string): Promise<ComparisonData[]> => {
        const performance = await analyticsService.getMachinePerformance();
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

    getRevenueByLocation: async (): Promise<{ location: string; revenue: number; machines: number }[]> => {
        const performance = await analyticsService.getMachinePerformance();
        const locationMap = new Map<string, { revenue: number; machines: number }>();

        performance.forEach(m => {
            const existing = locationMap.get(m.location) || { revenue: 0, machines: 0 };
            locationMap.set(m.location, {
                revenue: existing.revenue + m.revenue,
                machines: existing.machines + 1,
            });
        });

        return Array.from(locationMap.entries()).map(([location, data]) => ({
            location,
            ...data,
        }));
    },

    getRevenueByMachineType: async (): Promise<{ type: string; revenue: number; count: number; avgRevenue: number }[]> => {
        const performance = await analyticsService.getMachinePerformance();
        const typeMap = new Map<string, { revenue: number; count: number }>();

        performance.forEach(m => {
            const existing = typeMap.get(m.type) || { revenue: 0, count: 0 };
            typeMap.set(m.type, {
                revenue: existing.revenue + m.revenue,
                count: existing.count + 1,
            });
        });

        return Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            revenue: data.revenue,
            count: data.count,
            avgRevenue: +(data.revenue / data.count).toFixed(2),
        }));
    },

    getStockByCategory: async (): Promise<{ category: string; items: number; totalQuantity: number; totalValue: number }[]> => {
        const stockPerf = await analyticsService.getStockPerformance();
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

    getStockByBrand: async (): Promise<{ brand: string; items: number; totalValue: number }[]> => {
        const stockPerf = await analyticsService.getStockPerformance();
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

    // NEW: Calculate trend for a metric
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

    // NEW: Get moving average for time series data
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

    // NEW: Compare two time periods
    compareTimePeriods: async (days: number = 30): Promise<PeriodComparison[]> => {
        const currentData = generateMockRevenueData(days);
        const previousData = generateMockRevenueData(days); // Mock previous period

        const currentTotals = {
            revenue: currentData.reduce((sum, d) => sum + d.revenue, 0),
            plays: currentData.reduce((sum, d) => sum + d.plays, 0),
            wins: currentData.reduce((sum, d) => sum + d.wins, 0),
        };

        const previousTotals = {
            revenue: previousData.reduce((sum, d) => sum + d.revenue, 0),
            plays: previousData.reduce((sum, d) => sum + d.plays, 0),
            wins: previousData.reduce((sum, d) => sum + d.wins, 0),
        };

        const metrics = ['revenue', 'plays', 'wins'] as const;
        return metrics.map(metric => {
            const current = currentTotals[metric];
            const previous = previousTotals[metric];
            const change = current - previous;
            const changePercent = previous !== 0 ? +((change / previous) * 100).toFixed(1) : 0;

            return {
                metricName: metric.charAt(0).toUpperCase() + metric.slice(1),
                currentPeriod: { value: current, label: `Last ${days} days` },
                previousPeriod: { value: previous, label: `Previous ${days} days` },
                change,
                changePercent,
                trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
            };
        });
    },

    // NEW: Compare locations
    compareLocations: async (): Promise<LocationComparison[]> => {
        const performance = await analyticsService.getMachinePerformance();
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
            revenue: data.revenue,
            plays: data.plays,
            machines: data.machines,
            avgRevenuePerMachine: +(data.revenue / data.machines).toFixed(2),
            winRate: +(data.totalWinRate / data.machines).toFixed(1),
        }));
    },

    // NEW: Get reorder recommendations
    getReorderRecommendations: async (): Promise<ReorderRecommendation[]> => {
        const stockPerf = await analyticsService.getStockPerformance();

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

    // NEW: Get financial metrics
    getFinancialMetrics: async (days: number = 30): Promise<FinancialMetrics> => {
        const [revenueData, machinePerf, stockPerf] = await Promise.all([
            analyticsService.getRevenueTimeSeries(days),
            analyticsService.getMachinePerformance(),
            analyticsService.getStockPerformance(),
        ]);

        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
        const totalCost = stockPerf.reduce((sum, s) => sum + s.stockValue * 0.4, 0); // Mock 40% margin
        const grossProfit = totalRevenue - totalCost;

        // Revenue by machine type as proxy for category
        const typeMap = new Map<string, number>();
        machinePerf.forEach(m => {
            const existing = typeMap.get(m.type) || 0;
            typeMap.set(m.type, existing + m.revenue);
        });

        const revenueByCategory = Array.from(typeMap.entries()).map(([category, revenue]) => ({
            category,
            revenue,
            percentage: +((revenue / totalRevenue) * 100).toFixed(1),
        }));

        return {
            totalRevenue,
            totalCost: +totalCost.toFixed(2),
            grossProfit: +grossProfit.toFixed(2),
            profitMargin: +((grossProfit / totalRevenue) * 100).toFixed(1),
            avgRevenuePerMachine: +(totalRevenue / Math.max(machinePerf.length, 1)).toFixed(2),
            avgRevenuePerDay: +(totalRevenue / days).toFixed(2),
            projectedMonthlyRevenue: +((totalRevenue / days) * 30).toFixed(2),
            revenueByCategory,
        };
    },

    // NEW: Compare multiple machines (up to 4)
    compareMultipleMachines: async (machineIds: string[]): Promise<{ machines: MachinePerformance[]; metrics: string[] }> => {
        const performance = await analyticsService.getMachinePerformance();
        const selectedMachines = performance.filter(m => machineIds.includes(m.id));

        return {
            machines: selectedMachines,
            metrics: ['plays', 'revenue', 'winRate', 'uptime', 'avgPlayValue'],
        };
    },

    // NEW: Get machine status distribution
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
            percentage: +((count / total) * 100).toFixed(1),
        }));
    },

    // NEW: Get projected revenue forecast
    getProjectedRevenue: async (forecastDays: number = 7): Promise<TimeSeriesData[]> => {
        const historicalData = await analyticsService.getRevenueTimeSeries(30);
        const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
        const avgPlays = historicalData.reduce((sum, d) => sum + d.plays, 0) / historicalData.length;
        const avgWins = historicalData.reduce((sum, d) => sum + d.wins, 0) / historicalData.length;

        const forecast: TimeSeriesData[] = [];
        const now = new Date();

        for (let i = 1; i <= forecastDays; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);

            // Add some variance to make it realistic
            const variance = 0.15; // 15% variance
            forecast.push({
                date: date.toISOString().split('T')[0],
                revenue: Math.round(avgRevenue * (1 + (Math.random() * variance * 2 - variance))),
                plays: Math.round(avgPlays * (1 + (Math.random() * variance * 2 - variance))),
                wins: Math.round(avgWins * (1 + (Math.random() * variance * 2 - variance))),
            });
        }

        return forecast;
    },
};
