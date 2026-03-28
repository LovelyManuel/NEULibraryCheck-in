"use client";

import { useState, useEffect, use } from "react";
import { useAuth as useAuthContext } from "@/app/components/auth-context";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc, limit } from "firebase/firestore";
import { LibraryUser } from "@/app/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Loader2, 
  Search, 
  UserMinus, 
  UserCheck, 
  ShieldAlert, 
  Menu,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";
import { AdminNav } from "../components/admin-nav";
import { ThemeToggle } from "../components/theme-toggle";

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function UserManagement(props: PageProps) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const { profile, loading: authLoading } = useAuthContext();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = 'https://neu.edu.ph/main/img/neu.png';

  const searchUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!db || profile?.role !== 'admin') return;
    setLoading(true);
    
    const usersRef = collection(db, "users");
    let q;
    if (searchTerm) {
      q = query(
        usersRef, 
        where("displayName", ">=", searchTerm), 
        where("displayName", "<=", searchTerm + "\uf8ff"),
        limit(50)
      );
    } else {
      q = query(usersRef, limit(50));
    }
    
    getDocs(q).then(snapshot => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LibraryUser));
      setUsers(data);
      setLoading(false);
    }).catch(async (error) => {
      const contextualError = new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', contextualError);
      setLoading(false);
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (db && profile?.role === 'admin') searchUsers();
  }, [db, profile]);

  const toggleBlockStatus = async (user: LibraryUser) => {
    if (!db) return;
    const userDocRef = doc(db, "users", user.id);
    const newData = { isBlocked: !user.isBlocked };
    
    updateDoc(userDocRef, newData).then(() => {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u
      ));

      toast({
        title: user.isBlocked ? "Access Restored" : "User Blocked",
        description: `${user.displayName} has been ${user.isBlocked ? 'unblocked' : 'restricted from library access'}.`
      });
    }).catch(async (error) => {
      const contextualError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: newData,
      });
      errorEmitter.emit('permission-error', contextualError);
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return <div className="p-8 text-center font-bold text-destructive">Unauthorized Access. Administrators Only.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex relative overflow-hidden transition-colors duration-300">
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

        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/50 dark:border-slate-800 inline-block shadow-lg">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Access Control</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Manage student permissions and monitor institutional access levels.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/50 dark:border-slate-800 shadow-lg">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 transition-all hover:bg-primary/10 hover:text-primary"
                onClick={handleReload}
                title="Reload"
              >
                <RefreshCw className="h-4 w-4 text-primary" />
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <Card className="border-none shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-hidden rounded-2xl">
            <CardHeader className="pb-3 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <form onSubmit={searchUsers} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search students..." 
                    className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-primary rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="px-8 shadow-sm rounded-xl h-10">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search Directory"}
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800">
                      <th className="py-5 px-6">Student Profile</th>
                      <th className="py-5 px-6 hidden md:table-cell">Institutional Email</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold border border-slate-200 dark:border-slate-700">
                              {user.displayName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{user.displayName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono opacity-60 md:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium hidden md:table-cell">
                          {user.email}
                        </td>
                        <td className="py-5 px-6">
                          {user.isBlocked ? (
                            <Badge variant="destructive" className="gap-1.5 px-2 py-0.5 lg:px-3 lg:py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] lg:text-xs">
                              <ShieldAlert className="h-3 w-3" />
                              Restricted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 lg:px-3 lg:py-1 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] lg:text-xs">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant={user.isBlocked ? "outline" : "ghost"} 
                              size="sm"
                              className={user.isBlocked 
                                ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg px-2 lg:px-4 text-[10px] lg:text-xs" 
                                : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg px-2 lg:px-4 text-[10px] lg:text-xs"
                              }
                              onClick={() => toggleBlockStatus(user)}
                              disabled={user.id === profile?.id}
                            >
                              {user.id === profile?.id ? "Me" : (
                                user.isBlocked ? (
                                  <UserCheck className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                                ) : (
                                  <UserMinus className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                                )
                              )}
                              <span className="hidden lg:inline">{user.isBlocked ? "Unblock" : "Block"}</span>
                            </Button>
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
