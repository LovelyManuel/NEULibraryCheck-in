
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

/**
 * MASTER ADMINISTRATIVE LOGIC
 * These emails are pre-authorized to bypass standard user roles.
 */
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
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          let profileData: LibraryUser | null = null;

          if (userDoc.exists()) {
            profileData = userDoc.data() as LibraryUser;
          } else {
            // New Account / Profile Healing
            const isMasterAdmin = isAdminEmail(firebaseUser.email || '');

            // Validate student email if not the master admin
            if (!isMasterAdmin && !isStudentEmail(firebaseUser.email || '')) {
              await signOut(auth);
              toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'Students must use their @neu.edu.ph institutional email.',
              });
              setUser(null);
              setProfile(null);
              return;
            }

            const newUser: LibraryUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (isMasterAdmin ? 'Administrator' : 'Student'),
              role: isMasterAdmin ? 'admin' : 'user',
              collegeId: 'Unassigned',
              isBlocked: false,
              createdAt: Timestamp.now(),
            };

            await setDoc(userDocRef, newUser);
            profileData = newUser;
          }

          /**
           * ADMIN CODE INSERTION LOGIC
           * If the user is identified as an admin, we insert the 'admin code' 
           * (marker document) into the roles_admin collection to satisfy Security Rules.
           */
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

      if (portal === 'student' && !isStudentEmail(email)) {
        await signOut(auth);
        throw new Error('Students must use an @neu.edu.ph account.');
      }

      if (portal === 'admin' && !isAdminEmail(email)) {
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
