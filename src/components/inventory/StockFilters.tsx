"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List as ListIcon, Grip, FilterX } from "lucide-react";

export type ViewStyle = "grid" | "list" | "compact-grid";
export type SortOption = "name-asc" | "name-desc" | "qty-asc" | "qty-desc" | "date-new" | "date-old";
export type StockStatusFilter = "all" | "low" | "out" | "limited" | "in-stock-not-low";

interface StockFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: string[];
    sortOrder: SortOption;
    onSortChange: (value: SortOption) => void;
    stockStatus: StockStatusFilter;
    onStatusChange: (value: StockStatusFilter) => void;
    viewStyle: ViewStyle;
    onViewStyleChange: (value: ViewStyle) => void;
    selectedSize: string;
    onSizeChange: (value: string) => void;
    sizes: (string | undefined)[];
    selectedBrand: string;
    onBrandChange: (value: string) => void;
    brands: (string | undefined)[];
    onResetFilters: () => void;
    assignedStatusFilter: string;
    onAssignedStatusChange: (value: string) => void;
}

export function StockFilters({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories,
    sortOrder,
    onSortChange,
    stockStatus,
    onStatusChange,
    viewStyle,
    onViewStyleChange,
    selectedSize,
    onSizeChange,
    sizes,
    selectedBrand,
    onBrandChange,
    brands,
    onResetFilters,
    assignedStatusFilter,
    onAssignedStatusChange,
}: StockFiltersProps) {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <Select value={sortOrder} onValueChange={(v) => onSortChange(v as SortOption)}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-new">Newest First</SelectItem>
                        <SelectItem value="date-old">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="qty-asc">Qty (Low-High)</SelectItem>
                        <SelectItem value="qty-desc">Qty (High-Low)</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={stockStatus} onValueChange={(v) => onStatusChange(v as StockStatusFilter)}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="out">Out of Stock</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                        <SelectItem value="limited">Limited Stock</SelectItem>
                        <SelectItem value="in-stock-not-low">In Stock</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={selectedSize} onValueChange={onSizeChange}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Sizes</SelectItem>
                        {sizes.filter(Boolean).map((size) => (
                            <SelectItem key={size} value={size!}>{size}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedBrand} onValueChange={onBrandChange}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Brands</SelectItem>
                        {brands.filter(Boolean).map((brand) => (
                            <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={assignedStatusFilter} onValueChange={onAssignedStatusChange}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Assigned" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="not-assigned">Not Assigned</SelectItem>
                        <SelectItem value="assigned">Using</SelectItem>
                        <SelectItem value="assigned-for-replacement">Replacement</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetFilters}
                    className="gap-2"
                >
                    <FilterX className="h-4 w-4" />
                    Reset Filters
                </Button>


                <div className="flex items-center border rounded-md">
                    <Button
                        variant={viewStyle === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-r-none"
                        onClick={() => onViewStyleChange('list')}
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewStyle === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-none border-l border-r"
                        onClick={() => onViewStyleChange('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewStyle === 'compact-grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-l-none"
                        onClick={() => onViewStyleChange('compact-grid')}
                    >
                        <Grip className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
