import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import { socket } from '../lib/socket';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // If logged in with email, check if verified
        if (fbUser.email && !fbUser.emailVerified && !fbUser.phoneNumber) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentUser(userData);
          if (!userData.ghostMode?.hideOnline) {
             socket.connect();
             socket.emit('join', fbUser.uid);
          }
        } else {
          // Initialize new user
          const newUser: User = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            phoneNumber: fbUser.phoneNumber || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'User',
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            status: 'Hey there! I am using Chattrix.',
            ghostMode: { hideOnline: false, hideTyping: false, hideBlueTicks: false },
            autoReply: { enabled: false, message: "I'm busy right now, I'll get back to you soon!" }
          };
          await setDoc(doc(db, 'users', fbUser.uid), newUser);
          setCurrentUser(newUser);
          socket.connect();
          socket.emit('join', fbUser.uid);
        }
      } else {
        setCurrentUser(null);
        socket.disconnect();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
