import React, { useState } from 'react';
import { X, Calendar, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useChat } from '../../context/ChatContext';

interface ScheduleMessageModalProps {
  onClose: () => void;
  initialText?: string;
}

export default function ScheduleMessageModal({ onClose, initialText = '' }: ScheduleMessageModalProps) {
  const { scheduleMessage } = useChat();
  const [text, setText] = useState(initialText);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !date || !time) {
      setError('Please fill in all fields protocol.');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}`);
    const now = new Date();

    if (scheduledDate <= now) {
      setError('Signal must be scheduled for a future timestamp.');
      return;
    }

    setIsScheduling(true);
    setError(null);

    try {
      await scheduleMessage(text, scheduledDate.toISOString());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Transmission scheduling failed. Link unstable.');
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black tracking-tighter text-black dark:text-white uppercase">Schedule Feed</h2>
              <p className="text-[10px] font-bold text-black/30 dark:text-white/30 tracking-[0.2em] uppercase mt-1">Delayed Signal Protocol</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={20} className="text-black/40 dark:text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSchedule} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40 ml-1">Message Content</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your future signal..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/30 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 resize-none h-32 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40 ml-1">Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500/30 text-black dark:text-white [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40 dark:text-white/40 ml-1">Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500/30 text-black dark:text-white [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20"
                >
                  <CheckCircle2 size={14} />
                  Signal locked in transmission buffer.
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={isScheduling || success}
              type="submit"
              className={cn(
                "w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
                success 
                  ? "bg-emerald-500 text-white" 
                  : "bg-black dark:bg-white text-white dark:text-black hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white shadow-xl hover:shadow-emerald-500/20"
              )}
            >
              {isScheduling ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : success ? (
                "Locked"
              ) : (
                <>
                  <Send size={16} />
                  Initiate Schedule
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
