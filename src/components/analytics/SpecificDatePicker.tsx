"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

interface SpecificDatePickerProps {
    className?: string
    dates?: Date[]
    onDatesChange?: (dates: Date[]) => void
}

export function SpecificDatePicker({
    className,
    dates = [],
    onDatesChange,
}: SpecificDatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    const [localDates, setLocalDates] = React.useState<Date[]>([]);

    // Sync local state with prop when popover opens
    React.useEffect(() => {
        if (isOpen) {
            setLocalDates([...dates]);
            if (dates.length > 0) {
                // Sort to find latest and set month there if needed, or just keep current
                const latest = dates.sort((a, b) => b.getTime() - a.getTime())[0];
                setCurrentMonth(new Date(latest.getFullYear(), latest.getMonth(), 1));
            }
        }
    }, [isOpen, dates]);

    const toggleDate = (date: Date) => {
        const index = localDates.findIndex(d => sameDay(d, date));
        if (index > -1) {
            setLocalDates(prev => prev.filter((_, i) => i !== index));
        } else {
            setLocalDates(prev => [...prev, date]);
        }
    };

    const handleApply = () => {
        onDatesChange?.(localDates);
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, month, day);
            const isSelected = localDates.some(d => sameDay(d, dateObj));

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => toggleDate(dateObj)}
                    className={cn(
                        "h-8 w-8 rounded-md text-xs font-normal hover:bg-accent hover:text-accent-foreground focus:outline-none transition-colors",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const getDisplayText = () => {
        if (dates.length === 0) return "Select Specific Dates";
        if (dates.length === 1) return format(dates[0], "MMM dd, yyyy");
        return `${dates.length} dates selected`;
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal h-9",
                            dates.length === 0 && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        <span className="truncate">{getDisplayText()}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex flex-row overflow-hidden shadow-xl border-muted/20" align="start">
                    {/* Sidebar (Empty or helpful tips for specific mode) */}
                    <div className="w-36 border-r bg-muted/10 p-2 flex flex-col gap-2">
                        <div className="text-[10px] font-semibold text-muted-foreground/60 px-2 py-1 uppercase tracking-wider">Selection</div>
                        <p className="text-[10px] text-muted-foreground px-2 leading-relaxed italic">
                            Select multiple individual dates to compare them side-by-side.
                        </p>
                        <div className="mt-auto p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-[10px] h-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setLocalDates([])}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Area */}
                    <div className="p-4 bg-background">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-semibold">
                                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Status bar */}
                        <div className="h-8 mb-2 flex items-center justify-center bg-muted/20 rounded-md">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                                {localDates.length === 0
                                    ? "Select your dates"
                                    : `${localDates.length} days selected`}
                            </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                <div key={day} className="h-8 w-8 text-center text-[10px] font-bold text-muted-foreground/50 flex items-center justify-center uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-muted/20">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-[11px] h-8"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 text-[11px] h-8 shadow-sm"
                                onClick={handleApply}
                            >
                                Apply Dates
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
