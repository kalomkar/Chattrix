import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Camera, Save, User as UserIcon, Info, Mail, Phone, Ghost } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [about, setAbout] = useState(currentUser?.about || 'Hey there! I am using Chattrix.');
  const [status, setStatus] = useState(currentUser?.status || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        about,
        status
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
           <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <UserIcon className="text-blue-400" />
              Edit Profile
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X size={20} className="text-white/50" />
           </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
           {/* Avatar Section */}
           <div className="flex flex-col items-center">
              <div className="relative group">
                 <img 
                    src={currentUser?.photoURL} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-[2.5rem] border-4 border-blue-500/20 object-cover shadow-2xl"
                 />
                 <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-[#0f172a] hover:scale-110 transition-all cursor-pointer">
                    <Camera size={18} />
                 </button>
                 <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-xs text-white font-bold uppercase tracking-wider">Change Photo</p>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">Display Name</label>
                 <div className="relative">
                    <UserIcon size={14} className="absolute left-4 top-4 text-blue-400" />
                    <input 
                       type="text" 
                       value={displayName}
                       onChange={(e) => setDisplayName(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-white text-sm focus:border-blue-500/50 outline-none transition-all"
                       placeholder="Your Name"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">About / Bio</label>
                 <div className="relative">
                    <Info size={14} className="absolute left-4 top-4 text-blue-400" />
                    <textarea 
                       value={about}
                       onChange={(e) => setAbout(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-white text-sm focus:border-blue-500/50 outline-none transition-all min-h-[100px] resize-none"
                       placeholder="Say something about yourself..."
                    />
                 </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex flex-col gap-3">
                 <div className="flex items-center gap-3 text-xs text-white/70">
                    <Mail size={14} className="text-blue-400" />
                    <span className="truncate">{currentUser?.email}</span>
                 </div>
                 {currentUser?.phoneNumber && (
                   <div className="flex items-center gap-3 text-xs text-white/70">
                      <Phone size={14} className="text-blue-400" />
                      <span>{currentUser?.phoneNumber}</span>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 flex justify-end gap-3">
           <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white/50 hover:text-white transition-all"
           >
              Cancel
           </button>
           <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-2.5 rounded-2xl transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 active:scale-95 disabled:opacity-50"
           >
              {saving ? 'Saving...' : (
                <>
                  <Save size={18} />
                  <span>Update Profile</span>
                </>
              )}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
