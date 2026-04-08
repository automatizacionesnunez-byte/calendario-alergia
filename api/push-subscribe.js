import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  try {
    // Store the subscription in Vercel KV with metadata
    const key = `push_sub:${subscription.endpoint}`;
    await kv.set(key, {
      ...subscription,
      preferredHour: req.body.preferredHour || 21 // Default to 21
    });
    
    // Also add to a list of all subscriptions for easy iteration in push-send
    await kv.sadd('all_subscriptions', subscription.endpoint);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return res.status(500).json({ error: 'Error saving subscription' });
  }
}
