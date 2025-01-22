import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Force dynamic runtime
export const dynamic = 'force-dynamic';

// Use Node.js runtime
export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { message: 'GET working!' },
    { headers: corsHeaders }
  );
}

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    return NextResponse.json(
      { success: true, data },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 400, headers: corsHeaders }
    );
  }
} 