import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import webpush from 'web-push';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db, doc, updateDoc, getDoc, collection, getDocs } from './firebase.js';
import { createClient } from 'redis';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Web Push Configuration
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:ofeliaacevedo41@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

import { GoogleGenAI, Type } from '@google/genai';

// AI Instance (Lazy)
let aiInstance: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY missing');
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  // --- PHASE 2: WEBSOCKETS (SOCKET.IO) SETUP ---
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, restrict this to your domain
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Driver joins their own room to broadcast location
    socket.on('driver_online', (driverId) => {
      socket.join(`driver_${driverId}`);
      console.log(`Driver ${driverId} is online and broadcasting.`);
    });

    // Client joins a room to track a specific driver
    socket.on('join_tracking', (driverId) => {
      socket.join(`tracking_${driverId}`);
      console.log(`Client ${socket.id} is tracking driver ${driverId}`);
    });

    // Driver emits location update
    socket.on('update_location', (data) => {
      const { driverId, lat, lng } = data;
      // Broadcast to anyone tracking this driver
      io.to(`tracking_${driverId}`).emit('driver_location', { driverId, lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  app.use(cors());
  app.use(express.json());

  // --- PHASE 1: REDIS CACHE SETUP ---
  let redisClient: ReturnType<typeof createClient> | null = null;
  const memoryCache = new Map<string, any>(); // Fallback if Redis is not available

  if (process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    // Don't await strictly so server can boot even if Redis is slow
    redisClient.connect()
      .then(() => console.log('✅ Redis connected successfully'))
      .catch(err => {
        console.error('⚠️ Redis connection failed, using memory fallback:', err);
        redisClient = null;
      });
  } else {
    console.warn('⚠️ No REDIS_URL provided. Using in-memory fallback for caching.');
  }

  // Helper to get from cache
  const getCachedData = async (key: string) => {
    if (redisClient) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
    return memoryCache.get(key) || null;
  };

  // Helper to set cache (expires in 5 minutes)
  const setCachedData = async (key: string, data: any, ttlSeconds = 300) => {
    if (redisClient) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    } else {
      memoryCache.set(key, data);
      setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', cache: redisClient ? 'redis' : 'memory' });
  });

  // --- PHASE 1: CACHED STORES ENDPOINT ---
  app.get('/api/stores', async (req, res) => {
    const cacheKey = 'stores_catalog';
    
    try {
      // 1. Check Cache
      const cachedStores = await getCachedData(cacheKey);
      if (cachedStores) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedStores);
      }

      // 2. Cache Miss: Fetch from Firestore
      const storesSnapshot = await getDocs(collection(db, 'stores'));
      const storesData = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Save to Cache (TTL: 5 minutes)
      await setCachedData(cacheKey, storesData, 300);

      res.setHeader('X-Cache', 'MISS');
      res.json(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({ error: 'Failed to fetch stores' });
    }
  });

  // Mercado Pago Webhook
  app.post('/api/mp-webhook', async (req, res) => {
    try {
      const { action, data, type } = req.body;
      console.log('MP Webhook received:', { action, data, type });

      // We only care about payment notifications
      if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
        const paymentId = data?.id || req.query.id;
        if (!paymentId) return res.sendStatus(400);

        // We need an access token to check the payment status
        // Webhooks usually use the default platform token
        let accessToken = process.env.MP_ACCESS_TOKEN;
        try {
          const secretsDoc = await getDoc(doc(db, 'config', 'global', 'private', 'mercadoPago'));
          if (secretsDoc.exists()) {
            accessToken = secretsDoc.data()?.mpAccessToken;
          }
        } catch (e) {
          console.error('Error fetching MP token for webhook:', e);
        }

        if (!accessToken) {
          console.error('No MP Access Token for webhook verification');
          return res.sendStatus(500);
        }

        const mpClient = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(mpClient);
        const paymentData = await payment.get({ id: String(paymentId) });
        
        const orderId = paymentData.external_reference;
        const status = paymentData.status;

        console.log(`Order ${orderId} payment status: ${status}`);

        if (orderId) {
          const orderRef = doc(db, 'orders', orderId);
          let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
          
          if (status === 'approved') paymentStatus = 'PAID';
          else if (['rejected', 'cancelled', 'refunded'].includes(status || '')) paymentStatus = 'FAILED';

          await updateDoc(orderRef, { 
            paymentStatus,
            mpPaymentId: paymentId,
            mpStatus: status
          });
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error in MP Webhook:', error);
      res.sendStatus(500);
    }
  });

  // Create Mercado Pago Preference
  app.post('/api/create-preference', async (req, res) => {
    try {
      const { items, orderId, storeId, platformFee } = req.body;
      
      let accessToken = null;
      let isDecentralized = false;
      
      // Fetch global config to check payment mode
      try {
        const configDoc = await getDoc(doc(db, 'config', 'global'));
        if (configDoc.exists()) {
          isDecentralized = configDoc.data().paymentMode === 'DECENTRALIZED';
        }
      } catch (err) {
        console.error('Error fetching global config for MP mode:', err);
      }

      if (isDecentralized && storeId) {
        // Fetch store's private token
        try {
          const storeSecretsDoc = await getDoc(doc(db, 'stores', storeId, 'private', 'payment'));
          if (storeSecretsDoc.exists()) {
            accessToken = storeSecretsDoc.data().mpAccessToken;
          }
        } catch (err) {
          console.error(`Error fetching token for store ${storeId}:`, err);
        }
      }

      // If no store token or not decentralized, use global token
      if (!accessToken) {
        try {
          const secretsDoc = await getDoc(doc(db, 'config', 'global', 'private', 'mercadoPago'));
          if (secretsDoc.exists()) {
            accessToken = secretsDoc.data()?.mpAccessToken;
          }
        } catch (err) {
          console.error('Error fetching global config for MP:', err);
        }
      }

      // Fallback to env if still not found
      if (!accessToken) accessToken = process.env.MP_ACCESS_TOKEN;

      if (!accessToken) {
        return res.status(400).json({ error: 'Mercado Pago Access Token not configured' });
      }
      
      const client = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(client);
      
      const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
      
      // Platform Fee logic: only if decentralized and platformFee provided
      // (Normally you'd calculate this on the server for security too, fetching store commissionPct)
      const calculatedFee = platformFee ? Number(platformFee) : 0;

      const result = await preference.create({
        body: {
          items: items.map((item: { name: string, price: number, quantity: number }) => ({
            title: item.name,
            unit_price: Number(item.price),
            quantity: Number(item.quantity),
            currency_id: 'ARS' // Change as needed
          })),
          ...(accessToken && calculatedFee > 0 ? { marketplace_fee: calculatedFee } : {}),
          back_urls: {
            success: `${req.protocol}://${req.get('host')}/order-success?id=${orderId}`,
            failure: `${req.protocol}://${req.get('host')}/order-failure?id=${orderId}`,
            pending: `${req.protocol}://${req.get('host')}/order-pending?id=${orderId}`,
          },
          auto_return: 'approved',
          external_reference: orderId,
          notification_url: `${process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`}/api/mp-webhook`
        }
      });

      res.json({ id: result.id, init_point: result.init_point });
    } catch (error) {
      console.error('Error creating MP preference:', error);
      res.status(500).json({ error: 'Failed to create payment preference' });
    }
  });

  // Push Notification Endpoint
  app.post('/api/send-notification', async (req, res) => {
    // In this preview environment without the Firebase Admin SDK,
    // server-side reads to the users collection will fail with permission limits.
    // Push notifications are handled via real-time foreground updates and service workers.
    return res.json({ success: true, warning: 'Push notifications disabled in preview environment without Admin SDK' });
  });

  // --- PHASE 3: AI ENDPOINTS ---
  app.post('/api/ai/extract-products', async (req, res) => {
    try {
      const { base64Image } = req.body;
      if (!base64Image) return res.status(400).json({ error: 'No image provided' });

      const ai = getAi();
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{
          parts: [
            { text: `Analiza esta imagen o documento de un menú. Extrae TODOS los productos. Devuelve un ARREGLO JSON con objetos: name, description, price (número), category.` },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING }
              },
              required: ["name", "price"]
            }
          }
        }
      });

      res.json(JSON.parse(result.text || '[]'));
    } catch (error) {
      console.error('AI Extraction Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'AI processing failed' });
      }
    }
  });

  app.post('/api/ai/generate-banner', async (req, res) => {
    try {
      const { prompt: userPrompt } = req.body;
      const ai = getAi();
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{
          parts: [{ text: `Genera una promo para delivery: "${userPrompt}". JSON: title, subtitle, badge, unsplashTerm.` }]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              badge: { type: Type.STRING },
              unsplashTerm: { type: Type.STRING }
            }
          }
        }
      });
      res.json(JSON.parse(result.text || '{}'));
    } catch (error) {
      console.error('AI Generation Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'AI generation failed' });
      }
    }
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

startServer();
