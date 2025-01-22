import { NextRequest } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return Response.json({ message: 'GET working!' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return Response.json({ message: 'POST working!', received: body });
} 