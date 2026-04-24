import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useStory } from '../../context/StoryContext';
import { Search, MoreVertical, Ghost, MessageSquarePlus, Users, Archive, Phone, Video, Plus, Wand2 } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import StatusCarousel from '../Status/StatusCarousel';
import ProfileModal from '../Profile/ProfileModal';

interface ChatSidebarProps {
  onGhostClick: () => void;
}

export default function ChatSidebar({ onGhostClick }: ChatSidebarProps) {
  const { chats, setActiveChat, activeChat, onlineUsers, typingStatus, contacts, startNewChat } = useChat();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'favorites'>('all');

  const novaContact = contacts.find(c => c.uid === 'nova-ai-bot');
  const hasNovaChat = chats.find(c => c.participants.includes('nova-ai-bot'));

  const handleNovaClick = async () => {
    if (hasNovaChat) {
      setActiveChat(hasNovaChat);
    } else {
      await startNewChat('nova@chattrix.ai');
    }
  };

  const filteredChats = chats.filter(chat => {
      const otherParticipantId = chat.participants.find(p => p !== currentUser?.uid);
      const otherParticipant = otherParticipantId ? chat.participantDetails?.[otherParticipantId] : null;
      const name = chat.isGroup ? chat.groupMetadata?.name : otherParticipant?.displayName;
      
      const matchesSearch = name?.toLowerCase().includes(search.toLowerCase());
      if (filter === 'unread') return matchesSearch && (chat.unreadCount || 0) > 0;
      if (filter === 'groups') return matchesSearch && chat.isGroup;
      return matchesSearch;
  });

  const filters: { id: typeof filter, label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'groups', label: 'Groups' },
    { id: 'favorites', label: 'Favorites' }
  ];

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header Area */}
      <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Chats</h2>
          <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  // This is the "New Chat" button, it should show contacts or new chat modal
                  // For now, let's keep it as is but themed
                }}
                className="p-2 text-black/40 dark:text-white/40 hover:text-green-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                  <MessageSquarePlus size={20} />
              </button>
              <button className="p-2 text-white/40 hover:text-green-500 hover:bg-white/5 rounded-xl transition-all">
                  <MoreVertical size={20} />
              </button>
          </div>
      </div>

      {/* Status Highlights */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20 dark:text-white/20">Status</span>
          <button className="text-[10px] font-black text-green-500 hover:underline">View All</button>
        </div>
        <StatusCarousel />
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={16} className="text-white/20 group-focus-within:text-green-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-[1.2rem] py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-green-500/30 text-black dark:text-white transition-all placeholder-black/20 dark:placeholder-white/20 font-bold tracking-tight shadow-inner"
          />
        </div>
      </div>

      {/* Nova AI Quick Access */}
      {!hasNovaChat && (
        <div className="px-4 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNovaClick}
            className="w-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/20 rounded-2xl p-4 flex items-center gap-4 text-left group transition-all"
          >
            <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <Wand2 size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-black dark:text-white leading-tight">Chat with Nova ✨</p>
              <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest mt-1">Your Personal AI is Ready</p>
            </div>
          </motion.button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
               key={f.id}
               onClick={() => setFilter(f.id)}
               className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap",
                  filter === f.id 
                    ? "bg-green-600/20 text-green-500 border border-green-500/20" 
                    : "bg-white/[0.03] text-white/30 border border-transparent hover:bg-white/[0.05]"
               )}
            >
               {f.label}
            </button>
          ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 pt-2 space-y-1">
        <AnimatePresence initial={false}>
          {filteredChats.map((chat) => {
            const otherParticipantId = chat.participants.find(p => p !== currentUser?.uid);
            const otherParticipant = otherParticipantId ? chat.participantDetails?.[otherParticipantId] : null;
            const isOnline = otherParticipantId && onlineUsers.has(otherParticipantId) && !otherParticipant?.ghostMode?.hideOnline;
            const isActive = activeChat?.id === chat.id;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className="relative group"
              >
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 cursor-pointer relative overflow-hidden mx-1",
                  isActive 
                    ? "bg-green-600/10 border border-green-500/20 shadow-xl" 
                    : "hover:bg-white/[0.03] border border-transparent"
                )}>
                  {/* Avatar with Ring */}
                  <div className="relative shrink-0">
                    <div className={cn(
                        "p-[2px] rounded-full",
                        isOnline ? "bg-gradient-to-tr from-green-500 to-emerald-400" : "bg-black/5 dark:bg-white/5"
                    )}>
                        <img 
                            src={chat.isGroup ? chat.groupMetadata?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.groupMetadata?.name}` : otherParticipant?.photoURL} 
                            alt="Chat" 
                            className="w-12 h-12 rounded-full border border-[#0b141a] object-cover group-hover:scale-105 transition-transform"
                        />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className={cn(
                        "text-sm font-black tracking-tight truncate",
                        isActive ? "text-green-400" : "text-black/80 dark:text-white/80 group-hover:text-black dark:group-hover:text-white"
                      )}>
                        {chat.isGroup ? chat.groupMetadata?.name : otherParticipant?.displayName}
                      </p>
                      <span className={cn(
                        "text-[9px] font-bold tracking-widest",
                        isActive ? "text-green-500/60" : "text-black/20 dark:text-white/20"
                      )}>
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                       <p className={cn(
                        "text-xs truncate font-medium",
                        isActive ? "text-black/70 dark:text-white/70" : "text-black/30 dark:text-white/30 group-hover:text-black/40 dark:group-hover:text-white/40"
                       )}>
                        {typingStatus[otherParticipantId || ''] ? (
                          <span className="text-green-400 font-bold animate-pulse">Typing...</span>
                        ) : (chat.lastMessage?.text || 'Commence messaging...')}
                       </p>
                       
                       {chat.unreadCount && chat.unreadCount > 0 && !isActive ? (
                         <div className="h-5 min-w-[20px] px-1.5 bg-green-500 text-black rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                           {chat.unreadCount}
                         </div>
                       ) : null}
                    </div>
                  </div>

                  {isActive && (
                    <motion.div 
                        layoutId="active-chat-glow-green"
                        className="absolute inset-y-0 left-0 w-1 bg-green-500 rounded-r-full shadow-[2px_0_10px_rgba(34,197,94,0.5)]"
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredChats.length === 0 && (
           <div className="p-8 text-center text-[#8696a0]">
              <Archive className="mx-auto mb-4 opacity-20" size={48} />
              <p>No chats found</p>
           </div>
        )}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
