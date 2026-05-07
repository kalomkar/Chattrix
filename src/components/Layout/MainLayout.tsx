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
import { Ghost, ShieldCheck, Users, MessageSquare, Phone, CircleDot, Plus, Zap, Search, Bookmark, Sparkles } from 'lucide-react';
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
    <div className="flex h-screen w-full relative bg-gray-50 dark:bg-[#0B0E11] p-6 gap-6 overflow-hidden font-sans antialiased text-black dark:text-white transition-colors duration-300">
      <div className="mesh-bg opacity-30 select-none pointer-events-none" />
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 30, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={cn(
              "fixed top-0 left-1/2 z-[1000] px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 backdrop-blur-3xl border",
              toast.type === 'success' 
                ? "bg-emerald-600/90 border-emerald-500/50 text-white" 
                : "bg-red-600/90 border-red-500/50 text-white"
            )}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      {/* 1. Left Sidebar (Navigation) */}
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Middle Panel (Chats, List, etc.) */}
      <div className="w-[360px] lg:w-[420px] flex flex-col glass rounded-[2.8rem] overflow-hidden z-10 border border-black/5 dark:border-white/[0.05] shadow-[0_30px_100px_rgba(0,0,0,0.4)] relative">
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
                  <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
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
                              className="flex items-center gap-4 p-4 rounded-[1.8rem] hover:bg-black/5 dark:hover:bg-white/[0.05] border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-all cursor-pointer group"
                           >
                              <div className="relative">
                                 <img src={contact.photoURL} className="w-12 h-12 rounded-[1rem] object-cover border border-white/10 group-hover:scale-105 transition-transform" alt={contact.displayName} />
                                 <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-black tracking-tight group-hover:text-emerald-500 transition-colors text-black dark:text-white">{contact.displayName}</p>
                                 <p className="text-[10px] text-black/20 dark:text-white/20 font-bold tracking-widest uppercase truncate">{contact.email}</p>
                              </div>
                              <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/20 dark:text-white/20 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                                 <MessageSquare size={14} />
                              </button>
                           </div>
                        ))
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-black/10 dark:text-white/10 select-none">
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
                  <div className="p-6 border-b border-black/5 dark:border-white/5">
                     <h2 className="text-xl font-black tracking-tight text-black dark:text-white">Status</h2>
                     <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Ephemeral Chattrix Updates</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-black/20 dark:text-white/20">
                     <CircleDot size={48} className="text-emerald-400 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">No active stories available</p>
                  </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-black/5 dark:border-white/5">
                     <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Recent Calls</h2>
                     <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Encrypted Call History</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-black/20 dark:text-white/20">
                     <Phone size={48} className="text-cyan-400 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Secure log is empty</p>
                  </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-black/5 dark:border-white/5">
                     <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Groups</h2>
                     <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Chattrix Community Clusters</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-black/20 dark:text-white/20">
                     <Users size={48} className="text-green-500 mb-4 opacity-20" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">No active groups</p>
                  </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-black/5 dark:border-white/5">
                     <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Saved</h2>
                     <p className="text-[10px] uppercase font-bold text-black/30 dark:text-white/30 tracking-widest leading-none mt-1">Personal Archive</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-black/20 dark:text-white/20">
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
      <div className="flex-1 flex flex-col bg-white/40 dark:bg-[#0B0E11]/40 border border-black/5 dark:border-white/[0.05] rounded-[3.2rem] overflow-hidden z-10 shadow-2xl relative">
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
               className="h-full w-full flex flex-col items-center justify-center text-center p-12 bg-transparent relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none" />
               
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ 
                   duration: 3,
                   repeat: Infinity,
                   repeatType: "reverse"
                 }}
                 className="relative mb-16"
               >
                 <div className="absolute inset-0 bg-emerald-500 rounded-[4rem] blur-[100px] opacity-10 animate-pulse" />
                 <div className="w-40 h-40 rounded-[4rem] bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-black shadow-[0_0_50px_rgba(16,185,129,0.2)] relative z-10 border border-white/20">
                   <ShieldCheck size={80} strokeWidth={1.5} />
                 </div>
                 
                 <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-white dark:bg-[#0B0E11] border border-black/5 dark:border-white/5 flex items-center justify-center text-emerald-500 shadow-xl">
                    <Zap size={24} />
                 </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="relative z-10"
               >
                 <h2 className="text-5xl font-[900] text-black dark:text-white tracking-tighter mb-6 font-display">CHATTRIX CORE</h2>
                 <p className="text-black/20 dark:text-white/20 text-xs font-black uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed mb-16">
                   Establish a secure crypt-link via the global neural network.
                 </p>
                 
                 <button 
                   onClick={() => setShowAddContact(true)}
                   className="group relative px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(16,185,129,0.2)] active:scale-95 flex items-center gap-4 mx-auto overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                   Initiate Sync
                   <Sparkles size={18} className="text-emerald-200" />
                 </button>
               </motion.div>
               
               <div className="absolute bottom-16 flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.4em] text-black/10 dark:text-white/10 select-none font-mono">
                  <div className="flex items-center gap-3">
                     <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                     <span>SYSTEM: ONLINE</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping delay-300" />
                     <span>SECURE: E2EE</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping delay-700" />
                     <span>ENCRYPTION: AES-256</span>
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
