import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { AI_CONFIG } from '@/config/ai.config';
import type { Request, Response } from 'express';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
  console.error('Missing required environment variables:', {
    hasSupabaseUrl: !!SUPABASE_URL,
    hasSupabaseKey: !!SUPABASE_ANON_KEY,
    hasOpenAIKey: !!OPENAI_API_KEY,
  });
  throw new Error('Missing required environment variables for chat API');
}

// Create Supabase client with service role for API routes
const supabase = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface ChatRequestBody {
  messages: ChatCompletionMessageParam[];
  conversationId: string;
}

export async function handleChatRequest(
  req: Request<{}, {}, ChatRequestBody>,
  res: Response
): Promise<void> {
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  try {
    const { messages, conversationId } = req.body;

    if (!messages?.length || !conversationId) {
      res.status(400).json({ error: 'Messages and conversationId are required' });
      return;
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
      res.status(500).json({ error: 'Error saving message' });
      return;
    }

    // Set up SSE headers
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
        } as ChatCompletionMessageParam,
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

    // Stream the response
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

    // Send the [DONE] message and end the response
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      // If headers were sent, attempt to write error to stream
      try {
        res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.end();
      } catch (e) {
        console.error('Error sending error message:', e);
      }
    }
  }
} 