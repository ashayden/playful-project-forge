import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

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

export async function POST(request: Request) {
  try {
    // Log request details
    console.log('Processing chat request:', {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Check request method
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json() as ChatRequestBody;
    const { messages, conversationId } = body;

    if (!messages?.length || !conversationId) {
      console.log('Invalid request:', { hasMessages: !!messages?.length, hasConversationId: !!conversationId });
      return new Response(JSON.stringify({ error: 'Messages and conversationId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set up streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

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
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Error saving message' })}\n\n`));
      await writer.close();
      return new Response(stream.readable, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Start OpenAI streaming
    const openaiStream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    let fullResponse = '';

    // Process the stream
    (async () => {
      try {
        for await (const chunk of openaiStream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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

        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`));
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
} 