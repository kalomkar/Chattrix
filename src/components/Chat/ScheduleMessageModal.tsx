import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Send, X, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Please enter a message');
      return;
    }
    if (!date || !time) {
      setError('Please select date and time');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}`);
    if (scheduledDate <= new Date()) {
      setError('Scheduled time must be in the future');
      return;
    }

    setLoading(true);
    try {
      await scheduleMessage(text, scheduledDate.toISOString());
      onClose();
      setText('');
      setDate('');
      setTime('');
    } catch (err) {
      setError('Failed to schedule message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        id="schedule-modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#161921] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
          id="schedule-modal-content"
        >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#00d26a]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00d26a]/20 flex items-center justify-center text-[#00d26a]">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">Schedule Transmission</h2>
                  <p className="text-xs text-[#b3b3b3]">Timed message protocol</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl text-[#b3b3b3] transition-colors"
                id="close-schedule-modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#b3b3b3] ml-1">Message Content</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your encrypted message..."
                  className="w-full bg-[#0f1117]/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[#00d26a]/50 outline-none transition-all resize-none h-32"
                  id="schedule-message-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#b3b3b3] ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#0f1117]/50 border border-white/5 rounded-2xl p-3 pl-11 text-sm text-white focus:border-[#00d26a]/50 outline-none transition-all [color-scheme:dark]"
                      id="schedule-date-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#b3b3b3] ml-1">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#0f1117]/50 border border-white/5 rounded-2xl p-3 pl-11 text-sm text-white focus:border-[#00d26a]/50 outline-none transition-all [color-scheme:dark]"
                      id="schedule-time-input"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/10 text-xs font-medium animate-shake">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00d26a] hover:bg-[#00b35a] disabled:opacity-50 disabled:hover:bg-[#00d26a] text-[#0f1117] font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(0,210,106,0.2)] active:scale-[0.98]"
                id="submit-schedule-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#0f1117]/20 border-t-[#0f1117] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Execute Schedule</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
