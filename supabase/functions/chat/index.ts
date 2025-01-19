import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatOpenAI } from 'https://esm.sh/@langchain/openai'
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder, 
  HumanMessagePromptTemplate 
} from 'https://esm.sh/@langchain/core/prompts'
import { StringOutputParser } from 'https://esm.sh/@langchain/core/output_parsers'

serve(async (req) => {
  try {
    const { message, conversationId } = await req.json()
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Initialize ChatOpenAI
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini-2024-07-18',
      temperature: 0.7,
      maxTokens: 8192,
      streaming: true,
    })

    // Create chat prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a helpful AI assistant. Be concise and clear in your responses.'],
      MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate('{input}'),
    ])

    // Get conversation history
    const { data: messages, error: historyError } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (historyError) {
      return new Response('Error fetching conversation history', { status: 500 })
    }

    // Process the message
    const chain = prompt.pipe(model).pipe(new StringOutputParser())
    
    const response = await chain.invoke({
      history: messages,
      input: message,
    })

    // Save assistant's response
    const { error: saveError } = await supabaseClient
      .from('messages')
      .insert([
        {
          role: 'assistant',
          content: response,
          conversation_id: conversationId,
          user_id: user.id,
        },
      ])

    if (saveError) {
      return new Response('Error saving response', { status: 500 })
    }

    // Update conversation has_response flag
    await supabaseClient
      .from('conversations')
      .update({ has_response: true })
      .eq('id', conversationId)

    return new Response(response, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('Error in chat function:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}) 