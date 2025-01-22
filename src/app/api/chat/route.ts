import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { AI_CONFIG } from '@/config/ai.config';

export const runtime = 'edge';

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
  // Add CORS headers to all responses
  const headers = {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  try {
    // Parse request body
    const body = await request.json();
    const { messages, conversationId } = body;

    if (!messages?.length) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Set up streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start OpenAI streaming
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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // Save the conversation if we have a conversationId
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

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream response
    return new Response(stream, { headers });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
} 