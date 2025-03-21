// Track all active SSE connections
export const CONNECTIONS = new Set<any>();

// Clean up connections on exit
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', () => {
    CONNECTIONS.clear();
  });
} 