"use client";

import { RevenueChart } from "@/components/analytics/RevenueChart";
import { MachinePerformanceChart } from "@/components/analytics/MachinePerformanceChart";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AnalyticsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
                        <p className="text-muted-foreground">
                            Performance metrics and revenue trends.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <RevenueChart />
                    <MachinePerformanceChart />
                </div>
            </div>
        </ProtectedRoute>
    );
}
