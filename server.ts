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
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`[FIREBASE] Config loaded. Project: ${firebaseConfig.projectId}`);
  } catch (err) {
    console.error(`[FIREBASE] Error parsing config at ${configPath}:`, err);
  }
}

const pid = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const dbId = firebaseConfig.firestoreDatabaseId;

if (pid) {
  console.log(`[FIREBASE] Forcing environment variables for Project: ${pid}, DB: ${dbId || '(default)'}`);
  process.env.GOOGLE_CLOUD_PROJECT = pid;
  process.env.GCLOUD_PROJECT = pid;
  process.env.GOOGLE_CLOUD_QUOTA_PROJECT = pid;
  
  // Construct FIREBASE_CONFIG correctly
  const fbConfig: any = {
    projectId: pid,
    storageBucket: firebaseConfig.storageBucket,
  };
  if (dbId) fbConfig.databaseId = dbId;
  
  process.env.FIREBASE_CONFIG = JSON.stringify(fbConfig);
}

// Declare global variables for Firebase Admin
let admin: any;
let getFirestore: any;
let adminDb: any;

async function startServer() {
  console.log('[SERVER] Starting initialization bootstrap...');
  
  console.log('[DEBUG] Environment check:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`- GOOGLE_CLOUD_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT}`);
  console.log(`- GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT}`);
  console.log(`- FIREBASE_CONFIG exists: ${!!process.env.FIREBASE_CONFIG}`);
  if (process.env.FIREBASE_CONFIG) {
    console.log(`- FIREBASE_CONFIG: ${process.env.FIREBASE_CONFIG}`);
  }
  
  // Dynamic import to ensure process.env was set in the outer scope
  const adminModule = await import('firebase-admin');
  admin = adminModule.default;
  const firestoreModule = await import('firebase-admin/firestore');
  getFirestore = firestoreModule.getFirestore;

  // Initialize Admin SDK
  let firebaseApp: any;
  // Get credentials from environment or config
  const adminProjectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId;
  console.log(`[DEBUG] Initializing Firestore with Project: ${adminProjectId}, DB: ${databaseId}`);

  if (admin.apps.length === 0) {
    console.log(`[FIREBASE] Initializing Admin with explicit Application Default Credentials... Project=${adminProjectId}`);
    const options: any = {
      credential: admin.credential.applicationDefault(),
    };
    if (adminProjectId) options.projectId = adminProjectId;
    if (firebaseConfig.storageBucket) options.storageBucket = firebaseConfig.storageBucket;
    
    try {
      firebaseApp = admin.initializeApp(options);
    } catch (err) {
      console.error(`[FIREBASE] Fatal: Failed to initialize Admin SDK:`, err);
      firebaseApp = admin.initializeApp();
    }
  } else {
    firebaseApp = admin.app();
    console.log(`[FIREBASE] Reusing existing app: ${firebaseApp.options.projectId}`);
  }

  // Initialize Firestore Admin with Fallback Logic
  const initFirestoreInstance = async (dbId: string | undefined): Promise<any> => {
    console.log(`[FIREBASE] Attempting Firestore init for DB: ${dbId || '(default)'}`);
    const db = dbId && dbId !== '(default)' 
      ? getFirestore(firebaseApp, dbId) 
      : getFirestore(firebaseApp);
    
    try {
      // Diagnostic write test
      await db.collection('_health').doc('server').set({
        lastCheck: new Date().toISOString(),
        dbId: dbId || '(default)'
      });
      console.log(`[FIREBASE] Firestore connectivity PASSED for DB: ${dbId || '(default)'}`);
      return db;
    } catch (err: any) {
      if (err.code === 7 || err.message?.includes('PERMISSION_DENIED')) {
        console.warn(`[FIREBASE] PERMISSION_DENIED on database '${dbId || '(default)'}'.`);
        if (dbId && dbId !== '(default)') {
          console.log(`[FIREBASE] Retrying with (default) database...`);
          try {
            const fallbackDb = getFirestore(firebaseApp);
            await fallbackDb.collection('_health').doc('server').set({
              lastCheck: new Date().toISOString(),
              dbId: '(default)',
              note: 'fallback-from-named'
            });
            console.log(`[FIREBASE] FALLBACK SUCCESS: Using (default) database.`);
            return fallbackDb;
          } catch (fallbackErr: any) {
            console.error(`[FIREBASE] FALLBACK FAILED: (default) database also inaccessible:`, fallbackErr.message);
          }
        }
      }
      throw err;
    }
  };

  try {
    adminDb = await initFirestoreInstance(databaseId);
    console.log(`[FIREBASE] Admin Firestore initialized for DB: ${(adminDb as any)._settings?.databaseId}`);
  } catch (err: any) {
    console.error(`[FIREBASE] CRITICAL: All Firestore initialization attempts failed: ${err.message}`);
    adminDb = getFirestore(firebaseApp);
  }

  console.log(`[FIREBASE] Admin Firestore ready. Project: ${firebaseApp.options.projectId}, DB: ${(adminDb as any)._settings?.databaseId || '(default)'}`);


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
            const dbInfo = (adminDb as any)._settings || {};
            console.log(`[WORKER] Pulse check... Target: ${dbInfo.projectId}/${dbInfo.databaseId}`);
            // Actual task read
            const now = new Date().toISOString();
            let snap: any;
            try {
                snap = await adminDb.collection('scheduled_messages')
                    .where('status', 'in', ['pending', 'failed'])
                    .where('scheduledAt', '<=', now)
                    .limit(10)
                    .get();
            } catch (err: any) {
                if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
                    console.log('[WORKER] Scheduled messages collection not found, skipping.');
                    return;
                }
                throw err;
            }

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
  app.post('/api/ai', async (req, res) => {
    const { action, messages, text, isPersonalChat, targetLang } = req.body;
    
    console.log(`[AI API] Received request for action: ${action}`);

    // Lazy import of AI service on server
    const { GoogleGenAI } = await import('@google/genai');
    
    // Check for either Gemini or Grok key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GROK_API_KEY;
    if (!apiKey) {
      console.error('[AI API] CRITICAL ERROR: Neither GEMINI_API_KEY nor GROK_API_KEY found in environment variables!');
      return res.status(500).json({ error: 'Server configuration error: AI API Key missing' });
    }
    console.log(`[AI API] Using API Key: ${apiKey.substring(0, 4)}...`);
    
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      if (action === 'getAIAssistance') {
        const chatHistory = messages.map((m: any) => `${m.sender}: ${m.text}`).join('\n');
        console.log(`[AI API] Calling Gemini model...`);
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `You are Nova, an intelligent AI assistant... (rest of the prompt)\n\nHistory:\n${chatHistory}`
        });
        
        console.log(`[AI API] Success: model returned response.`);
        // ... (parse and return)
        res.json({ response: response.text });
      }
      // ... (other actions)
      res.json({ success: true });
    } catch (e: any) {
      console.error('[AI API] ERROR executing AI request:', e);
      res.status(500).json({ error: 'AI Error', details: e.message });
    }
  });

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
