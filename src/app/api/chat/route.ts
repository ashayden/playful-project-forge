import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { AI_CONFIG } from '@/config/ai.config';

// Remove edge runtime declaration
// export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Log request details
    console.log('Processing chat request:', {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Parse request body
    const body = await request.json();
    const { messages, conversationId } = body;

    if (!messages?.length) {
      console.log('Invalid request: messages required');
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a new stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Error saving message' })}\n\n`));
            controller.close();
            return;
          }

          // Start OpenAI streaming
          const openaiStream = await openai.chat.completions.create({
            ...AI_CONFIG,
            messages,
            stream: true,
          });

          let fullResponse = '';

          // Process the stream
          for await (const chunk of openaiStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
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

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream Error:', error);
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`));
          controller.close();
        }
      },
    });

    // Return the stream response
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
} 