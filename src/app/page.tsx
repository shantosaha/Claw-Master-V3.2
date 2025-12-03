"use client";

import { useEffect, useState } from "react";
import { machineService, stockService, maintenanceService, orderService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Box, Wrench, Users, Trophy, PlayCircle, Bell } from "lucide-react";
import Link from "next/link";
import { where } from "firebase/firestore";
import { DEMO_METRICS, DEMO_ALERTS, DEMO_MAINTENANCE } from "@/lib/demoData";
import { isFirebaseInitialized } from "@/lib/firebase";
import { MachinePerformanceChart } from "@/components/analytics/MachinePerformanceChart";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMachines: 0,
    lowStockItems: 0,
    openTickets: 0,
    pendingOrders: 0,
    dailyPlays: 0,
    popularCategory: "-",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (!isFirebaseInitialized) {
        setStats({
          totalMachines: DEMO_METRICS.activeMachines,
          lowStockItems: DEMO_METRICS.lowStockItems,
          openTickets: DEMO_METRICS.openTickets,
          pendingOrders: DEMO_METRICS.pendingOrders,
          dailyPlays: DEMO_METRICS.dailyPlays,
          popularCategory: DEMO_METRICS.popularCategory,
        });
        setLoading(false);
        return;
      }

      // Parallel data fetching
      const [machines, stock, tickets, orders] = await Promise.all([
        machineService.getAll(),
        stockService.getAll(),
        maintenanceService.query(where("status", "!=", "resolved")),
        orderService.query(where("status", "==", "submitted")),
      ]);

      const lowStock = stock.filter(item => {
        const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
        return totalQty <= item.lowStockThreshold;
      }).length;

      setStats({
        totalMachines: machines.length,
        lowStockItems: lowStock,
        openTickets: tickets.length,
        pendingOrders: orders.length,
        dailyPlays: 0, // Placeholder for real logic
        popularCategory: "-", // Placeholder for real logic
      });
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of arcade operations and alerts.
        </p>
      </div>

      {/* Top Row: Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/machines">
          <Card className="hover:scale-105 transition-transform cursor-pointer border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-50">Total Machines</CardTitle>
              <Activity className="h-4 w-4 text-blue-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : stats.totalMachines}</div>
              <p className="text-xs text-blue-100">
                Active units on floor
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory">
          <Card className="hover:scale-105 transition-transform cursor-pointer border-none shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-50">Low Stock Alerts</CardTitle>
              <Box className="h-4 w-4 text-orange-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "-" : stats.lowStockItems}
              </div>
              <p className="text-xs text-orange-100">
                Items below threshold
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-50">Daily Plays</CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.dailyPlays}</div>
            <p className="text-xs text-purple-100">
              Total games played today
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-yellow-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-50">Popular Category</CardTitle>
            <Trophy className="h-4 w-4 text-amber-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.popularCategory}</div>
            <p className="text-xs text-amber-100">
              Most played game type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Charts & Alerts */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4">
          <MachinePerformanceChart />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_ALERTS.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />}
                  {alert.type === 'error' && <Box className="h-5 w-5 text-red-500 mt-0.5" />}
                  {alert.type === 'info' && <Activity className="h-5 w-5 text-blue-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Technician Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Technician Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Task</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Machine</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Priority</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_MAINTENANCE.map((task) => (
                  <tr key={task.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{task.description}</td>
                    <td className="p-4 align-middle">{task.machineId}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 align-middle capitalize">{task.status}</td>
                    <td className="p-4 align-middle text-right">{task.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
