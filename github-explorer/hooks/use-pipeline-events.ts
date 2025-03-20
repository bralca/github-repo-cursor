import { useState, useEffect, useCallback, useRef } from 'react';

export type PipelineEvent = {
  type: string;
  data: any;
  timestamp: string;
};

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type UsePipelineEventsOptions = {
  autoConnect?: boolean;
  onEvent?: (event: PipelineEvent) => void;
  bufferSize?: number;
};

/**
 * React hook for connecting to pipeline events via Server-Sent Events
 */
export function usePipelineEvents({
  autoConnect = true,
  onEvent,
  bufferSize = 20,
}: UsePipelineEventsOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to the SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('connecting');
    const eventSource = new EventSource('/api/pipeline-events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus('connected');
      console.log('SSE connection established');
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setStatus('disconnected');
      } else {
        setStatus('error');
        console.error('SSE connection error');
        
        // Auto reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current === eventSource) {
            connect();
          }
        }, 5000);
      }
    };

    eventSource.onmessage = (message) => {
      try {
        const eventData = JSON.parse(message.data);
        const pipelineEvent: PipelineEvent = {
          ...eventData,
          timestamp: eventData.timestamp || new Date().toISOString(),
        };

        // Add to events buffer
        setEvents((currentEvents) => {
          const newEvents = [...currentEvents, pipelineEvent];
          // Keep only the most recent events
          return newEvents.slice(-bufferSize);
        });

        // Call the onEvent callback if provided
        if (onEvent) {
          onEvent(pipelineEvent);
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };
  }, [bufferSize, onEvent]);

  // Disconnect from the SSE endpoint
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [autoConnect, connect]);

  // Poll for new events to handle potential SSE connection issues
  useEffect(() => {
    // Don't poll if we have an active SSE connection
    if (status !== 'connected') {
      return;
    }

    const pollForEvents = async () => {
      try {
        const response = await fetch('/api/pipeline-events/poll');
        if (response.ok) {
          // Events are automatically broadcast to SSE connections
          // so we don't need to handle them here
        }
      } catch (error) {
        console.error('Error polling for events:', error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollForEvents, 5000);
    return () => clearInterval(interval);
  }, [status]);

  return { status, events, connect, disconnect };
} 