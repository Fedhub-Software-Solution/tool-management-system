import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";

export interface DateFilter {
  type: "week" | "month" | "year" | "custom" | "last6months" | "last3months" | "lastmonth";
  week?: string;
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
}

interface DateFilterControlProps {
  filter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  compact?: boolean;
}

export function DateFilterControl({ filter, onFilterChange, compact = false }: DateFilterControlProps) {
  return (
    <div className={`flex items-center gap-2 flex-wrap`}>
      <Select
        value={filter.type}
        onValueChange={(value: DateFilter["type"]) => {
          // Auto-populate default values when type changes
          const newFilter: DateFilter = { ...filter, type: value };
          
          if (value === "week" && !filter.week) {
            // Get current week (YYYY-Www format)
            const now = new Date();
            const year = now.getFullYear();
            const onejan = new Date(year, 0, 1);
            const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            newFilter.week = `${year}-W${week.toString().padStart(2, '0')}`;
          } else if (value === "month" && !filter.month) {
            newFilter.month = new Date().toISOString().slice(0, 7); // Current month
          } else if (value === "year" && !filter.year) {
            newFilter.year = new Date().getFullYear().toString(); // Current year
          }
          
          onFilterChange(newFilter);
        }}
      >
        <SelectTrigger className={`${compact ? 'h-7 text-xs w-28' : 'h-9 text-sm flex-shrink-0 w-[140px]'}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lastmonth">Last Month</SelectItem>
          <SelectItem value="last3months">Last 3 Months</SelectItem>
          <SelectItem value="last6months">Last 6 Months</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {filter.type === "week" && (
        <Input
          type="week"
          value={filter.week || ""}
          onChange={(e) => onFilterChange({ ...filter, week: e.target.value })}
          className={`${compact ? 'h-7 text-xs w-36' : 'h-9 text-sm flex-1 min-w-[150px]'}`}
        />
      )}

      {filter.type === "month" && (
        <Input
          type="month"
          value={filter.month || ""}
          onChange={(e) => onFilterChange({ ...filter, month: e.target.value })}
          className={`${compact ? 'h-7 text-xs w-32' : 'h-9 text-sm flex-1 min-w-[140px]'}`}
        />
      )}

      {filter.type === "year" && (
        <Input
          type="number"
          value={filter.year || ""}
          onChange={(e) => onFilterChange({ ...filter, year: e.target.value })}
          placeholder="Year"
          className={`${compact ? 'h-7 text-xs w-20' : 'h-9 text-sm flex-1 min-w-[100px]'}`}
          min="2020"
          max="2030"
        />
      )}

      {filter.type === "custom" && (
        <>
          <Input
            type="date"
            value={filter.startDate || ""}
            onChange={(e) => onFilterChange({ ...filter, startDate: e.target.value })}
            className={`${compact ? 'h-7 text-xs w-28' : 'h-9 text-sm flex-1 min-w-[130px]'}`}
          />
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground flex-shrink-0`}>to</span>
          <Input
            type="date"
            value={filter.endDate || ""}
            onChange={(e) => onFilterChange({ ...filter, endDate: e.target.value })}
            className={`${compact ? 'h-7 text-xs w-28' : 'h-9 text-sm flex-1 min-w-[130px]'}`}
          />
        </>
      )}
    </div>
  );
}

// Helper function to filter data by date
export function filterByDateRange<T extends { date?: string; createdAt?: string; inspectionDate?: string }>(
  data: T[],
  filter: DateFilter,
  dateField: keyof T = "createdAt" as keyof T
): T[] {
  const { type, week, month, year, startDate, endDate } = filter;

  // Handle preset ranges
  if (type === "lastmonth" || type === "last3months" || type === "last6months") {
    const now = new Date();
    const monthsBack = type === "lastmonth" ? 1 : type === "last3months" ? 3 : 6;
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    return data.filter(item => {
      const dateValue = item[dateField] as string | undefined;
      if (!dateValue) return false;
      const itemDate = new Date(dateValue);
      if (isNaN(itemDate.getTime())) return false;
      return itemDate >= rangeStart && itemDate <= rangeEnd;
    });
  }

  return data.filter(item => {
    const dateValue = item[dateField] as string | undefined;
    if (!dateValue) return false;
    
    const itemDate = new Date(dateValue);
    
    // Validate that the date is valid
    if (isNaN(itemDate.getTime())) return false;
    
    if (type === "week" && week) {
      // Parse week string (YYYY-Www)
      const [weekYear, weekNum] = week.split("-W");
      if (!weekYear || !weekNum) return false;
      
      const itemYear = itemDate.getFullYear();
      const onejan = new Date(itemYear, 0, 1);
      const itemWeek = Math.ceil((((itemDate.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      
      return itemYear === parseInt(weekYear) && itemWeek === parseInt(weekNum);
    } else if (type === "month" && month) {
      const [filterYear, filterMonth] = month.split("-");
      if (!filterYear || !filterMonth) return false;
      return itemDate.getFullYear() === parseInt(filterYear) && 
             itemDate.getMonth() === parseInt(filterMonth) - 1;
    } else if (type === "year" && year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) return false;
      return itemDate.getFullYear() === yearNum;
    } else if (type === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }
    return false;
  });
}

// Helper function to group data by time period
export function groupByTimePeriod<T extends { date?: string; createdAt?: string; inspectionDate?: string; quantity?: number }>(
  data: T[],
  groupBy: "day" | "month" | "week",
  dateField: keyof T = "createdAt" as keyof T
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  data.forEach(item => {
    const dateValue = item[dateField] as string | undefined;
    if (!dateValue) return;
    
    const itemDate = new Date(dateValue);
    if (isNaN(itemDate.getTime())) return;
    
    let key = "";
    
    if (groupBy === "day") {
      key = itemDate.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (groupBy === "month") {
      key = itemDate.toISOString().slice(0, 7); // YYYY-MM
    } else if (groupBy === "week") {
      const year = itemDate.getFullYear();
      const onejan = new Date(year, 0, 1);
      const week = Math.ceil((((itemDate.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      key = `${year}-W${week.toString().padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  return grouped;
}

// Helper function to sort time period keys
export function sortTimePeriodKeys(keys: string[]): string[] {
  return keys.sort((a, b) => {
    // Try to parse as dates (YYYY-MM-DD, YYYY-MM, or YYYY-Www)
    const dateA = new Date(a.replace(/W\d+$/, '')); 
    const dateB = new Date(b.replace(/W\d+$/, ''));
    
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Fallback to string comparison
    return a.localeCompare(b);
  });
}
