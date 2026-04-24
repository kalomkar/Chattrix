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
    <div className="flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
      {/* WhatsApp style pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />

      {/* Header */}
      <div className="h-16 px-4 border-b border-white/[0.05] flex items-center justify-between bg-[#202c33]/90 backdrop-blur-3xl z-30">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
             <img 
               src={activeChat?.isGroup ? activeChat.groupMetadata?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${activeChat.groupMetadata?.name}` : otherParticipant?.photoURL} 
               alt="Chat" 
               className="w-10 h-10 rounded-full object-cover border border-white/5"
             />
             {isOnline && (
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33]" />
             )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-white text-sm font-bold tracking-tight">
              {activeChat?.isGroup ? activeChat.groupMetadata?.name : otherParticipant?.displayName}
            </h3>
            <span className={cn("text-[10px] font-medium", isOnline || isTyping ? "text-green-500" : "text-white/40")}>
              {isTyping ? 'typing...' : (isOnline ? 'online' : (otherParticipant?.lastSeen ? `last seen ${formatTime(otherParticipant?.lastSeen)}` : 'offline'))}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchAiAssistance} 
            disabled={isAiLoading}
            className={cn(
              "flex items-center gap-2 py-1.5 px-3 transition-all rounded-xl",
              isAiLoading ? "bg-green-500/20 text-green-500 animate-pulse" : "bg-black/5 dark:bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
            )}
            title="Nova AI Assistant"
          >
            <Wand2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Ask Nova</span>
          </button>
          <button onClick={() => otherParticipant && startCall(otherParticipant, 'voice')} className="p-2 text-white/40 hover:text-white transition-all"><Phone size={20} /></button>
          <button onClick={() => otherParticipant && startCall(otherParticipant, 'video')} className="p-2 text-white/40 hover:text-white transition-all"><Video size={20} /></button>
          <div className="w-[1px] h-6 bg-white/5 mx-2" />
          <button className="p-2 text-white/40 hover:text-white transition-all"><Search size={20} /></button>
          <button className="p-2 text-white/40 hover:text-white transition-all"><MoreVertical size={20} /></button>
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
            className="px-4 py-2 bg-[#0b141a]/80 backdrop-blur-sm z-20"
          >
            <div className="max-w-screen-xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-500/10 rounded-md text-green-500">
                    < Wand2 size={12} />
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Nova Intelligence</span>
                  {isAiLoading && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-3 h-3 border-2 border-green-500/20 border-t-green-500 rounded-full"
                    />
                  )}
                </div>
                <button 
                  onClick={handleSummarize}
                  className="text-[10px] items-center gap-1 flex font-bold text-green-500/60 hover:text-green-500 uppercase tracking-widest transition-colors"
                >
                  <Clock size={10} />
                  Summarize Chat
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {autoReply && (
                  <button 
                    onClick={() => {
                      setInputText(autoReply);
                      setAutoReply('');
                      setSmartReplies([]);
                    }}
                    className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all flex items-center gap-1.5 group"
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
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-all"
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
      <div className="px-4 py-3 bg-[#202c33] z-30 relative">
        <AnimatePresence>
            {showActions && <QuickActionPanel onSelect={(type) => alert(`Selected ${type}`)} onClose={() => setShowActions(false)} />}
        </AnimatePresence>

        <div className="max-w-screen-xl mx-auto flex items-center gap-2">
            <div className="flex items-center gap-1">
                <button onClick={() => setShowEmoji(!showEmoji)} className="p-2.5 text-white/40 hover:text-white transition-all relative">
                    <Smile size={24} />
                    {showEmoji && (
                        <div className="absolute bottom-16 left-0 z-50">
                           <EmojiPicker 
                              onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} 
                              theme={EmojiTheme.DARK}
                              width={320}
                              height={400}
                           />
                        </div>
                    )}
                </button>
                <button onClick={() => setShowActions(!showActions)} className="p-2.5 text-white/40 hover:text-white transition-all">
                    <Paperclip size={24} />
                </button>
            </div>

            <form onSubmit={handleSend} className="flex-1 relative">
                <input 
                    type="text" 
                    placeholder="Type a message"
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        setTyping(e.target.value.length > 0);
                    }}
                    className="w-full bg-[#2a3942] rounded-[0.8rem] py-2.5 px-4 pr-12 text-sm focus:outline-none text-white placeholder-white/20"
                />
                <AnimatePresence>
                  {inputText.length > 5 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      type="button"
                      onClick={handlePolish}
                      disabled={isPolishing}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
                        isPolishing ? "text-green-500 animate-pulse" : "text-white/20 hover:text-green-500 hover:bg-white/5"
                      )}
                      title="Polish with Nova"
                    >
                      <Sparkles size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
            </form>

            <div className="flex items-center gap-1">
                {inputText.trim() ? (
                    <button 
                        onClick={() => handleSend()}
                        className="w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center hover:bg-green-400 transition-all active:scale-95 shadow-lg"
                    >
                        <Send size={20} />
                    </button>
                ) : (
                    <button className="w-12 h-12 rounded-full text-white/40 hover:text-white flex items-center justify-center transition-all">
                        <Mic size={24} />
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
              className="w-full max-w-md bg-[#202c33] p-6 rounded-3xl shadow-2xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">Chat Summary</h3>
                </div>
                <button onClick={() => setShowSummary(false)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-[#2a3942] rounded-2xl p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>

              <button 
                onClick={() => setShowSummary(false)}
                className="w-full mt-6 py-3 bg-green-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/20"
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
