import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config synchronously as early as possible
const configPath = path.join(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const pid = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  if (pid) {
    console.log(`[FIREBASE] Setting GOOGLE_CLOUD_PROJECT and FIREBASE_CONFIG to ${pid} before loading Admin SDK`);
    process.env.GOOGLE_CLOUD_PROJECT = pid;
    process.env.GCLOUD_PROJECT = pid;
    process.env.FIREBASE_CONFIG = JSON.stringify({
      projectId: pid,
      databaseId: firebaseConfig.firestoreDatabaseId
    });
  }
}

// Declare global variables for Firebase Admin
let admin: any;
let getFirestore: any;
let adminDb: any;

async function startServer() {
  console.log('[SERVER] Starting initialization bootstrap...');
  
  // Dynamic import to ensure process.env was set in the outer scope
  const adminModule = await import('firebase-admin');
  admin = adminModule.default;
  const firestoreModule = await import('firebase-admin/firestore');
  getFirestore = firestoreModule.getFirestore;

  const adminProjectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId;

  // Initialize Admin SDK
  let firebaseApp: any;
  if (admin.apps.length === 0) {
    console.log(`[FIREBASE] Initializing default Admin app (Project: ${adminProjectId})`);
    firebaseApp = admin.initializeApp({
      projectId: adminProjectId,
    });
  } else {
    firebaseApp = admin.app();
    if (firebaseApp.options.projectId !== adminProjectId && adminProjectId) {
      console.log(`[FIREBASE] Project ID mismatch. Initializing applet-admin.`);
      const existing = admin.apps.find((a: any) => a.name === 'applet-admin');
      firebaseApp = existing || admin.initializeApp({ projectId: adminProjectId }, 'applet-admin');
    }
  }

  // Initialize Firestore Admin
  adminDb = databaseId 
    ? getFirestore(firebaseApp, databaseId)
    : getFirestore(firebaseApp);

  console.log(`[FIREBASE] Admin Firestore initialized (Project: ${firebaseApp.options.projectId}, DB: ${databaseId || '(default)'})`);

  // Connectivity Test
  try {
      console.log('[FIREBASE] Validating Admin connectivity...');
      await adminDb.collection('_health').doc('server').set({ 
          lastActive: new Date().toISOString(),
          status: 'online',
          engine: 'dynamic-bootstrap'
      });
      console.log('[FIREBASE] Admin connectivity: PASSED');
  } catch (e: any) {
      console.error(`[FIREBASE] Admin connectivity: FAILED (${e.code}: ${e.message})`);
  }

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

  // Scheduled Message Worker
  const startScheduledWorker = () => {
    console.log('--- INITIALIZING SCHEDULED MESSAGE PROTOCOL ---');
    setInterval(async () => {
        try {
            // Diagnostic check to see if we can even access the collection
            try {
                await adminDb.collection('scheduled_messages').limit(1).get();
            } catch (diagError: any) {
                console.error(`[WORKER] DIAGNOSTIC FAIL: Basic collection read failed with ${diagError.code}: ${diagError.message}`);
                throw diagError; // Re-throw to be caught by the outer loop
            }

            const now = new Date().toISOString();
            const snap = await adminDb.collection('scheduled_messages')
                .where('status', 'in', ['pending', 'failed'])
                .where('scheduledAt', '<=', now)
                .limit(10)
                .get();

            if (snap.empty) return;

            console.log(`[WORKER] Intercepted ${snap.size} pending transmissions...`);

            for (const d of snap.docs) {
                const msgData = d.data();
                try {
                    // Start a transaction or batch if needed, but simple updates are fine
                    // 1. Lock for processing
                    await d.ref.update({ status: 'processing' });

                    const timestamp = admin.firestore.Timestamp.now();

                    // 2. Transmit to actual chat
                    await adminDb.collection('chats').doc(msgData.chatId).collection('messages').add({
                        text: msgData.text,
                        senderId: msgData.senderId,
                        timestamp: timestamp,
                        type: msgData.type || 'text',
                        status: 'sent',
                        scheduled: true
                    });

                    // 3. Update Chat Last Signal
                    await adminDb.collection('chats').doc(msgData.chatId).update({
                        lastMessage: {
                            text: msgData.text,
                            senderId: msgData.senderId,
                            timestamp: timestamp
                        },
                        updatedAt: timestamp
                    });

                    // 4. Mark success
                    await d.ref.update({ 
                        status: 'sent',
                        sentAt: new Date().toISOString()
                    });
                    
                    console.log(`[WORKER] Transmission ${d.id} successful.`);
                } catch (err) {
                    console.error(`[WORKER] Transmission ${d.id} failed:`, err);
                    const retries = (msgData.retryCount || 0) + 1;
                    await d.ref.update({ 
                        status: retries >= 5 ? 'failed' : 'pending',
                        retryCount: retries
                    });
                }
            }
        } catch (e) {
            console.error('[WORKER] Error in scheduler loop:', e);
        }
    }, 45000); // 45 second pulse
  };

  startScheduledWorker();

  // API Routes
  app.post('/api/contact/add', async (req, res) => {
    const { userId, phone, email } = req.body;
    
    if (!userId || (!phone && !email)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const usersRef = adminDb.collection('users');
      let targetUserDoc: any = null;

      if (email) {
        const snap = await usersRef.where('email', '==', email.trim()).get();
        if (!snap.empty) targetUserDoc = snap.docs[0];
      }

      if (!targetUserDoc && phone) {
        const snap = await usersRef.where('phoneNumber', '==', phone.trim()).get();
        if (!snap.empty) targetUserDoc = snap.docs[0];
      }

      if (!targetUserDoc) {
        return res.status(404).json({ error: 'User not found' });
      }

      const targetUserData = targetUserDoc.data();
      
      if (targetUserData.uid === userId) {
        return res.status(400).json({ error: 'Cannot add yourself' });
      }

      // Add to user's contacts subcollection
      const contactData = {
        uid: targetUserData.uid,
        email: targetUserData.email,
        displayName: targetUserData.displayName,
        photoURL: targetUserData.photoURL,
        phoneNumber: targetUserData.phoneNumber || null,
        addedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await adminDb.collection('users').doc(userId).collection('contacts').add(contactData);

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
