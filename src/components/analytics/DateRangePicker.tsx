"use client"

import * as React from "react"
import { subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange
    onDateChange?: (date: DateRange | undefined) => void
    footer?: React.ReactNode
}

const presets = [
    {
        label: "Today",
        value: "today",
        getValue: () => ({ from: new Date(), to: new Date() })
    },
    {
        label: "Yesterday",
        value: "yesterday",
        getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })
    },
    {
        label: "Last 7 days",
        value: "last7",
        getValue: () => ({ from: subDays(new Date(), 6), to: new Date() })
    },
    {
        label: "Last 14 days",
        value: "last14",
        getValue: () => ({ from: subDays(new Date(), 13), to: new Date() })
    },
    {
        label: "Last 30 days",
        value: "last30",
        getValue: () => ({ from: subDays(new Date(), 29), to: new Date() })
    },
    {
        label: "This week",
        value: "thisweek",
        getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 0 }), to: endOfWeek(new Date(), { weekStartsOn: 0 }) })
    },
    {
        label: "This month",
        value: "thismonth",
        getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
    },
    {
        label: "Last 6 months",
        value: "last6m",
        getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() })
    },
    {
        label: "Last year",
        value: "last1y",
        getValue: () => ({ from: subYears(new Date(), 1), to: new Date() })
    },
    {
        label: "All Time",
        value: "all",
        getValue: () => ({ from: new Date(2020, 0, 1), to: new Date() })
    }
];

function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function DatePickerWithRange({
    className,
    date,
    onDateChange,
    footer,
}: DatePickerWithRangeProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    const [startDate, setStartDate] = React.useState<Date | null>(date?.from || null);
    const [endDate, setEndDate] = React.useState<Date | null>(date?.to || null);

    // Sync local state with prop when popover opens
    React.useEffect(() => {
        if (isOpen) {
            setStartDate(date?.from || null);
            setEndDate(date?.to || null);
            if (date?.from) {
                setCurrentMonth(new Date(date.from.getFullYear(), date.from.getMonth(), 1));
            }
        }
    }, [isOpen, date]);

    // Initial default
    React.useEffect(() => {
        if (!date?.from) {
            const defaultPreset = presets.find(p => p.value === "last7");
            if (defaultPreset) {
                onDateChange?.(defaultPreset.getValue());
            }
        }
    }, []);

    const handlePresetClick = (getValue: () => DateRange) => {
        const range = getValue();
        onDateChange?.(range);
        setStartDate(range.from || null);
        setEndDate(range.to || null);
        setIsOpen(false);
    };

    const selectDate = (date: Date) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else if (date >= startDate) {
            setEndDate(date);
        } else {
            setStartDate(date);
            setEndDate(null);
        }
    };

    const handleApply = () => {
        if (startDate && endDate) {
            onDateChange?.({ from: startDate, to: endDate });
            setIsOpen(false);
        }
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
            const isStart = startDate && sameDay(dateObj, startDate);
            const isEnd = endDate && sameDay(dateObj, endDate);
            const isInRange = startDate && endDate && dateObj > startDate && dateObj < endDate;

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => selectDate(dateObj)}
                    className={cn(
                        "h-8 w-8 rounded-md text-xs font-normal hover:bg-accent hover:text-accent-foreground focus:outline-none transition-colors",
                        (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                        isInRange && "bg-accent text-accent-foreground rounded-none"
                    )}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const getDisplayText = () => {
        if (!date?.from || !date?.to) return "Select Range";
        return `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`;
    };

    const getSelectedDaysCount = () => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        <span className="truncate">{getDisplayText()}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex flex-col md:flex-row overflow-hidden shadow-xl border-muted/20" align="start">
                    {/* Presets Sidebar */}
                    <div className="w-full md:w-36 border-b md:border-b-0 md:border-r bg-muted/10 p-2 flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-muted-foreground/60 px-2 py-1 uppercase tracking-wider hidden md:block">Presets</div>
                        <div className="flex flex-wrap md:flex-col gap-1">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.value}
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs font-normal h-8 hover:bg-primary/5 hover:text-primary transition-colors flex-1 md:flex-none"
                                    onClick={() => handlePresetClick(preset.getValue)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
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
                                {startDate && endDate
                                    ? `${format(startDate, "MMM dd")} → ${format(endDate, "MMM dd")} (${getSelectedDaysCount()} days)`
                                    : startDate
                                        ? `Selecting end date...`
                                        : "Pick a start date"}
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
                                disabled={!startDate || !endDate}
                            >
                                Apply Range
                            </Button>
                        </div>
                        {footer && (
                            <div className="mt-4 pt-4 border-t border-muted/20">
                                {footer}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
