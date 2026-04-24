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
      case 'sent': return <Check size={14} className="text-[#8696a0]" />;
      case 'delivered': return <div className="flex -space-x-2"><Check size={14} className="text-[#8696a0]" /><Check size={14} className="text-[#8696a0]" /></div>;
      case 'seen': return <div className="flex -space-x-2"><Check size={14} className="text-[#53bdeb]" /><Check size={14} className="text-[#53bdeb]" /></div>;
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
              "absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-[#233138] border border-white/10 rounded-full shadow-xl z-20",
              isMine ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            <button 
              onClick={handleTranslate}
              disabled={isTranslating}
              className={cn(
                "p-1.5 rounded-full hover:bg-white/10 transition-colors",
                isTranslating ? "text-green-500 animate-spin" : "text-white/60",
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
                "p-1.5 rounded-full hover:bg-white/10 transition-colors",
                isAnalyzingTone ? "text-blue-500 animate-pulse" : "text-white/60",
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
        "max-w-[85%] sm:max-w-[70%] relative px-3 py-1.5 shadow-md flex flex-col transition-all",
        isMine 
          ? "bg-[#005c4b] text-[#e9edef] rounded-l-xl rounded-tr-xl rounded-br-none" 
          : "bg-[#202c33] text-[#e9edef] rounded-r-xl rounded-tl-xl rounded-bl-none",
        isFirstInSequence ? "mt-2" : "mt-0.5",
        (translatedText || tone) && "ring-1 ring-green-500/30"
      )}>
        <div className="flex flex-col relative z-10 pr-12 min-w-[60px]">
            {tone && (
              <div className="flex items-center gap-1 mb-1 text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                <Sparkles size={10} />
                <span>Detected: {tone}</span>
              </div>
            )}
            
            <p className="text-[14.2px] leading-relaxed break-words">
              {translatedText || message.text}
            </p>

            {translatedText && (
              <p className="mt-1.5 pt-1.5 border-t border-white/10 text-[12px] italic text-white/40">
                Original: {message.text}
              </p>
            )}

            <div className="absolute bottom-[-1px] right-[-4px] flex items-center gap-1">
                <span className="text-[10px] text-[#8696a0] font-medium leading-none">
                    {formatTime(message.timestamp)}
                </span>
                {message.disappearing?.enabled && (
                  <Clock size={10} className="text-amber-500/50" />
                )}
                {isMine && <StatusIcon />}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
