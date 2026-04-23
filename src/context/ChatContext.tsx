import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, increment, getDocs, limit, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Chat, Message, User } from '../types';
import { socket } from '../lib/socket';
import { handleFirestoreError } from '../lib/firestoreUtils';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (text: string, type?: Message['type'], mediaUrl?: string, disappearingDuration?: number) => Promise<void>;
  typingStatus: Record<string, boolean>; // userId -> isTyping
  setTyping: (isTyping: boolean) => void;
  startNewChat: (email: string) => Promise<void>;
  onlineUsers: Set<string>;
  contacts: User[];
  addContact: (email: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<User[]>([]);

  // Fetch contacts
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'users', currentUser.uid, 'contacts'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const contactsData: User[] = snapshot.docs.map(d => ({ ...d.data() } as User));
        setContacts(contactsData);
      },
      (error) => handleFirestoreError(error, 'list', `users/${currentUser.uid}/contacts`, auth.currentUser)
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addContact = async (contactInfo: string) => {
    if (!currentUser) return;
    try {
      const isEmail = contactInfo.includes('@');
      const response = await fetch('/api/contact/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: isEmail ? contactInfo : undefined,
          phone: !isEmail ? contactInfo : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add contact');
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      throw error;
    }
  };

  const startNewChat = async (email: string) => {
    if (!currentUser) return;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("User not found!");
        return;
      }

      const targetUser = querySnapshot.docs[0].data() as User;
      if (targetUser.uid === currentUser.uid) return;

      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const chatQuery = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const chatSnapshot = await getDocs(chatQuery);
      
      let existingChat = chatSnapshot.docs.find(d => (d.data() as Chat).participants.includes(targetUser.uid));
      
      if (existingChat) {
        setActiveChat({ id: existingChat.id, ...existingChat.data() } as Chat);
      } else {
        const newChat = {
          participants: [currentUser.uid, targetUser.uid],
          isGroup: false,
          updatedAt: serverTimestamp(),
          lastMessage: null
        };
        const docRef = await addDoc(collection(db, 'chats'), newChat).catch(err => handleFirestoreError(err, 'create', 'chats', auth.currentUser));
        if (docRef) {
          setActiveChat({ id: docRef.id, ...newChat } as Chat);
        }
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      handleFirestoreError(error, 'write', null, auth.currentUser);
    }
  };

  // Fetch chats
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        const chatsData: Chat[] = [];
        for (const d of snapshot.docs) {
          const chat = { id: d.id, ...d.data() } as Chat;
          
          // Fetch participant details
          const details: Record<string, User> = {};
          for (const pId of chat.participants) {
            if (pId !== currentUser.uid) {
              try {
                const uDoc = await getDoc(doc(db, 'users', pId));
                if (uDoc.exists()) {
                  details[pId] = uDoc.data() as User;
                }
              } catch (e) {
                console.error("Error fetching user details", e);
              }
            }
          }
          chat.participantDetails = details;
          chatsData.push(chat);
        }
        setChats(chatsData);
      },
      (error) => handleFirestoreError(error, 'list', 'chats', auth.currentUser)
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const now = Date.now();
        const msgs: Message[] = [];
        
        snapshot.docs.forEach(d => {
          const msg = { id: d.id, ...d.data() } as Message;
          
          // Handle disappearing messages
          if (msg.disappearing?.enabled && msg.disappearing.expiresAt) {
            const expiresAt = msg.disappearing.expiresAt.toDate ? msg.disappearing.expiresAt.toDate().getTime() : msg.disappearing.expiresAt;
            if (now >= expiresAt) {
              import('firebase/firestore').then(({ deleteDoc, doc }) => {
                deleteDoc(doc(db, 'chats', activeChat!.id, 'messages', msg.id))
                  .catch(err => console.error("Error pruning expiring message:", err));
              });
              return;
            }
          }
          
          msgs.push(msg);
        });

        setMessages(msgs);

        // Mark messages as seen if we are not the sender
        msgs.forEach(msg => {
            if (msg.senderId !== currentUser?.uid && msg.status !== 'seen' && !currentUser?.ghostMode?.hideBlueTicks) {
              updateDoc(doc(db, 'chats', activeChat.id, 'messages', msg.id), {
                status: 'seen'
              }).catch(err => handleFirestoreError(err, 'update', `chats/${activeChat.id}/messages/${msg.id}`, auth.currentUser));
            }
        });
      },
      (error) => handleFirestoreError(error, 'list', `chats/${activeChat.id}/messages`, auth.currentUser)
    );

    return () => unsubscribe();
  }, [activeChat, currentUser]);

  // Background timer to prune expired messages from state and DB and trigger re-renders
  useEffect(() => {
    const timer = setInterval(() => {
      if (!activeChat || messages.length === 0) return;
      
      const now = Date.now();
      messages.forEach(msg => {
        if (msg.disappearing?.enabled && msg.disappearing.expiresAt) {
           const expiresAt = msg.disappearing.expiresAt.toDate ? msg.disappearing.expiresAt.toDate().getTime() : msg.disappearing.expiresAt;
           if (now >= expiresAt) {
             import('firebase/firestore').then(({ deleteDoc, doc }) => {
                deleteDoc(doc(db, 'chats', activeChat.id, 'messages', msg.id));
             });
           }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeChat, messages]);

  // Socket listeners
  useEffect(() => {
    if (!currentUser) return;

    const handleReceiveMessage = (data: { chatId: string; message: any }) => {
      // Logic for sound or notifications could go here
    };

    const handleUserTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      if (activeChat?.id === data.chatId) {
        setTypingStatus(prev => ({ ...prev, [data.userId]: data.isTyping }));
      }
    };

    const handleUserOnline = (userId: string) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    };

    const handleUserOffline = (userId: string) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [activeChat, currentUser]);

  const sendMessage = async (text: string, type: Message['type'] = 'text', mediaUrl?: string, disappearingDuration?: number) => {
    if (!currentUser || !activeChat) return;

    let disappearing = undefined;
    if (disappearingDuration && disappearingDuration > 0) {
      const expiresAt = new Date(Date.now() + disappearingDuration * 1000);
      disappearing = {
        enabled: true,
        duration: disappearingDuration,
        expiresAt
      };
    }

    const messageData = {
      text,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      type,
      mediaUrl: mediaUrl || null,
      status: 'sent',
      chatId: activeChat.id,
      ...(disappearing && { disappearing })
    };

    await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messageData);
    await updateDoc(doc(db, 'chats', activeChat.id), {
      lastMessage: {
        text: disappearing ? "🕒 Disappearing Message" : (type === 'text' ? text : `[${type}]`),
        senderId: currentUser.uid,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Emit via socket for real-time delivery
    const recipientId = activeChat.participants.find(p => p !== currentUser.uid);
    socket.emit('send_message', {
      chatId: activeChat.id,
      recipientId,
      message: messageData
    });
  };

  const setTyping = useCallback((isTyping: boolean) => {
    if (!currentUser || !activeChat || currentUser.ghostMode?.hideTyping) return;
    
    const recipientId = activeChat.participants.find(p => p !== currentUser.uid);
    socket.emit('typing', {
      chatId: activeChat.id,
      userId: currentUser.uid,
      recipientId,
      isTyping
    });
  }, [currentUser, activeChat]);

  return (
    <ChatContext.Provider value={{ chats, activeChat, messages, setActiveChat, sendMessage, typingStatus, setTyping, onlineUsers, contacts, addContact, startNewChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
