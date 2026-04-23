import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Ghost, Wand2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SmartControls() {
  const { activeChat, onlineUsers, typingStatus } = useChat();
  const { currentUser } = useAuth();

  const otherParticipantId = activeChat?.participants.find(p => p !== currentUser?.uid);
  const otherParticipant = otherParticipantId ? activeChat?.participantDetails?.[otherParticipantId] : null;

  return (
    <aside className="w-72 glass rounded-3xl p-6 flex flex-col gap-8 h-full overflow-y-auto no-scrollbar hidden xl:flex">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 pl-1">Smart Controls</p>
        
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-white">Ghost Mode</p>
              <p className="text-[10px] text-white/40">Status: {currentUser?.ghostMode?.hideOnline ? 'Stealth' : 'Visible'}</p>
            </div>
            <div className={cn("p-1.5 rounded-full", currentUser?.ghostMode?.hideOnline ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/30")}>
               <Ghost size={14} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-white">Auto-Reply</p>
              <p className="text-[10px] text-white/40">{currentUser?.autoReply?.enabled ? 'Active' : 'Inactive'}</p>
            </div>
            <div className={cn("p-1.5 rounded-full", currentUser?.autoReply?.enabled ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/30")}>
               <AlertCircle size={14} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-lg shadow-blue-900/10">
            <div className="flex items-center gap-2 mb-3 text-blue-400">
               <Wand2 size={14} />
               <p className="text-xs font-bold uppercase tracking-wider">AI Insight</p>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed italic">
              {activeChat 
                ? `You are chatting with ${otherParticipant?.displayName || 'a contact'}. Their privacy settings are ${otherParticipant?.ghostMode?.hideOnline ? 'strictly private' : 'standard'}.`
                : "Select a chat to see AI-powered insights about your conversation partner and security."
              }
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4">
         <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
               <Clock size={20} />
            </div>
            <div className="flex flex-col">
               <p className="text-xs font-semibold text-white">Scheduled</p>
               <p className="text-[10px] text-white/40">No pending tasks</p>
            </div>
         </div>
         
         <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
               <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
               <p className="text-xs font-semibold text-white">Security</p>
               <p className="text-[10px] text-white/40">End-to-End verified</p>
            </div>
         </div>
      </div>
    </aside>
  );
}
