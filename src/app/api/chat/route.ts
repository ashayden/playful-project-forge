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

const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json();

    if (!messages?.length) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }), 
        { status: 400, headers }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const textEncoder = new TextEncoder();
        const sendData = (data: any) => {
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Save user message
          await supabase
            .from('messages')
            .insert({
              content: messages[messages.length - 1].content,
              role: 'user',
              conversation_id: conversationId,
            })
            .throwOnError();

          // Start OpenAI streaming
          const openaiStream = await openai.chat.completions.create({
            ...AI_CONFIG,
            messages,
            stream: true,
          });

          let fullResponse = '';

          for await (const chunk of openaiStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              sendData({ content });
            }
          }

          // Save assistant response
          await supabase
            .from('messages')
            .insert({
              content: fullResponse,
              role: 'assistant',
              conversation_id: conversationId,
            })
            .throwOnError();

          sendData({ done: true });
          controller.close();
        } catch (error) {
          console.error('Stream Error:', error);
          sendData({ error: 'An error occurred' });
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers }
    );
  }
} 