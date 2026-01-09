import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Database,
  Package,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { InventoryItem, SparesRequest, PR } from "./Dashboard";
import { DateFilterControl, type DateFilter, filterByDateRange, groupByTimePeriod, sortTimePeriodKeys } from "./DateFilterControl";

interface SparesDashboardProps {
  inventory: InventoryItem[];
  sparesRequests: SparesRequest[];
  prs: PR[];
  getRoleGradient: () => string;
  userRole: string;
}

export function SparesDashboard({
  inventory,
  sparesRequests,
  prs,
  getRoleGradient,
  userRole,
}: SparesDashboardProps) {
  // Individual date filter states for each chart
  const [stockStatusFilter, setStockStatusFilter] = useState<DateFilter>({ type: "last3months" });
  const [consumptionFilter, setConsumptionFilter] = useState<DateFilter>({ type: "last3months" });
  const [trendsFilter, setTrendsFilter] = useState<DateFilter>({ type: "last6months" });
  const [activitiesFilter, setActivitiesFilter] = useState<DateFilter>({ type: "lastmonth" });
  
  // Spares requests status filter
  const [requestStatusFilter, setRequestStatusFilter] = useState<"All" | "Pending" | "Fulfilled" | "Rejected">("All");

  // Calculate KPIs (not affected by date filter - always show current status)
  const totalItems = inventory.length;
  const inStockItems = inventory.filter(item => item.status === "In Stock").length;
  const lowStockItems = inventory.filter(item => item.status === "Low Stock").length;
  const outOfStockItems = inventory.filter(item => item.status === "Out of Stock").length;
  const totalRequests = sparesRequests.length;
  const pendingRequests = sparesRequests.filter(req => req.status === "Pending").length;
  const fulfilledRequests = sparesRequests.filter(req => req.status === "Fulfilled").length;
  const rejectedRequests = sparesRequests.filter(req => req.status === "Rejected").length;

  // Generate trend data for KPI cards (last 7 days)
  const generateKPITrend = () => {
    const days = 7;
    const trends = {
      totalItems: [] as number[],
      inStock: [] as number[],
      lowStock: [] as number[],
      outOfStock: [] as number[],
      pending: [] as number[],
      fulfilled: [] as number[],
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate trends based on current values with some variance
      const variance = Math.random() * 0.15 - 0.075; // ±7.5% variance
      
      trends.totalItems.push(Math.max(1, Math.round(totalItems * (1 + variance * (i / days)))));
      trends.inStock.push(Math.max(0, Math.round(inStockItems * (1 + variance * (i / days)))));
      trends.lowStock.push(Math.max(0, Math.round(lowStockItems * (1 - variance * (i / days)))));
      trends.outOfStock.push(Math.max(0, Math.round(outOfStockItems * (1 - variance * (i / days)))));
      trends.pending.push(Math.max(0, Math.round(pendingRequests * (1 + variance * (i / days)))));
      trends.fulfilled.push(Math.max(0, Math.round(fulfilledRequests * (1 - variance * (i / days)))));
    }

    return trends;
  };

  const kpiTrends = generateKPITrend();
  
  // Stock status distribution data (current status of all items - no filtering)
  const stockStatusData = [
    { name: "In Stock", value: inStockItems, color: "#22c55e" },
    { name: "Low Stock", value: lowStockItems, color: "#eab308" },
    { name: "Out of Stock", value: outOfStockItems, color: "#ef4444" },
  ].filter(item => item.value > 0);
  
  // Top consumed items (filtered by its own date range)
  const topConsumedItems = (() => {
    return inventory
      .map(item => {
        const allRemovals = (item.removalHistory || []).map(r => ({ ...r, createdAt: r.date }));
        const filteredRemovals = filterByDateRange(allRemovals, consumptionFilter);
        return {
          name: item.name,
          partNumber: item.partNumber,
          consumed: filteredRemovals.reduce((sum, removal) => sum + removal.quantity, 0),
        };
      })
      .filter(item => item.consumed > 0)
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5);
  })();
  
  // Monthly consumption trends (filtered by its own date range)
  const monthlyConsumption = (() => {
    // Collect all additions and removals with dates
    const allAdditions: Array<{ date: string; quantity: number }> = [];
    const allRemovals: Array<{ date: string; quantity: number }> = [];

    inventory.forEach(item => {
      (item.additionHistory || []).forEach(addition => {
        allAdditions.push({
          date: addition.date,
          quantity: addition.quantity,
        });
      });
      (item.removalHistory || []).forEach(removal => {
        allRemovals.push({
          date: removal.date,
          quantity: removal.quantity,
        });
      });
    });

    // Filter by date range
    const filteredAdditions = filterByDateRange(
      allAdditions.map(a => ({ ...a, createdAt: a.date })),
      trendsFilter
    );
    const filteredRemovals = filterByDateRange(
      allRemovals.map(r => ({ ...r, createdAt: r.date })),
      trendsFilter
    );

    // Determine grouping based on filter type
    const groupBy = 
      trendsFilter.type === "week" ? "day" :
      trendsFilter.type === "month" ? "day" :
      trendsFilter.type === "year" ? "month" :
      "month";

    // Group by time period
    const additionsByPeriod = groupByTimePeriod(filteredAdditions, groupBy);
    const removalsByPeriod = groupByTimePeriod(filteredRemovals, groupBy);

    // Get all unique periods
    const allPeriods = new Set([
      ...Object.keys(additionsByPeriod),
      ...Object.keys(removalsByPeriod)
    ]);

    const sortedPeriods = sortTimePeriodKeys(Array.from(allPeriods));

    return sortedPeriods.map(period => {
      const additions = additionsByPeriod[period] || [];
      const removals = removalsByPeriod[period] || [];

      // Format period label
      let periodLabel = period;
      if (groupBy === "day") {
        const date = new Date(period);
        periodLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period.includes('-')) {
        const [year, month] = period.split('-');
        if (month) {
          const date = new Date(parseInt(year), parseInt(month) - 1);
          periodLabel = date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: trendsFilter.type === "year" ? 'numeric' : undefined 
          });
        }
      }

      return {
        month: periodLabel,
        consumed: removals.reduce((sum, r) => sum + r.quantity, 0),
        added: additions.reduce((sum, a) => sum + a.quantity, 0),
      };
    });
  })();

  // Recent activities (filtered by its own date range)
  const recentActivities = (() => {
    const activities: Array<{ date: string; type: string; description: string; }> = [];
    
    // Add stock additions
    inventory.forEach(item => {
      (item.additionHistory || []).forEach(addition => {
        activities.push({
          date: addition.date,
          type: "addition",
          description: `Added ${addition.quantity} units of ${item.name} (${addition.reason})`,
        });
      });
    });
    
    // Add stock removals (fulfillments)
    inventory.forEach(item => {
      (item.removalHistory || []).forEach(removal => {
        activities.push({
          date: removal.date,
          type: "removal",
          description: `Fulfilled ${removal.quantity} units of ${item.name} for ${removal.requestedBy}`,
        });
      });
    });

    // Filter activities by date range
    const filteredActivities = filterByDateRange(
      activities.map(a => ({ ...a, createdAt: a.date })),
      activitiesFilter
    ).map(a => ({ ...a, date: a.createdAt }));

    // Add current low stock alerts (always show)
    const lowStockAlerts = inventory
      .filter(item => item.status === "Low Stock" || item.status === "Out of Stock")
      .map(item => ({
        date: new Date().toISOString(),
        type: "alert",
        description: `${item.status}: ${item.name} (Current: ${item.stockLevel}, Min: ${item.minStockLevel})`,
      }));

    // Combine and sort
    return [...filteredActivities, ...lowStockAlerts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);
  })();

  return (
    <div className="overflow-y-auto flex-1 scrollbar-smart">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 bg-gradient-to-br from-slate-50 to-slate-100 px-4 pt-2 pb-1.5 border-b border-slate-200/60 shadow-sm">
        <div className="mb-1.5">
          <h1 className="mb-0.5 text-sm font-bold leading-tight">Spares Inventory Dashboard</h1>
          <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
            Welcome, <span className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>{userRole} Team</span>
          </p>
        </div>

        {/* All KPI Metrics - 6 per row (Circular) */}
        <div className="grid grid-cols-6 gap-2 mb-3 px-1">
          {/* Total Items */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-50 to-emerald-100 border-3 border-teal-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-teal-500 rounded-full shadow-sm z-10">
                  <Database className="w-3 h-3 text-white" />
                </div>
                {/* Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends.totalItems.map((v, i) => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-teal-600 z-10">
                  {totalItems}
                </div>
                <p className="text-[10px] text-teal-700 mt-0.5 font-semibold leading-tight z-10">Total Items</p>
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 text-center font-medium">In inventory</p>
          </div>

          {/* In Stock Items */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 border-3 border-green-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-green-500 rounded-full shadow-sm z-10">
                  <Package className="w-3 h-3 text-white" />
                </div>
                {/* Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends.inStock.map((v, i) => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-green-600 z-10">
                  {inStockItems}
                </div>
                <p className="text-[10px] text-green-700 mt-0.5 font-semibold leading-tight z-10">In Stock</p>
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 text-center font-medium">Available</p>
          </div>

          {/* Low Stock Items */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-50 to-amber-100 border-3 border-yellow-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-yellow-500 rounded-full shadow-sm z-10">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
                {/* Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends.lowStock.map((v, i) => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke="#eab308" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-yellow-600 z-10">
                  {lowStockItems}
                </div>
                <p className="text-[10px] text-yellow-700 mt-0.5 font-semibold leading-tight z-10">Low Stock</p>
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 text-center font-medium">Needs reorder</p>
          </div>

          {/* Out of Stock Items */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-50 to-rose-100 border-3 border-red-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-red-500 rounded-full shadow-sm z-10">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
                {/* Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends.outOfStock.map((v, i) => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-red-600 z-10">
                  {outOfStockItems}
                </div>
                <p className="text-[10px] text-red-700 mt-0.5 font-semibold leading-tight z-10">Out of Stock</p>
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 text-center font-medium">Urgent</p>
          </div>

          {/* Pending Requests */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-50 to-amber-100 border-3 border-orange-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-orange-500 rounded-full shadow-sm z-10">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                {/* Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends.pending.map((v, i) => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-orange-600 z-10">
                  {pendingRequests}
                </div>
                <p className="text-[10px] text-orange-700 mt-0.5 font-semibold leading-tight z-10">Pending</p>
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 text-center font-medium">Requests</p>
          </div>

          {/* Fulfilled Requests */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-cyan-100 border-3 border-blue-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-blue-500 rounded-full shadow-sm z-10">
                  <Activity className="w-3 h-3 text-white" />
                </div>
                {/* Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends.fulfilled.map((v, i) => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-blue-600 z-10">
                  {fulfilledRequests}
                </div>
                <p className="text-[10px] text-blue-700 mt-0.5 font-semibold leading-tight z-10">Fulfilled</p>
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 text-center font-medium">Completed</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-4">
        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stock Status Distribution Pie Chart */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Stock Status Distribution</CardTitle>
              <CardDescription className="text-[10px]">Current inventory status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {stockStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={stockStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                  No inventory data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Consumed Items Bar Chart */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold text-slate-800">Top 5 Consumed Items</CardTitle>
                  <CardDescription className="text-[10px]">Most requested spare parts</CardDescription>
                </div>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <DateFilterControl
                  filter={consumptionFilter}
                  onFilterChange={setConsumptionFilter}
                  compact={true}
                />
              </div>
            </CardHeader>
            <CardContent>
              {topConsumedItems.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topConsumedItems} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" style={{ fontSize: '10px' }} />
                    <YAxis 
                      type="category" 
                      dataKey="partNumber" 
                      stroke="#64748b" 
                      style={{ fontSize: '9px' }}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value: number) => [`${value} units`, "Consumed"]}
                    />
                    <Bar dataKey="consumed" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                  No consumption data for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Consumption Trends */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-slate-800">Stock Movement Trends</CardTitle>
                <CardDescription className="text-[10px]">Stock additions vs. consumption</CardDescription>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-100">
              <DateFilterControl
                filter={trendsFilter}
                onFilterChange={setTrendsFilter}
                compact={true}
              />
            </div>
          </CardHeader>
          <CardContent>
            {monthlyConsumption.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="consumed" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    name="Consumed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="added" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                    name="Added"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                No stock movement data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activities
                </CardTitle>
                <CardDescription className="text-[10px]">Latest stock movements and alerts</CardDescription>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-100">
              <DateFilterControl
                filter={activitiesFilter}
                onFilterChange={setActivitiesFilter}
                compact={true}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const activityIcon = 
                    activity.type === "addition" ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                    activity.type === "removal" ? <TrendingDown className="w-4 h-4 text-blue-600" /> :
                    <AlertTriangle className="w-4 h-4 text-orange-600" />;
                  
                  const activityColor = 
                    activity.type === "addition" ? "border-green-200 bg-green-50" :
                    activity.type === "removal" ? "border-blue-200 bg-blue-50" :
                    "border-orange-200 bg-orange-50";

                  return (
                    <div key={index} className={`flex items-start gap-3 p-2.5 border rounded-lg ${activityColor} transition-colors`}>
                      <div className="mt-0.5">{activityIcon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-900">{activity.description}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {new Date(activity.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No activities for selected period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}