import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, conversationId } = req.body;

  if (!messages?.length || !conversationId) {
    return res.status(400).json({ error: 'Messages and conversationId are required' });
  }

  try {
    // Save user message to Supabase
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        content: messages[messages.length - 1].content,
        role: 'user',
        conversation_id: conversationId,
      });

    if (messageError) throw new Error('Error saving user message to database');

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Start OpenAI streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

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
    console.error('API Error:', (error as Error).message);

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
