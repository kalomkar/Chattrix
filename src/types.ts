export interface User {
  uid: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  photoURL: string;
  status?: string;
  about?: string;
  lastSeen?: any;
  isOnline?: boolean;
  ghostMode?: {
    hideOnline: boolean;
    hideTyping: boolean;
    hideBlueTicks: boolean;
  };
  autoReply?: {
    enabled: boolean;
    message: string;
  };
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  senderId: string;
  timestamp: any;
  type: 'text' | 'image' | 'video' | 'audio' | 'voice';
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'seen';
  reactions?: Record<string, string>;
  replyTo?: string;
  disappearing?: {
    enabled: boolean;
    duration: number; // in seconds
    expiresAt?: any;
  };
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails?: Record<string, User>;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  isGroup: boolean;
  groupMetadata?: {
    name: string;
    photoURL?: string;
    admins: string[];
  };
  updatedAt: any;
  unreadCount?: number;
}

export interface Story {
  id: string;
  uid: string;
  mediaUrl: string;
  type: 'image' | 'video' | 'text';
  caption?: string;
  timestamp: any;
  expiresAt: any;
  views: string[]; // array of userIds
}

export interface CallState {
  isIncoming: boolean;
  isOutgoing: boolean;
  isActive: boolean;
  otherUser: User | null;
  offer: any;
  callType: 'video' | 'voice';
}
