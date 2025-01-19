import { supabase } from '@/integrations/supabase/client';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core';
import { logger } from '@/services/loggingService';
import { Message } from '@/types/ai';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Save user message
    const { error: saveError } = await supabase
      .from('messages')
      .insert([{ content: message, type: 'user' }]);

    if (saveError) {
      logger.error('Error saving user message:', saveError);
      return new Response('Error saving user message', { status: 500 });
    }

    // Get conversation history
    const { data: historyData, error: historyError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (historyError) {
      logger.error('Error fetching history:', historyError);
      return new Response('Error fetching history', { status: 500 });
    }

    // Convert history to Message format
    const formattedHistory: Message[] = historyData.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at).getTime()
    }));

    // Process the message
    const response = await sendChatMessage(message, formattedHistory);

    // Insert assistant message
    const { error: assistantError } = await supabase
      .from('messages')
      .insert([{ content: response, type: 'assistant' }]);

    if (assistantError) {
      logger.error('Error saving assistant message:', assistantError);
      return new Response('Error saving assistant message', { status: 500 });
    }

    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function sendChatMessage(message: string, history: Message[]) {
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      streaming: true,
    });

    const messages = [
      new SystemMessage("You are a helpful AI assistant. Be concise and clear in your responses."),
      ...history.map(msg => 
        msg.role === 'user' 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(message)
    ];

    const response = await model.invoke(messages);
    return response.content;
  } catch (error) {
    logger.error('Error in sendChatMessage:', error);
    throw error;
  }
} 