import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { broadcastEvent } from '../route';

// Path to events directory - next to the database
// We'll use the same approach as the server to find the database path
const getEventsDir = (): string => {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), '../../../github_explorer.db');
  const dbDir = path.dirname(dbPath);
  return path.join(dbDir, 'events');
};

// Keep track of last processed events
let lastProcessedTimestamp = 0;

/**
 * Poll for new events and broadcast them to all connected clients
 */
export async function GET(req: NextRequest) {
  try {
    // Default limit to 10 events per request
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
    
    // Get timestamp parameter for more efficient polling
    const timestampParam = req.nextUrl.searchParams.get('timestamp');
    if (timestampParam) {
      lastProcessedTimestamp = parseInt(timestampParam, 10);
    }
    
    const eventsDir = getEventsDir();
    
    // Check if events directory exists
    if (!fs.existsSync(eventsDir)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Events directory not found'
      }, { status: 404 });
    }
    
    // Read event files sorted by creation time (oldest first)
    const eventFiles = fs.readdirSync(eventsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(eventsDir, file),
        timestamp: parseInt(file.split('-')[0], 10) || 0
      }))
      // Only process newer events
      .filter(file => file.timestamp > lastProcessedTimestamp)
      // Sort chronologically
      .sort((a, b) => a.timestamp - b.timestamp)
      // Limit number of events processed at once
      .slice(0, limit);
    
    // Process found events
    const events = [];
    
    for (const file of eventFiles) {
      try {
        const eventData = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        events.push(eventData);
        
        // Update timestamp to avoid processing this file again
        lastProcessedTimestamp = Math.max(lastProcessedTimestamp, file.timestamp);
        
        // Broadcast event to all connected clients
        broadcastEvent(eventData);
        
        // Delete the file after processing to avoid accumulation
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error(`Error processing event file ${file.name}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      eventsProcessed: events.length,
      events
    });
  } catch (error) {
    console.error('Error in event polling:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 