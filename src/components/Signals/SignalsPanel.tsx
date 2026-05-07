import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Zap, Shield, Wand2, X, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SignalsPanelProps {
  onClose: () => void;
}

const SIGNALS = [
  { id: 1, type: 'system', title: 'CORTEX CALIBRATED', time: '1m ago', desc: 'Neural processing units at 100% efficiency.', icon: Wand2, color: 'text-emerald-500' },
  { id: 2, type: 'security', title: 'SECURE LINK', time: '5m ago', desc: 'AES-256 handshake successful with global relay.', icon: Shield, color: 'text-blue-500' },
  { id: 3, type: 'power', title: 'AX-7 PROTOCOL', time: '12m ago', desc: 'Establishing prioritized transmission channels.', icon: Zap, color: 'text-amber-500' },
  { id: 4, type: 'update', title: 'BINARY SYNC', time: '1h ago', desc: 'Database delta-sync completed successfully.', icon: Bell, color: 'text-purple-500' },
];

export default function SignalsPanel({ onClose }: SignalsPanelProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute bottom-24 left-full ml-4 w-72 bg-white dark:bg-[#151B21] border border-black/10 dark:border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] p-5 backdrop-blur-3xl overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">System Signals</h3>
          <p className="text-[10px] font-bold text-black/20 dark:text-white/20 uppercase tracking-widest mt-0.5">Real-time Diagnostics</p>
        </div>
        <button 
           onClick={onClose}
           className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-black/30 dark:text-white/30 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {SIGNALS.map((signal) => (
          <div key={signal.id} className="flex gap-4 group cursor-default">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform",
              signal.color
            )}>
              <signal.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-2">
                 <span className="text-[10px] font-black tracking-tight text-black/80 dark:text-white/80">{signal.title}</span>
                 <span className="text-[8px] font-mono text-black/20 dark:text-white/20">{signal.time}</span>
               </div>
               <p className="text-[10px] text-black/40 dark:text-white/40 leading-relaxed mt-1 line-clamp-2">{signal.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-emerald-500 cursor-pointer hover:opacity-80 transition-opacity">
          <span>View All Logs</span>
          <Circle size={8} fill="currentColor" className="animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
