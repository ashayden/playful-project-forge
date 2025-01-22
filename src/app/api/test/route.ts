import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return new Response(JSON.stringify({ 
    status: 'ok',
    received: body 
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 