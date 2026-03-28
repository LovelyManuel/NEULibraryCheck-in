
"use client";

import { useState, useMemo, use } from "react";
import { useAuth as useAuthContext } from "@/app/components/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Timestamp, getDocs } from "firebase/firestore";
import { LibraryVisit } from "@/app/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { 
  Loader2, 
  Activity, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  FileDown, 
  Menu,
  ChevronDown,
  TrendingUp
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";
import { AdminNav } from "../components/admin-nav";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "../components/theme-toggle";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const COLORS = [
  '#336BCC', '#29C4E0', '#10B981', '#F59E0B', '#6366F1', '#EC4899',
  '#F43F5E', '#8B5CF6', '#06B6D4', '#84CC16', '#EAB308', '#F97316',
  '#EF4444', '#64748B', '#0891B2', '#059669', '#D97706', '#4F46E5',
  '#DB2777', '#7C3AED'
];

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const words = payload.value.split(' ');
  const lines: string[] = [];
  
  if (words.length > 3) {
    lines.push(words.slice(0, 2).join(' '));
    lines.push(words.slice(2, 4).join(' '));
    lines.push(words.slice(4).join(' '));
  } else if (words.length > 2) {
    lines.push(words.slice(0, 2).join(' '));
    lines.push(words.slice(2).join(' '));
  } else {
    lines.push(payload.value);
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={-12}
          y={index * 11 - (lines.length - 1) * 5.5}
          textAnchor="end"
          fill="currentColor"
          className="fill-slate-400 dark:fill-slate-500 text-[9px] font-bold"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111421] text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-2xl border border-white/10 uppercase tracking-widest whitespace-nowrap">
        {payload[0].payload.name || payload[0].payload.time}: {payload[0].value}
      </div>
    );
  }
  return null;
};

const CustomPieLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8 max-w-sm mx-auto">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3.5 h-3.5 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-headline">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function AdminDashboard({ params, searchParams }: PageProps) {
  use(params);
  use(searchParams);

  const { profile, loading: authLoading } = useAuthContext();
  const db = useFirestore();
  const { toast } = useToast();
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = 'https://neu.edu.ph/main/img/neu.png';

  const dateFilter = useMemo(() => {
    if (range === 'custom' && customRange?.from) {
      const start = new Date(customRange.from);
      start.setHours(0, 0, 0, 0);
      const end = customRange.to ? new Date(customRange.to) : new Date(customRange.from);
      end.setHours(23, 59, 59, 999);
      
      return {
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end)
      };
    }

    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (range === 'week') d.setDate(d.getDate() - 7);
    else if (range === 'month') d.setMonth(d.getMonth() - 1);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    return {
      start: Timestamp.fromDate(d),
      end: Timestamp.fromDate(end)
    };
  }, [range, customRange]);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || profile?.role !== 'admin') return null;
    return query(
      collection(db, "visits"),
      where("timestamp", ">=", dateFilter.start),
      where("timestamp", "<=", dateFilter.end),
      orderBy("timestamp", "asc")
    );
  }, [db, dateFilter, profile]);

  const { data: visitsData, isLoading: visitsLoading } = useCollection<LibraryVisit>(visitsQuery);
  const visits = visitsData || [];

  const handleRefresh = async () => {
    if (isRefreshing || !db) return;
    setIsRefreshing(true);
    try {
      const q = query(
        collection(db, "visits"),
        where("timestamp", ">=", dateFilter.start),
        where("timestamp", "<=", dateFilter.end),
        orderBy("timestamp", "asc")
      );
      await getDocs(q);
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({
        title: "Data Refreshed",
        description: "Dashboard metrics have been updated.",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Refresh Failed", description: "Could not fetch fresh data." });
    } finally {
      setIsRefreshing(false);
    }
  };

  const statsByTime = useMemo(() => {
    const timeMap: Record<string, number> = {};
    visits.forEach(v => {
      const date = v.timestamp.toDate();
      let key = "";
      if (range === 'today') {
        key = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        key = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      timeMap[key] = (timeMap[key] || 0) + 1;
    });
    return Object.entries(timeMap).map(([time, count]) => ({ time, count }));
  }, [visits, range]);

  const statsByCollege = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      const name = v.collegeName || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  const statsByPurpose = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      counts[v.purposeOfVisit] = (counts[v.purposeOfVisit] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  const statsByVisitorType = useMemo(() => {
    const counts: Record<string, number> = { "Student": 0, "Employee (Faculty/Staff)": 0 };
    visits.forEach(v => {
      if (v.visitorType) {
        counts[v.visitorType] = (counts[v.visitorType] || 0) + 1;
      } else {
        counts["Student"] = (counts["Student"] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const uniqueVisitors = new Set(visits.map(v => v.userId)).size;
    doc.setFontSize(22);
    doc.setTextColor(51, 107, 204);
    doc.text("NEU Library Comprehensive Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Period: ${range.toUpperCase()}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);
    doc.setFontSize(14);
    doc.setTextColor(51, 107, 204);
    doc.text("1. Core Strategic Metrics", 14, 45);
    autoTable(doc, {
      startY: 48,
      head: [['Core Metric', 'Value']],
      body: [
        ['Total Library Attendance', visits.length.toString()],
        ['Most Active Department', statsByCollege[0]?.name || "N/A"],
        ['Primary Visit Purpose', statsByPurpose[0]?.name || "N/A"],
        ['Unique Visitors Recorded', uniqueVisitors.toString()]
      ],
      headStyles: { fillColor: [51, 107, 204] },
      styles: { cellPadding: 3 }
    });
    const breakdownStartY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setTextColor(41, 196, 224);
    doc.text("2. Institutional Attendance Breakdown", 14, breakdownStartY);
    autoTable(doc, {
      startY: breakdownStartY + 3,
      head: [['Institutional College / Department', 'Visit Count']],
      body: statsByCollege.map(c => [c.name, c.count.toString()]),
      headStyles: { fillColor: [41, 196, 224] },
      styles: { cellPadding: 3 }
    });
    doc.save(`NEU_Library_Full_Report_${range}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleConfirmRange = () => {
    if (pendingRange) {
      setCustomRange(pendingRange);
      setIsPopoverOpen(false);
    }
  };

  const handleResetRange = () => {
    setPendingRange(undefined);
    setCustomRange(undefined);
  };

  if (authLoading || (visitsLoading && visits.length === 0)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authLoading && profile?.role !== 'admin') {
    return <div className="p-8 text-center font-bold text-destructive">Unauthorized Access. Administrators Only.</div>;
  }

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex relative overflow-hidden transition-colors duration-300 font-body">
      <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000">
        {bgImage && (
          <Image 
            src={bgImage} 
            alt="Library Background" 
            fill 
            className="object-cover opacity-60 dark:opacity-45"
            priority
            data-ai-hint="university building"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/40 dark:from-slate-950/70 via-transparent to-slate-200/40 dark:to-slate-900/70 backdrop-blur-[6px]" />
      </div>

      <aside className="w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-800 hidden lg:flex flex-col h-full z-30 shadow-xl border-slate-200/50">
        <AdminNav />
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10 flex flex-col h-full scroll-smooth">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image 
                src={logoImage} 
                alt="NEU Logo" 
                fill 
                className="object-contain"
                data-ai-hint="university logo"
              />
            </div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider font-headline">NEU Library</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-all rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <AdminNav />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-slate-800 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-headline">Live Monitoring Pulse</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-headline">Overview</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Strategic analysis of library attendance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/50 dark:border-slate-800 shadow-lg">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "h-9 w-9 rounded-xl bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 transition-all hover:bg-primary/10 hover:text-primary",
                  isRefreshing && "opacity-50"
                )}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
              </Button>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-2 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary shadow-sm rounded-xl transition-all"
                onClick={handleExportPDF}
              >
                <FileDown className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Download Full Report</span>
              </Button>

              <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 p-1 rounded-xl border dark:border-slate-700 shadow-sm overflow-x-auto max-w-full no-scrollbar">
                <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
                  <TabsList className="bg-transparent h-8">
                    {['today', 'week', 'month', 'custom'].map((val) => (
                      <TabsTrigger 
                        key={val}
                        value={val} 
                        className="text-[10px] lg:text-xs h-7 px-2 lg:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all hover:bg-primary/10 hover:text-primary capitalize font-headline"
                      >
                        {val}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "h-7 ml-1 px-2 text-[10px] font-bold border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 hover:bg-primary/10 hover:text-primary font-headline",
                        range !== 'custom' ? "hidden opacity-0" : "flex opacity-100 animate-in fade-in slide-in-from-left-2"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {customRange?.from ? (
                        customRange.to 
                          ? `${format(customRange.from, "MMM dd")} - ${format(customRange.to, "MMM dd")}`
                          : format(customRange.from, "MMM dd")
                      ) : "Select Range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden" align="end">
                    <div className="p-4 pb-1">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-headline">Date Range</h2>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleResetRange} 
                          className="text-slate-400 font-bold text-[10px] hover:bg-primary/10 hover:text-primary transition-colors rounded-lg h-7 font-headline"
                        >
                          Reset
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-primary uppercase mb-0.5 font-headline">From</p>
                          <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-200 truncate block">
                            {pendingRange?.from ? format(pendingRange.from, "MMM dd, yyyy") : "Select date"}
                          </span>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-primary uppercase mb-0.5 font-headline">To</p>
                          <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-200 truncate block">
                            {pendingRange?.to ? format(pendingRange.to, "MMM dd, yyyy") : "Select date"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-2">
                      <Calendar 
                        mode="range" 
                        selected={pendingRange} 
                        onSelect={setPendingRange} 
                        numberOfMonths={1} 
                        className="w-full" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsPopoverOpen(false)} 
                        className="text-slate-500 font-bold text-xs hover:bg-primary/10 hover:text-primary transition-colors rounded-lg font-headline"
                      >
                        Close
                      </Button>
                      <Button size="sm" onClick={handleConfirmRange} className="bg-primary text-white px-5 h-8 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all font-headline">
                        Confirm
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-xl bg-primary text-white overflow-hidden rounded-2xl relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80 font-headline">Total Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold font-headline">{visits.length}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-headline">Peak Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate text-slate-900 dark:text-slate-100 font-headline">{statsByCollege[0]?.name || "N/A"}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-headline">Primary Purpose</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-headline">{statsByPurpose[0]?.name || "N/A"}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-headline">Active Group</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-headline">{statsByVisitorType[0]?.name || "N/A"}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
            <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6">
              <CardHeader className="px-0 pt-0 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white font-headline">Attendance Trend</CardTitle>
                    <CardDescription className="font-headline">Temporal analysis of student visits</CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary opacity-60" />
                </div>
              </CardHeader>
              <CardContent className="h-[400px] px-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsByTime}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="#336BCC" strokeWidth={3} dot={{ r: 4, fill: '#336BCC', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white font-headline">Visitor Classification</CardTitle>
                <CardDescription className="font-headline">Ratio of students to employees</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] px-0 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statsByVisitorType} 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={5} 
                      dataKey="count"
                      stroke="none"
                    >
                      <Cell fill="#336BCC" />
                      <Cell fill="#10B981" />
                    </Pie>
                    <ChartTooltip content={<CustomTooltip />} />
                    <Legend content={<CustomPieLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white font-headline">Departmental Analytics</CardTitle>
                <CardDescription className="font-headline">Attendance by college</CardDescription>
              </CardHeader>
              <CardContent className="h-[420px] px-0 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsByCollege} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={<CustomYAxisTick />}
                    />
                    <ChartTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                      {statsByCollege.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white font-headline">Primary Purpose Distribution</CardTitle>
                <CardDescription className="font-headline">Reason for visits</CardDescription>
              </CardHeader>
              <CardContent className="h-[380px] px-0 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statsByPurpose} 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={5} 
                      dataKey="count"
                      stroke="none"
                    >
                      {statsByPurpose.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<CustomTooltip />} />
                    <Legend content={<CustomPieLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
