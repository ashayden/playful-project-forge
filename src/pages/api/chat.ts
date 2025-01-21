import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

// Log environment variable status
console.log('Environment variables status:', {
  hasSupabaseUrl: !!SUPABASE_URL,
  hasSupabaseAnonKey: !!SUPABASE_ANON_KEY,
  hasOpenAIKey: !!OPENAI_API_KEY,
  hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the incoming request
  console.log('API Request:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'accept': req.headers['accept'],
    },
    body: req.body,
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Parse and validate request body
  let messages, conversationId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body.messages;
    conversationId = body.conversationId;
    
    console.log('Parsed request body:', { messages, conversationId });
  } catch (error) {
    console.error('Error parsing request body:', error);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!messages?.length || !conversationId) {
    console.log('Invalid request:', { hasMessages: !!messages?.length, hasConversationId: !!conversationId });
    return res.status(400).json({ error: 'Messages and conversationId are required' });
  }

  try {
    // Save user message to Supabase
    console.log('Saving user message:', {
      content: messages[messages.length - 1].content,
      conversationId,
    });

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        content: messages[messages.length - 1].content,
        role: 'user',
        conversation_id: conversationId,
      });

    if (messageError) {
      console.error('Database error saving user message:', messageError);
      throw new Error('Error saving user message to database');
    }

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('Starting OpenAI stream...');
    // Start OpenAI streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    let fullResponse = '';
    let chunkCount = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        chunkCount++;
        if (chunkCount % 10 === 0) {
          console.log(`Streamed ${chunkCount} chunks...`);
        }
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    console.log('Stream completed. Saving assistant response:', {
      responseLength: fullResponse.length,
      chunkCount,
    });

    // Save assistant response to Supabase
    const { error: dbError } = await supabase
      .from('messages')
      .insert({
        content: fullResponse,
        role: 'assistant',
        conversation_id: conversationId,
      });

    if (dbError) {
      console.error('Error saving assistant message to database:', dbError);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API Error:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: (error as Error).message || 'Internal server error',
      });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.end();
      } catch (e) {
        console.error('Error sending error message:', (e as Error).message);
      }
    }
  }
}
