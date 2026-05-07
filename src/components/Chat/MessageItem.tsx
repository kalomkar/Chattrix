import React, { useState } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn, formatTime } from '../../lib/utils';
import { Check, Clock, Languages, Brain, Sparkles, Copy, CheckCircle2, Reply, Pin, PinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateMessage, analyzeTone } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageItemProps {
  message: Message;
  isFirstInSequence: boolean;
  onReply?: (message: Message) => void;
  onPin?: (message: Message) => void;
}

export default function MessageItem({ message, isFirstInSequence, onReply, onPin }: MessageItemProps) {
  const { currentUser } = useAuth();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isMine = message.senderId === currentUser?.uid;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText || message.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    
    setIsTranslating(true);
    try {
      const res = await translateMessage(message.text, 'English');
      setTranslatedText(res);
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
      const res = await analyzeTone(message.text);
      setTone(res);
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
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-1 group relative",
        isMine ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowTools(true)}
      onMouseLeave={() => setShowTools(false)}
    >
      <AnimatePresence>
        {showTools && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: isMine ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-1 bg-white dark:bg-[#111827] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-20 backdrop-blur-md",
              isMine ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            <button 
              onClick={() => onReply?.(message)}
              className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/60 dark:text-white/60"
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button 
              onClick={() => onPin?.(message)}
              className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/60 dark:text-white/60"
              title="Pin Message"
            >
               <Pin size={14} />
            </button>
            <div className="w-[1px] h-4 bg-black/5 dark:bg-white/5 mx-0.5" />
            <button 
              onClick={handleCopy}
              className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/60 dark:text-white/60"
              title="Copy"
            >
              {isCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <div className="w-[1px] h-4 bg-black/5 dark:bg-white/5 mx-0.5" />
            <button 
              onClick={handleTranslate}
              disabled={isTranslating}
              className={cn(
                "p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                isTranslating ? "text-green-500 animate-spin" : "text-black/60 dark:text-white/60",
                translatedText && "text-green-500"
              )}
              title="Translate Signal"
            >
              <Languages size={14} />
            </button>
            <button 
              onClick={handleAnalyzeTone}
              disabled={isAnalyzingTone}
              className={cn(
                "p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                isAnalyzingTone ? "text-blue-500 animate-pulse" : "text-black/60 dark:text-white/60",
                tone && "text-blue-400"
              )}
              title="Analyze Frequency"
            >
              <Brain size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "max-w-[85%] sm:max-w-[70%] relative px-4 pt-3 pb-8 flex flex-col transition-all border shadow-sm",
        isMine 
          ? "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-500/20 rounded-2xl rounded-tr-none" 
          : "bg-white dark:bg-[#111827] text-black dark:text-white border-black/5 dark:border-white/5 rounded-2xl rounded-tl-none",
        isFirstInSequence ? "mt-4" : "mt-0.5",
        (translatedText || tone) && "ring-1 ring-emerald-500/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
      )}>
        <div className="flex flex-col relative z-10 min-w-[80px]">
            {tone && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-500/20 rounded-lg self-start">
                <Sparkles size={10} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Tone: {tone}</span>
              </div>
            )}

            <div className={cn(
              "text-[14px] leading-relaxed markdown-container",
              isMine ? "text-white prose-invert" : "text-black dark:text-white prose-emerald"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative group/code my-2 text-[12px]">
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-xl !bg-black/30 !p-4 !m-0 border border-white/5 scrollbar-none"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        <button 
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-emerald-500/20 rounded-md opacity-0 group-hover/code:opacity-100 transition-all text-white/40 hover:text-emerald-400"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ) : (
                      <code className={cn("bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[0.9em] font-mono", className)} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {translatedText || message.text}
              </ReactMarkdown>
            </div>

            {message.scheduled && (
              <div className="flex items-center gap-1 mt-1.5 opacity-60">
                 <Clock size={10} />
                 <span className="text-[9px] uppercase tracking-[0.15em] font-black">Scheduled Signal</span>
              </div>
            )}

            {translatedText && (
              <p className={cn(
                "mt-2 pt-2 border-t text-[11px] italic opacity-50",
                isMine ? "border-white/10" : "border-black/5 dark:border-white/10"
              )}>
                Original Relay: {message.text}
              </p>
            )}
        </div>

        <div className={cn(
          "absolute bottom-1.5 right-3 flex items-center gap-1 text-[9px] font-bold select-none",
          isMine ? "text-white/40" : "text-black/30 dark:text-white/30"
        )}>
           <span className="font-mono">{formatTime(message.timestamp)}</span>
           <StatusIcon />
        </div>
      </div>
    </motion.div>
  );
}
