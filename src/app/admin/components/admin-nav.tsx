
"use client";

import { useAuth as useAuthContext } from "@/app/components/auth-context";
import { 
  Library, 
  LayoutDashboard, 
  UserCog, 
  LogOut, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  Activity, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";

export function AdminNav() {
  const { profile, logOut } = useAuthContext();
  const pathname = usePathname();
  const logoImage = placeholderData.placeholderImages.find(img => img.id === 'neu-logo')?.imageUrl || 'https://neu.edu.ph/main/img/neu.png';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="p-8 flex items-center gap-3">
        <div className="w-12 h-12 relative flex-shrink-0">
          <Image 
            src={logoImage} 
            alt="NEU Logo" 
            fill 
            className="object-contain"
            data-ai-hint="university logo"
          />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-white leading-none">NEU Library</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1.5">Staff Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-8">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Core Monitoring</p>
          <div className="space-y-1">
            <Link href="/admin/dashboard" className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all ${pathname === '/admin/dashboard' ? 'bg-primary text-white font-medium shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5" />
                Overview
              </div>
              <ChevronRight className={`h-4 w-4 ${pathname === '/admin/dashboard' ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`} />
            </Link>
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Data Management</p>
          <div className="space-y-1">
            <Link href="/admin/users" className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all ${pathname === '/admin/users' ? 'bg-primary text-white font-medium shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5" />
                Access Control
              </div>
              <ChevronRight className={`h-4 w-4 ${pathname === '/admin/users' ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`} />
            </Link>
            <Link href="/admin/audit-logs" className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all ${pathname === '/admin/audit-logs' ? 'bg-primary text-white font-medium shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Audit Logs
              </div>
              <ChevronRight className={`h-4 w-4 ${pathname === '/admin/audit-logs' ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`} />
            </Link>
            <Link href="/check-in" className="flex items-center justify-between group px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" />
                Public View
              </div>
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-all" />
            </Link>
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">System Health</p>
          <div className="space-y-3 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Database</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Security</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">STABLE</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-700">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
            {profile?.displayName?.charAt(0) || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{profile?.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Administrator</p>
          </div>
        </div>
        <button 
          onClick={logOut}
          className="w-full flex items-center justify-between group px-4 py-3 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 group-hover:text-primary transition-colors" />
            <span className="font-medium group-hover:text-primary transition-colors">Sign Out</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-all" />
        </button>
      </div>
    </div>
  );
}
