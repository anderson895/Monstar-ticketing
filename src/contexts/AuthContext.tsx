import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, UserRole } from '@/types';
import { logError, logInfo } from '@/lib/errorLogger';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role?: UserRole;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(uid: string) {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserProfile(snap.data() as User);
      }
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: 'AuthContext', action: 'fetchUserProfile', userId: uid });
    }
  }

  async function login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserProfile(result.user.uid);
      await logInfo('User logged in', { component: 'AuthContext', action: 'login', userId: result.user.uid, userEmail: email });
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: 'AuthContext', action: 'login', userEmail: email });
      throw err;
    }
  }

  async function register({ email, password, displayName, phone, role = 'passenger' }: RegisterData) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      const userDoc: Omit<User, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
        uid: result.user.uid,
        email,
        displayName,
        role,
        phone: phone ?? '',
        address: '',
        createdAt: serverTimestamp() as ReturnType<typeof serverTimestamp>,
      };
      await setDoc(doc(db, 'users', result.user.uid), userDoc);
      await logInfo('User registered', { component: 'AuthContext', action: 'register', userId: result.user.uid, userEmail: email });
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: 'AuthContext', action: 'register', userEmail: email });
      throw err;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: 'AuthContext', action: 'logout' });
      throw err;
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAdmin: userProfile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
