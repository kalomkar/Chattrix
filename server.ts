import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
let firebaseConfig: any = {};
const configPath = path.join(__dirname, 'firebase-applet-config.json');

if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DB_ID || firebaseConfig.firestoreDatabaseId
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // Socket.io logic
  const users = new Map<string, string>(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId: string) => {
      users.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} joined`);
      io.emit('user_online', userId);
    });

    socket.on('send_message', (data: any) => {
      const { recipientId, chatId, message } = data;
      if (recipientId) {
        socket.to(recipientId).emit('receive_message', { chatId, message });
      } else {
        socket.to(chatId).emit('receive_message', { chatId, message });
      }
    });

    socket.on('typing', (data: any) => {
      const { chatId, userId, recipientId, isTyping } = data;
      if (recipientId) {
          socket.to(recipientId).emit('user_typing', { chatId, userId, isTyping });
      } else {
          socket.to(chatId).emit('user_typing', { chatId, userId, isTyping });
      }
    });

    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
    });

    socket.on('leave_chat', (chatId: string) => {
      socket.leave(chatId);
    });

    // WebRTC Signaling
    socket.on('call-user', (data: { to: string, offer: any, from: string, name: string, callType: 'video' | 'voice' }) => {
      socket.to(data.to).emit('incoming-call', { from: data.from, offer: data.offer, name: data.name, callType: data.callType });
    });

    socket.on('answer-call', (data: { to: string, answer: any }) => {
      socket.to(data.to).emit('call-answered', { answer: data.answer });
    });

    socket.on('ice-candidate', (data: { to: string, candidate: any }) => {
      socket.to(data.to).emit('ice-candidate', { candidate: data.candidate });
    });

    socket.on('end-call', (data: { to: string }) => {
      socket.to(data.to).emit('call-ended');
    });

    socket.on('reject-call', (data: { to: string }) => {
      socket.to(data.to).emit('call-rejected');
    });

    socket.on('disconnect', () => {
      let disconnectedUserId: string | undefined;
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          users.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit('user_offline', disconnectedUserId);
      }
      console.log('User disconnected');
    });
  });

  // Backend Firebase Init
  const firebaseApp = initializeApp(config);
  const db = getFirestore(firebaseApp, config.firestoreDatabaseId);

  // API Routes
  app.post('/api/contact/add', async (req, res) => {
    const { userId, phone, email } = req.body;
    
    if (!userId || (!phone && !email)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const usersRef = collection(db, 'users');
      let targetUserDoc = null;

      if (email) {
        const q = query(usersRef, where('email', '==', email.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) targetUserDoc = snap.docs[0];
      }

      if (!targetUserDoc && phone) {
        const q = query(usersRef, where('phoneNumber', '==', phone.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) targetUserDoc = snap.docs[0];
      }

      if (!targetUserDoc) {
        return res.status(404).json({ error: 'User not found' });
      }

      const targetUserData = targetUserDoc.data();
      
      if (targetUserData.uid === userId) {
        return res.status(400).json({ error: 'Cannot add yourself' });
      }

      // Add to user's contacts subcollection (keeping with existing structure)
      const contactData = {
        uid: targetUserData.uid,
        email: targetUserData.email,
        displayName: targetUserData.displayName,
        photoURL: targetUserData.photoURL,
        phoneNumber: targetUserData.phoneNumber || null,
        addedAt: new Date()
      };

      await addDoc(collection(db, 'users', userId, 'contacts'), contactData);

      res.json({ 
        success: true, 
        message: 'Contact added successfully',
        contact: contactData 
      });
    } catch (error) {
      console.error('API Error adding contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
