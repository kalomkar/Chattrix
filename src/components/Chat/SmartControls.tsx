import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Ghost, Wand2, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SmartControls() {
  const { activeChat, onlineUsers, typingStatus } = useChat();
  const { currentUser } = useAuth();

  const otherParticipantId = activeChat?.participants.find(p => p !== currentUser?.uid);
  const otherParticipant = otherParticipantId ? activeChat?.participantDetails?.[otherParticipantId] : null;

  return (
    <aside className="w-72 glass rounded-3xl p-6 flex flex-col gap-8 h-full overflow-y-auto no-scrollbar hidden xl:flex">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D1D5DB] mb-6 pl-1 border-b border-white/10 pb-2">Smart Controls</p>
        
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/12 flex items-center justify-between hover:bg-white/10 transition-all">
            <div className="flex flex-col">
              <p className="text-xs font-black text-white uppercase tracking-tight">Ghost Mode</p>
              <p className="text-[10px] font-bold text-[#9CA3AF] mt-0.5">Status: <span className={currentUser?.ghostMode?.hideOnline ? "text-[#00D084]" : "text-[#9CA3AF]"}>{currentUser?.ghostMode?.hideOnline ? 'Stealth' : 'Visible'}</span></p>
            </div>
            <div className={cn("p-2 rounded-xl border transition-all", currentUser?.ghostMode?.hideOnline ? "bg-[#00D084]/20 text-[#00D084] border-[#00D084]/30 shadow-neon-green" : "bg-white/5 text-[#9CA3AF] border-white/10")}>
               <Ghost size={16} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/12 flex items-center justify-between hover:bg-white/10 transition-all">
            <div className="flex flex-col">
              <p className="text-xs font-black text-white uppercase tracking-tight">Auto-Reply</p>
              <p className="text-[10px] font-bold text-[#9CA3AF] mt-0.5">Status: <span className={currentUser?.autoReply?.enabled ? "text-[#2563FF]" : "text-[#9CA3AF]"}>{currentUser?.autoReply?.enabled ? 'Active' : 'Inactive'}</span></p>
            </div>
            <div className={cn("p-2 rounded-xl border transition-all", currentUser?.autoReply?.enabled ? "bg-[#2563FF]/20 text-[#2563FF] border-[#2563FF]/30 shadow-neon-blue" : "bg-white/5 text-[#9CA3AF] border-white/10")}>
               <AlertCircle size={16} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#2563FF]/10 border border-[#2563FF]/20 shadow-xl shadow-[#2563FF]/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Wand2 size={40} />
            </div>
            <div className="flex items-center gap-2 mb-3 text-[#2563FF]">
               <Sparkles size={14} className="animate-pulse" />
               <p className="text-xs font-black uppercase tracking-widest">AI Insight</p>
            </div>
            <p className="text-[11px] text-[#D1D5DB] leading-relaxed font-medium">
              {activeChat 
                ? `Analyzing stream with ${otherParticipant?.displayName || 'contact'}. Security status: ${otherParticipant?.ghostMode?.hideOnline ? 'Encrypted' : 'Standard'}.`
                : "Select a transmission stream to initialize AI partner analysis."
              }
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4">
         <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
               <Clock size={20} />
            </div>
            <div className="flex flex-col">
               <p className="text-xs font-black text-white uppercase">Scheduled</p>
               <p className="text-[10px] font-bold text-[#9CA3AF]">0 Pending Signals</p>
            </div>
         </div>
         
         <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#00D084]/10 border border-[#00D084]/20 flex items-center justify-center text-[#00D084] group-hover:scale-110 transition-transform">
               <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
               <p className="text-xs font-black text-white uppercase">Security</p>
               <p className="text-[10px] font-bold text-[#9CA3AF]">End-to-End Verified</p>
            </div>
         </div>
      </div>
    </aside>
  );
}
