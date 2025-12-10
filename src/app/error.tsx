"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="p-4 bg-red-100 dark:bg-red-950/30 rounded-full mb-6">
                <AlertCircle className="h-12 w-12 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
            <p className="text-muted-foreground mb-2 max-w-md">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {error.digest && (
                <p className="text-xs text-muted-foreground mb-6">
                    Error ID: {error.digest}
                </p>
            )}

            <div className="flex gap-4">
                <Button onClick={reset}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/">
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
