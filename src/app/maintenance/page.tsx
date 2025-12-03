import { MaintenanceDashboard } from "@/components/maintenance/MaintenanceDashboard";

export default function MaintenancePage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Maintenance</h1>
                    <p className="text-muted-foreground">
                        Track repairs, machine issues, and service requests.
                    </p>
                </div>
            </div>
            <MaintenanceDashboard />
        </div>
    );
}
