import { kv } from '@vercel/kv';
import webpush from 'web-push';

// Configuration
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: 'mailto:admin@healthlog.app'
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

export default async function handler(req, res) {
  // Security: In production, verify this is called by Vercel Cron or a secret header
  // if (req.headers['x-vercel-cron'] !== 'true') {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    const endpoints = await kv.smembers('all_subscriptions');
    const currentHour = new Date().getUTCHours();
    const results = [];

    for (const endpoint of endpoints) {
      const subKey = `push_sub:${endpoint}`;
      const subscription = await kv.get(subKey);

      if (subscription && subscription.preferredHour === currentHour) {
        try {
          await webpush.sendNotification(subscription, JSON.stringify({
            title: 'Recordatorio Clínico',
            body: 'Es hora de registrar tus síntomas alérgicos. Tu salud es lo primero.',
          }));
          results.push({ endpoint, status: 'sent' });
        } catch (err) {
          console.error(`Error sending to ${endpoint}:`, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
             // Subscription expired or invalid - remove it
             await kv.srem('all_subscriptions', endpoint);
             await kv.del(subKey);
             results.push({ endpoint, status: 'removed' });
          } else {
             results.push({ endpoint, status: 'error', error: err.message });
          }
        }
      }
    }

    return res.status(200).json({ success: true, count: results.length, details: results });
  } catch (error) {
    console.error('Error in push-send:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
