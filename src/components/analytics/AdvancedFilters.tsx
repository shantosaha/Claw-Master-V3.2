"use client";

import { useState } from "react";
import { Filter, ChevronDown, X, Calendar, MapPin, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface FilterState {
    timePeriod: string;
    location: string;
    machineType: string;
    status: string;
}

interface AdvancedFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    locations?: string[];
    machineTypes?: string[];
    className?: string;
}

const defaultLocations = ["All Locations", "Zone A", "Zone B", "Zone C", "Ground Floor", "Level 1"];
const defaultMachineTypes = ["All Types", "Claw Machine", "Redemption", "Skill Game", "Coin Pusher"];
const defaultStatuses = ["All Status", "Online", "Offline", "Maintenance", "Error"];

export function AdvancedFilters({
    filters,
    onFilterChange,
    locations = defaultLocations,
    machineTypes = defaultMachineTypes,
    className,
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const updateFilter = (key: keyof FilterState, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            timePeriod: "30",
            location: "All Locations",
            machineType: "All Types",
            status: "All Status",
        });
    };

    const activeFiltersCount = [
        filters.location !== "All Locations",
        filters.machineType !== "All Types",
        filters.status !== "All Status",
    ].filter(Boolean).length;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
            <div className="flex items-center gap-3 flex-wrap">
                {/* Time Period - Always visible */}
                <Select value={filters.timePeriod} onValueChange={(v) => updateFilter("timePeriod", v)}>
                    <SelectTrigger className="w-[140px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="14">Last 14 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="60">Last 60 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                </Select>

                {/* Toggle for advanced filters */}
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {activeFiltersCount}
                            </Badge>
                        )}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>

                {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                        <X className="h-3 w-3" />
                        Clear
                    </Button>
                )}
            </div>

            <CollapsibleContent className="mt-3">
                <div className="flex flex-wrap gap-3 p-4 rounded-lg border bg-muted/30">
                    {/* Location Filter */}
                    <Select value={filters.location} onValueChange={(v) => updateFilter("location", v)}>
                        <SelectTrigger className="w-[160px]">
                            <MapPin className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((loc) => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Machine Type Filter */}
                    <Select value={filters.machineType} onValueChange={(v) => updateFilter("machineType", v)}>
                        <SelectTrigger className="w-[160px]">
                            <Box className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Machine Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {machineTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {defaultStatuses.map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
