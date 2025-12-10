"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "claw-master-cookie-consent";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Delay showing the banner for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
                setIsAnimating(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
            accepted: true,
            timestamp: new Date().toISOString(),
        }));
        setIsAnimating(false);
        setTimeout(() => setIsVisible(false), 300);
    };

    const handleDecline = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
            accepted: false,
            timestamp: new Date().toISOString(),
        }));
        setIsAnimating(false);
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-300",
                isAnimating ? "translate-y-0" : "translate-y-full"
            )}
        >
            <div className="container max-w-4xl mx-auto">
                <div className="relative bg-background border rounded-lg shadow-lg p-4 sm:p-6">
                    <button
                        onClick={handleDecline}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close cookie banner"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-shrink-0 hidden sm:block">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Cookie className="h-6 w-6 text-primary" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 sm:space-y-1 pr-6 sm:pr-0">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Cookie className="h-4 w-4 sm:hidden" />
                                Cookie Notice
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                We use essential cookies for authentication and session management.
                                By continuing to use this application, you agree to our{" "}
                                <Link href="/privacy" className="text-primary hover:underline">
                                    Privacy Policy
                                </Link>
                                {" "}and{" "}
                                <Link href="/terms" className="text-primary hover:underline">
                                    Terms of Service
                                </Link>.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDecline}
                                className="w-full sm:w-auto"
                            >
                                Decline
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleAccept}
                                className="w-full sm:w-auto"
                            >
                                Accept
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CookieConsent;
