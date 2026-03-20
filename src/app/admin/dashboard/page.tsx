
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
  Users, 
  Library,
  FileDown,
  Menu,
  TrendingUp,
  Clock,
  Activity,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  X
} from "lucide-react";
import Link from "next/link";
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

const COLORS = ['#336BCC', '#29C4E0', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function AdminDashboard(props: PageProps) {
  // Unwrap Next.js 15 dynamic APIs
  use(props.params);
  use(props.searchParams);

  const { profile, loading: authLoading } = useAuthContext();
  const db = useFirestore();
  const { toast } = useToast();
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>();
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = placeholderData.placeholderImages.find(img => img.id === 'neu-logo')?.imageUrl || 'https://neu.edu.ph/main/img/neu.png';

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

    const purposeStartY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("3. Visit Purpose Distribution", 14, purposeStartY);
    autoTable(doc, {
      startY: purposeStartY + 3,
      head: [['Reason for Visit', 'Visitor Count']],
      body: statsByPurpose.map(p => [p.name, p.count.toString()]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { cellPadding: 3 }
    });

    doc.addPage();

    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text("4. Temporal Traffic Patterns", 14, 20);
    autoTable(doc, {
      startY: 23,
      head: [['Time / Date Interval', 'Entries Recorded']],
      body: statsByTime.map(t => [t.time, t.count.toString()]),
      headStyles: { fillColor: [99, 102, 241] },
      styles: { cellPadding: 3 }
    });

    const registryStartY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("5. Historical Entry Registry", 14, registryStartY);
    autoTable(doc, {
      startY: registryStartY + 3,
      head: [['Visitor Name', 'Department', 'Purpose', 'Date', 'Time']],
      body: visits.slice().reverse().map(v => [
        v.userName || "Unknown",
        v.collegeName || "Unknown",
        v.purposeOfVisit,
        v.timestamp.toDate().toLocaleDateString(),
        v.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ]),
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 8, cellPadding: 2 }
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
  };

  if (authLoading || (visitsLoading && visits.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authLoading && profile?.role !== 'admin') {
    return <div className="p-8 text-center font-bold text-destructive">Unauthorized Access. Administrators Only.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex relative overflow-hidden transition-colors duration-300 font-body">
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

      <aside className="w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r dark:border-slate-800 hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto z-30 shadow-xl border-slate-200/50">
        <AdminNav />
      </aside>

      <main className="flex-1 overflow-auto relative z-10 flex flex-col">
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
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">NEU Library</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
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
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Monitoring Pulse</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-headline">Overview</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Strategic analysis of library attendance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/50 dark:border-slate-800 shadow-lg">
              <Button 
                variant="outline" 
                size="icon" 
                className={`h-9 w-9 rounded-xl bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-2 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm rounded-xl"
                onClick={handleExportPDF}
              >
                <FileDown className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Download Full Report</span>
              </Button>

              <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 p-1 rounded-xl border dark:border-slate-700 shadow-sm">
                <Tabs value={range} onValueChange={(v) => {
                  setRange(v as any);
                }}>
                  <TabsList className="bg-transparent h-8">
                    <TabsTrigger value="today" className="text-xs h-7 px-3 lg:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Today</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs h-7 px-3 lg:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Week</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs h-7 px-3 lg:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Month</TabsTrigger>
                    <TabsTrigger value="custom" className="text-xs h-7 px-3 lg:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Custom</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 ml-1 px-2 text-[10px] font-medium border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm",
                        range !== 'custom' && "hidden",
                        !customRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {customRange?.from ? (
                        customRange.to ? (
                          <>
                            {format(customRange.from, "MMM dd, yyyy")} - {format(customRange.to, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(customRange.from, "MMM dd, yyyy")
                        )
                      ) : (
                        <span>Select Range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900" align="end">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Date Range</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleResetRange} 
                          className="h-8 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                        >
                          Reset
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            if (pendingRange?.from) setCalendarMonth(pendingRange.from);
                          }}
                          className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-between shadow-inner hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-primary leading-none mb-0.5">
                              {pendingRange?.from ? format(pendingRange.from, "EEEE") : "From"}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {pendingRange?.from ? format(pendingRange.from, "dd MMMM, yyyy") : "Select date"}
                            </span>
                          </div>
                          <ChevronDown className="h-3 w-3 text-slate-400" />
                        </button>
                        <div className="text-slate-300 font-medium">To</div>
                        <button 
                          onClick={() => {
                            if (pendingRange?.to) setCalendarMonth(pendingRange.to);
                          }}
                          className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-between shadow-inner hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-primary leading-none mb-0.5">
                              {pendingRange?.to ? format(pendingRange.to, "EEEE") : "To"}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {pendingRange?.to ? format(pendingRange.to, "dd MMMM, yyyy") : "Select date"}
                            </span>
                          </div>
                          <ChevronDown className="h-3 w-3 text-slate-400" />
                        </button>
                      </div>

                      <div className="border rounded-2xl p-1 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <Calendar
                          initialFocus
                          mode="range"
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          selected={pendingRange}
                          onSelect={setPendingRange}
                          numberOfMonths={1}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t dark:border-slate-800">
                      <Button variant="ghost" onClick={() => setIsPopoverOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
                        Close
                      </Button>
                      <Button onClick={handleConfirmRange} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-xl shadow-lg shadow-primary/20">
                        Confirm
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl bg-primary/95 backdrop-blur-sm text-white overflow-hidden rounded-2xl relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="h-20 w-20" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Total Attendance</CardTitle>
                <Users className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold">{visits.length}</div>
                <p className="text-xs mt-2 opacity-70">Filtered for your selected range</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Peak Department</CardTitle>
                <Library className="h-4 w-4 text-primary/40" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate text-slate-900 dark:text-slate-100">{statsByCollege[0]?.name || "N/A"}</div>
                <p className="text-xs text-muted-foreground mt-2">Top institutional contributor</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Primary Purpose</CardTitle>
                <Clock className="h-4 w-4 text-primary/40" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statsByPurpose[0]?.name || "N/A"}</div>
                <p className="text-xs text-muted-foreground mt-2">Main reason for library entry</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Trend</CardTitle>
                  <CardDescription>Temporal analysis of student visits</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="h-[300px] px-0 pb-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statsByTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                  <ChartTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }} 
                  />
                  <Line type="monotone" dataKey="count" stroke="#336BCC" strokeWidth={3} dot={{ r: 4, fill: '#336BCC', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Departmental Analytics</CardTitle>
                <CardDescription>Attendance by college</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] px-0 pb-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsByCollege} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                    <ChartTooltip 
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-2xl">
                              <p className="text-[10px] font-bold text-white uppercase tracking-tight">
                                {payload[0].payload.name} count: {payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                      {statsByCollege.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-4 lg:p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Primary Purpose Distribution</CardTitle>
                <CardDescription>Reason for visits</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] px-0 pb-0 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByPurpose}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      style={{ outline: 'none' }}
                    >
                      {statsByPurpose.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
                              <p className="text-[10px] font-bold text-white uppercase tracking-tight">
                                {payload[0].name}: {payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={80} 
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Recent Activity
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </CardTitle>
                  <CardDescription>Live monitoring of library entries</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="py-4 px-6">Visitor</th>
                      <th className="py-4 px-6">College</th>
                      <th className="py-4 px-6">Purpose</th>
                      <th className="py-4 px-6 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                    {visits.slice().reverse().slice(0, 10).map((visit) => (
                      <tr key={visit.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">
                              {visit.userName?.charAt(0) || "U"}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{visit.userName || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[11px] text-slate-500 dark:text-slate-400">
                          {visit.collegeName}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                            {visit.purposeOfVisit}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {visit.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t dark:border-slate-800 text-center">
                <Button variant="link" size="sm" asChild className="text-[11px] text-primary font-bold">
                  <Link href="/admin/audit-logs">View Full Audit Logs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
