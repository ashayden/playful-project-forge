import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Request, Response } from 'express';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

export async function handleChatRequest(req: Request, res: Response) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, conversationId } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({ error: 'Missing required fields' });
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
      return res.status(500).json({ error: 'Error saving message' });
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('*')
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 