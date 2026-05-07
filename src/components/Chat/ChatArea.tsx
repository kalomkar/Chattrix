import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useSettings } from '../../context/SettingsContext';
import { Search, MoreVertical, Send, Paperclip, Smile, Mic, X, ChevronDown, Wand2, Phone, Video, Clock, Camera, Plus, Sparkles, Trash2, RotateCcw, Copy, CheckCircle2, ArrowLeft, Reply, Calendar, Pin } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import MessageItem from './MessageItem';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIAssistance, summarizeChat, polishMessage } from '../../services/geminiService';
import QuickActionPanel from './QuickActionPanel';
import ScheduleMessageModal from './ScheduleMessageModal';
import { Message, ScheduledMessage } from '../../types';

import { jsPDF } from 'jspdf';

interface DateGroup {
  date: string;
  messages: Message[];
}

export default function ChatArea() {
  const { activeChat, messages, typingStatus, setTyping, onlineUsers, clearChat, regenerateResponse, setActiveChat, sendMessage, togglePin, scheduledMessages, cancelScheduledMessage, deleteScheduledMessage } = useChat();
  const { currentUser } = useAuth();
  const { startCall } = useCall();
  const { settings } = useSettings();
  
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [autoReply, setAutoReply] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pinnedMessages = useMemo(() => {
    return messages.filter(m => m.pinned);
  }, [messages]);

  const activeScheduledMessages = useMemo(() => {
    if (!activeChat) return [];
    return scheduledMessages.filter(m => m.chatId === activeChat.id && (m.status === 'pending' || m.status === 'failed'));
  }, [scheduledMessages, activeChat]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !currentUser) return;

    // Simulate upload for now but send as a specific type
    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await sendMessage(`Uploaded file: ${file.name}`, file.type.startsWith('image/') ? 'image' : 'text', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleExportTxt = () => {
    if (!messages.length || !activeChat) return;
    const content = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderId === currentUser?.uid ? 'Me' : 'Participant'}: ${m.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chat-Export-${activeChat.id}.txt`;
    a.click();
  };

  const handleExportPdf = () => {
    if (!messages.length || !activeChat) return;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text(`Transmission Log: ${activeChat.id}`, 10, y);
    y += 10;
    doc.setFontSize(10);
    
    messages.forEach(m => {
      if (y > 280) { doc.addPage(); y = 10; }
      const text = `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderId === currentUser?.uid ? 'ME' : 'PEER'}: ${m.text}`;
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 10, y);
      y += (splitText.length * 5) + 2;
    });
    
    doc.save(`Signal-log-${activeChat.id}.pdf`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = async () => {
    if (!activeChat) return;
    await clearChat(activeChat.id);
    setShowClearConfirm(false);
  };

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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    await sendMessage(inputText.trim(), 'text', undefined, 0, replyingTo?.id);
    setInputText('');
    setReplyingTo(null);
    setTyping(false);
    setSmartReplies([]);
    setShowEmoji(false);
    
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && settings.enterToSend) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && replyingTo) {
      setReplyingTo(null);
    }
  };

  // Date Grouping Logic
  const messageGroups = useMemo(() => {
    const filtered = messages.filter(m => 
      m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: DateGroup[] = [];
    filtered.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  }, [messages, searchQuery]);

  const getDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toLocaleDateString() === today.toLocaleDateString()) return 'Today';
    if (date.toLocaleDateString() === yesterday.toLocaleDateString()) return 'Yesterday';
    return dateStr;
  };

  const otherParticipantId = activeChat?.participants.find(p => p !== currentUser?.uid);
  const otherParticipant = otherParticipantId ? activeChat?.participantDetails?.[otherParticipantId] : null;
  const isOnline = otherParticipantId && onlineUsers.has(otherParticipantId);
  const isTyping = otherParticipantId && typingStatus[otherParticipantId];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0B0E11] relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat z-0" />
      
      {/* Header */}
      <div className="h-20 lg:h-24 px-4 lg:px-6 border-b border-black/5 dark:border-white/[0.05] flex items-center justify-between bg-white/80 dark:bg-[#0B0E11]/80 backdrop-blur-xl z-30 transition-all">
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          <button 
            onClick={() => setActiveChat(null)}
            className="lg:hidden p-2 text-black/40 dark:text-white/40 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
             <div className="p-1 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-transparent">
               <img 
                 src={activeChat?.isGroup ? activeChat.groupMetadata?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${activeChat.groupMetadata?.name}` : otherParticipant?.photoURL} 
                 alt="Chat" 
                 className="w-11 h-11 rounded-2xl object-cover border border-white/5 ring-1 ring-white/10"
               />
             </div>
             {isOnline && (
               <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0B0E11]" />
             )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-black dark:text-white text-base font-black tracking-tight font-display truncate max-w-[120px] sm:max-w-none">
              {activeChat?.isGroup ? activeChat.groupMetadata?.name : otherParticipant?.displayName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-black uppercase tracking-widest font-mono", isOnline || isTyping ? "text-emerald-500" : "text-black/20 dark:text-white/20")}>
                {isTyping ? 'SIGNAL: TYPING' : (isOnline ? 'SIGNAL: ONLINE' : 'SIGNAL: OFFLINE')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
            <AnimatePresence>
                {showSearch ? (
                   <motion.div 
                     initial={{ width: 0, opacity: 0 }}
                     animate={{ width: 240, opacity: 1 }}
                     exit={{ width: 0, opacity: 0 }}
                     className="relative hidden sm:block"
                   >
                     <input 
                       autoFocus
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       placeholder="Search inside stream..."
                       className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2 pl-4 pr-10 text-xs font-bold outline-none focus:border-emerald-500/30 transition-all"
                     />
                     <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
                       <X size={14} />
                     </button>
                   </motion.div>
                ) : (
                  <button onClick={() => setShowSearch(true)} className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 transition-all">
                    <Search size={20} />
                  </button>
                )}
            </AnimatePresence>

          <button onClick={() => otherParticipant && startCall(otherParticipant, 'voice')} className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"><Phone size={20} /></button>
          <button onClick={() => otherParticipant && startCall(otherParticipant, 'video')} className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"><Video size={20} /></button>
          
          <div className="relative group/menu">
            <button className="p-2.5 text-black/40 dark:text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all">
              <MoreVertical size={20} />
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1f2937] rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 py-2 hidden group-hover/menu:block z-[100] backdrop-blur-xl">
              <button 
                onClick={handleExportTxt}
                className="w-full px-4 py-2 text-left text-[11px] font-black uppercase tracking-widest text-black/60 dark:text-white/60 hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center gap-3 transition-colors"
                title="Export as Text"
              >
                  <Copy size={16} />
                  Export .Txt
              </button>
              <button 
                onClick={handleExportPdf}
                className="w-full px-4 py-2 text-left text-[11px] font-black uppercase tracking-widest text-black/60 dark:text-white/60 hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center gap-3 transition-colors"
                title="Export as PDF"
              >
                  <Sparkles size={16} />
                  Export .Pdf
              </button>
              <div className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
              >
                <Trash2 size={16} />
                Clear Stream
              </button>
              {activeChat?.participants.includes('nova-ai-bot') && (
                <button 
                  onClick={() => regenerateResponse()}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-3 transition-colors transition-all"
                >
                  <RotateCcw size={16} />
                  Regenerate Nova
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Messages Bar */}
      <AnimatePresence>
        {pinnedMessages.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-2 bg-emerald-500/5 border-b border-emerald-500/10 flex items-center gap-3 overflow-x-auto no-scrollbar"
          >
             <div className="flex items-center gap-1 shrink-0">
                <Pin size={10} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Pinned</span>
             </div>
             <div className="flex items-center gap-4 flex-nowrap">
                {pinnedMessages.map((msg) => (
                   <div key={msg.id} className="flex items-center gap-2 max-w-[200px] bg-white dark:bg-[#111827] px-2 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                      <p className="text-[10px] text-black/60 dark:text-white/60 line-clamp-1 italic">{msg.text}</p>
                   </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Messages Queue */}
      <AnimatePresence>
        {activeScheduledMessages.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 space-y-2 overflow-hidden"
          >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Clock size={12} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/40">Transmission Queue</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">{activeScheduledMessages.length} Pending</span>
             </div>
             <div className="flex flex-col gap-2">
                {activeScheduledMessages.map((msg) => (
                   <div key={msg.id} className="flex items-center justify-between bg-white dark:bg-[#111827] px-4 py-2.5 rounded-2xl border border-black/5 dark:border-white/5 group">
                      <div className="flex-1 min-w-0 mr-4">
                         <p className="text-[11px] text-black/60 dark:text-white/60 truncate font-medium">{msg.text}</p>
                         <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-tight mt-0.5">
                            Scheduled: {new Date(msg.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            {msg.status === 'failed' && <span className="text-red-500 ml-2">⚠️ PROTOCOL FAIL</span>}
                         </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => cancelScheduledMessage(msg.id)}
                            className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                            title="Cancel Signal"
                         >
                            <X size={14} />
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 no-scrollbar relative z-10 scroll-smooth">
        <div className="flex flex-col min-h-full">
          {messageGroups.length > 0 ? (
            <>
              {messageGroups.map((group) => (
                 <div key={group.date} className="space-y-4 mb-8">
                    <div className="flex items-center justify-center">
                        <div className="px-4 py-1.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5 flex items-center gap-2">
                            <Calendar size={12} className="text-black/30 dark:text-white/30" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
                                {getDateHeader(group.date)}
                            </span>
                        </div>
                    </div>
                    {group.messages.map((msg, index) => (
                        <MessageItem 
                            key={msg.id} 
                            message={msg} 
                            isFirstInSequence={index === 0 || group.messages[index - 1].senderId !== msg.senderId}
                            onReply={(m) => {
                                setReplyingTo(m);
                                inputRef.current?.focus();
                            }}
                            onPin={(m) => {
                                if (!activeChat) return;
                                togglePin(activeChat.id, m.id, !m.pinned);
                            }}
                        />
                    ))}
                 </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 select-none pb-20">
               <Sparkles size={64} className="mb-6 text-emerald-500" />
               <h4 className="text-xl font-black uppercase tracking-[0.3em] text-black dark:text-white">Relay Ready</h4>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[200px]">Signal stream established. Commence transmission.</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Area / Action Terminal */}
      <div className="bg-white dark:bg-[#0B0E11] z-30 relative border-t border-black/5 dark:border-white/5">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Reply Preview */}
        <AnimatePresence>
            {replyingTo && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 py-3 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">Replying to Signal</span>
                            <p className="text-xs text-black/60 dark:text-white/60 line-clamp-1 italic">{replyingTo.text}</p>
                        </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-emerald-500/10 rounded-full text-emerald-500 transition-all">
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="px-4 lg:px-8 py-4 max-w-screen-xl mx-auto space-y-4">
            <AnimatePresence>
              {showActions && (
                <QuickActionPanel 
                  onSelect={(type) => {
                    if (type === 'gallery' || type === 'document') {
                      fileInputRef.current?.click();
                    } else if (type === 'schedule') {
                       setShowScheduleModal(true);
                    } else {
                      alert(`Protocol: ${type} logic pending decryption.`);
                    }
                  }} 
                  onClose={() => setShowActions(false)} 
                />
              )}
            </AnimatePresence>

            {showScheduleModal && (
              <ScheduleMessageModal 
                onClose={() => setShowScheduleModal(false)}
                initialText={inputText}
              />
            )}
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-2xl p-1">
                    <button onClick={() => setShowEmoji(!showEmoji)} className={cn("p-2 text-black/40 dark:text-white/40 hover:text-emerald-500 transition-all relative group", showEmoji && "text-emerald-500")}>
                        <Smile size={24} />
                        {showEmoji && (
                            <div className="absolute bottom-16 left-0 z-50">
                               <EmojiPicker 
                                  onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} 
                                  theme={settings.theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                               />
                            </div>
                        )}
                    </button>
                    <button onClick={() => setShowActions(!showActions)} className={cn("p-2 text-black/40 dark:text-white/40 hover:text-emerald-500 transition-all group", showActions && "text-emerald-500 rotate-45")}>
                        <Plus size={24} />
                    </button>
                </div>

                <div className="flex-1 relative">
                    <textarea 
                        ref={inputRef as any}
                        rows={1}
                        placeholder="Commence transmission..."
                        value={inputText}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            setTyping(e.target.value.length > 0);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                        className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl py-3.5 px-6 text-sm focus:outline-none focus:border-emerald-500/50 text-black dark:text-white transition-all scrollbar-none resize-none min-h-[48px]"
                    />
                    <AnimatePresence>
                        {inputText.length > 5 && (
                             <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={handlePolish}
                                disabled={isPolishing}
                                className={cn(
                                    "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                                    isPolishing ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : "text-black/20 dark:text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10"
                                )}
                             >
                                <Sparkles size={18} />
                             </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex shrink-0">
                    {inputText.trim() ? (
                        <button 
                            onClick={() => handleSend()}
                            className="w-12 h-12 rounded-[1.2rem] bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                        >
                            <Send size={20} />
                        </button>
                    ) : (
                        <button className="w-12 h-12 rounded-[1.2rem] bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 hover:text-emerald-500 transition-all flex items-center justify-center group active:scale-95">
                            <Mic size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-white dark:bg-[#1f2937] p-8 rounded-[2.5rem] shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-wider mb-2">Wipe Stream?</h3>
              <p className="text-sm text-black/40 dark:text-white/40 mb-8 font-medium">This will permanently terminate all transmission data in this relay.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleClearChat}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-500 transition-all active:scale-95"
                >
                  Confirm Termination
                </button>
                <button onClick={() => setShowClearConfirm(false)} className="w-full py-4 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 font-black uppercase tracking-widest rounded-2xl">Abort</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
