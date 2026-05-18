import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { auth as firebaseAuth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface User {
  id: string; // Internal SQL ID
  uid: string; // App-wide ID (same as id)
  firebaseUid?: string;
  fullName: string;
  displayName: string; // App-wide name (same as fullName)
  username: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  ghostMode?: any;
  autoReply?: any;
  about?: string;
  status?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  firebaseAuthReady: boolean;
  firebaseStatus: 'connecting' | 'connected' | 'error' | 'restricted';
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'error' | 'restricted'>('connecting');

  // Unified Firebase Sync Logic
  const syncWithFirebase = async (user: User, firebaseToken?: string) => {
    setFirebaseStatus('connecting');
    try {
      let fbUser = firebaseAuth.currentUser;

      // 1. Try Custom Token if provided
      if (firebaseToken) {
        try {
          const cred = await signInWithCustomToken(firebaseAuth, firebaseToken);
          fbUser = cred.user;
        } catch (err) {
          console.warn('[FIREBASE] Custom token failed, attempting session reuse or anonymous.');
        }
      }

      // 2. If no user yet, check for anonymous fallback
      if (!fbUser) {
        try {
          const cred = await signInAnonymously(firebaseAuth);
          fbUser = cred.user;
        } catch (err: any) {
          if (err.code === 'auth/admin-restricted-operation') {
            setFirebaseStatus('restricted');
            console.error('[FIREBASE] Anonymous Auth is disabled in Firebase Console.');
          } else {
            setFirebaseStatus('error');
            console.error('[FIREBASE] Anonymous sign-in failed.', err);
          }
        }
      }

      if (fbUser) {
        setFirebaseStatus('connected');
        const fbUid = fbUser.uid;
        // 3. Ensure mapping exists in Firestore for rules
        await setDoc(doc(db, 'mappings', fbUid), { sqlId: user.id }, { merge: true }).catch(() => {});
        
        // 4. Update SQL DB with current Firebase UID if different
        if (user.firebaseUid !== fbUid) {
          await api.post('/auth/sync-firebase-uid', { firebaseUid: fbUid }).catch(() => {});
          setCurrentUser(prev => prev ? { ...prev, firebaseUid: fbUid } : null);
        }

        // 5. Sync profile to Firestore
        await setDoc(doc(db, 'users', user.id), {
          uid: user.id,
          firebaseUid: fbUid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          status: user.status || 'Hey there! I am using Chattrix.',
          lastSeen: serverTimestamp()
        }, { merge: true }).catch(err => console.error('[FIREBASE] Profile sync failed:', err));
      } else if (firebaseStatus !== 'restricted') {
        setFirebaseStatus('error');
      }
    } catch (error) {
      setFirebaseStatus('error');
      console.error('[FIREBASE] Global Sync Error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setFirebaseAuthReady(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          const mappedUser = {
            ...userData,
            uid: userData.uid || userData.id,
            displayName: userData.displayName || userData.fullName,
            photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`
          };
          setCurrentUser(mappedUser);

          // Get fresh token and sync
          const res = await api.get('/auth/firebase-token').catch(() => ({ data: {} }));
          syncWithFirebase(mappedUser, res.data.firebaseToken);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const { accessToken, refreshToken, firebaseToken, user: userData } = res.data;
      
      const mappedUser = {
        ...userData,
        uid: userData.id,
        displayName: userData.fullName,
        photoURL: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      
      syncWithFirebase(mappedUser, firebaseToken);
      setCurrentUser(mappedUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await api.post('/auth/register', userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setCurrentUser(null);
    }
  };

  const updateProfile = (data: any) => {
    const newUser = { 
      ...currentUser, 
      ...data,
      displayName: data.displayName || data.fullName || (currentUser?.displayName),
      photoURL: data.photoURL || (currentUser?.photoURL)
    } as User;
    setCurrentUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, firebaseAuthReady, firebaseStatus, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
