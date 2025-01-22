import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Request, Response } from 'express';

// Load environment variables
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface ChatRequestBody {
  messages: ChatCompletionMessageParam[];
  conversationId: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function handleChatRequest(req: Request, res: Response) {
  try {
    // Log request details
    console.log('Processing chat request:', {
      method: req.method,
      headers: req.headers,
    });

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // Check request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse request body
    const { messages, conversationId } = req.body as ChatRequestBody;

    if (!messages?.length || !conversationId) {
      console.log('Invalid request:', { hasMessages: !!messages?.length, hasConversationId: !!conversationId });
      res.status(400).json({ error: 'Messages and conversationId are required' });
      return;
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
      res.write(`data: ${JSON.stringify({ error: 'Error saving message' })}\n\n`);
      res.end();
      return;
    }

    // Start OpenAI streaming
    const openaiStream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    let fullResponse = '';

    // Process the stream
    for await (const chunk of openaiStream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save assistant response
    const { error: dbError } = await supabase
      .from('messages')
      .insert({
        content: fullResponse,
        role: 'assistant',
        conversation_id: conversationId,
      });

    if (dbError) {
      console.error('Error saving assistant message:', dbError);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 