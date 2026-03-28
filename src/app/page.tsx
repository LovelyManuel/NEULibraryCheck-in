'use client';

import { useAuth as useAuthContext } from '@/app/components/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  GraduationCap, 
  ShieldCheck, 
  UserCircle, 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function Home(props: PageProps) {
  // Unwrap Next.js 15 dynamic APIs
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const { user, profile, loading, signIn } = useAuthContext();
  const router = useRouter();
  const [portal, setPortal] = useState<'selection' | 'student' | 'admin'>('selection');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = placeholderData.placeholderImages.find(img => img.id === 'neu-logo')?.imageUrl || 'https://neu.edu.ph/main/img/neu.png';

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signIn(portal === 'admin' ? 'admin' : 'student');
      if (portal === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/check-in');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 overflow-hidden font-body text-white">
      <div className="absolute inset-0 z-0">
        {bgImage && (
          <Image 
            src={bgImage} 
            alt="New Era University Library" 
            fill 
            className="object-cover"
            priority
            data-ai-hint="university building"
          />
        )}
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[4px]" />
      </div>

      {/* Real-time Clock */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        {currentTime && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-1000">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <div className="flex flex-col text-right">
                <span className="text-xl font-bold tracking-tight leading-none font-headline">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center">
        <div className="mb-10 flex flex-col items-center">
          <div className="w-40 h-40 md:w-48 md:h-48 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl mb-8 p-6 transition-transform hover:scale-105 duration-500 overflow-hidden">
            <div className="relative w-full h-full">
              <Image 
                src={logoImage} 
                alt="NEU Logo" 
                fill 
                className="object-contain"
                data-ai-hint="university logo"
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-center mb-1 drop-shadow-md font-headline uppercase">
            NEU Library Portal
          </h1>
          <p className="text-white/60 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase">Institutional Access</p>
        </div>

        <div className="max-w-md mx-auto w-full">
          {portal === 'selection' ? (
            <div className="space-y-4">
              <Card 
                className="border-2 border-white/30 shadow-2xl bg-primary/40 backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group rounded-3xl"
                onClick={() => setPortal('student')}
              >
                <CardContent className="p-0">
                  <div className="w-full h-24 flex items-center px-6 gap-5 text-white">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shrink-0">
                      <UserCircle className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold tracking-tight font-headline">Student Portal</span>
                      <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Institutional Account</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-2 border-white/30 shadow-2xl bg-white/10 backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group rounded-3xl"
                onClick={() => setPortal('admin')}
              >
                <CardContent className="p-0">
                  <div className="w-full h-24 flex items-center px-6 gap-5 text-white">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shrink-0">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold tracking-tight font-headline">Admin Portal</span>
                      <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold mt-0.5">Authorized Staff Only</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-white/30 shadow-2xl bg-white/10 backdrop-blur-xl overflow-hidden p-2 rounded-3xl">
              <CardHeader className="text-center space-y-2 pb-6 pt-6 relative">
                <button 
                  onClick={() => setPortal('selection')}
                  className="absolute left-2 top-4 text-white/60 hover:text-white transition-colors p-2"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="mx-auto w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-1 border border-white/20">
                  {portal === 'admin' ? <ShieldCheck className="h-7 w-7 text-white" /> : <UserCircle className="h-7 w-7 text-white" />}
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white font-headline">
                  {portal === 'admin' ? 'Staff Login' : 'Student Login'}
                </CardTitle>
                <CardDescription className="text-sm text-white/70">
                  {portal === 'admin' 
                    ? 'Sign in to access library management tools.' 
                    : 'Please use your institutional Google account.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8 pt-0">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 bg-white text-primary hover:bg-white/90 rounded-2xl font-headline"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <GraduationCap className="h-6 w-6" />
                      Continue with Google
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-white/20 flex-1" />
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-headline">Secure Access</span>
                  <div className="h-px bg-white/20 flex-1" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <footer className="absolute bottom-6 w-full text-center z-10 px-6 space-y-3">
        <p className="text-white text-[13px] md:text-sm font-bold tracking-wide">
          New Era University Library · Central, Quezon City
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-white/90 text-[10px] md:text-xs font-medium">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Phone className="h-3 w-3" />
            <span>(02) 7273-6345</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Mail className="h-3 w-3" />
            <span>library@neu.edu.ph</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="leading-tight">No. 9 Central Avenue, New Era, Quezon City, 1107 Metro Manila</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
