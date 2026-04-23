import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Story } from '../../types';

interface StatusViewerProps {
  userId: string;
  stories: Story[];
  onClose: () => void;
}

export default function StatusViewer({ userId, stories, onClose }: StatusViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentStory) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
    >
      {/* Progress Bars */}
      <div className="absolute top-6 left-6 right-6 flex gap-2 z-50">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
               className="h-full bg-blue-500" 
               style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
           <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
              alt="User" 
              className="w-10 h-10 rounded-full border border-white/20"
           />
           <div>
              <p className="text-white text-sm font-bold">User {userId.slice(0, 6)}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-tighter">
                {new Date(currentStory.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
           </div>
        </div>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-all">
           <X size={24} />
        </button>
      </div>

      {/* Media Content */}
      <div className="w-full h-full max-w-lg relative flex items-center justify-center">
         {currentStory.type === 'image' && (
            <img 
               src={currentStory.mediaUrl} 
               alt="Status Content" 
               className="w-full h-auto max-h-screen object-contain shadow-2xl"
            />
         )}
         {currentStory.type === 'text' && (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-12 text-center">
               <h2 className="text-3xl font-black text-white leading-tight">{currentStory.caption}</h2>
            </div>
         )}
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-x-0 inset-y-1/2 flex justify-between z-40 px-4">
        <button onClick={handlePrev} className="p-4 text-white/20 hover:text-white transition-all">
           <ChevronLeft size={32} />
        </button>
        <button onClick={handleNext} className="p-4 text-white/20 hover:text-white transition-all">
           <ChevronRight size={32} />
        </button>
      </div>

      {/* Caption */}
      {currentStory.caption && currentStory.type !== 'text' && (
         <div className="absolute bottom-24 left-6 right-6 text-center z-50">
            <p className="text-white text-lg font-medium drop-shadow-lg">{currentStory.caption}</p>
         </div>
      )}

      {/* Reply Bar */}
      <div className="absolute bottom-10 left-6 right-6 z-50">
         <div className="glass rounded-2xl p-4 flex items-center gap-4 border-white/20">
            <input 
               type="text" 
               placeholder="Reply to status..." 
               className="flex-1 bg-white/5 border-none outline-none text-white text-sm"
            />
            <button className="text-blue-400 font-bold text-xs uppercase tracking-widest">Send</button>
         </div>
      </div>
    </motion.div>
  );
}
