"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SingleDatePickerProps {
    date?: Date
    onDateChange?: (date: Date | undefined) => void
    className?: string
    placeholder?: string
}

const presets = [
    {
        label: "Today",
        getValue: () => new Date()
    },
    {
        label: "Yesterday",
        getValue: () => subDays(new Date(), 1)
    },
    {
        label: "In 7 Days",
        getValue: () => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        }
    }
];

export function SingleDatePicker({
    date,
    onDateChange,
    className,
    placeholder = "Pick a date"
}: SingleDatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (newDate: Date | undefined) => {
        onDateChange?.(newDate);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "MMM dd, yyyy") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    {/* Optional Presets Sidebar - simplified for single date */}
                    <div className="w-32 border-r bg-muted/10 p-2 flex flex-col gap-1">
                        <div className="text-[10px] font-semibold text-muted-foreground/60 px-2 py-1 uppercase tracking-wider">
                            Quick Select
                        </div>
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-xs font-normal h-8 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                                onClick={() => handleSelect(preset.getValue())}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    <div className="p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleSelect}
                            initialFocus
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
