'use client';

import { useEffect, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type SupabaseEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscriptionOptions {
  /**
   * The event types to subscribe to
   */
  event?: SupabaseEventType;
  
  /**
   * Filter to specific columns
   */
  columns?: string | string[];
  
  /**
   * Filter to specific record values
   */
  filter?: string;
  
  /**
   * Show toast notifications for changes
   */
  showNotifications?: boolean;
}

/**
 * A hook for subscribing to real-time changes in a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param options - Subscription options
 * @returns An object with the subscription status and channel
 */
export function useSupabaseSubscription<T = any>(
  table: string,
  options: SubscriptionOptions = {}
) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimePostgresChangesPayload<T> | null>(null);
  
  const { event = '*', columns, filter, showNotifications = false } = options;
  
  useEffect(() => {
    if (!table) return;
    
    // Create a new channel for this subscription
    const newChannel = supabase
      .channel(`table-changes-${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(columns ? { columns } : {}),
          ...(filter ? { filter } : {}),
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          setLastEvent(payload);
          
          if (showNotifications) {
            const eventType = payload.eventType;
            const record = payload.new || payload.old;
            
            switch (eventType) {
              case 'INSERT':
                toast.info(`New ${table} record added`);
                break;
              case 'UPDATE':
                toast.info(`${table} record updated`);
                break;
              case 'DELETE':
                toast.info(`${table} record deleted`);
                break;
            }
          }
        }
      )
      .subscribe((status) => {
        setStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
        
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
        }
      });
    
    setChannel(newChannel);
    setStatus('connecting');
    
    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      if (newChannel) {
        console.log(`Unsubscribing from ${table} changes`);
        newChannel.unsubscribe();
        setStatus('disconnected');
        setChannel(null);
      }
    };
  }, [table, event, columns, filter, showNotifications]);
  
  return {
    status,
    channel,
    lastEvent,
  };
}

/**
 * A hook for subscribing to real-time changes in a Supabase table and maintaining a local state.
 * 
 * @param table - The Supabase table name
 * @param initialData - Initial data to populate the state
 * @param options - Subscription options
 * @returns An object with the current data and subscription status
 */
export function useSupabaseRealtimeData<T extends { id: string | number }>(
  table: string,
  initialData: T[] = [],
  options: SubscriptionOptions = {}
) {
  const [data, setData] = useState<T[]>(initialData);
  const { status, lastEvent } = useSupabaseSubscription<T>(table, options);
  
  // Update the local state when new events come in
  useEffect(() => {
    if (!lastEvent) return;
    
    const { eventType, new: newRecord, old: oldRecord } = lastEvent;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          setData((prev) => [...prev, newRecord]);
        }
        break;
      case 'UPDATE':
        if (newRecord) {
          setData((prev) => 
            prev.map((item) => (item.id === newRecord.id ? newRecord : item))
          );
        }
        break;
      case 'DELETE':
        if (oldRecord) {
          setData((prev) => prev.filter((item) => item.id !== oldRecord.id));
        }
        break;
    }
  }, [lastEvent]);
  
  return {
    data,
    status,
    setData,
  };
} 