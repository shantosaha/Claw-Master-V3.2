"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { LayoutGrid, Eye, Wifi, DollarSign, PlayCircle, Ticket, Activity, View } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MachineStatus, MonitoringReportItem } from "@/services/monitoringService";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";

export type ExtendedMachineStatus = MachineStatus & Partial<MonitoringReportItem>;

interface NonCraneMachineCardProps {
    machine: ExtendedMachineStatus;
    onAction?: (action: string, machine: ExtendedMachineStatus) => void;
}

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

    // Use machine image from data store (imageUrl) preferrably
    // monitoringService.transformMachineData already populates imageUrl from slots
    const displayImageUrl = machine.imageUrl;

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-200 hover:shadow-md",
            machine.status === 'error' && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
            machine.status === 'offline' && "opacity-80"
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
                        statusColors[machine.status || 'online']
                    )} />
                </div>
            </div>

            <CardContent className="p-3">
                <div className="space-y-3">
                    {/* Header with Image */}
                    <div className="flex gap-3">
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className="h-16 w-16 bg-muted rounded-md flex-shrink-0 overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity">
                                    {displayImageUrl ? (
                                        <img
                                            src={getThumbnailUrl(displayImageUrl, 128)}
                                            alt={machine.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-secondary/50">
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
                                    {displayImageUrl ? (
                                        <img
                                            src={getThumbnailUrl(displayImageUrl, 1024)}
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

                        {/* Name and Basic Info */}
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/machines/${machine.id}`}
                                className="font-bold text-sm leading-tight hover:underline hover:text-primary block mb-0.5 line-clamp-1"
                                title={machine.name}
                            >
                                {machine.name}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 uppercase font-medium">
                                <span className="bg-muted px-1 rounded">{machine.location}</span>
                                <span>•</span>
                                <span>{machine.assetTag || 'NO TAG'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <Badge
                                    variant="outline"
                                    className={cn("text-[9px] h-4.5 px-1.5 capitalize font-bold", statusBadgeVariants[machine.status || 'online'])}
                                >
                                    {machine.status}
                                </Badge>
                                <Badge variant="secondary" className="text-[9px] h-4.5 px-1.5 font-bold">
                                    Arcade
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Simplified Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="bg-muted/30 p-2 rounded-lg space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                                <PlayCircle className="h-3 w-3 text-blue-500" />
                                Activity
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold">{machine.customerPlays ?? 0}</span>
                                <span className="text-[9px] text-muted-foreground">plays</span>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                                <DollarSign className="h-3 w-3 text-green-500" />
                                Revenue
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-green-600">
                                    ${((machine.customerPlays || 0) * 3.6).toFixed(0)}
                                </span>
                                <span className="text-[9px] text-muted-foreground">est.</span>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg space-y-1 col-span-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                                    <Ticket className="h-3 w-3 text-orange-500" />
                                    Points/Tickets
                                </div>
                                <span className="text-xs font-bold text-orange-600">{machine.payouts ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-8 text-xs font-bold"
                            onClick={(e) => {
                                if (onAction) {
                                    e.preventDefault();
                                    onAction('quick_view', machine);
                                }
                            }}
                        >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Details
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs font-bold border-dashed"
                            asChild
                        >
                            <Link href={`/machines/${machine.id}`}>
                                Full View
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
