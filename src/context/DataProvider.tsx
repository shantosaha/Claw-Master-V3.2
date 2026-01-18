"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { StockItem, ArcadeMachine, ServiceReport } from "@/types";
import { stockService, machineService } from "@/services";
import { serviceReportService } from "@/services/serviceReportService";
import { GameReportItem, gameReportApiService } from "@/services/gameReportApiService";
import { RevenueItem, revenueApiService } from "@/services/revenueApiService";
import { monitoringService } from "@/services/monitoringService";
import { appSettingsService } from "@/services/appSettingsService";

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

                // 1. Fetch API settings once to avoid redundant Firestore calls
                const apiSettings = await appSettingsService.getApiSettings();
                console.log("[DataProvider] API Settings fetched, starting parallel API calls");

                // 2. Launch each API fetch independently to allow independent updates

                // JotForm - Usually slow
                serviceReportService.getReports("GLOBAL_FETCH", undefined, apiSettings)
                    .then(reports => {
                        setServiceReports(reports);
                        setServiceReportsLoading(false);
                        console.log(`[DataProvider] JotForm Sync Complete: ${reports.length} reports`);
                    })
                    .catch(err => {
                        console.error("[DataProvider] JotForm fetch failed:", err);
                        setServiceReportsLoading(false);
                    });

                // Game Report - Usually fast
                gameReportApiService.fetchTodayReport(undefined, apiSettings)
                    .then(gameData => {
                        setTodayGameReports(gameData);
                        monitoringService.setPrefetchedGameData(gameData);
                        console.log(`[DataProvider] Game Report Sync Complete: ${gameData.length} records`);
                    })
                    .catch(err => {
                        console.error("[DataProvider] Game Report fetch failed:", err);
                    });

                // Revenue - Usually fast
                revenueApiService.fetchTodayRevenue(undefined, apiSettings)
                    .then(revData => {
                        setTodayRevenue(revData);
                        console.log(`[DataProvider] Revenue Sync Complete: ${revData.length} records`);
                    })
                    .catch(err => {
                        console.error("[DataProvider] Revenue fetch failed:", err);
                    })
                    .finally(() => {
                        setApisLoading(false);
                    });

            } catch (error) {
                console.error("[DataProvider] Failed to initiate startup API data:", error);
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
        setServiceReportsLoading(true);
        try {
            // Fetch API settings once
            const apiSettings = await appSettingsService.getApiSettings();

            // Run in parallel but update states as they complete
            const jotformPromise = serviceReportService.getReports("GLOBAL_FETCH", undefined, apiSettings)
                .then(reports => {
                    setServiceReports(reports);
                    setServiceReportsLoading(false);
                    return reports;
                });

            const gameReportPromise = gameReportApiService.fetchTodayReport(undefined, apiSettings)
                .then(gameData => {
                    setTodayGameReports(gameData);
                    monitoringService.setPrefetchedGameData(gameData);
                    return gameData;
                });

            const revenuePromise = revenueApiService.fetchTodayRevenue(undefined, apiSettings)
                .then(revData => {
                    setTodayRevenue(revData);
                    return revData;
                });

            // We still await all for the general apisLoading state if needed, 
            // but individual states are updated earlier via then()
            await Promise.allSettled([jotformPromise, gameReportPromise, revenuePromise]);
        } catch (error) {
            console.error("[DataProvider] Failed to refresh APIs:", error);
        } finally {
            setApisLoading(false);
            setServiceReportsLoading(false);
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
