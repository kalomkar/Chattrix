import React, { useState } from 'react';
import { useStory } from '../../context/StoryContext';
import { X, Image as ImageIcon, Video, Type, Send, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface StatusUploadModalProps {
  onClose: () => void;
}

export default function StatusUploadModal({ onClose }: StatusUploadModalProps) {
  const { uploadStory } = useStory();
  const [type, setType] = useState<'image' | 'video' | 'text'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!mediaUrl && type !== 'text') return;
    if (type === 'text' && !caption) return;

    setIsUploading(true);
    try {
      await uploadStory(mediaUrl, type, caption);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0f172a] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black text-white tracking-tight uppercase">Update Status</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Type Selector */}
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
            <button 
              onClick={() => setType('image')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all",
                type === 'image' ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white/60"
              )}
            >
              <ImageIcon size={16} />
              Image
            </button>
            <button 
              onClick={() => setType('video')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all",
                type === 'video' ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white/60"
              )}
            >
              <Video size={16} />
              Video
            </button>
            <button 
              onClick={() => setType('text')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all",
                type === 'text' ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white/60"
              )}
            >
              <Type size={16} />
              Text
            </button>
          </div>

          <div className="space-y-4">
            {type !== 'text' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Media URL</label>
                <input 
                  type="text"
                  placeholder={type === 'image' ? "Paste image URL..." : "Paste video URL..."}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 font-medium transition-all"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
                <p className="text-[9px] text-white/20 ml-2 italic">Pro-tip: Use Pixabay, Pexels or Unsplash URLs</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">
                {type === 'text' ? 'Status Content' : 'Caption (Optional)'}
              </label>
              <textarea 
                placeholder={type === 'text' ? "What's on your mind?..." : "Write a caption..."}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 font-medium transition-all resize-none"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={isUploading || (type !== 'text' && !mediaUrl) || (type === 'text' && !caption)}
            onClick={handleUpload}
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} />
                Share Status
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
