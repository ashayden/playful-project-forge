import type { NextApiRequest, NextApiResponse } from 'next'

// Enable bodyParser
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log request details
  console.log('Request:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Handle GET request
  if (req.method === 'GET') {
    res.status(200).json({ message: 'GET working!' });
    return;
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      // Log raw body
      const rawBody = req.body;
      console.log('Raw POST body:', rawBody);

      res.status(200).json({
        success: true,
        received: rawBody
      });
    } catch (error: any) {
      console.error('Error processing POST:', error);
      res.status(400).json({
        success: false,
        error: error?.message || 'Failed to process request'
      });
    }
    return;
  }

  // Handle unsupported methods
  res.status(405).json({ error: 'Method not allowed' });
} 