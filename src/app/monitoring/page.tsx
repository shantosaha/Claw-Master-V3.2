import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MonitoringPage() {
    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Real-time Monitoring</h1>
                <p className="text-muted-foreground">
                    Live status updates from all connected machines.
                </p>
            </div>

            <Card className="flex-1 flex items-center justify-center border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                        <div className="relative bg-primary/10 p-6 rounded-full">
                            <Activity className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-semibold">Live Feed Coming Soon</h3>
                        <p className="text-muted-foreground max-w-md">
                            We are currently integrating with the machine telemetry API.
                            Real-time status, voltage readings, and error codes will appear here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
