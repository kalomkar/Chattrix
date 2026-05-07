import React from 'react';
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
    <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 glass rounded-2xl z-[60] flex items-center justify-around px-2 shadow-2xl">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as TabId)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all",
            activeTab === item.id ? "text-emerald-500 scale-110" : "text-black/30 dark:text-white/30"
          )}
        >
          <item.icon size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
