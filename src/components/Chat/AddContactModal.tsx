import React, { useState } from 'react';
import { X, Search, UserPlus, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '../../context/ChatContext';
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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 px-2">Identification</p>
            <input 
              type="text" 
              placeholder="Email or Phone Number..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-6 text-sm focus:outline-none focus:border-green-500/50 text-black dark:text-white transition-all placeholder-black/20 dark:placeholder-white/20 font-bold"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
            {isLoading ? 'Verifying Identity...' : 'Confirm Connection'}
          </button>
        </form>

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
