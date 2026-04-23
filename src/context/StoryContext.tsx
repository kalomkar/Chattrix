import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Story } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

interface StoryContextType {
  stories: Story[];
  userStories: Story[];
  loading: boolean;
  uploadStory: (mediaUrl: string, type: 'image' | 'video' | 'text', caption?: string) => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setStories([]);
      return;
    }

    // Get all non-expired stories (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'stories'),
      where('timestamp', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const storyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Story[];
        setStories(storyData);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, 'list', 'stories', auth.currentUser)
    );

    return () => unsubscribe();
  }, [currentUser]);

  const uploadStory = async (mediaUrl: string, type: 'image' | 'video' | 'text', caption?: string) => {
    if (!currentUser) return;
    
    try {
      await addDoc(collection(db, 'stories'), {
        uid: currentUser.uid,
        mediaUrl,
        type,
        caption,
        timestamp: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        views: []
      });
    } catch (error) {
      handleFirestoreError(error, 'create', 'stories', auth.currentUser);
    }
  };

  const viewStory = async (storyId: string) => {
    // This would update the views array in Firestore
    // For simplicity, I'll omit real implementation unless needed
  };

  const userStories = stories.filter(s => s.uid === currentUser?.uid);

  return (
    <StoryContext.Provider value={{ stories, userStories, loading, uploadStory, viewStory }}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
}
