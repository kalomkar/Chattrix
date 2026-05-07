import React from 'react';
import { Image, Camera, FileText, Music, MapPin, User, X, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickActionPanelProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

export default function QuickActionPanel({ onSelect, onClose }: QuickActionPanelProps) {
  const actions = [
    { id: 'gallery', label: 'Gallery', icon: Image, color: 'bg-purple-500' },
    { id: 'camera', label: 'Camera', icon: Camera, color: 'bg-pink-500' },
    { id: 'document', label: 'Document', icon: FileText, color: 'bg-blue-500' },
    { id: 'audio', label: 'Audio', icon: Music, color: 'bg-orange-500' },
    { id: 'schedule', label: 'Schedule', icon: Clock, color: 'bg-emerald-500' },
    { id: 'location', label: 'Location', icon: MapPin, color: 'bg-green-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="absolute bottom-24 left-8 bg-white dark:bg-[#1f2c33] p-4 rounded-3xl shadow-2xl border border-black/10 dark:border-white/5 grid grid-cols-3 gap-4 z-50 w-[300px]"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => {
            onSelect(action.id);
            onClose();
          }}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            <action.icon size={24} />
          </div>
          <span className="text-[10px] font-bold text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white">{action.label}</span>
        </button>
      ))}
      <button 
        onClick={onClose}
        className="absolute -top-3 -right-3 w-8 h-8 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full flex items-center justify-center text-black/40 dark:text-white/40 backdrop-blur-xl"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
