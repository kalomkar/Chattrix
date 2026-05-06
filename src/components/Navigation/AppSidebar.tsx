import React, { useState } from 'react';
import { MessageSquare, CircleDot, Phone, Settings, ChevronLeft, ChevronRight, LogOut, ShieldCheck, Users, Bookmark, Users2, Sun, Moon, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { TabId } from '../Layout/MainLayout';
import SignalsPanel from '../Signals/SignalsPanel';

interface AppSidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignals, setShowSignals] = useState(false);
  const { currentUser } = useAuth();
  const { settings, updateSetting } = useSettings();

  const isDarkMode = settings.theme === 'dark';
  const toggleDarkMode = () => {
    updateSetting('theme', isDarkMode ? 'light' : 'dark');
  };

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'status', icon: CircleDot, label: 'Status' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'groups', icon: Users2, label: 'Groups' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isExpanded ? 240 : 88 }}
      className="h-full bg-[#0B0E11]/80 backdrop-blur-2xl rounded-[2.8rem] border border-white/[0.05] flex flex-col relative z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-8 right-1/2 translate-x-1/2 w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all z-50 opacity-0 group-hover:opacity-100"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Top Logo Area */}
      <div className="p-6 mb-4 flex flex-col items-center">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-4 transition-all cursor-pointer",
            !isExpanded && "justify-center"
          )}
        >
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl opacity-0 group-hover/logo:opacity-30 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-black shadow-2xl relative z-10 border border-white/20">
              <ShieldCheck size={32} />
            </div>
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-white font-[900] tracking-tighter text-2xl leading-none font-display">CHATTRIX</span>
              <span className="text-emerald-500 text-[10px] uppercase font-black tracking-[0.3em] mt-1">AX-7 PROTOCOL</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar py-4">
        {navItems.map((item) => (
          <div key={item.id} className="relative group/item">
            <button
              onClick={() => setActiveTab(item.id as TabId)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative overflow-hidden",
                activeTab === item.id 
                   ? "bg-emerald-600 text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)]" 
                   : "text-white/30 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <item.icon size={24} className={cn("shrink-0 transition-transform duration-500", activeTab === item.id && "scale-110")} />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xs font-black uppercase tracking-[0.1em] whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {activeTab === item.id && (
                <motion.div 
                  layoutId="sidebar-active-glow"
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none"
                />
              )}
            </button>

            {!isExpanded && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all translate-x-2 group-hover/item:translate-x-0 whitespace-nowrap z-[100] shadow-2xl border border-white/20">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 mt-auto space-y-2 border-t border-white/5">
        <div className="space-y-1">
           <button 
              onClick={toggleDarkMode}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl text-white/30 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all",
                !isExpanded && "justify-center"
              )}
           >
              {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
              {isExpanded && <span className="text-[10px] font-black uppercase tracking-widest truncate">Cortex Mode</span>}
           </button>
           <button 
              onClick={() => setShowSignals(!showSignals)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl text-white/30 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all relative",
                !isExpanded && "justify-center",
                showSignals && "text-emerald-500 bg-emerald-500/10"
              )}
           >
              <Bell size={22} />
              {isExpanded && <span className="text-[10px] font-black uppercase tracking-widest truncate">Signals</span>}
              {showSignals && <SignalsPanel onClose={() => setShowSignals(false)} />}
           </button>
        </div>

        <div className={cn(
          "flex items-center gap-4 p-3 transition-all",
          !isExpanded && "justify-center flex-col"
        )}>
          <div className="relative group/avatar">
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-lg opacity-0 group-hover/avatar:opacity-30 transition-opacity" />
            <img src={currentUser?.photoURL} className="w-12 h-12 rounded-2xl object-cover border border-white/10 relative z-10" alt="Me" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0B0E11] rounded-full z-20" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 text-white">
               <p className="text-xs font-[900] truncate tracking-tight">{currentUser?.displayName}</p>
               <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] truncate">Operator: Verified</p>
            </div>
          )}
        </div>

        <button
          onClick={() => auth.signOut()}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all",
            !isExpanded && "justify-center"
          )}
        >
          <LogOut size={22} />
          {isExpanded && <span className="text-[10px] font-black uppercase tracking-widest overflow-hidden text-ellipsis">Terminate Session</span>}
        </button>
      </div>
    </motion.div>
  );
}
