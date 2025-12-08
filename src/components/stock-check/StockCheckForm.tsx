"use client";

import { useEffect, useState } from "react";
import { machineService, stockService, maintenanceService } from "@/services";
import { ArcadeMachine, StockItem } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/services/auditLogger";

export function StockCheckForm() {
    const { user } = useAuth();
    const [machines, setMachines] = useState<ArcadeMachine[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [checks, setChecks] = useState<Record<string, boolean>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        let unsubscribeMachines: (() => void) | undefined;

        // Subscribe to real-time machine updates
        if (typeof (machineService as any).subscribe === 'function') {
            unsubscribeMachines = (machineService as any).subscribe((data: ArcadeMachine[]) => {
                setMachines(data);
                setLoading(false);
            });
        }

        // Initial load
        loadData();

        return () => {
            if (unsubscribeMachines) unsubscribeMachines();
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await machineService.getAll();
            setMachines(data);
        } catch (error) {
            console.error("Failed to load machines:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = (machineId: string, checked: boolean) => {
        setChecks(prev => ({ ...prev, [machineId]: checked }));
    };

    const handleNoteChange = (machineId: string, note: string) => {
        setNotes(prev => ({ ...prev, [machineId]: note }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            // In a real app, we would create a "StockCheckReport" document.
            // For now, we'll just log it.
            const report = {
                checkedMachines: Object.keys(checks).filter(id => checks[id]),
                notes,
                submittedBy: user.uid,
                timestamp: new Date(),
            };

            await logAction(
                user.uid,
                "create",
                "stock", // Using 'stock' as entity type
                "REPORT-" + Date.now(),
                "Submitted Weekly Stock Check",
                null,
                report
            );

            // Create maintenance tasks for machines with notes
            const machinesWithIssues = Object.keys(notes).filter(id => notes[id] && notes[id].trim() !== "");
            for (const machineId of machinesWithIssues) {
                await maintenanceService.add({
                    machineId,
                    description: `Stock Check Issue: ${notes[machineId]}`,
                    priority: "medium",
                    status: "open",
                    createdBy: user.uid,
                    createdAt: new Date(),
                } as any);
            }


            alert("Stock check submitted successfully!");
            // Reset form
            setChecks({});
            setNotes({});
        } catch (error) {
            console.error("Failed to submit stock check:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading checklist...</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {machines.map((machine) => (
                    <Card key={machine.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex justify-between items-center">
                                {machine.name}
                                <Checkbox
                                    checked={checks[machine.id] || false}
                                    onCheckedChange={(checked) => handleCheck(machine.id, checked as boolean)}
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-2">
                                {machine.location} • {machine.assetTag}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`note-${machine.id}`} className="text-xs">Notes / Issues</Label>
                                <Input
                                    id={`note-${machine.id}`}
                                    placeholder="e.g., Low plush, coin jam..."
                                    value={notes[machine.id] || ""}
                                    onChange={(e) => handleNoteChange(machine.id, e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end sticky bottom-4 bg-background p-4 border-t shadow-lg rounded-lg">
                <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Stock Check"}
                </Button>
            </div>
        </div>
    );
}
