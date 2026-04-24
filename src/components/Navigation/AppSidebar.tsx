import React, { useState } from 'react';
import { MessageSquare, CircleDot, Phone, Settings, ChevronLeft, ChevronRight, LogOut, ShieldCheck, Users, Bookmark, Users2, Sun, Moon, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { TabId } from '../Layout/MainLayout';

interface AppSidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === 'dark';
    return true; // default to dark
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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
      animate={{ width: isExpanded ? 260 : 76 }}
      className="h-full glass rounded-[1.5rem] border border-white/[0.05] flex flex-col relative z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group shadow-2xl overflow-hidden"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-6 right-6 w-8 h-8 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-50 opacity-0 group-hover:opacity-100"
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Top Logo Area */}
      <div className="p-4 mb-4 flex flex-col items-center">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-4 transition-all cursor-pointer",
            !isExpanded && "justify-center"
          )}
        >
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-green-500 rounded-2xl blur-lg opacity-0 group-hover/logo:opacity-40 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-600 flex items-center justify-center text-white shadow-2xl relative z-10 border border-white/20">
              <ShieldCheck size={28} />
            </div>
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-black dark:text-white font-black tracking-tighter text-xl leading-none">CHATTRIX</span>
              <span className="text-green-500 text-[10px] uppercase font-black tracking-[0.3em] mt-1">v.2.4 Premium AI</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto no-scrollbar py-2">
        {navItems.map((item) => (
          <div key={item.id} className="relative group/item">
            <button
              onClick={() => setActiveTab(item.id as TabId)}
              className={cn(
                "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all relative overflow-hidden",
                activeTab === item.id 
                   ? "bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white" 
                   : "text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              )}
            >
              <item.icon size={22} className={cn("shrink-0 transition-transform", activeTab === item.id && "scale-110")} />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-bold tracking-tight whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {activeTab === item.id && (
                <motion.div 
                  layoutId="sidebar-active-glow"
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
                />
              )}
            </button>

            {!isExpanded && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-black text-[10px] font-black rounded-xl opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all translate-x-2 group-hover/item:translate-x-0 whitespace-nowrap z-[100] shadow-2xl border border-white/20">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-3 mt-auto space-y-2 border-t border-white/5">
        <div className="space-y-1">
           <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "w-full flex items-center gap-4 p-3.5 rounded-2xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all",
                !isExpanded && "justify-center"
              )}
           >
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              {isExpanded && <span className="text-sm font-bold truncate">Dark Mode</span>}
           </button>
           <button 
              className={cn(
                "w-full flex items-center gap-4 p-3.5 rounded-2xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all",
                !isExpanded && "justify-center"
              )}
           >
              <Bell size={20} />
              {isExpanded && <span className="text-sm font-bold truncate">Notifications</span>}
           </button>
        </div>

        <div className={cn(
          "flex items-center gap-4 p-3 transition-all",
          !isExpanded && "justify-center"
        )}>
          <div className="relative">
            <img src={currentUser?.photoURL} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="Me" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0b141a]" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 text-black dark:text-white">
               <p className="text-xs font-black truncate">{currentUser?.displayName}</p>
               <p className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest truncate">Subscribed User</p>
            </div>
          )}
        </div>

        <button
          onClick={() => auth.signOut()}
          className={cn(
            "w-full flex items-center gap-4 p-3.5 rounded-2xl text-red-400/30 hover:text-red-400 hover:bg-red-500/10 transition-all",
            !isExpanded && "justify-center"
          )}
        >
          <LogOut size={20} />
          {isExpanded && <span className="text-sm font-bold tracking-tight">Disconnect</span>}
        </button>
      </div>
    </motion.div>
  );
}
