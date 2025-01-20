import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Request, Response } from 'express';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export async function handleChatRequest(req: Request, res: Response) {
  try {
    const session = req.session;

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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Respond concisely and accurately.',
        },
        ...messages,
      ],
      stream: true,
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
    await supabase
      .from('messages')
      .insert({
        content: fullResponse,
        role: 'assistant',
        conversation_id: conversationId,
        user_id: session.user.id,
      });

    // End the response
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 