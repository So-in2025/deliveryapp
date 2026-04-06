import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import webpush from 'web-push';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db, doc, updateDoc, getDoc } from './firebase.js';

dotenv.config();

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mercado Pago Configuration
  const mpClient = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || '' 
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
      const { items, orderId, customAccessToken } = req.body;
      
      // Use custom access token if provided (Decentralized Mode)
      // Otherwise use the platform's default token (Centralized Mode)
      const client = customAccessToken 
        ? new MercadoPagoConfig({ accessToken: customAccessToken })
        : mpClient;

      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: items.map((item: { name: string, price: number, quantity: number }) => ({
            title: item.name,
            unit_price: Number(item.price),
            quantity: Number(item.quantity),
            currency_id: 'ARS' // Change as needed
          })),
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
    try {
      const { userId, title, body, url } = req.body;
      
      // Fetch user's push subscription from Firestore
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userSnap.data();
      const subscription = userData.pushSubscription;
      
      if (!subscription) {
        return res.status(400).json({ error: 'User has no push subscription' });
      }
      
      const payload = JSON.stringify({ title, body, url });
      
      await webpush.sendNotification(subscription, payload);
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending push notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
