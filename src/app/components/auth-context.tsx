
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { LibraryUser } from '@/app/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: LibraryUser | null;
  loading: boolean;
  signIn: (portal: 'admin' | 'student') => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAILS = [
  'francesaly11@gmail.com',
  'jcesperanza@neu.edu.ph',
  'admin@example.com'
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LibraryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isStudentEmail = (email: string) => email.toLowerCase().endsWith('@neu.edu.ph');
  const isAdminEmail = (email: string) => ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const isMasterAdmin = isAdminEmail(firebaseUser.email || '');
          const isStudent = isStudentEmail(firebaseUser.email || '');

          if (!isMasterAdmin && !isStudent) {
            await signOut(auth);
            toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'Access is restricted to @neu.edu.ph institutional accounts.',
            });
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          let profileData: LibraryUser | null = null;

          if (userDoc.exists()) {
            profileData = userDoc.data() as LibraryUser;
          } else {
            const newUser: LibraryUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (isMasterAdmin ? 'Administrator' : 'Student'),
              role: isMasterAdmin ? 'admin' : 'user',
              collegeId: 'Unassigned',
              visitorType: 'Unassigned',
              isBlocked: false,
              createdAt: Timestamp.now(),
            };

            await setDoc(userDocRef, newUser);
            profileData = newUser;
          }

          if (profileData.role === 'admin') {
            const adminMarkerRef = doc(firestore, 'roles_admin', firebaseUser.uid);
            const adminMarker = await getDoc(adminMarkerRef);
            if (!adminMarker.exists()) {
              await setDoc(adminMarkerRef, { 
                uid: firebaseUser.uid, 
                email: firebaseUser.email,
                assignedAt: Timestamp.now()
              });
            }
          }

          if (profileData.isBlocked) {
            await signOut(auth);
            toast({
              variant: 'destructive',
              title: 'Account Blocked',
              description: 'Access restricted by library administration.',
            });
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          setProfile(profileData);
          setUser(firebaseUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error: any) {
        console.error('Auth error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const signIn = async (portal: 'admin' | 'student') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || '';

      const isMasterAdmin = isAdminEmail(email);
      const isStudent = isStudentEmail(email);

      if (portal === 'student' && !isStudent) {
        await signOut(auth);
        throw new Error('Students must use their @neu.edu.ph institutional account.');
      }

      if (portal === 'admin' && !isMasterAdmin) {
        const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
        if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
          await signOut(auth);
          throw new Error('This account does not have administrator privileges.');
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    }
  };

  const logOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
