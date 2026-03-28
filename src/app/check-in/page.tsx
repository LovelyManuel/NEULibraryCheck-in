
"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/app/components/auth-context";
import { collection, addDoc, getDocs, Timestamp, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { VISIT_PURPOSES, College, DEPARTMENTS, VISITOR_TYPES, VisitorType } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, LogOut, ClipboardCheck, School, ShieldCheck, Clock, Check, GraduationCap, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";
import { ThemeToggle } from "../admin/components/theme-toggle";

const COLLEGE_PROGRAMS: Record<string, string[]> = {
  "LIBRARY": ["Staff / Faculty"],
  "ABM": ["BS Accountancy"],
  "CAS": [
    "AB Communication", 
    "AB Political Science", 
    "BS Psychology", 
    "BS Biology"
  ],
  "CBA": [
    "BS Business Administration", 
    "BS Entrepreneurship", 
    "BS Tourism Management"
  ],
  "CEA": [
    "BS Architecture",
    "BS Civil Engineering", 
    "BS Electrical Engineering", 
    "BS Mechanical Engineering", 
    "BS Electronics Engineering", 
    "BS Industrial Engineering"
  ],
  "CED": [
    "Bachelor of Elementary Education", 
    "Bachelor of Secondary Education"
  ],
  "CICS": [
    "BS Computer Science", 
    "BS Information Technology", 
    "BS Information Systems"
  ],
  "CMT": ["BS Medical Technology"],
  "COA": ["BS Agriculture"],
  "COC": ["AB Communication"],
  "COM": ["BS Midwifery"],
  "COMS": ["BM Music"],
  "CON": ["BS Nursing"],
  "CPT": ["BS Physical Therapy"],
  "CRIM": ["BS Criminology"],
  "CRT": ["BS Respiratory Therapy"],
  "SOIR": ["AB International Relations"]
};

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function CheckInPage({ params, searchParams }: PageProps) {
  use(params);
  use(searchParams);

  const { user, profile, loading, logOut } = useAuth();
  const { firestore } = useFirebase();
  const [colleges, setColleges] = useState<College[]>([]);
  const [visitorType, setVisitorType] = useState<VisitorType | "">("");
  const [purpose, setPurpose] = useState<string>("");
  const [collegeId, setCollegeId] = useState<string>("");
  const [program, setProgram] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = 'https://neu.edu.ph/main/img/neu.png';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
        return;
      }
      
      const email = user.email || "";
      const isInstitutional = email.toLowerCase().endsWith("@neu.edu.ph");
      const isAllowedAdmin = [
        'francesaly11@gmail.com',
        'jcesperanza@neu.edu.ph',
        'admin@example.com'
      ].some(admin => admin.toLowerCase() === email.toLowerCase());

      if (!isInstitutional && !isAllowedAdmin) {
        router.push('/');
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (profile?.visitorType) {
      setVisitorType(profile.visitorType);
    }
  }, [profile]);

  useEffect(() => {
    const list = Object.entries(DEPARTMENTS).map(([id, name]) => ({
      id,
      name
    }));
    setColleges(list);
  }, []);

  useEffect(() => {
    setProgram("");
  }, [collegeId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submitted && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (submitted && countdown === 0) {
      router.push('/');
    }
    return () => clearTimeout(timer);
  }, [submitted, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !visitorType || !purpose || !collegeId || !firestore || !program) return;

    const selectedCollege = colleges.find(c => c.id === collegeId);
    const finalCollegeName = selectedCollege?.name || "Unassigned";

    setActionLoading(true);
    try {
      if (profile?.visitorType !== visitorType) {
        await updateDoc(doc(firestore, "users", user.uid), {
          visitorType: visitorType
        });
      }

      await addDoc(collection(firestore, "visits"), {
        userId: user.uid,
        userName: user.displayName,
        visitorType: visitorType,
        timestamp: Timestamp.now(),
        purposeOfVisit: purpose,
        collegeId: collegeId,
        collegeName: finalCollegeName,
        program: program
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const currentCollegeName = colleges.find(c => c.id === collegeId)?.name || "Unassigned";
  const availablePrograms = COLLEGE_PROGRAMS[collegeId] || [];

  const getGreetingName = () => {
    const fullName = profile?.displayName || user?.displayName || "";
    const parts = fullName.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0] || "Student";
  };

  const checkInTitle = visitorType === "Employee (Faculty/Staff)" ? "Employee Check-in" : "Student Check-in";

  if (loading || (!user && !submitted)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden transition-colors duration-300">
        <div className="fixed inset-0 z-0">
          {bgImage && (
            <Image 
              src={bgImage} 
              alt="Library Background" 
              fill 
              className="object-cover opacity-60 dark:opacity-40"
              priority
              data-ai-hint="university building"
            />
          )}
          <div className="absolute inset-0 bg-slate-100/60 dark:bg-slate-950/70 backdrop-blur-md" />
        </div>
        <Card className="w-full max-w-lg overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-500 relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl">
          <div className="h-2 bg-green-500" />
          <CardContent className="pt-12 pb-10 px-8 text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-14 w-14 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-headline">Success!</h2>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary tracking-tight font-headline">
                  Welcome to NEU library, {getGreetingName()}!
                </p>
                <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400 font-medium text-wrap">
                  <span>{currentCollegeName}</span>
                  <span className="text-primary/70">{program}</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-500 text-sm">Your visit has been logged. Happy studying!</p>
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Clock className="h-3 w-3 animate-pulse" />
                Returning to login in {countdown}s
              </div>
              <Button 
                variant="default" 
                size="lg" 
                className="w-full rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold text-lg"
                onClick={() => router.push('/')}
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/40 dark:from-slate-950/70 via-transparent to-slate-200/40 dark:to-slate-900/70 backdrop-blur-[8px]" />
      </div>

      <header className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 relative">
              <Image 
                src={logoImage} 
                alt="NEU Logo" 
                fill 
                className="object-contain"
                data-ai-hint="university logo"
              />
            </div>
            <h1 className="font-bold text-xl text-slate-900 dark:text-white">NEU Library</h1>
          </div>
          <div className="flex items-center gap-4">
            {profile?.role === 'admin' && (
              <Button variant="outline" size="sm" asChild className="hidden md:flex gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl dark:border-slate-800">
                <Link href="/admin/dashboard">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Portal
                </Link>
              </Button>
            )}
            
            <ThemeToggle />

            <div className="text-right hidden sm:block border-l pl-4 border-slate-200 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{profile?.displayName}</p>
              <p className="text-[10px] text-muted-foreground lowercase tracking-wider font-medium mt-1">{profile?.email}</p>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logOut} 
              className="text-slate-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-slate-800 transition-all rounded-xl"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="space-y-1 pb-8">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Visit Registration</span>
                </div>
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{checkInTitle}</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Please provide your visit details below to enter the library.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitorType" className="text-xs font-bold uppercase tracking-wider text-slate-400">Visitor Classification</Label>
                      <div className="relative">
                        <Select value={visitorType} onValueChange={(v) => setVisitorType(v as VisitorType)} required>
                          <SelectTrigger id="visitorType" className="h-12 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 focus:ring-primary pl-10 rounded-xl">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl">
                            {VISITOR_TYPES.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <UserCircle className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purpose" className="text-xs font-bold uppercase tracking-wider text-slate-400">Purpose of Visit</Label>
                      <Select value={purpose} onValueChange={setPurpose} required>
                        <SelectTrigger id="purpose" className="h-12 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 focus:ring-primary rounded-xl">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl">
                          {VISIT_PURPOSES.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="college" className="text-xs font-bold uppercase tracking-wider text-slate-400">College / Department</Label>
                      <div className="relative">
                        <Select value={collegeId} onValueChange={setCollegeId} required>
                          <SelectTrigger id="college" className="h-12 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 focus:ring-primary pl-10 rounded-xl">
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl">
                            {colleges.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <School className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-slate-400">Program / Course</Label>
                      <div className="relative">
                        <Select value={program} onValueChange={setProgram} disabled={!collegeId} required>
                          <SelectTrigger id="program" className="h-12 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 focus:ring-primary pl-10 rounded-xl text-left">
                            <SelectValue placeholder={!collegeId ? "Select college first" : "Select program"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl">
                            {availablePrograms.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <GraduationCap className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-primary/20 transition-all rounded-xl active:scale-95" 
                    disabled={actionLoading || !visitorType || !purpose || !collegeId || !program}
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Complete Check-in"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary/60" />
                  Library Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 text-sm">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Operation Hours</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Mon - Wed, Fri</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">7:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Thu, Sat</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">7:00 AM - 6:00 PM</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Available Services</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 text-xs group">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      FREE WIFI ACCESS
                    </li>
                    <li className="flex flex-col gap-1 leading-tight group">
                      <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 text-xs">
                        <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        PRINTING & COPYING
                      </div>
                      <span className="text-[9px] text-slate-400 ml-9 uppercase font-bold tracking-tighter">(Premium Service)</span>
                    </li>
                    <li className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 text-xs group">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      BOOK LENDING
                    </li>
                    <li className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 text-xs group">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      DIGITAL RESOURCES
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
