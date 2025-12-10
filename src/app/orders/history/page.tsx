"use client";

import { useEffect, useState } from "react";
import { orderService, stockService } from "@/services";
import { ReorderRequest, StockItem } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<ReorderRequest[]>([]);
    const [stockItems, setStockItems] = useState<Record<string, StockItem>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeStock: (() => void) | undefined;

        // Type for service with optional subscribe method
        type ServiceWithSubscribe<T> = {
            subscribe?: (callback: (data: T[]) => void) => () => void;
        };
        const stockSvc = stockService as unknown as ServiceWithSubscribe<StockItem>;

        // Subscribe to real-time stock updates
        if (typeof stockSvc.subscribe === 'function') {
            unsubscribeStock = stockSvc.subscribe((stockData: StockItem[]) => {
                const stockMap: Record<string, StockItem> = {};
                stockData.forEach(item => {
                    stockMap[item.id] = item;
                });
                setStockItems(stockMap);
            });
        }

        // Initial load
        loadData();

        return () => {
            if (unsubscribeStock) unsubscribeStock();
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, stockData] = await Promise.all([
                orderService.getAll(),
                stockService.getAll(),
            ]);

            // Sort by date desc
            const sortedOrders = ordersData.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any).toDate();
                const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any).toDate();
                return dateB.getTime() - dateA.getTime();
            });

            setOrders(sortedOrders);

            const stockMap: Record<string, StockItem> = {};
            stockData.forEach(item => {
                stockMap[item.id] = item;
            });
            setStockItems(stockMap);

        } catch (error) {
            console.error("Failed to load order history:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string): "destructive" | "default" | "secondary" | "outline" => {
        switch (status) {
            case "submitted": return "secondary";
            case "approved": return "default"; // Blue/Primary
            case "ordered": return "outline";
            case "received": return "default"; // Green usually, but default is fine
            case "fulfilled": return "default";
            case "rejected": return "destructive";
            default: return "secondary";
        }
    };

    if (loading) return <div>Loading history...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">Order History</h1>
                <p className="text-muted-foreground">
                    View all past reorder requests.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Requested By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell className="font-medium">
                                            {order.itemName || (order.itemId ? stockItems[order.itemId]?.name : "Unknown Item")}
                                        </TableCell>
                                        <TableCell>{order.quantityRequested}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(order.status)} className="capitalize">
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{order.requestedBy}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
