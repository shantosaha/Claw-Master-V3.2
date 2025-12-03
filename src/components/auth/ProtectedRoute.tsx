"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@/types";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/"); // Redirect to login/home
            } else if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
                router.push("/"); // Or unauthorized page
                alert("You do not have permission to view this page.");
            }
        }
    }, [user, userProfile, loading, allowedRoles, router]);

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    if (!user) return null;
    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) return null;

    return <>{children}</>;
}
