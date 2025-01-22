import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { AI_CONFIG } from '@/config/ai.config';

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable body parsing to handle streaming
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Parse the request body manually since we disabled bodyParser
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const body = JSON.parse(buffer.toString());

    const { messages, conversationId } = body;

    if (!messages?.length) {
      console.log('Invalid request: messages required');
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Start streaming
    const completion = await openai.chat.completions.create({
      ...AI_CONFIG,
      messages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        // Write chunk to response
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save conversation if we have an ID
    if (conversationId) {
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          content: messages[messages.length - 1].content,
          role: 'user',
        },
        {
          conversation_id: conversationId,
          content: fullResponse,
          role: 'assistant',
        },
      ]);
    }

    // End the stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API error:', error);
    // If headers haven't been sent, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      // If streaming has started, send error in stream format
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.end();
    }
  }
} 