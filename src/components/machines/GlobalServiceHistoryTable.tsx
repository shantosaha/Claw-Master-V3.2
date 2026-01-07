"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, FileText } from "lucide-react";
import { ServiceReport } from "@/types";
import { serviceReportService } from "@/services/serviceReportService";

export function GlobalServiceHistoryTable() {
    const [reports, setReports] = useState<ServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            try {
                // In a real app we would have a 'getAllReports' method or pagination
                // For now reusing getReports with a generic ID or specific "all" flag if implemented,
                // but since it mocks data based on machineID, we might mock a different set here.
                // Let's create a dedicated global fetch in service or just mock here.

                // Simulating global fetch by combining mocks
                const data = await serviceReportService.getReports("GLOBAL_FETCH");
                setReports(data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            } catch (error) {
                console.error("Failed to fetch service reports", error);
            }
            setIsLoading(false);
        };

        fetchReports();
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading submissions...</div>;
    }

    if (reports.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No service reports found.</div>;
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Tag</TableHead>
                        <TableHead>Machine Name</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead className="text-right">C1</TableHead>
                        <TableHead className="text-right">C2</TableHead>
                        <TableHead className="text-right">C3</TableHead>
                        <TableHead className="text-right">C4</TableHead>
                        <TableHead className="text-right">Payout</TableHead>
                        <TableHead className="text-center">Image</TableHead>
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                                {format(report.timestamp, "MMM dd, HH:mm")}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{report.inflowSku || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>{report.machineName}</TableCell>
                            <TableCell>{report.staffName}</TableCell>
                            <TableCell className="text-right">{report.c1}</TableCell>
                            <TableCell className="text-right">{report.c2}</TableCell>
                            <TableCell className="text-right">{report.c3}</TableCell>
                            <TableCell className="text-right">{report.c4}</TableCell>
                            <TableCell className="text-right">{report.playsPerWin}</TableCell>
                            <TableCell className="text-center">
                                {report.imageUrl ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                                <img
                                                    src={report.imageUrl}
                                                    alt="Thumb"
                                                    className="w-10 h-10 object-cover rounded-sm border"
                                                />
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Service Image - {format(report.timestamp, "MMM dd")}</DialogTitle>
                                            </DialogHeader>
                                            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                                                <img
                                                    src={report.imageUrl}
                                                    alt="Service Report"
                                                    className="object-contain w-full h-full"
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                )}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                {report.remarks ? (
                                    <span className="text-sm truncate block" title={report.remarks}>
                                        {report.remarks}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
