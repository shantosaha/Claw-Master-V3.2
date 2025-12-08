"use client";

import { useEffect, useState } from "react";
import { maintenanceService, machineService } from "@/services";
import { MaintenanceTask } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MaintenanceDialog } from "./MaintenanceDialog";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { SortableTaskCard } from "./SortableTaskCard";

export function MaintenanceDashboard() {
    const [tasks, setTasks] = useState<(MaintenanceTask & { machineName?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        let unsubscribeMachines: (() => void) | undefined;

        // Subscribe to real-time machine updates for enriching task data
        if (typeof (machineService as any).subscribe === 'function') {
            unsubscribeMachines = (machineService as any).subscribe((machines: any[]) => {
                // Re-enrich tasks when machine data changes
                setTasks(prev => prev.map(task => ({
                    ...task,
                    machineName: machines.find(m => m.id === task.machineId)?.name || "Unknown Machine",
                })));
            });
        }

        // Initial load
        loadData();

        return () => {
            if (unsubscribeMachines) unsubscribeMachines();
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [taskList, machines] = await Promise.all([
                maintenanceService.getAll(),
                machineService.getAll(),
            ]);

            const enrichedTasks = taskList.map(task => ({
                ...task,
                machineName: machines.find(m => m.id === task.machineId)?.name || "Unknown Machine",
            }));

            setTasks(enrichedTasks);
        } catch (error) {
            console.error("Failed to load maintenance tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        // Determine new status based on drop target (column ID)
        let newStatus = over.id as MaintenanceTask['status'];

        // If dropped on a task, get that task's status
        if (tasks.some(t => t.id === over.id)) {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            // Optimistic update
            setTasks(tasks.map(t =>
                t.id === activeTask.id ? { ...t, status: newStatus } : t
            ));

            try {
                await maintenanceService.update(activeTask.id, {
                    status: newStatus,
                    resolvedAt: newStatus === 'resolved' ? new Date() : undefined
                });
            } catch (error) {
                console.error("Failed to update task status:", error);
                loadData(); // Revert on error
            }
        }

        setActiveId(null);
    };

    const columns = [
        { id: "open", title: "Open", color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300" },
        { id: "in-progress", title: "In Progress", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" },
        { id: "resolved", title: "Resolved", color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300" },
    ];

    if (loading) return <div>Loading tasks...</div>;

    return (
        <div className="space-y-4 h-full">
            <div className="flex justify-end">
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Ticket
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {columns.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            tasks={tasks.filter(t => t.status === col.id)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <SortableTaskCard task={tasks.find(t => t.id === activeId)!} />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <MaintenanceDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={loadData}
            />
        </div>
    );
}

