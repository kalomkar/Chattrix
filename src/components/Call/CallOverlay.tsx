import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function CallOverlay() {
  const { callState, answerCall, rejectCall, endCall, localStream, remoteStream } = useCall();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!callState.isIncoming && !callState.isOutgoing && !callState.isActive) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      >
        <div className="w-full max-w-4xl aspect-video glass rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/10 flex flex-col items-center justify-center">
          
          {/* Main Video (Remote) */}
          <div className="absolute inset-0 z-0 bg-slate-900 flex items-center justify-center">
             {callState.isActive && callState.callType === 'video' ? (
                <video 
                   ref={remoteVideoRef} 
                   autoPlay 
                   playsInline 
                   className="w-full h-full object-cover" 
                />
             ) : (
                <div className="flex flex-col items-center gap-6">
                    <img 
                        src={callState.otherUser?.photoURL} 
                        alt="Avatar" 
                        className="w-32 h-32 rounded-full border-4 border-blue-500/30 object-cover"
                    />
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">{callState.otherUser?.displayName}</h2>
                        <p className="text-blue-400 animate-pulse font-medium tracking-widest uppercase text-xs">
                           {callState.isIncoming ? "Incoming Call..." : callState.isOutgoing ? "Calling..." : "On Call"}
                        </p>
                    </div>
                </div>
             )}
          </div>

          {/* Local Video (Selfie) */}
          {callState.isActive && callState.callType === 'video' && (
             <motion.div 
                drag
                dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
                className="absolute top-8 right-8 w-48 aspect-video bg-black rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl z-10"
             >
                <video 
                   ref={localVideoRef} 
                   autoPlay 
                   muted 
                   playsInline 
                   className="w-full h-full object-cover mirror" 
                />
             </motion.div>
          )}

          {/* Controls */}
          <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center items-center gap-6">
            {callState.isIncoming ? (
              <>
                <button 
                   onClick={rejectCall}
                   className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all active:scale-90"
                >
                  <PhoneOff size={28} />
                </button>
                <button 
                   onClick={answerCall}
                   className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 transition-all active:scale-95 animate-bounce"
                >
                  <Phone size={28} />
                </button>
              </>
            ) : (
              <>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                  <Mic size={20} />
                </button>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                  <VideoOff size={20} />
                </button>
                <button 
                   onClick={endCall}
                   className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all active:scale-90"
                >
                  <PhoneOff size={28} />
                </button>
              </>
            )}
          </div>

          {/* Header Controls */}
          <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
             <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <Maximize size={18} />
             </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
