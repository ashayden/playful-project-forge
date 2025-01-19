import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggingService';

export async function POST(request: Request) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const { message, conversationId } = await request.json();
    
    if (!message || typeof message !== 'string' || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save user message
    const { error: saveError } = await supabase
      .from('messages')
      .insert([{ 
        content: message, 
        role: 'user',
        conversation_id: conversationId,
        user_id: user.id
      }]);

    if (saveError) {
      logger.error('Error saving user message:', saveError);
      throw new Error('Failed to save user message');
    }

    // Get conversation history
    const { data: historyData, error: historyError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      logger.error('Error fetching history:', historyError);
      throw new Error('Failed to fetch conversation history');
    }

    // Create empty assistant message for streaming
    const { data: assistantMessage, error: assistantError } = await supabase
      .from('messages')
      .insert([{ 
        content: '', 
        role: 'assistant',
        conversation_id: conversationId,
        user_id: null
      }])
      .select()
      .single();

    if (assistantError) {
      logger.error('Error creating assistant message:', assistantError);
      throw new Error('Failed to create assistant message');
    }

    // Dynamically import LangChain modules
    const [{ ChatOpenAI }, { SystemMessage, HumanMessage, AIMessage }] = await Promise.all([
      import('@langchain/openai'),
      import('@langchain/core/messages')
    ]);

    // Initialize AI model
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      streaming: true,
      maxRetries: 3,
      timeout: 60000,
    });

    // Prepare messages for AI
    const messages = [
      new SystemMessage("You are a helpful AI assistant. Be concise and clear in your responses."),
      ...historyData.map(msg => 
        msg.role === 'user' 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(message)
    ];

    // Get streaming response
    const stream = await model.stream(messages);
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        try {
          for await (const chunk of stream) {
            const content = typeof chunk.content === 'string' 
              ? chunk.content 
              : JSON.stringify(chunk.content);
            fullResponse += content;
            controller.enqueue(encoder.encode(content));
            
            // Update assistant message in database
            await supabase
              .from('messages')
              .update({ content: fullResponse })
              .eq('id', assistantMessage.id);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Update conversation to indicate it has a response
    await supabase
      .from('conversations')
      .update({ has_response: true })
      .eq('id', conversationId);

    // Return streaming response
    return new Response(readable, {
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

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