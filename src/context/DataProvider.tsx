"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { StockItem, ArcadeMachine } from "@/types";
import { stockService, machineService } from "@/services";

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

    const value: DataContextType = {
        items,
        itemsLoading,
        getItemById,
        refreshItems,
        machines,
        machinesLoading,
        getMachineById,
        refreshMachines,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
