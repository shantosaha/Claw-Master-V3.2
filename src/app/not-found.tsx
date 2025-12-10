"use client";

import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="relative mb-8">
                {/* Arcade machine illustration */}
                <div className="w-32 h-40 bg-gradient-to-b from-purple-500 to-purple-700 rounded-t-xl relative">
                    <div className="absolute inset-4 bg-slate-800 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-400 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-36 h-4 bg-purple-800 rounded-b-lg" />
                </div>
                <div className="text-6xl font-bold text-purple-600 mt-4">404</div>
            </div>

            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                Oops! This page seems to have wandered off. The machine you&apos;re looking for
                might have been moved or doesn&apos;t exist.
            </p>

            <div className="flex gap-4">
                <Button asChild>
                    <Link href="/">
                        <Home className="h-4 w-4 mr-2" />
                        Go to Dashboard
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/inventory">
                        View Inventory
                    </Link>
                </Button>
            </div>
        </div>
    );
}
