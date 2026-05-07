import React, { useState } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn, formatTime } from '../../lib/utils';
import { Check, Clock, Languages, Brain, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateMessage, analyzeTone } from '../../services/geminiService';

interface MessageItemProps {
  message: Message;
  isFirstInSequence: boolean;
}

export default function MessageItem({ message, isFirstInSequence }: MessageItemProps) {
  const { currentUser } = useAuth();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const isMine = message.senderId === currentUser?.uid;

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    setIsTranslating(true);
    try {
      const result = await translateMessage(message.text, "Hindi"); // Defaulting to Hindi for demo
      setTranslatedText(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAnalyzeTone = async () => {
    if (tone) {
      setTone(null);
      return;
    }
    setIsAnalyzingTone(true);
    try {
      const result = await analyzeTone(message.text);
      setTone(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  const StatusIcon = () => {
    if (!isMine) return null;
    switch (message.status) {
      case 'sent': return <Check size={14} className="text-black/30 dark:text-white/30" />;
      case 'delivered': return <div className="flex -space-x-2"><Check size={14} className="text-black/30 dark:text-white/30" /><Check size={14} className="text-black/30 dark:text-white/30" /></div>;
      case 'seen': return <div className="flex -space-x-2"><Check size={14} className="text-blue-400 dark:text-[#53bdeb]" /><Check size={14} className="text-blue-400 dark:text-[#53bdeb]" /></div>;
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setShowTools(true)}
      onMouseLeave={() => setShowTools(false)}
      className={cn(
        "flex w-full mb-1 group relative",
        isMine ? "justify-end" : "justify-start"
      )}
    >
      <AnimatePresence>
        {showTools && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#151B21] border border-black/10 dark:border-white/10 rounded-full shadow-2xl z-20 backdrop-blur-md",
              isMine ? "right-full mr-3 flex-row-reverse" : "left-full ml-3"
            )}
          >
            <button 
              onClick={handleTranslate}
              disabled={isTranslating}
              className={cn(
                "p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                isTranslating ? "text-green-500 animate-spin" : "text-black/60 dark:text-white/60",
                translatedText && "text-green-500"
              )}
              title="Translate with Nova"
            >
              <Languages size={14} />
            </button>
            <button 
              onClick={handleAnalyzeTone}
              disabled={isAnalyzingTone}
              className={cn(
                "p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                isAnalyzingTone ? "text-blue-500 animate-pulse" : "text-black/60 dark:text-white/60",
                tone && "text-blue-400"
              )}
              title="Analyze Mood"
            >
              <Brain size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "max-w-[85%] sm:max-w-[70%] relative px-4 py-2.5 flex flex-col transition-all border",
        isMine 
          ? "bg-emerald-600 dark:bg-emerald-800 text-white dark:text-[#e9edef] border-emerald-500/20 shadow-[0_5px_15px_rgba(6,95,70,0.1)]" 
          : "bg-gray-100 dark:bg-[#151B21] text-black dark:text-[#e9edef] border-black/5 dark:border-white/5",
        isFirstInSequence ? "mt-4" : "mt-1",
        (translatedText || tone) && "ring-2 ring-emerald-500/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
      )}>
        <div className="flex flex-col relative z-10 pr-14 min-w-[80px]">
            {tone && (
              <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-400">
                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                <span>PHASE: {tone}</span>
              </div>
            )}
            
            <p className={cn(
              "text-[14px] leading-relaxed break-words font-medium",
              isMine ? "text-white" : "text-black dark:text-white/90"
            )}>
              {translatedText || message.text}
            </p>

            {translatedText && (
              <p className={cn(
                "mt-1.5 pt-1.5 border-t text-[12px] italic",
                isMine ? "border-white/10 text-white/40" : "border-black/5 dark:border-white/10 text-black/40 dark:text-white/40"
              )}>
                Original: {message.text}
              </p>
            )}

            <div className="absolute bottom-0 right-0 flex items-center gap-1.5">
                <span className="text-[9px] text-black/30 dark:text-white/30 font-mono tracking-tighter">
                    {formatTime(message.timestamp)}
                </span>
                {message.disappearing?.enabled && (
                  <Clock size={10} className="text-emerald-500/40" />
                )}
                {isMine && <StatusIcon />}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
