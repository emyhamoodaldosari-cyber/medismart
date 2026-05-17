import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionConfig {
  table: string;
  event: PostgresChangeEvent;
  filter?: string;
  callback: (payload: any) => void;
}

/**
 * Custom hook for Supabase realtime subscriptions with automatic cleanup
 * 
 * @param channelName - Unique channel name for this subscription
 * @param config - Subscription configuration
 * @param enabled - Whether the subscription is active (default: true)
 * 
 * @example
 * useRealtimeSubscription(
 *   'orders-user-123',
 *   {
 *     table: 'orders',
 *     event: 'UPDATE',
 *     filter: 'user_id=eq.123',
 *     callback: (payload) => console.log('Order updated', payload)
 *   }
 * );
 */
export const useRealtimeSubscription = (
  channelName: string,
  config: SubscriptionConfig | SubscriptionConfig[],
  enabled: boolean = true
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create channel
    const channel = supabase.channel(channelName);

    // Handle single or multiple subscriptions
    const configs = Array.isArray(config) ? config : [config];

    // Add all postgres_changes listeners
    configs.forEach(({ table, event, filter, callback }) => {
      channel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        },
        callback
      );
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✓ Realtime subscribed: ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`✗ Realtime error: ${channelName}`);
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log(`✓ Realtime unsubscribed: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, enabled, JSON.stringify(config)]);

  return channelRef;
};
