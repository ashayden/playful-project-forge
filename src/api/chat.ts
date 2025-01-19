import { supabase } from '@/integrations/supabase/client';
import { ChatOpenAI } from '@langchain/openai';
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder, 
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { logger } from '@/services/loggingService';

export async function POST(request: Request) {
  try {
    const { message, conversationId } = await request.json();

    if (!message || !conversationId) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Insert user message first
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert([{
        role: 'user',
        content: message,
        conversation_id: conversationId,
        user_id: user.id,
      }]);

    if (userMessageError) {
      logger.error('Error inserting user message:', userMessageError);
      return new Response('Error saving user message', { status: 500 });
    }

    // Initialize ChatOpenAI
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000,
      streaming: false,
    });

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

    // Format messages for LangChain
    const formattedHistory = messages?.map(msg => ({
      type: msg.role,
      content: msg.content,
    })) || [];

    // Create chat prompt
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        'You are a helpful AI assistant. Be concise and clear in your responses.'
      ),
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate('{input}'),
    ]);

    // Process the message
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const response = await chain.invoke({
      history: formattedHistory,
      input: message,
    });

    // Insert assistant message
    const { error: insertError } = await supabase
      .from('messages')
      .insert([{
        role: 'assistant',
        content: response,
        conversation_id: conversationId,
        user_id: user.id,
      }]);

    if (insertError) {
      logger.error('Error inserting assistant message:', insertError);
      return new Response('Error saving response', { status: 500 });
    }

    // Update conversation has_response flag
    await supabase
      .from('conversations')
      .update({ has_response: true })
      .eq('id', conversationId);

    return new Response(response);
  } catch (error) {
    logger.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 