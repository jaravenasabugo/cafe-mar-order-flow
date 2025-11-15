/**
 * Vercel Serverless Function to proxy order submissions to the webhook.
 * This avoids browser CORS issues by performing the POST on the server.
 */

export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Intentar obtener la URL del webhook desde variables de entorno
  // Soporta tanto VITE_ORDER_WEBHOOK_URL como ORDER_WEBHOOK_URL
  const webhookUrl = process.env.ORDER_WEBHOOK_URL || process.env.VITE_ORDER_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Missing ORDER_WEBHOOK_URL env variable' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    // Mirror status and content back to client
    res.status(response.status);
    // Try to forward JSON when possible
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(text);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

