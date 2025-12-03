import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = 'list' | 'grid' | 'compact';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    return (
        <div className="flex items-center border rounded-md p-1 bg-muted/20">
            <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", currentView === 'list' && "bg-background shadow-sm")}
                onClick={() => onViewChange('list')}
                title="List View"
            >
                <LayoutList className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", currentView === 'grid' && "bg-background shadow-sm")}
                onClick={() => onViewChange('grid')}
                title="Grid View"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", currentView === 'compact' && "bg-background shadow-sm")}
                onClick={() => onViewChange('compact')}
                title="Compact Grid"
            >
                <Grid3X3 className="h-4 w-4" />
            </Button>
        </div>
    );
}
