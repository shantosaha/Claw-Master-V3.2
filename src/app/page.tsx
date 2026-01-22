"use client";

import { useEffect, useState } from "react";
import { maintenanceService, orderService } from "@/services";
import { useData } from "@/context/DataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, AlertTriangle, Box, Wrench, Trophy, PlayCircle, Bell, DollarSign, TrendingUp, CreditCard, Banknote, Info, Gift, Percent, ArrowUpRight, Receipt, BarChart3, Gamepad2, Target } from "lucide-react";
import Link from "next/link";
import { where } from "firebase/firestore";
import { isFirebaseInitialized } from "@/lib/firebase";
import { MachinePerformanceChart } from "@/components/analytics/MachinePerformanceChart";
import { MachineRevenueChart } from "@/components/analytics/MachineRevenueChart";
import { gameReportApiService, GameReportItem } from "@/services/gameReportApiService";
import { revenueApiService, RevenueSummary } from "@/services/revenueApiService";
import { monitoringService, MonitoringAlert } from "@/services/monitoringService";
import { MaintenanceTask } from "@/types";
import { RevenueScopeDialog } from "@/components/dashboard/RevenueScopeDialog";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";

export default function Dashboard() {
  const {
    items,
    machines,
    itemsLoading,
    machinesLoading,
    todayGameReports,
    todayRevenue,
    apisLoading
  } = useData();

  const [stats, setStats] = useState({
    totalMachines: 0,
    lowStockItems: 0,
    openTickets: 0,
    pendingOrders: 0,
    dailyPlays: 0,
    totalRevenue: 0,
    popularCategory: "-",
    // New game report stats
    totalWins: 0,
    gameRevenue: 0,
    gameCashRev: 0,
    gameBonusRev: 0,
    empPlays: 0,
    winRate: 0,
    activeMachines: 0,
  });
  const [loading, setLoading] = useState(true);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [revenueScopeOpen, setRevenueScopeOpen] = useState(false);
  const [gameReportStats, setGameReportStats] = useState<{
    byGroup: { group: string; plays: number; revenue: number; wins: number }[];
    topMachines: GameReportItem[];
  }>({ byGroup: [], topMachines: [] });

  // List view filter states
  const [listLocationFilter, setListLocationFilter] = useState<string>('all');
  const [listGroupFilter, setListGroupFilter] = useState<string>('all');
  const [listSubGroupFilter, setListSubGroupFilter] = useState<string>('all');

  // Calculate stats from context data and APIs
  useEffect(() => {
    const calculateStats = async () => {
      // Don't wait for apisLoading here, we'll process data when it arrives
      if (itemsLoading || machinesLoading) return;

      try {
        const gameReportData = todayGameReports;
        const revenueData = todayRevenue;

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
          // New game report stats initialized
          totalWins: 0,
          gameRevenue: 0,
          gameCashRev: 0,
          gameBonusRev: 0,
          empPlays: 0,
          winRate: 0,
          activeMachines: 0,
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

        // Process Game Report data
        if (gameReportData.length > 0) {
          baseStats.dailyPlays = gameReportApiService.calculateTotalPlays(gameReportData);
          baseStats.gameRevenue = gameReportApiService.calculateTotalRevenue(gameReportData);

          // Calculate additional game report stats
          let totalWins = 0;
          let totalCashRev = 0;
          let totalBonusRev = 0;
          let totalEmpPlays = 0;
          const groupMap = new Map<string, { plays: number; revenue: number; wins: number }>();

          for (const item of gameReportData) {
            totalWins += item.merchandise || 0;
            totalCashRev += item.cashRev || 0;
            totalBonusRev += item.bonusRev || 0;
            totalEmpPlays += item.empPlays || 0;

            // Group breakdown
            const existing = groupMap.get(item.group) || { plays: 0, revenue: 0, wins: 0 };
            groupMap.set(item.group, {
              plays: existing.plays + item.standardPlays + item.empPlays,
              revenue: existing.revenue + item.totalRev,
              wins: existing.wins + (item.merchandise || 0),
            });
          }

          baseStats.totalWins = totalWins;
          baseStats.gameCashRev = totalCashRev;
          baseStats.gameBonusRev = totalBonusRev;
          baseStats.empPlays = totalEmpPlays;
          baseStats.activeMachines = gameReportData.length;
          baseStats.winRate = baseStats.dailyPlays > 0
            ? (totalWins / baseStats.dailyPlays) * 100
            : 0;

          // Set group breakdown
          const byGroup = Array.from(groupMap.entries())
            .map(([group, data]) => ({ group, ...data }))
            .sort((a, b) => b.plays - a.plays);

          // Top performing machines
          const topMachines = [...gameReportData]
            .sort((a, b) => b.totalRev - a.totalRev)
            .slice(0, 5);

          setGameReportStats({ byGroup, topMachines });

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
          totalWins: 0,
          gameRevenue: 0,
          gameCashRev: 0,
          gameBonusRev: 0,
          empPlays: 0,
          winRate: 0,
          activeMachines: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [items, machines, itemsLoading, machinesLoading, todayGameReports, todayRevenue]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of arcade operations and alerts.
        </p>
      </div>

      {/* Top Row: Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

      {/* Second Row: Game Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wins</CardTitle>
            <Gift className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {loading ? "-" : stats.totalWins.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Prizes dispensed today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {loading ? "-" : `${stats.winRate.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">Wins per play</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Game Revenue</CardTitle>
            <Gamepad2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              ${loading ? "-" : stats.gameRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">Cash: ${stats.gameCashRev.toFixed(0)}</span>
              <span className="text-blue-600">Bonus: ${stats.gameBonusRev.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-lime-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Machines</CardTitle>
            <BarChart3 className="h-4 w-4 text-lime-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600">
              {loading ? "-" : stats.activeMachines}
            </div>
            <p className="text-xs text-muted-foreground">
              Reporting today • {stats.empPlays > 0 && <span className="text-amber-600">Emp: {stats.empPlays}</span>}
            </p>
          </CardContent>
        </Card>

        {/* Revenue Scope Button */}
        <Card
          className="border-none shadow-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setRevenueScopeOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-50">Revenue Scope</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-100" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              <span className="font-semibold">View Details</span>
            </div>
            <p className="text-xs text-emerald-100 mt-1">Complete revenue analytics</p>
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

      {/* Top Row: Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-full">
          <MachinePerformanceChart data={todayGameReports} className="h-full" />
        </div>
        <div className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top Performing Machines
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue Chart</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-0">
                  {/* List View Filters */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    <Select value={listLocationFilter} onValueChange={setListLocationFilter}>
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-semibold">All Floors</SelectItem>
                        <SelectItem value="basement" className="text-xs">Basement</SelectItem>
                        <SelectItem value="ground" className="text-xs">Ground</SelectItem>
                        <SelectItem value="level1" className="text-xs">Level 1</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={listGroupFilter} onValueChange={(v) => { setListGroupFilter(v); setListSubGroupFilter('all'); }}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-semibold">All Groups</SelectItem>
                        {Array.from(new Set(todayGameReports.map(i => i.group).filter(Boolean))).sort().map(group => (
                          <SelectItem key={group} value={group} className="text-xs">
                            {group.split('-')[1] || group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {listGroupFilter !== 'all' && (() => {
                      const subGroups = Array.from(new Set(
                        todayGameReports
                          .filter(i => i.group === listGroupFilter && i.subGroup)
                          .map(i => i.subGroup)
                      )).sort();
                      return subGroups.length > 0 && (
                        <Select value={listSubGroupFilter} onValueChange={setListSubGroupFilter}>
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="SubGroup" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs font-semibold">All SubGroups</SelectItem>
                            {subGroups.map(subGroup => (
                              <SelectItem key={subGroup} value={subGroup!} className="text-xs">
                                {subGroup}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      let filtered = [...todayGameReports];

                      // Apply location filter
                      if (listLocationFilter !== 'all') {
                        if (listLocationFilter === 'basement') {
                          filtered = filtered.filter(m =>
                            m.location?.toLowerCase().includes('basement') ||
                            m.location?.toLowerCase() === 'bm' ||
                            m.description?.includes('BM')
                          );
                        } else if (listLocationFilter === 'ground') {
                          filtered = filtered.filter(m =>
                            m.location?.toLowerCase().includes('ground') ||
                            m.location?.toLowerCase() === 'g' ||
                            m.description?.endsWith(' G')
                          );
                        } else if (listLocationFilter === 'level1') {
                          filtered = filtered.filter(m =>
                            m.location?.toLowerCase().includes('level') ||
                            m.location?.toLowerCase() === 'l1' ||
                            m.description?.includes('L1')
                          );
                        }
                      }

                      // Apply group filter
                      if (listGroupFilter !== 'all') {
                        filtered = filtered.filter(m => m.group === listGroupFilter);
                      }

                      // Apply subgroup filter
                      if (listSubGroupFilter !== 'all') {
                        filtered = filtered.filter(m => m.subGroup === listSubGroupFilter);
                      }

                      // Sort by revenue and slice top 5
                      const topFiltered = filtered
                        .sort((a, b) => b.totalRev - a.totalRev)
                        .slice(0, 5);

                      return topFiltered.length > 0 ? topFiltered.map((machine, index) => {
                        const machineData = machines.find(m => String(m.tag) === String(machine.tag) || m.assetTag === machine.assetTag);
                        const imageUrl = machineData?.imageUrl;

                        return (
                          <div
                            key={machine.tag}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                index === 1 ? 'bg-slate-200 text-slate-700' :
                                  index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                {index + 1}
                              </div>
                              {/* Machine Thumbnail */}
                              {imageUrl && (
                                <div className="h-10 w-10 flex-shrink-0 rounded border border-muted-foreground/10 overflow-hidden bg-muted/30">
                                  <img
                                    src={getThumbnailUrl(imageUrl, 100)}
                                    alt={machine.description}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{machine.description}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {machine.group?.split('-')[1] || machine.group || 'Unknown'} • {machine.assetTag}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">${machine.totalRev.toFixed(0)}</p>
                              <p className="text-xs text-muted-foreground">
                                {machine.standardPlays + machine.empPlays} plays
                              </p>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                          No machines match the selected filters
                        </div>
                      );
                    })()}
                  </div>
                </TabsContent>

                <TabsContent value="revenue" className="mt-0">
                  <MachineRevenueChart data={todayGameReports} metric="revenue" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Middle Row: Category Breakdown */}
      {gameReportStats.byGroup.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Performance by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                {gameReportStats.byGroup.slice(0, 5).map((group, index) => {
                  const maxPlays = gameReportStats.byGroup[0]?.plays || 1;
                  const percentage = (group.plays / maxPlays) * 100;
                  const shortName = group.group.split('-')[1] || group.group;
                  return (
                    <div key={group.group} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                          <span className="font-medium">{shortName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span>{group.plays.toLocaleString()} plays</span>
                          <span className="text-green-600">${group.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                {gameReportStats.byGroup.slice(5, 10).map((group, index) => {
                  const maxPlays = gameReportStats.byGroup[0]?.plays || 1;
                  const percentage = (group.plays / maxPlays) * 100;
                  const shortName = group.group.split('-')[1] || group.group;
                  return (
                    <div key={group.group} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{index + 6}</Badge>
                          <span className="font-medium">{shortName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span>{group.plays.toLocaleString()} plays</span>
                          <span className="text-green-600">${group.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Row: Alerts & Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-[10px] text-muted-foreground">{alert.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technician Tasks */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {maintenanceTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-muted">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{task.description}</p>
                      <p className="text-xs text-muted-foreground">Machine: {task.machineId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold
                                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-medium capitalize text-muted-foreground">{task.assignedTo || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Scope Dialog */}
      <RevenueScopeDialog open={revenueScopeOpen} onOpenChange={setRevenueScopeOpen} />
    </div>
  );
}
