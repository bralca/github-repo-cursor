import { NextRequest, NextResponse } from 'next/server';

// Track all active SSE connections
const CONNECTIONS = new Set<any>();

// Clean up connections on exit
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', () => {
    CONNECTIONS.clear();
  });
}

/**
 * Send data to all active SSE connections
 */
export function broadcastEvent(event: any) {
  CONNECTIONS.forEach((writer) => {
    try {
      if (writer && typeof writer.write === 'function') {
        const encoder = new TextEncoder();
        writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
    } catch (err) {
      console.error('Error broadcasting event to client:', err);
    }
  });
}

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