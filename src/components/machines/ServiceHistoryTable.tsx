"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { OptimizedThumbnail } from "@/components/ui/OptimizedImage";

interface ServiceHistoryTableProps {
    machineId: string;
    assetTag?: string;
}

export function ServiceHistoryTable({ machineId, assetTag }: ServiceHistoryTableProps) {
    const [reports, setReports] = useState<ServiceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            try {
                // Fetch all reports and filter by assetTag if provided
                const data = await serviceReportService.getReports("GLOBAL_FETCH");

                // Filter by assetTag (which corresponds to inflowSku in reports)
                const filtered = assetTag
                    ? data.filter(report => {
                        const reportTag = String(report.inflowSku || '').trim().toLowerCase();
                        const machineTag = String(assetTag).trim().toLowerCase();
                        return reportTag === machineTag;
                    })
                    : data;

                setReports(filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            } catch (error) {
                console.error("Failed to fetch service reports", error);
            }
            setIsLoading(false);
        };

        fetchReports();
    }, [machineId, assetTag]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading service history...</div>;
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
                        <TableHead>Staff</TableHead>
                        <TableHead className="text-right">C1</TableHead>
                        <TableHead className="text-right">C2</TableHead>
                        <TableHead className="text-right">C3</TableHead>
                        <TableHead className="text-right">C4</TableHead>
                        <TableHead className="text-right">Win Rate</TableHead>
                        <TableHead className="text-center">Image</TableHead>
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="font-medium">
                                {format(report.timestamp, "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{report.inflowSku || report.machineName}</TableCell>
                            <TableCell>{report.staffName}</TableCell>
                            <TableCell className="text-right">{isNaN(report.c1) ? '-' : report.c1}</TableCell>
                            <TableCell className="text-right">{isNaN(report.c2) ? '-' : report.c2}</TableCell>
                            <TableCell className="text-right">{isNaN(report.c3) ? '-' : report.c3}</TableCell>
                            <TableCell className="text-right">{isNaN(report.c4) ? '-' : report.c4}</TableCell>
                            <TableCell className="text-right">1/{isNaN(report.playPerWin) ? '-' : report.playPerWin}</TableCell>
                            <TableCell className="text-center">
                                {report.imageUrl ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="cursor-pointer hover:opacity-80 transition-opacity inline-block">
                                                <OptimizedThumbnail
                                                    src={report.imageUrl}
                                                    alt="Service Report"
                                                    size={48}
                                                    className="h-12 w-12 rounded-md border shadow-sm object-cover"
                                                />
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-5xl max-h-[90vh]">
                                            <DialogHeader>
                                                <DialogTitle>Service Image - {format(report.timestamp, "MMM dd, yyyy HH:mm")}</DialogTitle>
                                            </DialogHeader>
                                            <div className="relative w-full overflow-hidden rounded-md bg-muted" style={{ height: 'calc(90vh - 120px)' }}>
                                                <Image
                                                    src={report.imageUrl}
                                                    alt="Service Report"
                                                    fill
                                                    className="object-contain"
                                                    priority
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                {report.remarks ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="truncate cursor-pointer hover:text-primary flex items-center gap-1">
                                                <FileText className="h-3 w-3 inline" />
                                                {report.remarks}
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Service Notes</DialogTitle>
                                            </DialogHeader>
                                            <ScrollArea className="h-[200px]">
                                                <p className="text-sm text-foreground leading-relaxed p-4">
                                                    {report.remarks}
                                                </p>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                ) : "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
