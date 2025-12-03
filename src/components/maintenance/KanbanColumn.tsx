import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MaintenanceTask } from "@/types";
import { SortableTaskCard } from "./SortableTaskCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: (MaintenanceTask & { machineName?: string })[];
    color?: string;
}

export function KanbanColumn({ id, title, tasks, color = "bg-secondary/50" }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div className="flex flex-col h-full min-h-[500px] w-full rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className={cn("p-4 border-b font-semibold flex items-center justify-between", color)}>
                <span>{title}</span>
                <span className="text-xs bg-background/50 px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </div>
            <div ref={setNodeRef} className="p-4 flex-1 space-y-3 bg-muted/20">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-sm">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    );
}
