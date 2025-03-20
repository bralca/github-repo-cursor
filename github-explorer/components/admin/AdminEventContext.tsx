'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePipelineEvents, PipelineEvent } from '@/hooks/use-pipeline-events';
import { eventPollerService } from '@/app/services/event-poller';

// Define the context type
type AdminEventContextType = {
  events: PipelineEvent[];
  connectionStatus: string;
  lastEventTimestamp: string | null;
  latestEventsByType: Record<string, PipelineEvent>;
};

// Create the context with default values
const AdminEventContext = createContext<AdminEventContextType>({
  events: [],
  connectionStatus: 'disconnected',
  lastEventTimestamp: null,
  latestEventsByType: {},
});

// Provider component props
type AdminEventProviderProps = {
  children: ReactNode;
};

export function AdminEventProvider({ children }: AdminEventProviderProps) {
  // Use our custom hook to connect to server-sent events
  const { status, events } = usePipelineEvents({
    autoConnect: true,
    bufferSize: 50,
  });

  // State to store the latest event of each type
  const [latestEventsByType, setLatestEventsByType] = useState<Record<string, PipelineEvent>>({});
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(null);

  // Update the latestEventsByType when new events arrive
  useEffect(() => {
    if (events.length > 0) {
      const newLatestEvents = { ...latestEventsByType };
      
      // Find the most recent event of each type
      events.forEach(event => {
        if (!event.type) return;
        
        // Only update if this event is newer than the stored one or there is no stored event of this type
        if (
          !newLatestEvents[event.type] || 
          (event.timestamp && newLatestEvents[event.type].timestamp &&
           new Date(event.timestamp) > new Date(newLatestEvents[event.type].timestamp))
        ) {
          newLatestEvents[event.type] = event;
        }
      });
      
      // Update the state
      setLatestEventsByType(newLatestEvents);
      
      // Update the last event timestamp
      const latestEvent = events[events.length - 1];
      if (latestEvent && latestEvent.timestamp) {
        setLastEventTimestamp(latestEvent.timestamp);
      }
    }
  }, [events]);

  // Start the event polling service
  useEffect(() => {
    // Start the service if not already running
    eventPollerService.startPolling();
    
    // Clean up on unmount
    return () => {
      eventPollerService.stopPolling();
    };
  }, []);

  // Create the context value
  const contextValue: AdminEventContextType = {
    events,
    connectionStatus: status,
    lastEventTimestamp,
    latestEventsByType,
  };

  return (
    <AdminEventContext.Provider value={contextValue}>
      {children}
    </AdminEventContext.Provider>
  );
}

// Custom hook to use the admin event context
export function useAdminEvents() {
  const context = useContext(AdminEventContext);
  if (context === undefined) {
    throw new Error('useAdminEvents must be used within an AdminEventProvider');
  }
  return context;
} 