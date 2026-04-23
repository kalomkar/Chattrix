import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useSettings } from '../../context/SettingsContext';
import { Search, MoreVertical, Send, Paperclip, Smile, Mic, X, ChevronDown, Wand2, Phone, Video, Clock, Camera, Plus } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import MessageItem from './MessageItem';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSmartReplies, summarizeChat } from '../../services/geminiService';
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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUser?.uid && lastMsg.type === 'text') {
      const timer = setTimeout(async () => {
        const replies = await getSmartReplies(lastMsg.text);
        setSmartReplies(replies);
      }, 500);
      return () => clearTimeout(timer);
    } else {
        setSmartReplies([]);
    }
  }, [messages, currentUser?.uid]);

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

            <form onSubmit={handleSend} className="flex-1">
                <input 
                    type="text" 
                    placeholder="Type a message"
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        setTyping(e.target.value.length > 0);
                    }}
                    className="w-full bg-[#2a3942] rounded-[0.8rem] py-2.5 px-4 text-sm focus:outline-none text-white placeholder-white/20"
                />
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
    </div>
  );
}
