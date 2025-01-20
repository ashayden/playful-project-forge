import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggingService';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

export async function POST(request: Request) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logger.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const { message, conversationId } = await request.json();
    logger.info('Processing message:', { conversationId, messageLength: message?.length });
    
    if (!message || typeof message !== 'string' || !conversationId) {
      logger.error('Invalid request format:', { message, conversationId });
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

    logger.info('Fetched conversation history:', { messageCount: historyData?.length });

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

    // Initialize AI model
    logger.info('Initializing AI model...');
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

    logger.info('Starting stream...');
    // Get streaming response
    const stream = await model.stream(messages);
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        try {
          logger.info('Processing stream...');
          for await (const chunk of stream) {
            // Ensure chunk content is a string and handle different response formats
            let content = '';
            if (typeof chunk.content === 'string') {
              content = chunk.content;
            } else if (Array.isArray(chunk.content)) {
              content = chunk.content
                .map(c => typeof c === 'string' ? c : JSON.stringify(c))
                .join('');
            } else if (chunk.content) {
              content = JSON.stringify(chunk.content);
            }

            if (content.trim()) {
              fullResponse += content;
              logger.debug('Received chunk:', { contentLength: content.length });
              
              // Encode as a proper SSE message
              const message = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(message));
              
              // Update assistant message in database
              await supabase
                .from('messages')
                .update({ content: fullResponse })
                .eq('id', assistantMessage.id);
            }
          }

          // Ensure final message is saved
          if (fullResponse.trim()) {
            logger.info('Saving final response:', { responseLength: fullResponse.length });
            await supabase
              .from('messages')
              .update({ content: fullResponse })
              .eq('id', assistantMessage.id);
          }

          // Send a completion message
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          logger.error('Streaming error:', error);
          // Try to save any partial response
          if (fullResponse.trim()) {
            await supabase
              .from('messages')
              .update({ content: fullResponse })
              .eq('id', assistantMessage.id);
          }
          controller.error(error);
        }
      },
    });

    // Update conversation to indicate it has a response
    await supabase
      .from('conversations')
      .update({ has_response: true })
      .eq('id', conversationId);

    logger.info('Returning response stream');
    // Return streaming response with correct headers
    return new Response(readable, {
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',  // Prevent proxy buffering
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    logger.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        } 
      }
    );
  }
} 