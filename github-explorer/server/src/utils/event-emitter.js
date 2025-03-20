/**
 * PipelineEventEmitter
 * 
 * Simple file-based event emitter for cross-process communication.
 * This enables real-time updates in the frontend by writing event files 
 * that can be picked up by the API polling mechanism.
 */

import fs from 'fs';
import path from 'path';
import { getDbPath } from './db-path.js';
import { setupLogger } from './logger.js';

export class PipelineEventEmitter {
  constructor() {
    this.logger = setupLogger('PipelineEventEmitter');
    
    // Use a directory next to the database for events
    const dbDir = path.dirname(getDbPath());
    this.eventsDir = path.join(dbDir, 'events');
    
    // Ensure events directory exists
    if (!fs.existsSync(this.eventsDir)) {
      try {
        fs.mkdirSync(this.eventsDir, { recursive: true });
        this.logger.info(`Created events directory at ${this.eventsDir}`);
      } catch (error) {
        this.logger.error(`Failed to create events directory: ${error.message}`);
      }
    }
    
    // Clean up old events on startup
    this.cleanupOldEvents();
  }

  /**
   * Emit a pipeline event by writing to a JSON file
   * @param {string} eventType - Type of event (e.g., 'pipeline_started')
   * @param {object} data - Event data
   */
  emit(eventType, data) {
    if (!eventType) {
      this.logger.warn('Attempted to emit event with no type');
      return;
    }
    
    const event = {
      type: eventType,
      data: data || {},
      timestamp: new Date().toISOString()
    };
    
    try {
      // Create a unique filename with timestamp and random string
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.json`;
      const filePath = path.join(this.eventsDir, filename);
      
      // Write event to file
      fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
      this.logger.debug(`Emitted event ${eventType} to ${filename}`);
      
      // Occasionally clean up old events
      if (Math.random() < 0.1) { // 10% chance on each emit
        this.cleanupOldEvents();
      }
    } catch (error) {
      this.logger.error(`Failed to emit event ${eventType}: ${error.message}`);
    }
  }
  
  /**
   * Clean up event files older than 30 minutes
   */
  cleanupOldEvents() {
    try {
      const files = fs.readdirSync(this.eventsDir);
      const now = Date.now();
      let deletedCount = 0;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.eventsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        
        // Delete files older than 30 minutes
        if (fileAge > 30 * 60 * 1000) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        this.logger.info(`Cleaned up ${deletedCount} old event files`);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up old events: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const pipelineEvents = new PipelineEventEmitter(); 