import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, increment, getDocs, limit, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Chat, Message, User, ScheduledMessage } from '../types';
import { socket } from '../lib/socket';
import { handleFirestoreError } from '../lib/firestoreUtils';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (text: string, type?: Message['type'], mediaUrl?: string, disappearingDuration?: number, replyToId?: string) => Promise<void>;
  typingStatus: Record<string, boolean>; // userId -> isTyping
  setTyping: (isTyping: boolean) => void;
  startNewChat: (email: string) => Promise<void>;
  onlineUsers: Set<string>;
  contacts: User[];
  addContact: (email: string) => Promise<void>;
  clearChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newName: string) => Promise<void>;
  togglePin: (chatId: string, messageId: string, pinned: boolean) => Promise<void>;
  regenerateResponse: () => Promise<void>;
  scheduledMessages: ScheduledMessage[];
  scheduleMessage: (text: string, scheduledAt: string, type?: ScheduledMessage['type']) => Promise<void>;
  cancelScheduledMessage: (messageId: string) => Promise<void>;
  deleteScheduledMessage: (messageId: string) => Promise<void>;
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
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);

  // Fetch contacts
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'users', currentUser.uid, 'contacts'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const contactsData: User[] = snapshot.docs.map(d => ({ ...d.data() } as User));
        
        // Always include Nova AI in contacts
        const novaBot: User = {
          uid: 'nova-ai-bot',
          displayName: 'Nova AI ✨',
          email: 'nova@chattrix.ai',
          photoURL: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nova',
          phoneNumber: '',
          status: 'Your Intelligent Chattrix Assistant'
        };
        
        if (!contactsData.find(c => c.uid === novaBot.uid)) {
          contactsData.unshift(novaBot);
        }
        
        setContacts(contactsData);
      },
      (error) => handleFirestoreError(error, 'list', `users/${currentUser.uid}/contacts`, auth.currentUser)
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch scheduled messages
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'scheduled_messages'),
      where('senderId', '==', currentUser.uid),
      orderBy('scheduledAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScheduledMessage));
      setScheduledMessages(msgs);
    }, (error) => handleFirestoreError(error, 'list', 'scheduled_messages', auth.currentUser));
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
      let targetUser: User | null = null;

      if (email === 'nova@chattrix.ai') {
        targetUser = {
          uid: 'nova-ai-bot',
          displayName: 'Nova AI ✨',
          email: 'nova@chattrix.ai',
          photoURL: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nova',
          phoneNumber: '',
          status: 'Your Intelligent Chattrix Assistant'
        };
      } else {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          alert("User not found!");
          return;
        }
        targetUser = querySnapshot.docs[0].data() as User;
      }

      if (targetUser.uid === currentUser.uid) return;

      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const chatQuery = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const chatSnapshot = await getDocs(chatQuery);
      
      let existingChat = chatSnapshot.docs.find(d => (d.data() as Chat).participants.includes(targetUser!.uid));
      
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
              if (pId === 'nova-ai-bot') {
                 details[pId] = {
                   uid: 'nova-ai-bot',
                   displayName: 'Nova AI',
                   email: 'nova@chattrix.ai',
                   photoURL: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nova',
                   phoneNumber: '',
                   status: 'Nova AI Assistant is Online'
                 };
              } else {
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
      if (activeChat?.id !== data.chatId) {
        // Show notification or toast could be handled here if we had access to toast function
        // For now, let's just log it and maybe we can use a simpler approach or a global event
        console.log("New message received in background", data);
      }
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

  const sendMessage = async (text: string, type: Message['type'] = 'text', mediaUrl?: string, disappearingDuration?: number, replyToId?: string) => {
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
      replyToId: replyToId || null,
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

    // Nova AI Bot logic
    const recipientId = activeChat.participants.find(p => p !== currentUser.uid);
    if (recipientId === 'nova-ai-bot' && type === 'text') {
      // Small delay to feel natural
      setTimeout(async () => {
        try {
          const { getAIAssistance } = await import('../services/geminiService');
          
          // Get recent history
          const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
          const snap = await getDocs(q);
          const history = snap.docs.reverse().map(d => {
            const m = d.data();
            return { 
              sender: m.senderId === currentUser.uid ? 'User' : 'Nova',
              text: m.text 
            };
          });

          const { reply } = await getAIAssistance(history, true);
          
          if (reply) {
            const novaMsg = {
              text: reply,
              senderId: 'nova-ai-bot',
              timestamp: serverTimestamp(),
              type: 'text' as const,
              mediaUrl: null,
              status: 'delivered' as const,
              chatId: activeChat.id
            };
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), novaMsg);
            await updateDoc(doc(db, 'chats', activeChat.id), {
              lastMessage: {
                text: reply,
                senderId: 'nova-ai-bot',
                timestamp: serverTimestamp()
              },
              updatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Nova AI Response Error:", e);
        }
      }, 1000);
    }

    // Emit via socket for real-time delivery
    if (recipientId !== 'nova-ai-bot') {
      socket.emit('send_message', {
        chatId: activeChat.id,
        recipientId,
        message: messageData
      });
    }
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

  const clearChat = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const snapshot = await getDocs(messagesRef);
      const { deleteDoc, doc } = await import('firebase/firestore');
      
      const promises = snapshot.docs.map(d => deleteDoc(doc(db, 'chats', chatId, 'messages', d.id)));
      await Promise.all(promises);
      
      // Update last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error clearing chat:", error);
      handleFirestoreError(error, 'write', `chats/${chatId}/messages`, auth.currentUser);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!currentUser) return;
    try {
      await clearChat(chatId);
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
      handleFirestoreError(error, 'write', `chats/${chatId}`, auth.currentUser);
    }
  };

  const renameChat = async (chatId: string, newName: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        'groupMetadata.name': newName,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error renaming chat:", error);
      handleFirestoreError(error, 'write', `chats/${chatId}`, auth.currentUser);
    }
  };

  const togglePin = async (chatId: string, messageId: string, pinned: boolean) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        pinned: pinned
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      handleFirestoreError(error, 'write', `chats/${chatId}/messages/${messageId}`, auth.currentUser);
    }
  };

  const regenerateResponse = async () => {
    if (!currentUser || !activeChat || activeChat.participants.find(p => p === 'nova-ai-bot') === undefined) return;
    
    // Find last user message
    const lastUserMsg = [...messages].reverse().find(m => m.senderId === currentUser.uid);
    if (!lastUserMsg) return;

    // Delete last bot response if it exists and was after this user message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId === 'nova-ai-bot') {
       const { deleteDoc, doc: fireDoc } = await import('firebase/firestore');
       await deleteDoc(fireDoc(db, 'chats', activeChat.id, 'messages', lastMsg.id));
    }

    // Trigger AI response again
    setTimeout(async () => {
        try {
          const { getAIAssistance } = await import('../services/geminiService');
          const history = messages.slice(-10).map(m => ({ 
            sender: m.senderId === currentUser.uid ? 'User' : 'Nova',
            text: m.text 
          }));

          const { reply } = await getAIAssistance(history, true);
          
          if (reply) {
            const novaMsg = {
              text: reply,
              senderId: 'nova-ai-bot',
              timestamp: serverTimestamp(),
              type: 'text' as const,
              mediaUrl: null,
              status: 'delivered' as const,
              chatId: activeChat.id
            };
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), novaMsg);
          }
        } catch (e) {
          console.error("Nova AI Regeneration Error:", e);
        }
      }, 500);
  };

  const scheduleMessage = async (text: string, scheduledAt: string, type: ScheduledMessage['type'] = 'text') => {
    if (!currentUser || !activeChat) return;
    try {
      const data = {
        chatId: activeChat.id,
        text,
        senderId: currentUser.uid,
        scheduledAt,
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        type
      };
      await addDoc(collection(db, 'scheduled_messages'), data);
    } catch (error) {
      console.error("Error scheduling message:", error);
      handleFirestoreError(error, 'create', 'scheduled_messages', auth.currentUser);
    }
  };

  const cancelScheduledMessage = async (messageId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'scheduled_messages', messageId), {
        status: 'cancelled'
      });
    } catch (error) {
      console.error("Error cancelling scheduled message:", error);
      handleFirestoreError(error, 'update', `scheduled_messages/${messageId}`, auth.currentUser);
    }
  };

  const deleteScheduledMessage = async (messageId: string) => {
    if (!currentUser) return;
    try {
      const { deleteDoc, doc: fireDoc } = await import('firebase/firestore');
      await deleteDoc(fireDoc(db, 'scheduled_messages', messageId));
    } catch (error) {
      console.error("Error deleting scheduled message:", error);
      handleFirestoreError(error, 'delete', `scheduled_messages/${messageId}`, auth.currentUser);
    }
  };

  return (
    <ChatContext.Provider value={{ chats, activeChat, messages, setActiveChat, sendMessage, typingStatus, setTyping, onlineUsers, contacts, addContact, startNewChat, clearChat, deleteChat, renameChat, togglePin, regenerateResponse, scheduledMessages, scheduleMessage, cancelScheduledMessage, deleteScheduledMessage }}>
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
