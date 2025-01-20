import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Request, Response } from 'express';
import { AI_CONFIG } from '@/config/ai.config';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // Explicitly disable browser usage
});

export async function handleChatRequest(req: Request, res: Response) {
  try {
    const session = req.session;

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messages, conversationId } = req.body;

    if (!messages || !conversationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        content: messages[messages.length - 1].content,
        role: 'user',
        conversation_id: conversationId,
        user_id: session.user.id,
      });

    if (messageError) {
      console.error('Error saving user message:', messageError);
      return res.status(500).json({ error: 'Error saving message' });
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