import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  message?: string
  error?: string
  data?: any
}

// Disable body parsing to handle raw request
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
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
    res.status(200).json({ message: 'Chat API test endpoint is working!' });
    return;
  }

  // Handle POST
  if (req.method === 'POST') {
    try {
      // Parse body manually
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const data = JSON.parse(body);

      res.status(200).json({ 
        message: 'Data received',
        data: data
      });
    } catch (error: any) {
      console.error('Error processing request:', error);
      res.status(400).json({ 
        error: 'Invalid request',
        message: error.message 
      });
    }
    return;
  }

  // Handle other methods
  res.status(405).json({ error: 'Method not allowed' });
} 