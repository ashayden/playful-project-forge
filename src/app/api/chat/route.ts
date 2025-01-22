import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

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

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Log request details
    console.log('Processing chat request:', {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Parse request body
    const body = await request.json() as ChatRequestBody;
    const { messages, conversationId } = body;

    if (!messages?.length || !conversationId) {
      console.log('Invalid request:', { hasMessages: !!messages?.length, hasConversationId: !!conversationId });
      return NextResponse.json(
        { error: 'Messages and conversationId are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Set up streaming
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
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
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Error saving message' })}\n\n`));
            controller.close();
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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`));
          controller.close();
        }
      },
    });

    // Return the stream response
    return new Response(customReadable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 