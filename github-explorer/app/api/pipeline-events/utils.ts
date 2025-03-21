// Import the CONNECTIONS Set from the shared file
import { CONNECTIONS } from './connections';

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