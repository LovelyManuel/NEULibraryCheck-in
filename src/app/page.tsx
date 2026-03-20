
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
  MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';

interface PageProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

export default function Home({ params, searchParams }: PageProps) {
  // Unwrap Next.js 15 dynamic APIs
  use(params);
  use(searchParams);

  const { user, profile, loading, signIn } = useAuthContext();
  const router = useRouter();
  const [portal, setPortal] = useState<'selection' | 'student' | 'admin'>('selection');
  const [authLoading, setAuthLoading] = useState(false);

  const bgImage = placeholderData.placeholderImages.find(img => img.id === 'neu-library-bg')?.imageUrl || '';
  const logoImage = 'https://neu.edu.ph/main/img/neu.png';

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signIn(portal === 'admin' ? 'admin' : 'student');
      // Redirect happens after successful login
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
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 overflow-hidden font-body">
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

      <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-700 pb-32">
        <div className="mb-10 flex flex-col items-center">
          <div className="relative group">
            <div className="w-48 h-48 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)] mb-8 overflow-hidden p-6 transition-transform hover:scale-105 duration-500">
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
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white text-center mb-1 drop-shadow-md font-headline whitespace-nowrap">
            NEU Library Portal
          </h1>
          <p className="text-slate-300 text-sm font-bold tracking-widest uppercase opacity-80">Institutional Access</p>
        </div>

        <div className="max-w-md mx-auto w-full">
          {portal === 'selection' ? (
            <div className="space-y-4">
              <Card 
                className="border-2 border-white/30 shadow-2xl bg-primary/40 backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group rounded-2xl"
                onClick={() => setPortal('student')}
              >
                <CardContent className="p-0">
                  <div className="w-full h-24 flex items-center px-8 gap-6 text-white">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                      <UserCircle className="h-9 w-9" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold tracking-tight">Student Portal</span>
                      <span className="text-[10px] text-white/70 uppercase tracking-[0.2em] font-bold">Institutional Account</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-2 border-white/30 shadow-2xl bg-white/10 backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group rounded-2xl"
                onClick={() => setPortal('admin')}
              >
                <CardContent className="p-0">
                  <div className="w-full h-24 flex items-center px-8 gap-6 text-white">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                      <ShieldCheck className="h-9 w-9" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold tracking-tight">Admin Portal</span>
                      <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">Authorized Staff Only</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-white/30 shadow-2xl bg-white/10 backdrop-blur-xl overflow-hidden p-2 rounded-2xl">
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
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
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
                  className="w-full h-14 text-lg font-bold shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 bg-white text-primary hover:bg-white/90 rounded-xl"
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
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Secure Access</span>
                  <div className="h-px bg-white/20 flex-1" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <footer className="absolute bottom-6 w-full text-center z-10 px-6 flex flex-col items-center gap-2">
        <p className="text-white text-sm font-bold tracking-widest font-sans">
          New Era University Library · Central, Quezon City
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-white/80 text-[10px] md:text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            <span>(02) 7273-6345</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            <span>library@neu.edu.ph</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>No. 9 Central Avenue, New Era, Quezon City, 1107 Metro Manila</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
