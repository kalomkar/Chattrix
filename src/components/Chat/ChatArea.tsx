import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useSettings } from '../../context/SettingsContext';
import { Search, MoreVertical, Send, Paperclip, Smile, Mic, X, ChevronDown, Wand2, Phone, Video, Clock, Camera, Plus, Sparkles } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import MessageItem from './MessageItem';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIAssistance, summarizeChat, polishMessage } from '../../services/geminiService';
import QuickActionPanel from './QuickActionPanel';

const DISAPPEARING_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '1m', value: 60 },
  { label: '1h', value: 3600 },
  { label: '1d', value: 86400 },
];

export default function ChatArea() {
  const { activeChat, messages, sendMessage, typingStatus, setTyping, onlineUsers } = useChat();
  const { currentUser } = useAuth();
  const { startCall } = useCall();
  const { settings } = useSettings();
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState(0);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [autoReply, setAutoReply] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);

  const handlePolish = async () => {
    if (!inputText.trim() || isPolishing) return;
    setIsPolishing(true);
    try {
      const polished = await polishMessage(inputText);
      setInputText(polished);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishing(false);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAiAssistance = async () => {
    if (messages.length === 0) return;
    setIsAiLoading(true);
    try {
      const isNovaChat = activeChat?.participants.includes('nova-ai-bot');
      const history = messages.slice(-10).map(m => ({
        sender: m.senderId === currentUser?.uid ? 'Me' : (activeChat?.participantDetails?.[m.senderId]?.displayName || 'Other'),
        text: m.text
      }));
      const { autoReply: aiAutoReply, suggestions } = await getAIAssistance(history, isNovaChat);
      setAutoReply(aiAutoReply);
      setSmartReplies(suggestions);
    } catch (error) {
      console.error("Nova Assistance Fetch Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUser?.uid && lastMsg.type === 'text') {
      const timer = setTimeout(fetchAiAssistance, 1000);
      return () => clearTimeout(timer);
    } else {
        setSmartReplies([]);
        setAutoReply('');
    }
  }, [messages, currentUser?.uid]);

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setIsAiLoading(true);
    try {
      const history = messages.slice(-50).map(m => ({
        sender: m.senderId === currentUser?.uid ? 'Me' : (activeChat?.participantDetails?.[m.senderId]?.displayName || 'Other'),
        text: m.text
      }));
      const res = await summarizeChat(history);
      setSummary(res || "");
      setShowSummary(true);
    } catch (error) {
      console.error("AI Summarization Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    await sendMessage(inputText.trim(), 'text', undefined, disappearingDuration);
    setInputText('');
    setTyping(false);
    setSmartReplies([]);
    setShowEmoji(false);
  };

  const otherParticipantId = activeChat?.participants.find(p => p !== currentUser?.uid);
  const otherParticipant = otherParticipantId ? activeChat?.participantDetails?.[otherParticipantId] : null;
  const isOnline = otherParticipantId && onlineUsers.has(otherParticipantId) && !otherParticipant?.ghostMode?.hideOnline;
  const isTyping = otherParticipantId && typingStatus[otherParticipantId];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0E11] relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat z-0" />
      <div className="mesh-bg opacity-30" />

      {/* Header */}
      <div className="h-20 px-6 border-b border-black/5 dark:border-white/[0.05] flex items-center justify-between bg-white/80 dark:bg-[#0B0E11]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="relative">
             <div className="p-1 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-transparent">
               <img 
                 src={activeChat?.isGroup ? activeChat.groupMetadata?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${activeChat.groupMetadata?.name}` : otherParticipant?.photoURL} 
                 alt="Chat" 
                 className="w-11 h-11 rounded-2xl object-cover border border-white/5 ring-1 ring-white/10"
               />
             </div>
             {isOnline && (
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0B0E11]" />
             )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-black dark:text-white text-base font-[900] tracking-tight font-display">
                {activeChat?.isGroup ? activeChat.groupMetadata?.name : otherParticipant?.displayName}
              </h3>
              {activeChat?.isGroup && (
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">Group</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-black uppercase tracking-widest font-mono", isOnline || isTyping ? "text-emerald-400" : "text-white/20")}>
                {isTyping ? 'SIGNAL: TYPING' : (isOnline ? 'SIGNAL: ONLINE' : 'SIGNAL: OFFLINE')}
              </span>
              {!isOnline && otherParticipant?.lastSeen && (
                <span className="text-[10px] font-bold text-white/10 font-mono">
                  [{formatTime(otherParticipant?.lastSeen)}]
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl mr-4">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">Latency</span>
                <span className="text-[10px] font-mono text-emerald-500">24ms</span>
             </div>
             <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">Secure</span>
                <span className="text-[10px] font-mono text-white/60">E2EE</span>
             </div>
          </div>

          <button 
            onClick={handleSummarize}
            className="p-2.5 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"
            title="Summarize Protocol"
          >
            <Clock size={20} />
          </button>
          
          <div className="w-[1px] h-6 bg-black/5 dark:bg-white/5 mx-1" />

          <button onClick={() => otherParticipant && startCall(otherParticipant, 'voice')} className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"><Phone size={20} /></button>
          <button onClick={() => otherParticipant && startCall(otherParticipant, 'video')} className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"><Video size={20} /></button>
          
          <div className="w-[1px] h-6 bg-black/5 dark:bg-white/5 mx-1" />

          <button className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10">
        <div className="flex flex-col">
          {messages.map((msg, index) => (
            <MessageItem 
                key={msg.id} 
                message={msg} 
                isFirstInSequence={index === 0 || messages[index - 1].senderId !== msg.senderId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* AI Suggestions Area */}
      <AnimatePresence>
        {(smartReplies.length > 0 || autoReply || isAiLoading) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-4 bg-gray-50/95 dark:bg-[#151B21]/95 backdrop-blur-md z-20 border-t border-black/5 dark:border-white/5"
          >
            <div className="max-w-screen-xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 ring-1 ring-emerald-500/20">
                    <Wand2 size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">CORTEX RESPONSE</span>
                    <span className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest mt-0.5">Nova Intelligence Protocol</span>
                  </div>
                </div>
                {isAiLoading && (
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                     <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 animate-pulse uppercase tracking-widest">Analyzing Content</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {autoReply && (
                  <button 
                    onClick={() => {
                      setInputText(autoReply);
                      setAutoReply('');
                      setSmartReplies([]);
                    }}
                    className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 group"
                  >
                    <span className="opacity-40 group-hover:opacity-100 italic">Auto:</span>
                    {autoReply}
                  </button>
                )}
                {smartReplies.map((reply, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      sendMessage(reply, 'text', undefined, disappearingDuration);
                      setSmartReplies([]);
                      setAutoReply('');
                    }}
                    className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-6 py-4 bg-white dark:bg-[#0B0E11] z-30 relative border-t border-black/5 dark:border-white/5">
        <AnimatePresence>
            {showActions && <QuickActionPanel onSelect={(type) => alert(`Selected ${type}`)} onClose={() => setShowActions(false)} />}
        </AnimatePresence>

        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-2xl p-1">
                <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-black/40 dark:text-white/40 hover:text-emerald-500 transition-all relative group">
                    <Smile size={24} className="group-hover:scale-110 transition-transform" />
                    {showEmoji && (
                        <div className="absolute bottom-16 left-0 z-50">
                           <EmojiPicker 
                              onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} 
                              theme={settings.theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                              width={320}
                              height={400}
                           />
                        </div>
                    )}
                </button>
                <button onClick={() => setShowActions(!showActions)} className="p-2 text-black/40 dark:text-white/40 hover:text-emerald-500 transition-all group">
                    <Plus size={24} className={cn("group-hover:scale-110 transition-transform", showActions && "rotate-45")} />
                </button>
            </div>

            <form onSubmit={handleSend} className="flex-1 relative group">
                <input 
                    type="text" 
                    placeholder="Commence transmission..."
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        setTyping(e.target.value.length > 0);
                    }}
                    className="w-full bg-gray-50 dark:bg-[#151B21] border border-black/5 dark:border-white/5 rounded-2xl py-3.5 px-6 pr-14 text-sm focus:outline-none focus:border-emerald-500/50 text-black dark:text-white placeholder-black/20 dark:placeholder-white/20 transition-all shadow-inner"
                />
                <AnimatePresence>
                  {inputText.length > 5 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      type="button"
                      onClick={handlePolish}
                      disabled={isPolishing}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                        isPolishing ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : "text-black/20 dark:text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10"
                      )}
                      title="Polish with Nova"
                    >
                      <Sparkles size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>
            </form>

            <div className="flex items-center gap-1">
                {inputText.trim() ? (
                    <motion.button 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => handleSend()}
                        className="w-12 h-12 rounded-[1.2rem] bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        <Send size={20} />
                    </motion.button>
                ) : (
                    <button className="w-12 h-12 rounded-[1.2rem] bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white flex items-center justify-center transition-all group">
                        <Mic size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-[#202c33] p-6 rounded-3xl shadow-2xl border border-black/5 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-xl font-black text-black dark:text-white tracking-tight">Chat Summary</h3>
                </div>
                <button onClick={() => setShowSummary(false)} className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#2a3942] rounded-2xl p-4 max-h-[60vh] overflow-y-auto no-scrollbar border border-black/5 dark:border-transparent">
                <div className="text-sm text-black/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>

              <button 
                onClick={() => setShowSummary(false)}
                className="w-full mt-6 py-3 bg-emerald-600 dark:bg-green-500 text-white dark:text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 dark:hover:bg-green-400 transition-all active:scale-95 shadow-lg"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
