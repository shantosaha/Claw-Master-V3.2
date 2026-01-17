"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BaseFieldProps {
    label: string;
    value: string | number | undefined;
    onSave: (newValue: string) => Promise<void>;
    disabled?: boolean;
    className?: string;
}

interface TextFieldProps extends BaseFieldProps {
    type: "text" | "number" | "textarea";
}

interface SelectFieldProps extends BaseFieldProps {
    type: "select";
    options: { label: string; value: string }[];
}

type InlineEditFieldProps = TextFieldProps | SelectFieldProps;

export function InlineEditField(props: InlineEditFieldProps) {
    const { label, value, onSave, disabled = false, className = "" } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(String(value ?? ""));
    const [isSaving, setIsSaving] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customValue, setCustomValue] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        setEditValue(String(value ?? ""));
    }, [value]);

    const handleSave = async () => {
        const finalValue = showCustomInput ? customValue.trim() : editValue;

        if (!finalValue && showCustomInput) return; // Don't save empty custom value

        if (finalValue === String(value ?? "") && !showCustomInput) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(finalValue);
            setIsEditing(false);
            setShowCustomInput(false);
            setCustomValue("");
        } catch (error) {
            console.error("Failed to save:", error);
            // Revert on error
            setEditValue(String(value ?? ""));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(String(value ?? ""));
        setIsEditing(false);
        setShowCustomInput(false);
        setCustomValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && props.type !== "textarea") {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (disabled) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-sm text-foreground">{value || "-"}</span>
            </div>
        );
    }



    if (isEditing) {
        if (props.type === "select") {
            return (
                <div className={`flex flex-col gap-1 ${className}`}>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                        {showCustomInput ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    value={customValue}
                                    onChange={(e) => setCustomValue(e.target.value)}
                                    placeholder="Enter custom value..."
                                    className="h-8 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSave();
                                        } else if (e.key === "Escape") {
                                            setShowCustomInput(false);
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <Select
                                value={editValue}
                                onValueChange={(val) => {
                                    if (val === "__custom__") {
                                        setShowCustomInput(true);
                                        setCustomValue("");
                                    } else {
                                        setEditValue(val);
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {props.options.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <X className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            );
        }

        if (props.type === "textarea") {
            return (
                <div className={`flex flex-col gap-1 ${className}`}>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <div className="flex flex-col gap-2">
                        <Textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="min-h-[80px] text-sm"
                            disabled={isSaving}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                <Check className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        // Text or Number input
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type={props.type === "number" ? "number" : "text"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm"
                        disabled={isSaving}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        <X className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    }

    // Display mode with edit trigger
    const displayValue = props.type === "select"
        ? ((props as SelectFieldProps).options.find(o => o.value === String(value))?.label || value)
        : (typeof value === 'number' && isNaN(value) ? '-' : value);

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div
                className="group flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 -mx-2 transition-colors"
                onClick={() => setIsEditing(true)}
            >
                <span className="text-sm text-foreground flex-1">{displayValue || "-"}</span>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
        </div>
    );
}
