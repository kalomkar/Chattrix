import React, { useState } from 'react';
import ChatSidebar from '../Chat/ChatSidebar';
import ChatArea from '../Chat/ChatArea';
import AppSidebar from '../Navigation/AppSidebar';
import SettingsPanel from '../Settings/SettingsPanel';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import GhostModeMenu from '../Ghost/GhostModeMenu';
import SmartControls from '../Chat/SmartControls';
import CallOverlay from '../Call/CallOverlay';
import AddContactModal from '../Chat/AddContactModal';
import { Ghost, ShieldCheck, Users, MessageSquare, Phone, CircleDot, Plus, Zap, Search, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export type TabId = 'chats' | 'status' | 'calls' | 'contacts' | 'settings' | 'groups' | 'saved';

export default function MainLayout() {
  const { activeChat, startNewChat, contacts } = useChat();
  const { currentUser } = useAuth();
  const [showGhostSettings, setShowGhostSettings] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('chats');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex h-screen w-full relative bg-white dark:bg-[#0b141a] p-3 gap-3 overflow-hidden font-sans antialiased text-black dark:text-white transition-colors duration-300">
      <div className="mesh-bg opacity-40 select-none pointer-events-none" />
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={cn(
              "fixed top-0 left-1/2 z-[1000] px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 backdrop-blur-xl border",
              toast.type === 'success' 
                ? "bg-green-600/90 border-green-500/50 text-white" 
                : "bg-red-600/90 border-red-500/50 text-white"
            )}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      {/* 1. Left Sidebar (Navigation) */}
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Middle Panel (Chats, List, etc.) */}
      <div className="w-[340px] lg:w-[400px] flex flex-col glass rounded-[1.5rem] overflow-hidden z-10 border border-black/[0.05] dark:border-white/[0.05] shadow-2xl relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full"
          >
            {activeTab === 'chats' && <ChatSidebar onGhostClick={() => setShowGhostSettings(true)} />}
            
            {activeTab === 'contacts' && (
               <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                     <div>
                        <h2 className="text-xl font-black tracking-tight text-black dark:text-white">Contacts</h2>
                        <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Verified Chattrix Directory</p>
                     </div>
                     <button 
                        onClick={() => setShowAddContact(true)}
                        className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-lg"
                      >
                        <Plus size={20} />
                     </button>
                  </div>
                  <div className="p-4">
                     <div className="relative group">
                        <Search size={14} className="absolute left-4 top-3.5 text-black/20 dark:text-white/20 group-focus-within:text-green-500 transition-colors" />
                        <input 
                           type="text" 
                           placeholder="Filter link directory..." 
                           className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-green-500/50 transition-all text-black dark:text-white placeholder-black/10 dark:placeholder-white/10"
                        />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                     {contacts.length > 0 ? (
                        contacts.map((contact) => (
                           <div 
                              key={contact.uid} 
                              onClick={() => {
                                 startNewChat(contact.email);
                                 setActiveTab('chats');
                              }}
                              className="flex items-center gap-4 p-4 rounded-[1.8rem] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                           >
                              <div className="relative">
                                 <img src={contact.photoURL} className="w-12 h-12 rounded-[1rem] object-cover border border-white/10 group-hover:scale-105 transition-transform" alt={contact.displayName} />
                                 <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-black tracking-tight group-hover:text-blue-400 transition-colors">{contact.displayName}</p>
                                 <p className="text-[10px] text-white/20 font-bold tracking-widest uppercase truncate">{contact.email}</p>
                              </div>
                              <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                                 <MessageSquare size={14} />
                              </button>
                           </div>
                        ))
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white/10 select-none">
                           <Users size={64} className="mb-6 opacity-5" />
                           <p className="text-xs font-black uppercase tracking-[0.2em] mb-2">Network directory is empty</p>
                           <button 
                              onClick={() => setShowAddContact(true)}
                              className="text-[10px] font-bold text-blue-500 hover:underline hover:text-blue-400 transition-all"
                           >
                              Search Global Directory
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {activeTab === 'status' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-white/5">
                     <h2 className="text-xl font-black tracking-tight text-black dark:text-white">Status</h2>
                     <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Ephemeral Chattrix Updates</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/20">
                     <CircleDot size={48} className="text-emerald-400 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">No active stories available</p>
                  </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-white/5">
                     <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Recent Calls</h2>
                     <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Encrypted Call History</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/20">
                     <Phone size={48} className="text-cyan-400 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Secure log is empty</p>
                  </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-white/5">
                     <h2 className="text-xl font-bold tracking-tight">Groups</h2>
                     <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest leading-none mt-1">Chattrix Community Clusters</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/20">
                     <Users size={48} className="text-green-500 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">No active groups</p>
                  </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-white/5">
                     <h2 className="text-xl font-bold tracking-tight">Saved</h2>
                     <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest leading-none mt-1">Personal Archive</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/20">
                     <Bookmark size={48} className="text-yellow-500 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Archive is empty</p>
                  </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating Action Button */}
        {activeTab === 'chats' && (
          <button 
            onClick={() => setShowAddContact(true)}
            className="absolute bottom-8 right-8 w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-green-600/40 hover:scale-110 active:scale-95 transition-all group z-30"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          </button>
        )}
      </div>

      {/* 3. Main Display Area (Chat or Settings) */}
      <div className="flex-1 flex flex-col glass rounded-[2.5rem] overflow-hidden z-10 border border-white/[0.08] shadow-2xl relative">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' ? (
            <motion.div 
               key="settings"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="h-full"
            >
               <SettingsPanel />
            </motion.div>
          ) : activeChat ? (
            <motion.div 
               key="chat-area"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="h-full"
            >
               <ChatArea />
            </motion.div>
          ) : (
            <motion.div 
               key="empty-state"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="h-full w-full flex flex-col items-center justify-center text-center p-12 bg-white/[0.01] relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-b from-green-600/[0.02] to-transparent pointer-events-none" />
               
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ 
                   duration: 2,
                   repeat: Infinity,
                   repeatType: "reverse"
                 }}
                 className="relative mb-12"
               >
                 <div className="absolute inset-0 bg-green-600 rounded-[3.5rem] blur-3xl opacity-10" />
                 <div className="w-32 h-32 rounded-[3.5rem] bg-gradient-to-tr from-green-600 to-emerald-600 flex items-center justify-center text-white shadow-2xl relative z-10 border border-white/20">
                   <ShieldCheck size={64} />
                 </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="relative z-10"
               >
                 <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Chattrix Core Online</h2>
                 <p className="text-white/30 text-sm font-bold uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed mb-12">
                   Start chatting with your contacts via the secure crypt channel.
                 </p>
                 
                 <button 
                   onClick={() => {
                       const email = prompt("Enter user email to chat with:");
                       if (email) startNewChat(email);
                   }}
                   className="group relative px-10 py-5 bg-green-600 hover:bg-green-500 text-white rounded-[2rem] font-black text-sm transition-all shadow-2xl shadow-green-600/30 active:scale-95 flex items-center gap-4 mx-auto"
                 >
                   <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                   New Chat
                   <Zap size={18} className="text-green-200 animate-pulse" />
                 </button>
               </motion.div>
               
               <div className="absolute bottom-12 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/10 select-none">
                  <div className="flex items-center gap-2">
                     <Zap size={14} className="text-green-500" />
                     <span>Neural Engine v2.4</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Ghost size={14} className="text-green-500" />
                     <span>Ghost Protocol Active</span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SmartControls />
      <CallOverlay />

      {showGhostSettings && (
        <GhostModeMenu onClose={() => setShowGhostSettings(false)} />
      )}

      <AnimatePresence>
        {showAddContact && (
          <AddContactModal 
            onClose={() => setShowAddContact(false)} 
            onShowToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
