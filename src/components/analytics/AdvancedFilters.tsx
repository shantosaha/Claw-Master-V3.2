import { useState, useEffect } from "react";
import { Filter, ChevronDown, X, Calendar, MapPin, Box, Tag, ArrowUpDown, BarChart2, Layers, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "./DateRangePicker";
import { DateRange } from "react-day-picker";
import { differenceInDays } from "date-fns";

export interface FilterState {
    timePeriod: string;
    dateRange?: DateRange;
    location: string;
    machineType: string;
    status: string;
    category: string;
    brand: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    revenueRange: string;
    performanceLevel: string;
}

interface AdvancedFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    locations?: string[];
    machineTypes?: string[];
    categories?: string[];
    brands?: string[];
    showCategoryFilter?: boolean;
    showBrandFilter?: boolean;
    showSortOptions?: boolean;
    showRevenueFilter?: boolean;
    showPerformanceFilter?: boolean;
    className?: string;
    variant?: "compact" | "full";
}

const defaultLocations = ["All Locations", "Zone A", "Zone B", "Zone C", "Ground Floor", "Level 1"];
const defaultMachineTypes = ["All Types", "Claw Machine", "Redemption", "Skill Game", "Coin Pusher"];
const defaultStatuses = ["All Status", "Online", "Offline", "Maintenance", "Error"];
const defaultCategories = ["All Categories", "Plush", "Electronics", "Toys", "Collectibles", "Candy"];
const defaultBrands = ["All Brands", "Disney", "Pokemon", "Sanrio", "Marvel", "Generic"];
const sortOptions = [
    { value: "revenue", label: "Revenue" },
    { value: "plays", label: "Plays" },
    { value: "winRate", label: "Win Rate" },
    { value: "name", label: "Name" },
    { value: "date", label: "Date" },
];
const revenueRanges = [
    { value: "all", label: "All Revenue" },
    { value: "0-100", label: "$0 - $100" },
    { value: "100-500", label: "$100 - $500" },
    { value: "500-1000", label: "$500 - $1,000" },
    { value: "1000+", label: "$1,000+" },
];
const performanceLevels = [
    { value: "all", label: "All Performance" },
    { value: "high", label: "High Performers" },
    { value: "medium", label: "Medium Performers" },
    { value: "low", label: "Low Performers" },
];

export const defaultFilterState: FilterState = {
    timePeriod: "30",
    location: "All Locations",
    machineType: "All Types",
    status: "All Status",
    category: "All Categories",
    brand: "All Brands",
    sortBy: "revenue",
    sortOrder: "desc",
    revenueRange: "all",
    performanceLevel: "all",
};

export function AdvancedFilters({
    filters,
    onFilterChange,
    locations = defaultLocations,
    machineTypes = defaultMachineTypes,
    categories = defaultCategories,
    brands = defaultBrands,
    showCategoryFilter = false,
    showBrandFilter = false,
    showSortOptions = false,
    showRevenueFilter = false,
    showPerformanceFilter = false,
    className,
    variant = "full",
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const updateFilter = (key: keyof FilterState, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange(defaultFilterState);
    };

    const activeFiltersCount = [
        filters.location !== "All Locations",
        filters.machineType !== "All Types",
        filters.status !== "All Status",
        filters.category !== "All Categories",
        filters.brand !== "All Brands",
        filters.revenueRange !== "all",
        filters.performanceLevel !== "all",
    ].filter(Boolean).length;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
            <div className="flex items-center gap-3 flex-wrap">
                {/* Sort Options - Optionally visible */}
                {showSortOptions && (
                    <div className="flex items-center gap-1">
                        <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
                            <SelectTrigger className="w-[120px]">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <ToggleGroup
                            type="single"
                            value={filters.sortOrder}
                            onValueChange={(v) => v && updateFilter("sortOrder", v)}
                            className="border rounded-md"
                        >
                            <ToggleGroupItem value="asc" aria-label="Ascending" className="px-2">
                                ↑
                            </ToggleGroupItem>
                            <ToggleGroupItem value="desc" aria-label="Descending" className="px-2">
                                ↓
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                )}

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
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                    {/* Primary Filters Row */}
                    <div className="flex flex-wrap gap-3">
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

                    {/* Secondary Filters Row - Conditional */}
                    {(showCategoryFilter || showBrandFilter || showRevenueFilter || showPerformanceFilter) && (
                        <div className="flex flex-wrap gap-3 pt-3 border-t">
                            {/* Category Filter */}
                            {showCategoryFilter && (
                                <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
                                    <SelectTrigger className="w-[160px]">
                                        <Tag className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Brand Filter */}
                            {showBrandFilter && (
                                <Select value={filters.brand} onValueChange={(v) => updateFilter("brand", v)}>
                                    <SelectTrigger className="w-[150px]">
                                        <Layers className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Revenue Range Filter */}
                            {showRevenueFilter && (
                                <Select value={filters.revenueRange} onValueChange={(v) => updateFilter("revenueRange", v)}>
                                    <SelectTrigger className="w-[150px]">
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Revenue Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {revenueRanges.map((range) => (
                                            <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Performance Level Filter */}
                            {showPerformanceFilter && (
                                <Select value={filters.performanceLevel} onValueChange={(v) => updateFilter("performanceLevel", v)}>
                                    <SelectTrigger className="w-[170px]">
                                        <BarChart2 className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Performance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {performanceLevels.map((level) => (
                                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {/* Active Filters Display */}
                    {activeFiltersCount > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t">
                            <span className="text-xs text-muted-foreground self-center">Active:</span>
                            {filters.location !== "All Locations" && (
                                <Badge variant="outline" className="gap-1">
                                    {filters.location}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("location", "All Locations")} />
                                </Badge>
                            )}
                            {filters.machineType !== "All Types" && (
                                <Badge variant="outline" className="gap-1">
                                    {filters.machineType}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("machineType", "All Types")} />
                                </Badge>
                            )}
                            {filters.status !== "All Status" && (
                                <Badge variant="outline" className="gap-1">
                                    {filters.status}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("status", "All Status")} />
                                </Badge>
                            )}
                            {filters.category !== "All Categories" && (
                                <Badge variant="outline" className="gap-1">
                                    {filters.category}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("category", "All Categories")} />
                                </Badge>
                            )}
                            {filters.brand !== "All Brands" && (
                                <Badge variant="outline" className="gap-1">
                                    {filters.brand}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("brand", "All Brands")} />
                                </Badge>
                            )}
                            {filters.revenueRange !== "all" && (
                                <Badge variant="outline" className="gap-1">
                                    {revenueRanges.find(r => r.value === filters.revenueRange)?.label}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("revenueRange", "all")} />
                                </Badge>
                            )}
                            {filters.performanceLevel !== "all" && (
                                <Badge variant="outline" className="gap-1">
                                    {performanceLevels.find(p => p.value === filters.performanceLevel)?.label}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("performanceLevel", "all")} />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

