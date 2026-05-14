import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, CircleDot, Phone, Users, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabId } from '../Layout/MainLayout';

interface MobileBottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const items = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'status', icon: CircleDot, label: 'Status' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-[#1a1d26]/80 backdrop-blur-md rounded-2xl z-[60] flex items-center justify-around px-2 shadow-2xl border border-white/10">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as TabId)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all h-full w-full relative",
            activeTab === item.id ? "text-[#00d26a]" : "text-white/40 hover:text-white"
          )}
        >
          <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
          
          {activeTab === item.id && (
            <motion.div 
              layoutId="activeTabIndicator"
              className="absolute -top-1 w-6 h-1 bg-[#00d26a] rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  );
}
