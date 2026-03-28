
"use client";

import { useMemo, useState, use } from "react";
import { useAuth as useAuthContext } from "@/app/components/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { LibraryVisit } from "@/app/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Loader2, 
  Search, 
  Menu,
  Clock,
  FileDown,
  UserCircle
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";
import { AdminNav } from "../components/admin-nav";
import { ThemeToggle } from "../components/theme-toggle";

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function AuditLogsPage({ params, searchParams }: PageProps) {
  // Unwrap Next.js 15 dynamic APIs
  use(params);
  use(searchParams);

  const { profile, loading: authLoading } = useAuthContext();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = 'https://neu.edu.ph/main/img/neu.png';

  const visitsQuery = useMemoFirebase(() => {
    if (!db || profile?.role !== 'admin') return null;
    return query(collection(db, "visits"), orderBy("timestamp", "desc"), limit(200));
  }, [db, profile]);

  const { data: visitsData, isLoading: visitsLoading } = useCollection<LibraryVisit>(visitsQuery);
  const visits = visitsData || [];

  const filteredVisits = useMemo(() => {
    if (!searchTerm) return visits;
    const term = searchTerm.toLowerCase();
    return visits.filter(v => 
      v.userName?.toLowerCase().includes(term) ||
      v.visitorType?.toLowerCase().includes(term) ||
      v.purposeOfVisit?.toLowerCase().includes(term) ||
      v.collegeName?.toLowerCase().includes(term) ||
      v.program?.toLowerCase().includes(term)
    );
  }, [visits, searchTerm]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(51, 107, 204);
    doc.text("NEU Library Audit Logs", 14, 20);
    
    autoTable(doc, {
      startY: 35,
      head: [['Visitor', 'Type', 'College', 'Program', 'Purpose', 'Date', 'Time']],
      body: filteredVisits.map(v => [
        v.userName || "Unknown",
        v.visitorType || "Student",
        v.collegeName || "Unknown",
        v.program || "N/A",
        v.purposeOfVisit,
        v.timestamp.toDate().toLocaleDateString(),
        v.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ]),
      headStyles: { fillColor: [51, 107, 204] },
      styles: { fontSize: 7 },
    });

    doc.save(`NEU_Library_Audit_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col lg:flex-row relative transition-colors duration-300">
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

      <main className="flex-1 overflow-auto relative z-10">
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

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-slate-800 inline-block shadow-lg">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Audit Logs</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Historical record of all library entries and visitor activities.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/50 dark:border-slate-800 shadow-lg">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF} 
                className="rounded-xl h-9 gap-2 bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
              >
                <FileDown className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b dark:border-slate-800">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search name, type, or college..." 
                  className="pl-10 h-10 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800">
                      <th className="py-5 px-6">Visitor</th>
                      <th className="py-5 px-6">Type</th>
                      <th className="py-5 px-6">College</th>
                      <th className="py-5 px-6">Program</th>
                      <th className="py-5 px-6">Purpose</th>
                      <th className="py-5 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVisits.map((visit) => (
                      <tr key={visit.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-5 px-6">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{visit.userName || "Unknown"}</p>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 whitespace-nowrap">
                            {visit.visitorType || "Student"}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-sm text-slate-500 dark:text-slate-400">
                          {visit.collegeName}
                        </td>
                        <td className="py-5 px-6 text-sm text-slate-500 dark:text-slate-400">
                          {visit.program || "N/A"}
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 whitespace-nowrap">
                            {visit.purposeOfVisit}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {visit.timestamp.toDate().toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {visit.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
