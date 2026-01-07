"use client";

import * as React from "react";
import Link from "next/link";
import { StockItem, MachineAssignment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gamepad2, ChevronDown, MapPin } from "lucide-react";
import { migrateToMachineAssignments } from "@/utils/machineAssignmentUtils";
import { cn } from "@/lib/utils";

interface MachineAssignmentBadgeProps {
    item: StockItem;
    variant?: "compact" | "full";
    className?: string;
}

export function MachineAssignmentBadge({
    item,
    variant = "compact",
    className,
}: MachineAssignmentBadgeProps) {
    const assignments = migrateToMachineAssignments(item);
    const count = assignments.length;

    if (count === 0) {
        return (
            <span className={cn("text-muted-foreground text-sm", className)}>
                -
            </span>
        );
    }

    // Single assignment - show as simple link
    if (count === 1) {
        const assignment = assignments[0];
        return (
            <Link
                href={`/machines/${assignment.machineId}`}
                className={cn(
                    "text-primary hover:underline flex items-center gap-1.5",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <Gamepad2 className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{assignment.machineName}</span>
                <Badge
                    variant="outline"
                    className={cn(
                        "text-[10px] px-1.5 py-0 h-4 ml-1",
                        assignment.status === "Using"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    )}
                >
                    {assignment.status}
                </Badge>
            </Link>
        );
    }

    // Multiple assignments - show dropdown
    const primaryAssignment = assignments.find((a) => a.status === "Using");
    const displayName = primaryAssignment?.machineName || assignments[0].machineName;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 px-2 gap-1.5 text-primary hover:text-primary hover:bg-primary/5",
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">Multiple</span>
                    <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-xs font-semibold bg-primary/10 text-primary"
                    >
                        {count}
                    </Badge>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Assigned Machines ({count})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {assignments.map((assignment, index) => (
                    <DropdownMenuItem key={`${assignment.machineId}-${index}`} asChild>
                        <Link
                            href={`/machines/${assignment.machineId}`}
                            className="flex items-center justify-between gap-2 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{assignment.machineName}</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] px-1.5 py-0 h-4 shrink-0",
                                    assignment.status === "Using"
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                )}
                            >
                                {assignment.status}
                            </Badge>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
