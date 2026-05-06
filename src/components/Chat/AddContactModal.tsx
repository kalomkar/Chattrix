import React, { useState } from 'react';
import { X, Search, UserPlus, Loader2, User, Copy, Check, Share2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User as UserType } from '../../types';
import { cn } from '../../lib/utils';

interface AddContactModalProps {
  onClose: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function AddContactModal({ onClose, onShowToast }: AddContactModalProps) {
  const { addContact } = useChat();
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!currentUser?.email) return;
    navigator.clipboard.writeText(currentUser.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      await addContact(input.trim());
      onShowToast("Contact added successfully", "success");
      setTimeout(onClose, 1200);
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || "User not found", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md glass rounded-[2.5rem] border border-white/10 shadow-2xl p-8 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-6">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={20} className="text-white/40" />
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">New Connection</h2>
          <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-[0.2em] mt-1">Connect to the Chattrix Network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 px-2">Secure Search</p>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Email address of your contact..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
                className="w-full bg-[#151B21] border border-white/5 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-emerald-500/50 text-white transition-all placeholder-white/20 font-bold shadow-inner"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-white/5 rounded-lg text-white/20 group-focus-within:text-emerald-500 transition-colors">
                <Search size={16} />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
            {isLoading ? 'ESTABLISHING LINK...' : 'INITIATE CONNECTION'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Invite Intel</p>
            <Share2 size={12} className="text-white/20" />
          </div>
          
          <div className="bg-[#151B21] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
               <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Your Protocol ID</p>
               <p className="text-xs font-bold text-white/60 truncate">{currentUser?.email}</p>
            </div>
            <button 
               onClick={handleCopyId}
               className={cn(
                 "p-3 rounded-xl transition-all",
                 copied ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-white/40 hover:bg-white/10"
               )}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 transition-all">
                <Mail size={14} /> Email Invite
             </button>
             <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 transition-all">
                <Share2 size={14} /> More Options
             </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
            <button 
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest text-black/20 dark:text-white/20 hover:text-green-500 transition-colors"
            >
              Cancel Link Request
            </button>
        </div>
      </motion.div>
    </div>
  );
}
