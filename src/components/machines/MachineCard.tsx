"use client";

import { ArcadeMachine, ArcadeMachineSlot } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Package, AlertCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface MachineCardProps {
    machine: ArcadeMachine;
    onManageStock: (machine: ArcadeMachine) => void;
    onStatusChange: (machine: ArcadeMachine, status: ArcadeMachine['status']) => void;
}

export function MachineCard({ machine, onManageStock, onStatusChange }: MachineCardProps) {
    const router = useRouter();
    const getStatusColor = (status: ArcadeMachine['status']) => {
        switch (status) {
            case 'Online': return "default";
            case 'Maintenance': return "secondary";
            case 'Error': return "destructive";
            case 'Offline': return "outline";
            default: return "secondary";
        }
    };

    const getStockStatusColor = (level: ArcadeMachineSlot['stockLevel']) => {
        switch (level) {
            case 'Full': return "bg-green-500";
            case 'Good': return "bg-blue-500";
            case 'Low': return "bg-yellow-500";
            case 'Empty': return "bg-red-500";
            default: return "bg-gray-200";
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on interactive elements
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="menuitem"]')) {
            return;
        }
        router.push(`/machines/${machine.id}`);
    };

    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={handleCardClick}
        >
            <CardHeader className="p-0">
                <div className="relative h-48 w-full bg-muted">
                    {machine.imageUrl ? (
                        <Image
                            src={machine.imageUrl}
                            alt={machine.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            No Image
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Badge
                                    variant={getStatusColor(machine.status) as any}
                                    className="cursor-pointer hover:opacity-80"
                                >
                                    {machine.status}
                                </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onStatusChange(machine, 'Online')}>
                                    Set Online
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(machine, 'Maintenance')}>
                                    Set Maintenance
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(machine, 'Offline')}>
                                    Set Offline
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <h3 className="text-white font-bold truncate">{machine.name}</h3>
                        <p className="text-white/80 text-xs">{machine.location}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{machine.type || "Unknown Type"}</span>
                    <span>{machine.prizeSize || "Unknown Size"}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-medium">Revenue</span>
                    <span className="text-sm font-bold text-green-600">
                        {machine.revenue ? `$${machine.revenue.toFixed(2)}` : "-"}
                    </span>
                </div>
                {machine.slots.length > 0 ? (
                    <div className="space-y-3">
                        {machine.slots.map(slot => (
                            <div key={slot.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", getStockStatusColor(slot.stockLevel))} />
                                    <span className="font-medium">{slot.name}</span>
                                </div>
                                <div className="text-right">
                                    {slot.currentItem ? (
                                        <Link
                                            href={`/inventory/${slot.currentItem.id}`}
                                            className="text-blue-600 hover:underline text-sm truncate max-w-[100px] block"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {slot.currentItem.name}
                                        </Link>
                                    ) : (
                                        <div className="text-muted-foreground text-sm">Empty</div>
                                    )}
                                    {slot.upcomingQueue.length > 0 && (
                                        <div className="text-xs text-blue-500">
                                            Next: {slot.upcomingQueue[0].name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-20 text-muted-foreground text-sm border border-dashed rounded-md">
                        No slots configured
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full" variant="outline" onClick={() => onManageStock(machine)}>
                    <Package className="mr-2 h-4 w-4" />
                    Manage Stock
                </Button>
            </CardFooter>
        </Card>
    );
}
