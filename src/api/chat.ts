import { supabase } from '@/integrations/supabase/client';
import { ChatOpenAI } from '@langchain/openai';
import { 
  SystemMessage,
  HumanMessage,
  AIMessage,
} from '@langchain/core/messages';
import { logger } from '@/services/loggingService';
import { Message } from '@/types/ai';

export async function POST(request: Request) {
  try {
    // Validate request
    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'Missing request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save user message
    const { error: saveError } = await supabase
      .from('messages')
      .insert([{ content: message, type: 'user' }]);

    if (saveError) {
      logger.error('Error saving user message:', saveError);
      throw new Error('Failed to save user message');
    }

    // Get conversation history
    const { data: historyData, error: historyError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(10); // Limit context window

    if (historyError) {
      logger.error('Error fetching history:', historyError);
      throw new Error('Failed to fetch conversation history');
    }

    // Convert history to Message format
    const formattedHistory: Message[] = historyData.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at).getTime()
    }));

    // Initialize AI model
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      streaming: false,
      maxRetries: 3,
      timeout: 60000, // 60 second timeout
    });

    // Prepare messages
    const messages = [
      new SystemMessage("You are a helpful AI assistant. Be concise and clear in your responses."),
      ...formattedHistory.map(msg => 
        msg.role === 'user' 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(message)
    ];

    // Get AI response
    const response = await model.invoke(messages);
    if (!response?.content) {
      throw new Error('No response received from AI model');
    }

    // Save AI response
    const { error: assistantError } = await supabase
      .from('messages')
      .insert([{ content: response.content, type: 'assistant' }]);

    if (assistantError) {
      logger.error('Error saving assistant message:', assistantError);
      throw new Error('Failed to save assistant response');
    }

    // Return successful response
    return new Response(
      JSON.stringify({ 
        response: response.content,
        success: true 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        success: false 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 