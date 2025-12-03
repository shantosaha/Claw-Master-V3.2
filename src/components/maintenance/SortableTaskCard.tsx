import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaintenanceTask } from "@/types";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils/date";

interface SortableTaskCardProps {
    task: MaintenanceTask & { machineName?: string };
}

export function SortableTaskCard({ task }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "destructive";
            case "high": return "destructive";
            case "medium": return "secondary"; // yellow-ish usually
            default: return "outline";
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                <CardHeader className="p-3 pb-0 space-y-1">
                    <div className="flex justify-between items-start">
                        <Badge variant={getPriorityColor(task.priority) as any} className="text-[10px] px-1.5 py-0">
                            {task.priority.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                            {formatDate(task.createdAt)}
                        </span>
                    </div>
                    <CardTitle className="text-sm font-medium line-clamp-2">
                        {task.description}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="text-xs text-muted-foreground mb-2">
                        <span className="font-semibold text-foreground">Machine:</span> {task.machineName}
                    </div>
                    {task.assignedTo && (
                        <div className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Assigned:</span> {task.assignedTo}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
