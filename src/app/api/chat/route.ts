import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { message, conversationId } = await req.json();

    if (!message || !conversationId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        content: message,
        role: 'user',
        conversation_id: conversationId,
        user_id: session.user.id,
      });

    if (messageError) {
      console.error('Error saving user message:', messageError);
      return new NextResponse('Error saving message', { status: 500 });
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Prepare messages for OpenAI
    const messages = history?.map(msg => ({
      role: msg.role,
      content: msg.content,
    })) || [];

    // Create stream
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Respond concisely and accurately.',
        },
        ...messages,
      ],
      stream: true,
    });

    // Create a new response with streaming support
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        const saveMessage = async (content: string) => {
          await supabase
            .from('messages')
            .insert({
              content,
              role: 'assistant',
              conversation_id: conversationId,
            });
        };

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
          await saveMessage(fullResponse);
          
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

    return new NextResponse(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 