
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
import { cn } from "@/lib/utils";

export function AdminNav() {
  const { profile, logOut } = useAuthContext();
  const pathname = usePathname();
  const logoImage = placeholderData.placeholderImages.find(img => img.id === 'neu-logo')?.imageUrl || 'https://neu.edu.ph/main/img/neu.png';

  const NavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        className={cn(
          "flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-300",
          isActive 
            ? 'bg-primary text-white font-semibold shadow-lg shadow-primary/25' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors")} />
          <span className="text-[14px]">{label}</span>
        </div>
        {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="p-8 flex items-center gap-4">
        <div className="w-14 h-14 relative flex-shrink-0">
          <Image 
            src={logoImage} 
            alt="NEU Logo" 
            fill 
            className="object-contain"
            data-ai-hint="university logo"
          />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-900 dark:text-white leading-none font-headline">NEU Library</h2>
          <p className="text-[10px] text-primary/70 uppercase tracking-widest font-bold mt-2">Staff Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-9 overflow-y-auto no-scrollbar">
        <div>
          <p className="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Core Monitoring</p>
          <div className="space-y-1.5">
            <NavLink href="/admin/dashboard" icon={LayoutDashboard} label="Overview" />
          </div>
        </div>

        <div>
          <p className="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Data Management</p>
          <div className="space-y-1.5">
            <NavLink href="/admin/users" icon={UserCog} label="Access Control" />
            <NavLink href="/admin/audit-logs" icon={FileText} label="Audit Logs" />
            <Link href="/check-in" className="flex items-center justify-between group px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[14px]">Public View</span>
              </div>
            </Link>
          </div>
        </div>

        <div>
          <p className="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">System Health</p>
          <div className="space-y-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Database</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Security</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900">STABLE</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 text-lg">
            {profile?.displayName?.charAt(0) || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[14px] font-bold truncate text-slate-900 dark:text-white leading-tight">{profile?.displayName}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Administrator</p>
          </div>
        </div>
        
        <button 
          onClick={logOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 group"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span className="text-[14px] font-semibold group-hover:text-red-600 transition-colors">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
