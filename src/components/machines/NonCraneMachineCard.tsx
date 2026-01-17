"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { View, Ticket, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import { MachineStatus, MonitoringReportItem } from "@/services/monitoringService";

type ExtendedMachineStatus = MachineStatus & Partial<MonitoringReportItem> & { group?: string };

interface NonCraneMachineCardProps {
    machine: ExtendedMachineStatus;
    onAction?: (action: string, machine: ExtendedMachineStatus) => void;
}

/**
 * Simplified machine card for non-crane arcade machines.
 * Displays basic status, play statistics, and revenue without claw-specific features.
 */
export function NonCraneMachineCard({ machine, onAction }: NonCraneMachineCardProps) {
    const statusColors = {
        online: "bg-green-500",
        offline: "bg-gray-400",
        error: "bg-red-500",
        maintenance: "bg-yellow-500",
    };

    const statusBadgeVariants = {
        online: "bg-green-100 text-green-800 border-green-200",
        offline: "bg-gray-100 text-gray-800 border-gray-200",
        error: "bg-red-100 text-red-800 border-red-200",
        maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    // Estimate revenue from plays (assuming $3.60 per 2 plays average)
    const estimatedRevenue = ((machine.customerPlays || 0) * 1.8).toFixed(0);

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
            machine.status === 'error' && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
            machine.status === 'offline' && "opacity-60"
        )}>
            {/* Status indicator */}
            <div className="absolute top-3 right-3">
                <div className="relative">
                    {machine.status === 'online' && (
                        <div className={cn(
                            "absolute inset-0 rounded-full animate-ping opacity-75",
                            statusColors[machine.status]
                        )} />
                    )}
                    <div className={cn(
                        "relative h-3 w-3 rounded-full",
                        statusColors[machine.status]
                    )} />
                </div>
            </div>

            <CardContent className="p-3">
                <div className="space-y-3">
                    {/* Header with Image */}
                    <div className="flex gap-3">
                        {/* Machine Image */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className="h-16 w-16 bg-muted rounded-md flex-shrink-0 overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity">
                                    {machine.imageUrl ? (
                                        <img
                                            src={getThumbnailUrl(machine.imageUrl, 128)}
                                            alt={machine.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-secondary">
                                            <View className="h-6 w-6 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                <VisuallyHidden>
                                    <DialogTitle>{machine.name} Image</DialogTitle>
                                </VisuallyHidden>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {machine.imageUrl ? (
                                        <img
                                            src={getThumbnailUrl(machine.imageUrl, 1024)}
                                            alt={machine.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                        />
                                    ) : (
                                        <div className="w-64 h-64 bg-background rounded-lg flex items-center justify-center">
                                            <View className="h-16 w-16 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Name and Info */}
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/machines/${machine.id}`}
                                className="font-bold text-xs leading-none hover:underline hover:text-primary block mb-1 line-clamp-2"
                                title={machine.name}
                            >
                                {machine.name}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                                {machine.location}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <Badge
                                    variant="outline"
                                    className={cn("text-[10px] h-5 px-1 capitalize", statusBadgeVariants[machine.status])}
                                >
                                    {machine.status}
                                </Badge>
                                {machine.group && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                        {machine.group}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs border-t pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Cust. Plays:
                            </span>
                            <span className="font-medium">{machine.customerPlays ?? '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Staff Plays:</span>
                            <span className="font-medium">{machine.staffPlays ?? '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Revenue:
                            </span>
                            <span className="font-medium text-green-600">${estimatedRevenue}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                Points:
                            </span>
                            <span className="font-medium text-purple-600">{(machine as any).points ?? '-'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 h-7 text-xs shadow-sm hover:bg-primary/90"
                            onClick={(e) => {
                                if (onAction) {
                                    e.preventDefault();
                                    onAction('quick_view', machine);
                                }
                            }}
                        >
                            Quick Details
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs border-dashed"
                            asChild
                        >
                            <Link href={`/machines/${machine.id}`}>
                                View Full
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
