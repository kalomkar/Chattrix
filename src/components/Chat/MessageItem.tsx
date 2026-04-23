import React from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn, formatTime } from '../../lib/utils';
import { Check, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface MessageItemProps {
  message: Message;
  isFirstInSequence: boolean;
}

export default function MessageItem({ message, isFirstInSequence }: MessageItemProps) {
  const { currentUser } = useAuth();
  const isMine = message.senderId === currentUser?.uid;

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
      className={cn(
        "flex w-full mb-1",
        isMine ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] sm:max-w-[70%] relative px-3 py-1.5 shadow-md flex flex-col",
        isMine 
          ? "bg-[#005c4b] text-[#e9edef] rounded-l-xl rounded-tr-xl rounded-br-none" 
          : "bg-[#202c33] text-[#e9edef] rounded-r-xl rounded-tl-xl rounded-bl-none",
        isFirstInSequence ? "mt-2" : "mt-0.5"
      )}>
        <div className="flex flex-col relative z-10 pr-12">
            <p className="text-[14.2px] leading-relaxed break-words">
              {message.text}
            </p>
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
