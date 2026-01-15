"use client";

import { useEffect, useState } from "react";
import { maintenanceService, orderService } from "@/services";
import { useData } from "@/context/DataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Box, Wrench, Trophy, PlayCircle, Bell, DollarSign, TrendingUp, CreditCard, Banknote, Info } from "lucide-react";
import Link from "next/link";
import { where } from "firebase/firestore";
import { isFirebaseInitialized } from "@/lib/firebase";
import { MachinePerformanceChart } from "@/components/analytics/MachinePerformanceChart";
import { gameReportApiService } from "@/services/gameReportApiService";
import { revenueApiService, RevenueSummary } from "@/services/revenueApiService";
import { monitoringService, MonitoringAlert } from "@/services/monitoringService";
import { MaintenanceTask } from "@/types";

export default function Dashboard() {
  const { items, machines, itemsLoading, machinesLoading } = useData();

  const [stats, setStats] = useState({
    totalMachines: 0,
    lowStockItems: 0,
    openTickets: 0,
    pendingOrders: 0,
    dailyPlays: 0,
    totalRevenue: 0,
    popularCategory: "-",
  });
  const [loading, setLoading] = useState(true);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);

  // Calculate stats from context data and APIs
  useEffect(() => {
    const calculateStats = async () => {
      if (itemsLoading || machinesLoading) return;

      try {
        // Fetch Game Report data for today
        const gameReportPromise = gameReportApiService.fetchTodayReport();
        const revenuePromise = revenueApiService.fetchTodayRevenue();

        const lowStock = items.filter(item => {
          const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
          return totalQty <= item.lowStockThreshold;
        }).length;

        // Base stats
        let baseStats = {
          totalMachines: machines.length,
          lowStockItems: lowStock,
          openTickets: 0,
          pendingOrders: 0,
          dailyPlays: 0,
          totalRevenue: 0,
          popularCategory: "-",
        };

        // Fetch real maintenance tasks and orders
        if (isFirebaseInitialized) {
          const [tickets, orders, tasks] = await Promise.all([
            maintenanceService.query(where("status", "!=", "resolved")),
            orderService.query(where("status", "==", "submitted")),
            maintenanceService.getAll(),
          ]);
          baseStats.openTickets = tickets.length;
          baseStats.pendingOrders = orders.length;
          setMaintenanceTasks(tasks.slice(0, 5)); // Show latest 5 tasks
        }

        // Get real alerts from monitoring service
        const currentAlerts = monitoringService.getAlerts();
        setAlerts(currentAlerts);

        // Wait for API data
        const [gameReportData, revenueData] = await Promise.all([gameReportPromise, revenuePromise]);

        // Process Game Report data
        if (gameReportData.length > 0) {
          baseStats.dailyPlays = gameReportApiService.calculateTotalPlays(gameReportData);
          const topGroup = gameReportApiService.getMostPopularGroup(gameReportData);
          if (topGroup) {
            // Extract short name (e.g., "Group 4-Cranes" -> "Cranes")
            baseStats.popularCategory = topGroup.split('-')[1] || topGroup;
          }
        }

        // Process Revenue data
        if (revenueData.length > 0) {
          const summary = revenueApiService.calculateSummary(revenueData);
          baseStats.totalRevenue = summary.grandTotal;
          setRevenueSummary(summary);
        }

        setStats(baseStats);
      } catch (error) {
        console.error("Failed to calculate dashboard stats:", error);
        // Set to zero/empty on error - no demo fallback
        setStats({
          totalMachines: machines.length,
          lowStockItems: 0,
          openTickets: 0,
          pendingOrders: 0,
          dailyPlays: 0,
          totalRevenue: 0,
          popularCategory: "-",
        });
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [items, machines, itemsLoading, machinesLoading]);

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

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-50">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-emerald-100">
              Store total for today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Section */}
      {revenueSummary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Revenue</CardTitle>
              <Banknote className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${revenueSummary.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Card Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${revenueSummary.totalCard.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">POS Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${revenueSummary.posTotals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Cash: ${revenueSummary.posTotals.cash.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">iTeller Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${revenueSummary.tellerTotals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Cash: ${revenueSummary.tellerTotals.cash.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      )}

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
              {alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground p-4 text-center justify-center">
                  <Info className="h-4 w-4" />
                  <span>No alerts at this time</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                    {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />}
                    {alert.type === 'error' && <Box className="h-5 w-5 text-red-500 mt-0.5" />}
                    {alert.type === 'info' && <Activity className="h-5 w-5 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
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
          {maintenanceTasks.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground p-4 text-center justify-center">
              <Info className="h-4 w-4" />
              <span>No maintenance tasks</span>
            </div>
          ) : (
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
                  {maintenanceTasks.map((task) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
