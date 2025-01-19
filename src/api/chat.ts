import { supabase } from '@/integrations/supabase/client';
import { ChatOpenAI } from '@langchain/openai';
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder, 
  HumanMessagePromptTemplate 
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { logger } from '@/services/loggingService';

export async function POST(request: Request) {
  try {
    const { message, conversationId } = await request.json();

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Initialize ChatOpenAI
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini-2024-07-18',
      temperature: 0.7,
      maxTokens: 8192,
      streaming: true,
    });

    // Create chat prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a helpful AI assistant. Be concise and clear in your responses.'],
      MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate('{input}'),
    ]);

    // Get conversation history
    const { data: messages, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      logger.error('Error fetching conversation history:', historyError);
      return new Response('Error fetching conversation history', { status: 500 });
    }

    // Process the message
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const response = await chain.invoke({
      history: messages,
      input: message,
    });

    // Save assistant's response
    const { error: saveError } = await supabase
      .from('messages')
      .insert([{
        role: 'assistant',
        content: response,
        conversation_id: conversationId,
        user_id: user.id,
      }]);

    if (saveError) {
      logger.error('Error saving response:', saveError);
      return new Response('Error saving response', { status: 500 });
    }

    // Update conversation has_response flag
    await supabase
      .from('conversations')
      .update({ has_response: true })
      .eq('id', conversationId);

    return new Response(response, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    logger.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 