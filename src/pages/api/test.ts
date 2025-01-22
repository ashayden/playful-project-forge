import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Handle GET request
  if (req.method === 'GET') {
    res.status(200).json({ message: 'Pages Router test endpoint working!' });
    return;
  }

  // Handle POST request
  if (req.method === 'POST') {
    res.status(200).json({ 
      message: 'Pages Router test endpoint working!',
      receivedData: req.body 
    });
    return;
  }

  // Handle unsupported methods
  res.status(405).json({ error: 'Method not allowed' });
} 