import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { AI_CONFIG } from '@/config/ai.config';

// Get environment variables
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;

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
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, // Fallback to anon key if service role key is not available
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

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Validate request
    if (!req.body) {
      return new Response(JSON.stringify({ error: 'Request body is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, conversationId } = await req.json();

    if (!messages?.length || !conversationId) {
      return new Response(JSON.stringify({ error: 'Messages and conversationId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Error saving message' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Create a TransformStream for streaming the response
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Error in stream processing:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream response
    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 