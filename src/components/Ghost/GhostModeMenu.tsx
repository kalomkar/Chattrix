import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Ghost, EyeOff, Keyboard, CheckCheck, MessageSquare, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';

interface GhostModeMenuProps {
  onClose: () => void;
}

export default function GhostModeMenu({ onClose }: GhostModeMenuProps) {
  const { currentUser } = useAuth();
  const [ghostMode, setGhostMode] = useState(currentUser?.ghostMode || { hideOnline: false, hideTyping: false, hideBlueTicks: false });
  const [autoReply, setAutoReply] = useState(currentUser?.autoReply || { enabled: false, message: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ghostMode,
        autoReply
      });
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleGhost = (key: keyof typeof ghostMode) => {
    setGhostMode(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div className="flex items-center space-x-3 text-blue-500 dark:text-blue-400">
            <Ghost size={24} />
            <h2 className="text-lg font-bold text-black dark:text-white">GB Chattrix Settings</h2>
          </div>
          <button onClick={onClose} className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <section className="space-y-4">
             <h3 className="text-black/30 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest pl-1">Privacy / Ghost Mode</h3>
             <ToggleItem 
                icon={<EyeOff size={18} />} 
                label="Hide Online Status" 
                description="Others won't see when you're online"
                active={ghostMode.hideOnline} 
                onClick={() => toggleGhost('hideOnline')} 
             />
             <ToggleItem 
                icon={<Keyboard size={18} />} 
                label="Hide Typing status" 
                description="Hides the 'typing...' indicator"
                active={ghostMode.hideTyping} 
                onClick={() => toggleGhost('hideTyping')} 
             />
             <ToggleItem 
                icon={<CheckCheck size={18} />} 
                label="Hide Blue Ticks" 
                description="Messages won't be marked as read"
                active={ghostMode.hideBlueTicks} 
                onClick={() => toggleGhost('hideBlueTicks')} 
             />
          </section>

          <section className="space-y-4">
             <div className="flex items-center justify-between pl-1">
                <h3 className="text-black/30 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Auto Reply</h3>
                <button 
                  onClick={() => setAutoReply(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={cn("w-10 h-5 rounded-full relative transition-all duration-300", autoReply.enabled ? "bg-blue-600" : "bg-black/10 dark:bg-white/10")}
                >
                  <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white dark:bg-gray-200 transition-all duration-300 shadow-sm", autoReply.enabled ? "right-1" : "left-1")} />
                </button>
             </div>
             {autoReply.enabled && (
                <textarea 
                  value={autoReply.message}
                  onChange={(e) => setAutoReply(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your auto reply message..."
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-sm text-black dark:text-white placeholder-black/20 dark:placeholder-white/20 focus:border-blue-500/50 outline-none transition-all"
                  rows={3}
                />
             )}
          </section>
        </div>

        <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-2.5 rounded-2xl flex items-center space-x-2 transition-all shadow-lg shadow-blue-900/30 active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ToggleItem({ icon, label, description, active, onClick }: { icon: React.ReactNode, label: string, description: string, active: boolean, onClick: () => void }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all" onClick={onClick}>
      <div className="flex items-center space-x-4">
        <div className={cn("p-2.5 rounded-xl transition-all", active ? "bg-blue-600/20 text-blue-500 dark:text-blue-400" : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40")}>
          {icon}
        </div>
        <div className="flex flex-col">
          <div className="text-black dark:text-white text-sm font-semibold">{label}</div>
          <div className="text-black/40 dark:text-white/40 text-[10px]">{description}</div>
        </div>
      </div>
      <div className={cn("w-10 h-5 rounded-full relative transition-all duration-300", active ? "bg-blue-600" : "bg-black/10 dark:bg-white/10")}>
        <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white dark:bg-gray-200 transition-all duration-300 shadow-sm", active ? "right-1" : "left-1")} />
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
