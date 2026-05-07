import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { socket } from '../lib/socket';
import Peer from 'simple-peer';
import { CallState, User } from '../types';

interface CallContextType {
  callState: CallState;
  startCall: (targetUser: User, callType: 'video' | 'voice') => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    isIncoming: false,
    isOutgoing: false,
    isActive: false,
    otherUser: null,
    offer: null,
    callType: 'video'
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', (data: { from: string, offer: any, name: string, callType: 'video' | 'voice' }) => {
      // Mock user search or better yet, we'd need user details. 
      // For now, we'll assume we have a way to get details or pass them in signal.
      setCallState({
        isIncoming: true,
        isOutgoing: false,
        isActive: false,
        otherUser: { uid: data.from, displayName: data.name, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.from}` } as User,
        offer: data.offer,
        callType: data.callType
      });
      // Play ringing sound?
    });

    socket.on('call-answered', (data: { answer: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(data.answer);
      }
      setCallState(prev => ({ ...prev, isActive: true, isOutgoing: false }));
    });

    socket.on('ice-candidate', (data: { candidate: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(data.candidate);
      }
    });

    socket.on('call-ended', () => {
      cleanupCall();
    });

    socket.on('call-rejected', () => {
      cleanupCall();
      alert("Call rejected");
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('call-ended');
      socket.off('call-rejected');
    };
  }, [socket]);

  const startCall = async (targetUser: User, callType: 'video' | 'voice') => {
    try {
      // Check for devices before calling getUserMedia
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      const hasAudio = devices.some(device => device.kind === 'audioinput');

      if (!hasAudio) {
        alert("No microphone found. Please connect one and try again.");
        return;
      }

      if (callType === 'video' && !hasVideo) {
        if (confirm("No camera found. Would you like to start a voice call instead?")) {
          callType = 'voice';
        } else {
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      setLocalStream(stream);
      streamRef.current = stream;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      peer.on('signal', (data) => {
        socket.emit('call-user', {
          to: targetUser.uid,
          offer: data,
          from: currentUser?.uid,
          name: currentUser?.displayName,
          callType
        });
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peerRef.current = peer;
      setCallState({
        isIncoming: false,
        isOutgoing: true,
        isActive: false,
        otherUser: targetUser,
        offer: null,
        callType
      });
    } catch (err: any) {
      console.error("Failed to start call:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert("Required device could not be found. Please ensure your microphone/camera is connected.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone/Camera permission denied. Please allow access to use this feature.");
      } else {
        alert(`Failed to start call: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const answerCall = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      const hasAudio = devices.some(device => device.kind === 'audioinput');

      if (!hasAudio) {
        alert("No microphone found. Please connect one to answer.");
        rejectCall();
        return;
      }

      let actualCallType = callState.callType;
      if (actualCallType === 'video' && !hasVideo) {
        alert("No camera found. Answering as voice call.");
        actualCallType = 'voice';
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: actualCallType === 'video',
        audio: true
      });

      setLocalStream(stream);
      streamRef.current = stream;

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      });

      peer.on('signal', (data) => {
        socket.emit('answer-call', {
          to: callState.otherUser!.uid,
          answer: data
        });
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer.signal(callState.offer);
      peerRef.current = peer;
      setCallState(prev => ({ ...prev, isActive: true, isIncoming: false }));
    } catch (err: any) {
      console.error("Failed to answer call:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert("Required device could not be found. Please ensure your microphone/camera is connected.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone/Camera permission denied. Please allow access to use this feature.");
      } else {
        alert(`Failed to answer call: ${err.message || 'Unknown error'}`);
      }
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (callState.otherUser) {
      socket.emit('reject-call', { to: callState.otherUser.uid });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (callState.otherUser) {
      socket.emit('end-call', { to: callState.otherUser.uid });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    peerRef.current = null;
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({
      isIncoming: false,
      isOutgoing: false,
      isActive: false,
      otherUser: null,
      offer: null,
      callType: 'video'
    });
  };

  return (
    <CallContext.Provider value={{ callState, startCall, answerCall, rejectCall, endCall, localStream, remoteStream }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
