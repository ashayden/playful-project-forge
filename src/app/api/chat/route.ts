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

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create stream from OpenAI
    const completion = await openai.chat.completions.create({
      ...AI_CONFIG,
      messages,
      stream: true,
    });

    // Create a TransformStream to handle the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the stream
    (async () => {
      try {
        let fullResponse = '';
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            // Write chunk to stream
            const data = encoder.encode(`data: ${JSON.stringify({ content })}\n\n`);
            await writer.write(data);
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

        // Write end marker and close
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error) {
        console.error('Stream error:', error);
        const errorData = encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        await writer.write(errorData);
        await writer.close();
      }
    })();

    // Return the stream with appropriate headers
    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
} 