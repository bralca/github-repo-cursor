import { NextRequest, NextResponse } from 'next/server';
import { CONNECTIONS } from './connections';

/**
 * Server-Sent Events (SSE) endpoint for real-time pipeline events
 */
export async function GET(req: NextRequest) {
  // Create a new stream for Server-Sent Events
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Store the writer for later use
  CONNECTIONS.add(writer);

  // Send initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    CONNECTIONS.delete(writer);
    writer.close();
  });

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
} 