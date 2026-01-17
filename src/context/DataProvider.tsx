"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { StockItem, ArcadeMachine, ServiceReport } from "@/types";
import { stockService, machineService } from "@/services";
import { serviceReportService } from "@/services/serviceReportService";
import { GameReportItem, gameReportApiService } from "@/services/gameReportApiService";
import { RevenueItem, revenueApiService } from "@/services/revenueApiService";
import { monitoringService } from "@/services/monitoringService";

interface DataContextType {
    // Stock Items
    items: StockItem[];
    itemsLoading: boolean;
    getItemById: (id: string) => StockItem | undefined;
    refreshItems: () => Promise<void>;

    // Machines
    machines: ArcadeMachine[];
    machinesLoading: boolean;
    getMachineById: (id: string) => ArcadeMachine | undefined;
    refreshMachines: () => Promise<void>;

    // JotForm Service Reports (cached)
    serviceReports: ServiceReport[];
    serviceReportsLoading: boolean;
    getReportsByMachineTag: (tag: string) => ServiceReport[];
    refreshServiceReports: () => Promise<void>;

    // Today's API Data (Prefetched)
    todayGameReports: GameReportItem[];
    todayRevenue: RevenueItem[];
    apisLoading: boolean;
    refreshApis: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}

interface DataProviderProps {
    children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
    const [items, setItems] = useState<StockItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [machines, setMachines] = useState<ArcadeMachine[]>([]);
    const [machinesLoading, setMachinesLoading] = useState(true);
    const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
    const [serviceReportsLoading, setServiceReportsLoading] = useState(true);
    const [todayGameReports, setTodayGameReports] = useState<GameReportItem[]>([]);
    const [todayRevenue, setTodayRevenue] = useState<RevenueItem[]>([]);
    const [apisLoading, setApisLoading] = useState(true);

    useEffect(() => {
        let unsubscribeStock: (() => void) | undefined;
        let unsubscribeMachines: (() => void) | undefined;

        const initialize = async () => {
            // Type for services with optional subscribe method
            type ServiceWithSubscribe<T> = {
                subscribe?: (callback: (data: T[]) => void) => () => void;
                getAll: () => Promise<T[]>;
            };

            const stockSvc = stockService as unknown as ServiceWithSubscribe<StockItem>;
            const machineSvc = machineService as unknown as ServiceWithSubscribe<ArcadeMachine>;

            // Subscribe to stock updates if available
            if (typeof stockSvc.subscribe === "function") {
                unsubscribeStock = stockSvc.subscribe((data: StockItem[]) => {
                    setItems(data);
                    setItemsLoading(false);
                });
            } else {
                // Fallback to manual fetch
                const data = await stockService.getAll();
                setItems(data);
                setItemsLoading(false);
            }

            // Subscribe to machine updates if available
            if (typeof machineSvc.subscribe === "function") {
                unsubscribeMachines = machineSvc.subscribe((data: ArcadeMachine[]) => {
                    setMachines(data);
                    setMachinesLoading(false);
                });
            } else {
                // Fallback to manual fetch
                const data = await machineService.getAll();
                setMachines(data);
                setMachinesLoading(false);
            }

            // Fetch All APIs on startup (JotForm, Game Report, Revenue)
            try {
                console.log("[DataProvider] Pre-fetching all machine performance APIs...");
                const [reports, gameData, revData] = await Promise.all([
                    serviceReportService.getReports("GLOBAL_FETCH"),
                    gameReportApiService.fetchTodayReport(),
                    revenueApiService.fetchTodayRevenue()
                ]);

                setServiceReports(reports);
                setTodayGameReports(gameData);
                setTodayRevenue(revData);

                console.log(`[DataProvider] API Sync Complete: ${reports.length} reports, ${gameData.length} game stats, ${revData.length} revenue items`);
            } catch (error) {
                console.error("[DataProvider] Failed to fetch startup API data:", error);
            } finally {
                setServiceReportsLoading(false);
                setApisLoading(false);
            }
        };

        initialize();

        return () => {
            if (unsubscribeStock) unsubscribeStock();
            if (unsubscribeMachines) unsubscribeMachines();
        };
    }, []);

    const getItemById = useCallback((id: string) => {
        return items.find(item => item.id === id);
    }, [items]);

    const getMachineById = useCallback((id: string) => {
        return machines.find(machine => machine.id === id);
    }, [machines]);

    const refreshItems = useCallback(async () => {
        // Don't set loading=true to avoid UI flicker during refresh
        const data = await stockService.getAll();
        setItems(data);
    }, []);

    const refreshMachines = useCallback(async () => {
        // Don't set loading=true to avoid UI flicker during refresh
        const data = await machineService.getAll();
        setMachines(data);
    }, []);

    const getReportsByMachineTag = useCallback((tag: string) => {
        if (!tag) return [];
        const normalizedTag = tag.trim().toLowerCase();
        return serviceReports.filter(report => {
            const reportTag = String(report.inflowSku || '').trim().toLowerCase();
            const reportMachineId = String(report.machineId || '').trim().toLowerCase();
            return reportTag === normalizedTag || reportMachineId === normalizedTag;
        });
    }, [serviceReports]);

    const refreshApis = useCallback(async () => {
        setApisLoading(true);
        try {
            const [reports, gameData, revData] = await Promise.all([
                serviceReportService.getReports("GLOBAL_FETCH"),
                gameReportApiService.fetchTodayReport(),
                revenueApiService.fetchTodayRevenue()
            ]);
            setServiceReports(reports);
            setTodayGameReports(gameData);
            setTodayRevenue(revData);

            // Sync with monitoring service
            monitoringService.setPrefetchedGameData(gameData);
        } catch (error) {
            console.error("[DataProvider] Failed to refresh APIs:", error);
        } finally {
            setApisLoading(false);
        }
    }, []);

    const value: DataContextType = {
        items,
        itemsLoading,
        getItemById,
        refreshItems,
        machines,
        machinesLoading,
        getMachineById,
        refreshMachines,
        serviceReports,
        serviceReportsLoading,
        getReportsByMachineTag,
        refreshServiceReports: refreshApis,
        todayGameReports,
        todayRevenue,
        apisLoading,
        refreshApis,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
