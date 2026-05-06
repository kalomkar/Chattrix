import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useStory } from '../../context/StoryContext';
import { Search, MoreVertical, Ghost, MessageSquarePlus, Users, Archive, Phone, Video, Plus, Wand2, Share2, Sparkles, UserPlus } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import StatusCarousel from '../Status/StatusCarousel';
import ProfileModal from '../Profile/ProfileModal';
import AddContactModal from './AddContactModal';

interface ChatSidebarProps {
  onGhostClick: () => void;
}

export default function ChatSidebar({ onGhostClick }: ChatSidebarProps) {
  const { chats, setActiveChat, activeChat, onlineUsers, typingStatus, contacts, startNewChat } = useChat();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
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
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header Area */}
      <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-[900] tracking-tighter text-black dark:text-white font-display">CHATTRIX</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500/80">Network Active</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowAddContact(true)}
                className="p-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:text-green-500 hover:bg-green-500/10 rounded-2xl transition-all group"
                title="New Chat"
              >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <button className="p-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:text-green-500 hover:bg-green-500/10 rounded-2xl transition-all">
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
            className="w-full relative overflow-hidden bg-[#151B21] border border-emerald-500/20 rounded-[1.8rem] p-5 flex items-center gap-4 text-left group transition-all shadow-xl"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <Sparkles size={80} />
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform relative z-10">
              <Wand2 size={28} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-black text-white leading-tight flex items-center gap-2">
                Talk to Nova AI
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </p>
              <p className="text-[10px] uppercase font-bold text-white/30 tracking-[0.15em] mt-1.5 line-clamp-1">Personal Assistant Protocol Active</p>
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
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 space-y-1.5 pb-24 relative">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Active Transmissions</h3>
          <button 
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <UserPlus size={10} />
            Invite Friends
          </button>
        </div>
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

      {/* Floating Action Button for Profile */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] z-50">
        <motion.button
           whileHover={{ scale: 1.02, y: -2 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setShowProfile(true)}
           className="w-full bg-[#151B21] border border-white/5 rounded-3xl p-3 flex items-center gap-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="relative">
            <img src={currentUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.displayName}`} alt="Profile" className="w-10 h-10 rounded-2xl object-cover border border-white/10" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#151B21] rounded-full" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-black text-white truncate">{currentUser?.displayName}</p>
            <p className="text-[10px] font-bold text-white/30 tracking-wider">Operational Commander</p>
          </div>
          <div className="p-2.5 bg-white/5 rounded-2xl text-white/40">
            <MoreVertical size={16} />
          </div>
        </motion.button>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      <AnimatePresence>
        {showAddContact && (
          <AddContactModal 
            onClose={() => setShowAddContact(false)} 
            onShowToast={(msg, type) => console.log(msg)} // We could use a global toast
          />
        )}
      </AnimatePresence>
    </div>
  );
}
