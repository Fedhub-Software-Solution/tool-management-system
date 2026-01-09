import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText, FileSpreadsheet, Package, CalendarIcon, Filter } from "lucide-react";
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
} from "recharts";
import { PR } from "./Dashboard";
import { useState } from "react";
import { Button } from "./ui/button";
import { DateFilterControl, type DateFilter } from "./DateFilterControl";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface NPDDashboardProps {
  prs: PR[];
  getRoleGradient: () => string;
  userRole: string;
}

export function NPDDashboard({ prs, getRoleGradient, userRole }: NPDDashboardProps) {
  const [selectedKPI, setSelectedKPI] = useState<'total' | 'approved' | 'pending' | 'awards' | 'pendingAwards' | null>(null);
  const [kpiDateRange, setKpiDateRange] = useState<{
    preset: '3months' | '6months' | '1year' | '2years' | '3years' | 'custom';
    customFromDate?: Date;
    customToDate?: Date;
  }>({ preset: '6months' });

  // Chart filter - unified date filter for all charts
  const [chartFilter, setChartFilter] = useState<DateFilter>({
    type: "month",
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
  });

  // Status Filter for Status Chart
  const [statusFilter, setStatusFilter] = useState<{
    month: string;
    year: string;
  }>({
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
  });

  // Award Filter for Award Chart
  const [awardFilter, setAwardFilter] = useState<{
    month: string;
    year: string;
  }>({
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
  });

  // Type Filter for Type Chart
  const [typeFilter, setTypeFilter] = useState<{
    month: string;
    year: string;
  }>({
    month: 'all',
    year: 'all',
  });

  // Trend Filter for Trend Chart
  const [trendFilter, setTrendFilter] = useState<{
    period: string;
    prType: string;
  }>({
    period: '6months',
    prType: 'all',
  });

  // Helper function to get available years from PRs
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year);
    }
    return years;
  };

  const availableYears = getAvailableYears();

  return (
    <div className="overflow-y-auto flex-1 scrollbar-smart">
      {/* Sticky Header with KPIs */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="px-4 py-2.5">
          <div className="mb-1.5">
            <h1 className="mb-0.5 text-2xl font-bold leading-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 leading-tight">
              Welcome, <span className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>{userRole} Team</span>
            </p>
          </div>

          {/* KPI Cards Row */}
          <div className="flex justify-around items-center gap-4 mt-3">
            {/* Total PRs */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setSelectedKPI(selectedKPI === 'total' ? null : 'total')}
                className={`w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xl border-4 ${selectedKPI === 'total' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-blue-100'}`}
              >
                <div className="p-1.5 bg-blue-100 rounded-full mb-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{prs.length}</div>
              </div>
              <p className="text-[10px] text-blue-900 font-medium mt-1.5">Total PRs</p>
            </div>

            {/* Approved PRs */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setSelectedKPI(selectedKPI === 'approved' ? null : 'approved')}
                className={`w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xl border-4 ${selectedKPI === 'approved' ? 'border-green-500 ring-2 ring-green-300' : 'border-green-100'}`}
              >
                <div className="p-1.5 bg-green-100 rounded-full mb-1">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {prs.filter(pr => pr.status === "Approved").length}
                </div>
              </div>
              <p className="text-[10px] text-green-900 font-medium mt-1.5">Approved PRs</p>
            </div>

            {/* Pending PRs */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setSelectedKPI(selectedKPI === 'pending' ? null : 'pending')}
                className={`w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xl border-4 ${selectedKPI === 'pending' ? 'border-amber-500 ring-2 ring-amber-300' : 'border-amber-100'}`}
              >
                <div className="p-1.5 bg-amber-100 rounded-full mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {prs.filter(pr => pr.status === "Pending Approval").length}
                </div>
              </div>
              <p className="text-[10px] text-amber-900 font-medium mt-1.5">Pending PRs</p>
            </div>

            {/* Total Awards */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setSelectedKPI(selectedKPI === 'awards' ? null : 'awards')}
                className={`w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xl border-4 ${selectedKPI === 'awards' ? 'border-purple-500 ring-2 ring-purple-300' : 'border-purple-100'}`}
              >
                <div className="p-1.5 bg-purple-100 rounded-full mb-1">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {prs.filter(pr => pr.status === "Awarded").length}
                </div>
              </div>
              <p className="text-[10px] text-purple-900 font-medium mt-1.5">Total Awards</p>
            </div>

            {/* Pending Awards */}
            <div className="flex flex-col items-center">
              <div 
                onClick={() => setSelectedKPI(selectedKPI === 'pendingAwards' ? null : 'pendingAwards')}
                className={`w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-cyan-50 to-teal-50 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-xl border-4 ${selectedKPI === 'pendingAwards' ? 'border-cyan-500 ring-2 ring-cyan-300' : 'border-cyan-100'}`}
              >
                <div className="p-1.5 bg-cyan-100 rounded-full mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="text-2xl font-bold text-cyan-600">
                  {prs.filter(pr => pr.status === "Approved" && (!pr.awardedSupplier || pr.awardedSupplier === "")).length}
                </div>
              </div>
              <p className="text-[10px] text-cyan-900 font-medium mt-1.5">Pending Awards</p>
            </div>
          </div>

          {/* KPI Trend Graph - Shows when a KPI is selected */}
          {selectedKPI && (
            <div className="mt-3 mb-2">
              <Card className="border-0 shadow-lg animate-in slide-in-from-top-2 duration-300">
                <CardHeader className="pb-2 pt-3 px-4 bg-white border-b">
                  {/* Title and Period Filter on Same Line */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-shrink-0">
                      <CardTitle className="text-sm">
                        {selectedKPI === 'total' && 'Total PRs Trend'}
                        {selectedKPI === 'approved' && 'Approved PRs Trend'}
                        {selectedKPI === 'pending' && 'Pending PRs Trend'}
                        {selectedKPI === 'awards' && 'Awards Trend'}
                        {selectedKPI === 'pendingAwards' && 'Pending Awards Trend'}
                      </CardTitle>
                    </div>
                    
                    {/* Period Filter Buttons in Middle - with Custom Date Pickers Inline */}
                    <div className="flex items-center gap-2 flex-wrap flex-1 justify-center">
                      <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Period:</Label>
                      <div className="flex gap-1 flex-wrap items-center">
                        <Button
                          size="sm"
                          variant={kpiDateRange.preset === '3months' ? 'default' : 'outline'}
                          onClick={() => setKpiDateRange({ preset: '3months', customFromDate: undefined, customToDate: undefined })}
                          className="h-6 px-2 text-[10px]"
                        >
                          3M
                        </Button>
                        <Button
                          size="sm"
                          variant={kpiDateRange.preset === '6months' ? 'default' : 'outline'}
                          onClick={() => setKpiDateRange({ preset: '6months', customFromDate: undefined, customToDate: undefined })}
                          className="h-6 px-2 text-[10px]"
                        >
                          6M
                        </Button>
                        <Button
                          size="sm"
                          variant={kpiDateRange.preset === '1year' ? 'default' : 'outline'}
                          onClick={() => setKpiDateRange({ preset: '1year', customFromDate: undefined, customToDate: undefined })}
                          className="h-6 px-2 text-[10px]"
                        >
                          1Y
                        </Button>
                        <Button
                          size="sm"
                          variant={kpiDateRange.preset === '2years' ? 'default' : 'outline'}
                          onClick={() => setKpiDateRange({ preset: '2years', customFromDate: undefined, customToDate: undefined })}
                          className="h-6 px-2 text-[10px]"
                        >
                          2Y
                        </Button>
                        <Button
                          size="sm"
                          variant={kpiDateRange.preset === '3years' ? 'default' : 'outline'}
                          onClick={() => setKpiDateRange({ preset: '3years', customFromDate: undefined, customToDate: undefined })}
                          className="h-6 px-2 text-[10px]"
                        >
                          3Y
                        </Button>
                        <Button
                          size="sm"
                          variant={kpiDateRange.preset === 'custom' ? 'default' : 'outline'}
                          onClick={() => setKpiDateRange({ ...kpiDateRange, preset: 'custom' })}
                          className="h-6 px-2 text-[10px]"
                        >
                          Custom
                        </Button>
                        
                        {/* Custom Date Pickers - Inline with Custom Button */}
                        {kpiDateRange.preset === 'custom' && (
                          <>
                            <div className="flex items-center gap-1.5 ml-2">
                              <Label className="text-[10px] text-muted-foreground whitespace-nowrap">From:</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] justify-start min-w-[100px]"
                                  >
                                    <CalendarIcon className="mr-1 h-3 w-3" />
                                    {kpiDateRange.customFromDate ? format(kpiDateRange.customFromDate, "MMM dd, yyyy") : "Select"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={kpiDateRange.customFromDate}
                                    onSelect={(date) => setKpiDateRange({ ...kpiDateRange, customFromDate: date })}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] text-muted-foreground whitespace-nowrap">To:</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] justify-start min-w-[100px]"
                                  >
                                    <CalendarIcon className="mr-1 h-3 w-3" />
                                    {kpiDateRange.customToDate ? format(kpiDateRange.customToDate, "MMM dd, yyyy") : "Select"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={kpiDateRange.customToDate}
                                    onSelect={(date) => setKpiDateRange({ ...kpiDateRange, customToDate: date })}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Description Text - Before Close Button */}
                    <p className="text-[10px] text-muted-foreground flex-shrink-0">
                      {kpiDateRange.preset === 'custom' 
                        ? 'Custom date range'
                        : kpiDateRange.preset === '3months' 
                        ? 'Last 3 months'
                        : kpiDateRange.preset === '6months'
                        ? 'Last 6 months'
                        : kpiDateRange.preset === '1year'
                        ? 'Last 1 year'
                        : kpiDateRange.preset === '2years'
                        ? 'Last 2 years'
                        : kpiDateRange.preset === '3years'
                        ? 'Last 3 years'
                        : 'Last 6 months'
                      }
                    </p>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKPI(null);
                      }}
                      className="h-7 w-7 p-0 flex-shrink-0"
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-4 pt-4">
                  {(() => {
                    // Determine date range based on filter selection
                    let monthsToShow = 6; // default
                    let startDate: Date;
                    let endDate = new Date();
                    
                    if (kpiDateRange.preset === 'custom') {
                      if (kpiDateRange.customFromDate && kpiDateRange.customToDate) {
                        startDate = kpiDateRange.customFromDate;
                        endDate = kpiDateRange.customToDate;
                        // Calculate months between custom dates
                        const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                         (endDate.getMonth() - startDate.getMonth());
                        monthsToShow = Math.max(1, monthDiff + 1);
                      } else {
                        // If custom is selected but dates aren't set, use default
                        monthsToShow = 6;
                        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsToShow + 1, 1);
                      }
                    } else {
                      // Preset ranges
                      monthsToShow = kpiDateRange.preset === '3months' ? 3 : 
                                    kpiDateRange.preset === '6months' ? 6 : 
                                    kpiDateRange.preset === '1year' ? 12 :
                                    kpiDateRange.preset === '2years' ? 24 :
                                    kpiDateRange.preset === '3years' ? 36 : 6;
                      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsToShow + 1, 1);
                    }
                    
                    // Generate months data based on selected range
                    const monthsData = [];
                    const now = endDate;
                    
                    for (let i = monthsToShow - 1; i >= 0; i--) {
                      const date = kpiDateRange.preset === 'custom' && startDate 
                        ? new Date(startDate.getFullYear(), startDate.getMonth() + (monthsToShow - 1 - i), 1)
                        : new Date(now.getFullYear(), now.getMonth() - i, 1);
                      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                      // Filter PRs for this month
                      const monthPRs = prs.filter(pr => {
                        const prDate = new Date(pr.createdAt);
                        return prDate >= monthStart && prDate <= monthEnd;
                      });

                      let value = 0;
                      if (selectedKPI === 'total') {
                        value = monthPRs.length;
                      } else if (selectedKPI === 'approved') {
                        value = monthPRs.filter(pr => pr.status === "Approved").length;
                      } else if (selectedKPI === 'pending') {
                        value = monthPRs.filter(pr => pr.status === "Pending Approval").length;
                      } else if (selectedKPI === 'awards') {
                        value = monthPRs.filter(pr => pr.status === "Awarded").length;
                      } else if (selectedKPI === 'pendingAwards') {
                        value = monthPRs.filter(pr => pr.status === "Approved" && (!pr.awardedSupplier || pr.awardedSupplier === "")).length;
                      }

                      monthsData.push({
                        month: monthName,
                        value: value,
                      });
                    }

                    return (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthsData}>
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
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={
                              selectedKPI === 'total' ? '#3b82f6' :
                              selectedKPI === 'approved' ? '#10b981' :
                              selectedKPI === 'pending' ? '#f59e0b' :
                              selectedKPI === 'awards' ? '#8b5cf6' :
                              '#06b6d4'
                            }
                            strokeWidth={2}
                            name={
                              selectedKPI === 'total' ? 'Total PRs' :
                              selectedKPI === 'approved' ? 'Approved PRs' :
                              selectedKPI === 'pending' ? 'Pending PRs' :
                              selectedKPI === 'awards' ? 'Awards' :
                              'Pending Awards'
                            }
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content with Charts */}
      <div className="p-4 space-y-4">
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PR Status Breakdown */}
          <Card className="shadow-md">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">PR Status Breakdown</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Distribution of PRs by status</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <div className="space-y-1.5 min-w-[100px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Month
                    </Label>
                    <Select
                      value={statusFilter.month}
                      onValueChange={(value) => setStatusFilter({ ...statusFilter, month: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="0">Jan</SelectItem>
                        <SelectItem value="1">Feb</SelectItem>
                        <SelectItem value="2">Mar</SelectItem>
                        <SelectItem value="3">Apr</SelectItem>
                        <SelectItem value="4">May</SelectItem>
                        <SelectItem value="5">Jun</SelectItem>
                        <SelectItem value="6">Jul</SelectItem>
                        <SelectItem value="7">Aug</SelectItem>
                        <SelectItem value="8">Sep</SelectItem>
                        <SelectItem value="9">Oct</SelectItem>
                        <SelectItem value="10">Nov</SelectItem>
                        <SelectItem value="11">Dec</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-[90px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Year
                    </Label>
                    <Select
                      value={statusFilter.year}
                      onValueChange={(value) => setStatusFilter({ ...statusFilter, year: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {(() => {
                // Apply month and year filter
                let filteredPRs = prs;
                
                filteredPRs = prs.filter(pr => {
                  const prDate = new Date(pr.createdAt);
                  const matchMonth = statusFilter.month === 'all' || prDate.getMonth() === parseInt(statusFilter.month);
                  const matchYear = statusFilter.year === 'all' || prDate.getFullYear() === parseInt(statusFilter.year);
                  return matchMonth && matchYear;
                });

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { status: 'Draft', count: filteredPRs.filter(pr => pr.status === "Draft").length },
                      { status: 'Pending', count: filteredPRs.filter(pr => pr.status === "Pending Approval").length },
                      { status: 'Approved', count: filteredPRs.filter(pr => pr.status === "Approved").length },
                      { status: 'Awarded', count: filteredPRs.filter(pr => pr.status === "Awarded").length },
                      { status: 'Rejected', count: filteredPRs.filter(pr => pr.status === "Rejected").length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="status" stroke="#64748b" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* PR Type Distribution */}
          <Card className="shadow-md">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">PR Type Distribution</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Breakdown by PR type</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <div className="space-y-1.5 min-w-[100px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Month
                    </Label>
                    <Select
                      value={typeFilter.month}
                      onValueChange={(value) => setTypeFilter({ ...typeFilter, month: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="0">Jan</SelectItem>
                        <SelectItem value="1">Feb</SelectItem>
                        <SelectItem value="2">Mar</SelectItem>
                        <SelectItem value="3">Apr</SelectItem>
                        <SelectItem value="4">May</SelectItem>
                        <SelectItem value="5">Jun</SelectItem>
                        <SelectItem value="6">Jul</SelectItem>
                        <SelectItem value="7">Aug</SelectItem>
                        <SelectItem value="8">Sep</SelectItem>
                        <SelectItem value="9">Oct</SelectItem>
                        <SelectItem value="10">Nov</SelectItem>
                        <SelectItem value="11">Dec</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-[90px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Year
                    </Label>
                    <Select
                      value={typeFilter.year}
                      onValueChange={(value) => setTypeFilter({ ...typeFilter, year: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {(() => {
                // Apply month and year filter
                let filteredPRs = prs;
                
                filteredPRs = prs.filter(pr => {
                  const prDate = new Date(pr.createdAt);
                  const matchMonth = typeFilter.month === 'all' || prDate.getMonth() === parseInt(typeFilter.month);
                  const matchYear = typeFilter.year === 'all' || prDate.getFullYear() === parseInt(typeFilter.year);
                  return matchMonth && matchYear;
                });

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { type: 'New Set', count: filteredPRs.filter(pr => pr.prType === "New Set").length },
                      { type: 'Modification', count: filteredPRs.filter(pr => pr.prType === "Modification").length },
                      { type: 'Refurbished', count: filteredPRs.filter(pr => pr.prType === "Refurbished").length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="type" stroke="#64748b" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* Approval Timeline */}
          <Card className="shadow-md">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Monthly PR Trend</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">PR creation over time</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <div className="space-y-1.5 min-w-[110px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Period
                    </Label>
                    <Select
                      value={trendFilter.period}
                      onValueChange={(value) => setTrendFilter({ ...trendFilter, period: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="Last 6 Months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3months">3 Months</SelectItem>
                        <SelectItem value="6months">6 Months</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="2years">2 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-[110px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      PR Type
                    </Label>
                    <Select
                      value={trendFilter.prType}
                      onValueChange={(value) => setTrendFilter({ ...trendFilter, prType: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="New Set">New Set</SelectItem>
                        <SelectItem value="Modification">Modification</SelectItem>
                        <SelectItem value="Refurbished">Refurbished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {(() => {
                const now = new Date();
                const monthsToShow = trendFilter.period === '3months' ? 3 :
                                    trendFilter.period === '6months' ? 6 :
                                    trendFilter.period === '1year' ? 12 :
                                    trendFilter.period === '2years' ? 24 : 6;
                
                const monthsData = [];
                for (let i = monthsToShow - 1; i >= 0; i--) {
                  const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                  
                  let monthPRs = prs.filter(pr => {
                    const prDate = new Date(pr.createdAt);
                    return prDate >= monthStart && prDate <= monthEnd;
                  });

                  // Apply PR type filter
                  if (trendFilter.prType !== 'all') {
                    monthPRs = monthPRs.filter(pr => pr.prType === trendFilter.prType);
                  }
                  
                  monthsData.push({
                    month: monthName,
                    total: monthPRs.length,
                    approved: monthPRs.filter(pr => pr.status === "Approved").length,
                    awarded: monthPRs.filter(pr => pr.status === "Awarded").length,
                  });
                }

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthsData}>
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
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total PRs" />
                      <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
                      <Line type="monotone" dataKey="awarded" stroke="#8b5cf6" strokeWidth={2} name="Awarded" />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* Award Status */}
          <Card className="shadow-md">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Award Status</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Approved vs Awarded PRs</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2">
                  <div className="space-y-1.5 min-w-[100px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Month
                    </Label>
                    <Select
                      value={awardFilter.month}
                      onValueChange={(value) => setAwardFilter({ ...awardFilter, month: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="0">Jan</SelectItem>
                        <SelectItem value="1">Feb</SelectItem>
                        <SelectItem value="2">Mar</SelectItem>
                        <SelectItem value="3">Apr</SelectItem>
                        <SelectItem value="4">May</SelectItem>
                        <SelectItem value="5">Jun</SelectItem>
                        <SelectItem value="6">Jul</SelectItem>
                        <SelectItem value="7">Aug</SelectItem>
                        <SelectItem value="8">Sep</SelectItem>
                        <SelectItem value="9">Oct</SelectItem>
                        <SelectItem value="10">Nov</SelectItem>
                        <SelectItem value="11">Dec</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-[90px]">
                    <Label className="text-[10px] flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Year
                    </Label>
                    <Select
                      value={awardFilter.year}
                      onValueChange={(value) => setAwardFilter({ ...awardFilter, year: value })}
                    >
                      <SelectTrigger className="h-7 text-[10px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {(() => {
                // Apply month and year filter
                let filteredPRs = prs;
                
                filteredPRs = prs.filter(pr => {
                  const prDate = new Date(pr.createdAt);
                  const matchMonth = awardFilter.month === 'all' || prDate.getMonth() === parseInt(awardFilter.month);
                  const matchYear = awardFilter.year === 'all' || prDate.getFullYear() === parseInt(awardFilter.year);
                  return matchMonth && matchYear;
                });

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { 
                        category: 'Awards',
                        'Awarded': filteredPRs.filter(pr => pr.status === "Awarded").length,
                        'Pending Award': filteredPRs.filter(pr => pr.status === "Approved" && (!pr.awardedSupplier || pr.awardedSupplier === "")).length,
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="category" stroke="#64748b" style={{ fontSize: '10px' }} />
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
                      <Bar dataKey="Awarded" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Pending Award" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-slate-900">Average Approval Time</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className="text-lg font-bold text-slate-600">~3.5 days</div>
              <p className="text-[9px] text-slate-600/70 mt-0.5">For approved PRs</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-slate-900">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className="text-lg font-bold text-slate-600">
                {prs.length > 0 ? Math.round((prs.filter(pr => pr.status === "Approved" || pr.status === "Awarded").length / prs.filter(pr => pr.status !== "Draft").length) * 100) : 0}%
              </div>
              <p className="text-[9px] text-slate-600/70 mt-0.5">Of submitted PRs</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-slate-900">Award Completion</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className="text-lg font-bold text-slate-600">
                {prs.filter(pr => pr.status === "Approved" || pr.status === "Awarded").length > 0 
                  ? Math.round((prs.filter(pr => pr.status === "Awarded").length / prs.filter(pr => pr.status === "Approved" || pr.status === "Awarded").length) * 100) 
                  : 0}%
              </div>
              <p className="text-[9px] text-slate-600/70 mt-0.5">Of approved PRs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}