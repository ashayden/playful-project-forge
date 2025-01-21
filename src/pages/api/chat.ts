import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { AI_CONFIG } from '@/config/ai.config';
import type { NextApiRequest, NextApiResponse } from 'next';

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
  throw new Error('Missing required environment variables');
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

// Create OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, conversationId } = req.body;

    if (!messages?.length || !conversationId) {
      return res.status(400).json({ error: 'Messages and conversationId are required' });
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        content: messages[messages.length - 1].content,
        role: 'user',
        conversation_id: conversationId,
      });

    if (messageError) {
      console.error('Error saving user message:', messageError);
      return res.status(500).json({ error: 'Error saving message' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create stream
    const stream = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: AI_CONFIG.system_message,
        },
        ...messages,
      ],
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.max_tokens,
      top_p: AI_CONFIG.top_p,
      frequency_penalty: AI_CONFIG.frequency_penalty,
      presence_penalty: AI_CONFIG.presence_penalty,
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

    // Save the complete message
    const { error: dbError } = await supabase
      .from('messages')
      .insert({
        content: fullResponse,
        role: 'assistant',
        conversation_id: conversationId,
      });

    if (dbError) {
      console.error('Error saving message to database:', dbError);
    }

    // Send the [DONE] message
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
} 