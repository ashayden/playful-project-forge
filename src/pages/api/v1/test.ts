import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  message?: string
  error?: string
  data?: any
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Handle GET
  if (req.method === 'GET') {
    res.status(200).json({ message: 'API is working!' });
    return;
  }

  // Handle POST
  if (req.method === 'POST') {
    try {
      res.status(200).json({ 
        message: 'Data received',
        data: req.body 
      });
      return;
    } catch (error) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
  }

  // Handle other methods
  res.status(405).json({ error: 'Method not allowed' });
} 