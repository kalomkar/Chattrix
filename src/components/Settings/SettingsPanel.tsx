import React, { useState } from 'react';
import { 
  User, Shield, Lock, Bell, MessageSquare, Palette, Share2, 
  Smartphone, Database, Code, LogOut, ChevronRight, Check, X,
  Moon, Sun, Ghost, Clock, Eye, Trash2, Camera, Phone, Settings as SettingsIcon,
  Zap, Calendar, BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { auth, db } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface Section {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
}

const SECTIONS: Section[] = [
  { id: 'account', label: 'Account', icon: User, description: 'Profile, security, delete options', color: 'text-blue-400' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Last seen, visible items, read receipts', color: 'text-emerald-400' },
  { id: 'ghost', label: 'Ghost Mode', icon: Ghost, description: 'GB Features: Stealth and invisible features', color: 'text-indigo-400' },
  { id: 'chats', label: 'Chats', icon: MessageSquare, description: 'Wallpaper, font size, enter to send', color: 'text-amber-400' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Themes, accent colors, glass effects', color: 'text-pink-400' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Message sounds, groups, mute controls', color: 'text-red-400' },
  { id: 'status', label: 'Status', icon: Share2, description: 'Visibility, auto-delete, replies', color: 'text-teal-400' },
  { id: 'calls', label: 'Calls', icon: Phone, description: 'Ringtones, data usage, auto-accept', color: 'text-cyan-400' },
  { id: 'auto-reply', label: 'Auto Reply', icon: Zap, description: 'Smart replies, scheduling, templates', color: 'text-orange-400' },
  { id: 'storage', label: 'Storage & Data', icon: Database, description: 'Network usage, cache, media management', color: 'text-slate-400' },
  { id: 'advanced', label: 'Advanced', icon: Code, description: 'Dev mode, debug logs, app reset', color: 'text-purple-400' },
];

export default function SettingsPanel() {
  const { currentUser } = useAuth();
  const [activePath, setActivePath] = useState<string | null>(null);

  const handleBack = () => setActivePath(null);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="text-3xl font-black text-black dark:text-white tracking-tighter">Settings</h1>
              <p className="text-black/30 dark:text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-1">Chattrix Configuration Suite</p>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <SettingsIcon size={24} />
           </div>
        </div>

        {/* Mini Profile Card */}
        <div className="p-4 rounded-[2rem] glass border border-black/10 dark:border-white/10 flex items-center gap-4 transition-all hover:bg-black/5 dark:hover:bg-white/5">
           <img 
            src={currentUser?.photoURL} 
            alt="User" 
            className="w-14 h-14 rounded-full border-2 border-blue-500/20"
           />
           <div className="flex-1">
              <h3 className="text-black dark:text-white font-bold">{currentUser?.displayName}</h3>
              <p className="text-black/40 dark:text-white/40 text-xs truncate max-w-[200px]">{currentUser?.email || currentUser?.phoneNumber}</p>
           </div>
           <button 
            onClick={() => setActivePath('account')}
            className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
           >
              <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-8">
        <AnimatePresence mode="wait">
          {!activePath ? (
            <motion.div 
              key="main-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActivePath(section.id)}
                  className="group p-5 rounded-[2rem] glass border border-black/5 dark:border-white/5 flex items-center gap-5 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/10 dark:hover:border-white/10 text-left"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center transition-all group-hover:scale-110",
                    section.color
                  )}>
                    <section.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-black dark:text-white font-bold text-sm tracking-tight">{section.label}</h4>
                    <p className="text-black/30 dark:text-white/30 text-[11px] font-medium leading-tight mt-0.5">{section.description}</p>
                  </div>
                  <ChevronRight size={18} className="text-black/10 dark:text-white/10 group-hover:text-black/40 dark:group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
              
              <button
                onClick={() => auth.signOut()}
                className="col-span-full mt-4 p-5 rounded-[2rem] bg-red-500/10 border border-red-500/10 flex items-center gap-5 transition-all hover:bg-red-500/20 text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-all">
                  <LogOut size={22} />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-400 font-bold text-sm">Logout</h4>
                  <p className="text-red-400/40 text-[11px] font-medium">Terminate session on this device</p>
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors mb-8 group"
              >
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                   <ChevronRight size={16} className="rotate-180" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Back to settings</span>
              </button>

              <SettingsContent path={activePath} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SettingsContent({ path }: { path: string }) {
  const { currentUser } = useAuth();
  const { settings, updateSetting, resetSettings } = useSettings();
  
   const [autoReplyMessage, setAutoReplyMessage] = useState(currentUser?.autoReply?.message || '');

  const handleUpdateAccount = async (data: any) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), data);
    } catch (err) {
      console.error(err);
    }
  };

  switch (path) {
    case 'account':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Account Settings" icon={User} color="text-blue-500 dark:text-blue-400" />
           <div className="space-y-4">
              <SettingsGroup title="Profile Infomation">
                 <div className="flex flex-col items-center gap-6 p-4">
                    <div className="relative group">
                       <img src={currentUser?.photoURL} className="w-24 h-24 rounded-3xl object-cover border-4 border-blue-500/20" />
                       <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-[#0f172a]">
                          <Camera size={14} />
                       </button>
                    </div>
                    <div className="w-full space-y-4">
                       <InputGroup label="Display Name" value={currentUser?.displayName || ''} />
                       <InputGroup label="Phone Number" value={currentUser?.phoneNumber || 'Not Linked'} disabled />
                       <InputGroup label="Email Address" value={currentUser?.email || ''} disabled />
                    </div>
                 </div>
              </SettingsGroup>
           </div>
        </div>
      );
    case 'privacy':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Privacy Options" icon={Shield} color="text-emerald-500 dark:text-emerald-400" />
           <div className="space-y-4">
              <SettingsGroup title="Visibility">
                 <SelectOption label="Last Seen" options={['everyone', 'contacts', 'nobody']} value="everyone" />
              </SettingsGroup>
              <SettingsGroup title="Messaging">
                 <ToggleOption label="Read Receipts" enabled={settings.notifications} onToggle={() => updateSetting('notifications', !settings.notifications)} />
              </SettingsGroup>
           </div>
        </div>
      );
    case 'ghost':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Ghost Mode" icon={Ghost} color="text-indigo-500 dark:text-indigo-400" />
           <div className="space-y-4">
              <SettingsGroup title="Stealth Settings">
                 <ToggleOption label="Hide Online Status" enabled={currentUser?.ghostMode?.hideOnline || false} onToggle={() => handleUpdateAccount({ 'ghostMode.hideOnline': !currentUser?.ghostMode?.hideOnline })} />
                 <ToggleOption label="Hide Typing Status" enabled={currentUser?.ghostMode?.hideTyping || false} onToggle={() => handleUpdateAccount({ 'ghostMode.hideTyping': !currentUser?.ghostMode?.hideTyping })} />
                 <ToggleOption label="Hide Blue Ticks" enabled={currentUser?.ghostMode?.hideBlueTicks || false} onToggle={() => handleUpdateAccount({ 'ghostMode.hideBlueTicks': !currentUser?.ghostMode?.hideBlueTicks })} />
              </SettingsGroup>
           </div>
        </div>
      );
    case 'chats':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Chat Settings" icon={MessageSquare} color="text-amber-500 dark:text-amber-400" />
           <div className="space-y-4">
              <SettingsGroup title="Behavior">
                 <ToggleOption label="Enter to Send" enabled={settings.enterToSend} onToggle={() => updateSetting('enterToSend', !settings.enterToSend)} />
              </SettingsGroup>
              <SettingsGroup title="Appearance">
                 <SelectOption label="Font Size" options={['small', 'medium', 'large']} value={settings.fontSize} onSelect={(v) => updateSetting('fontSize', v)} />
              </SettingsGroup>
           </div>
        </div>
      );
    case 'appearance':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Appearance" icon={Palette} color="text-pink-500 dark:text-pink-400" />
           <div className="space-y-4">
              <SettingsGroup title="Interface">
                 <ToggleOption label="Glass Effect" enabled={settings.glassEffect} onToggle={() => updateSetting('glassEffect', !settings.glassEffect)} />
              </SettingsGroup>
           </div>
        </div>
      );
    case 'auto-reply':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Auto Reply" icon={Zap} color="text-orange-500 dark:text-orange-400" />
           <div className="space-y-4">
              <SettingsGroup title="Automation">
                 <ToggleOption label="Enabled" enabled={currentUser?.autoReply?.enabled || false} onToggle={() => handleUpdateAccount({ 'autoReply.enabled': !currentUser?.autoReply?.enabled })} />
                 <div className="p-4">
                    <textarea 
                       value={autoReplyMessage}
                       onChange={(e) => setAutoReplyMessage(e.target.value)}
                       onBlur={() => handleUpdateAccount({ 'autoReply.message': autoReplyMessage })}
                       className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-sm text-black dark:text-white min-h-[100px] resize-none focus:outline-none focus:border-blue-500/50"
                       placeholder="Enter message..."
                    />
                 </div>
              </SettingsGroup>
           </div>
        </div>
      );
    case 'advanced':
      return (
        <div className="space-y-6">
           <SettingsHeader title="Advanced" icon={Code} color="text-purple-500 dark:text-purple-400" />
           <button onClick={resetSettings} className="w-full p-4 glass rounded-[2.5rem] text-amber-500 dark:text-amber-400 font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Reset All Settings</button>
        </div>
      );
    default:
      return <div>Section Not Found</div>;
  }
}

function SettingsHeader({ title, icon: Icon, color }: { title: string, icon: any, color: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
       <div className={cn("p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10", color)}>
          <Icon size={24} />
       </div>
       <h2 className="text-xl font-black text-black dark:text-white">{title}</h2>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black uppercase tracking-widest text-black/20 dark:text-white/20 ml-4">{title}</label>
       <div className="glass border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden">
          {children}
       </div>
    </div>
  );
}

function ToggleOption({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: () => void }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all">
       <span className="text-sm font-bold text-black dark:text-white">{label}</span>
       <button 
        onClick={onToggle}
        className={cn("w-12 h-6 rounded-full p-1 relative transition-colors", enabled ? "bg-blue-600" : "bg-black/10 dark:bg-white/10")}
       >
          <motion.div animate={{ x: enabled ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
       </button>
    </div>
  );
}

function SelectOption({ label, options, value, onSelect }: { label: string, options: string[], value: string, onSelect?: (v: string) => void }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all">
       <span className="text-sm font-bold text-black dark:text-white">{label}</span>
       <div className="flex gap-2">
          {options.map(opt => (
            <button 
              key={opt} 
              onClick={() => onSelect?.(opt)}
              className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all", opt === value ? "bg-blue-600 text-white" : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10")}
            >
               {opt}
            </button>
          ))}
       </div>
    </div>
  );
}

function InputGroup({ label, value, disabled = false }: { label: string, value: string, disabled?: boolean }) {
  return (
    <div className="p-4 space-y-1">
       <label className="text-[9px] font-black uppercase text-black/20 dark:text-white/20">{label}</label>
       <input type="text" value={value} disabled={disabled} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-black dark:text-white disabled:opacity-50 focus:outline-none focus:border-blue-500/50 transition-all font-bold" />
    </div>
  );
}
