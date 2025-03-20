/**
 * Pipeline Event Polling Service
 * 
 * This service polls for pipeline events and triggers 
 * callbacks when events are received.
 */

type PipelineEventCallback = (event: any) => void;

class EventPollerService {
  private isPolling: boolean = false;
  private pollInterval: number = 3000; // 3 seconds
  private intervalId?: NodeJS.Timeout;
  private callbacks: PipelineEventCallback[] = [];
  private lastPollTime: number = 0;

  /**
   * Start polling for events
   */
  startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.poll(); // Poll immediately
    
    // Set up interval for regular polling
    this.intervalId = setInterval(() => {
      this.poll();
    }, this.pollInterval);
    
    console.log('Started polling for pipeline events');
  }

  /**
   * Stop polling for events
   */
  stopPolling(): void {
    if (!this.isPolling) return;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    this.isPolling = false;
    console.log('Stopped polling for pipeline events');
  }

  /**
   * Register a callback to be called when events are received
   */
  subscribe(callback: PipelineEventCallback): () => void {
    this.callbacks.push(callback);
    
    // Auto-start polling if this is the first subscriber
    if (this.callbacks.length === 1 && !this.isPolling) {
      this.startPolling();
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
      
      // Auto-stop polling if there are no more subscribers
      if (this.callbacks.length === 0 && this.isPolling) {
        this.stopPolling();
      }
    };
  }

  /**
   * Set the polling interval
   */
  setPollInterval(interval: number): void {
    this.pollInterval = interval;
    
    // Restart polling with new interval if already polling
    if (this.isPolling && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.poll();
      }, this.pollInterval);
    }
  }

  /**
   * Poll for events
   */
  private async poll(): Promise<void> {
    try {
      const response = await fetch(`/api/pipeline-events/poll?timestamp=${this.lastPollTime}`);
      
      if (!response.ok) {
        console.error('Error polling for events:', response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.events && data.events.length > 0) {
        // Update last poll time to avoid getting the same events again
        this.lastPollTime = Date.now();
        
        // Notify all subscribers
        data.events.forEach((event: any) => {
          this.callbacks.forEach(callback => {
            try {
              callback(event);
            } catch (error) {
              console.error('Error in event callback:', error);
            }
          });
        });
      }
    } catch (error) {
      console.error('Error polling for events:', error);
    }
  }

  /**
   * Get the current polling status
   */
  getStatus(): { isPolling: boolean; pollInterval: number; subscriberCount: number } {
    return {
      isPolling: this.isPolling,
      pollInterval: this.pollInterval,
      subscriberCount: this.callbacks.length
    };
  }
}

// Export singleton instance
export const eventPollerService = new EventPollerService(); 