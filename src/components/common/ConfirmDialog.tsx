"use client";

import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    destructive?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    destructive = false,
}: ConfirmDialogProps) {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (!open) {
            setCountdown(10);
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [open]);

    useEffect(() => {
        if (open && countdown === 0) {
            onOpenChange(false);
        }
    }, [countdown, open, onOpenChange]);

    const isFlashing = countdown <= 5;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className={cn(isFlashing && "border-destructive border-2 animate-pulse")}>
                <AlertDialogHeader>
                    <AlertDialogTitle className={cn(isFlashing && "text-destructive")}>
                        {title} ({countdown}s)
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                        <br />
                        <span className="font-bold mt-2 block">
                            Action will abort automatically in {countdown} seconds.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={cn(destructive && "bg-destructive hover:bg-destructive/90")}
                    >
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
