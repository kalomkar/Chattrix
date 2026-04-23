import React, { useState } from 'react';
import { useStory } from '../../context/StoryContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StatusViewer from './StatusViewer';
import { cn } from '../../lib/utils';

export default function StatusCarousel() {
  const { stories, userStories } = useStory();
  const { currentUser } = useAuth();
  const [selectedUserStories, setSelectedUserStories] = useState<string | null>(null);

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.uid]) acc[story.uid] = [];
    acc[story.uid].push(story);
    return acc;
  }, {} as Record<string, typeof stories>);

  const userIds = Object.keys(storiesByUser).filter(uid => uid !== currentUser?.uid);

  return (
    <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/10 bg-white/5">
      {/* My Status */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div 
           className={cn(
             "w-16 h-16 rounded-[1.5rem] p-0.5 relative cursor-pointer group transition-all hover:scale-105",
             userStories.length > 0 
                ? "bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 p-[2px] shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                : "bg-white/10"
           )}
           onClick={() => userStories.length > 0 && setSelectedUserStories(currentUser!.uid)}
        >
          <div className="w-full h-full rounded-[1.4rem] bg-[#0f172a] p-0.5 overflow-hidden">
            <img 
               src={currentUser?.photoURL} 
               alt="My Status" 
               className="w-full h-full rounded-[1.3rem] object-cover"
            />
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-xl flex items-center justify-center text-white border-4 border-[#0f172a] shadow-lg group-hover:scale-110 transition-all z-10">
             <Plus size={14} />
          </button>
        </div>
        <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">You</p>
      </div>

      <div className="h-12 w-[1px] bg-white/5 mx-2 shrink-0" />

      {/* Others' Statuses */}
      <div className="flex items-center gap-5">
        {userIds.map(uid => (
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={uid} 
            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => setSelectedUserStories(uid)}
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 p-[2px] shadow-[0_0_15px_rgba(37,99,235,0.2)]">
               <div className="w-full h-full rounded-[1.4rem] bg-[#0f172a] p-0.5 overflow-hidden">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
                    alt="Status" 
                    className="w-full h-full rounded-[1.3rem] object-cover"
                  />
               </div>
            </div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter max-w-[64px] truncate">
               User {uid.slice(0, 4)}
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedUserStories && (
          <StatusViewer 
            userId={selectedUserStories} 
            stories={storiesByUserId(selectedUserStories, storiesByUser)} 
            onClose={() => setSelectedUserStories(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function storiesByUserId(uid: string, map: any) {
  return map[uid] || [];
}
