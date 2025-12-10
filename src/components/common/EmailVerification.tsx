"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sendEmailVerification, User } from "firebase/auth";

interface EmailVerificationProps {
    user: User | null;
    emailVerified: boolean;
    className?: string;
}

export function EmailVerificationBanner({
    user,
    emailVerified,
    className
}: EmailVerificationProps) {
    const [isSending, setIsSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleSendVerification = async () => {
        if (!user || cooldown > 0) return;

        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast.success("Verification email sent!", {
                description: "Please check your inbox and spam folder.",
            });
            // Set 60 second cooldown
            setCooldown(60);
            const interval = setInterval(() => {
                setCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            console.error("Error sending verification email:", error);
            toast.error("Failed to send verification email", {
                description: "Please try again later.",
            });
        } finally {
            setIsSending(false);
        }
    };

    if (emailVerified) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-green-600", className)}>
                <CheckCircle className="h-4 w-4" />
                <span>Email verified</span>
            </div>
        );
    }

    return (
        <Card className={cn("border-amber-200 bg-amber-50 dark:bg-amber-950/20", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base text-amber-800 dark:text-amber-200">
                            Email Not Verified
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                        Action Required
                    </Badge>
                </div>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                    Please verify your email address to access all features.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <Mail className="h-4 w-4" />
                        <span>{user?.email || "No email available"}</span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendVerification}
                        disabled={isSending || cooldown > 0}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry in {cooldown}s
                            </>
                        ) : (
                            <>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Verification Email
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function EmailVerificationStatus({ emailVerified }: { emailVerified: boolean }) {
    if (emailVerified) {
        return (
            <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unverified
        </Badge>
    );
}
