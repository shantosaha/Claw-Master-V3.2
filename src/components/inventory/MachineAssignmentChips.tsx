"use client";

import * as React from "react";
import Link from "next/link";
import { StockItem, MachineAssignment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gamepad2, X, Plus } from "lucide-react";
import { migrateToMachineAssignments } from "@/utils/machineAssignmentUtils";
import { cn } from "@/lib/utils";

interface MachineAssignmentChipsProps {
    item: StockItem;
    onAddAssignment?: () => void;
    onRemoveAssignment?: (machineId: string) => void;
    editable?: boolean;
    className?: string;
}

export function MachineAssignmentChips({
    item,
    onAddAssignment,
    onRemoveAssignment,
    editable = false,
    className,
}: MachineAssignmentChipsProps) {
    const assignments = migrateToMachineAssignments(item);

    if (assignments.length === 0 && !editable) {
        return null;
    }

    return (
        <div className={cn("mt-4", className)}>
            <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                        Assigned Machines
                    </span>
                    {assignments.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {assignments.length}
                        </Badge>
                    )}
                </div>

                {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                        Not assigned to any machines
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {assignments.map((assignment) => (
                            <MachineChip
                                key={assignment.machineId}
                                assignment={assignment}
                                editable={editable}
                                onRemove={
                                    editable && onRemoveAssignment
                                        ? () => onRemoveAssignment(assignment.machineId)
                                        : undefined
                                }
                            />
                        ))}

                        {editable && onAddAssignment && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 border-dashed"
                                onClick={onAddAssignment}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Machine
                            </Button>
                        )}
                    </div>
                )}

                {assignments.length === 0 && editable && onAddAssignment && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-dashed"
                        onClick={onAddAssignment}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Assign to Machine
                    </Button>
                )}
            </div>
        </div>
    );
}

interface MachineChipProps {
    assignment: MachineAssignment;
    editable?: boolean;
    onRemove?: () => void;
}

function MachineChip({ assignment, editable, onRemove }: MachineChipProps) {
    const isUsing = assignment.status === "Using";

    return (
        <div
            className={cn(
                "group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all",
                isUsing
                    ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
                    : "bg-blue-500/5 border-blue-500/30 hover:border-blue-500/50"
            )}
        >
            <Gamepad2
                className={cn(
                    "h-4 w-4",
                    isUsing ? "text-green-600" : "text-blue-600"
                )}
            />

            <div className="flex flex-col min-w-0">
                <Link
                    href={`/machines/${assignment.machineId}`}
                    className={cn(
                        "text-sm font-medium hover:underline truncate max-w-[180px]",
                        isUsing ? "text-green-700" : "text-blue-700"
                    )}
                >
                    {assignment.machineName}
                </Link>

            </div>

            <Badge
                variant="outline"
                className={cn(
                    "text-[10px] px-1.5 py-0 h-4 shrink-0",
                    isUsing
                        ? "bg-green-500/10 text-green-600 border-green-500/30"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                )}
            >
                {assignment.status}
            </Badge>

            {editable && onRemove && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={cn(
                        "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center",
                        "bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    )}
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
