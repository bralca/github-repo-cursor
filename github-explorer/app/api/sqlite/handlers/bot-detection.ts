import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handles operations related to bot detection
 */
export async function handleBotDetection(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { operation } = body;
    
    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }
    
    // Handle different operations
    switch (operation) {
      case 'add_is_bot_column':
        return await addIsBotColumn();
        
      case 'detect_bots':
        return await detectBots();
        
      case 'get_bot_count':
        return await getBotCount();
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in bot detection API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add is_bot column to contributors table if it doesn't exist
 */
async function addIsBotColumn() {
  try {
    const columnAdded = await withDb(async (db) => {
      // Check if the column already exists
      let columnExists = false;
      try {
        await db.get(`SELECT is_bot FROM contributors LIMIT 1`);
        columnExists = true;
      } catch (e: any) {
        // Column doesn't exist - this is expected
        columnExists = false;
      }
      
      // Add the column if it doesn't exist
      if (!columnExists) {
        await db.run(`ALTER TABLE contributors ADD COLUMN is_bot BOOLEAN DEFAULT 0`);
        return true;
      }
      
      return false;
    });
    
    return NextResponse.json({
      success: true,
      message: columnAdded 
        ? 'Added is_bot column to contributors table' 
        : 'is_bot column already exists'
    });
  } catch (error: any) {
    console.error('Error adding is_bot column:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add is_bot column' },
      { status: 500 }
    );
  }
}

/**
 * Detect and flag bot accounts
 * Identifies bots based on name or bio containing the word "bot"
 */
async function detectBots() {
  try {
    // First ensure the column exists
    await addIsBotColumn();
    
    // Update contributors to flag bots
    const result = await withDb(async (db) => {
      // Flag contributors with "bot" in their name, username, or bio
      const { changes } = await db.run(`
        UPDATE contributors
        SET is_bot = 1
        WHERE 
          LOWER(name) LIKE '%bot%' OR 
          LOWER(username) LIKE '%bot%' OR 
          LOWER(bio) LIKE '%bot%'
      `);
      
      return { botsDetected: changes };
    });
    
    return NextResponse.json({
      success: true,
      message: `Detected ${result.botsDetected} bot accounts`,
      botsDetected: result.botsDetected
    });
  } catch (error: any) {
    console.error('Error detecting bots:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect bots' },
      { status: 500 }
    );
  }
}

/**
 * Get count of contributors flagged as bots
 */
async function getBotCount() {
  try {
    const stats = await withDb(async (db) => {
      // Get count of bots
      const { botCount } = await db.get(`
        SELECT COUNT(*) as botCount
        FROM contributors
        WHERE is_bot = 1
      `);
      
      // Get total contributor count
      const { totalCount } = await db.get(`
        SELECT COUNT(*) as totalCount
        FROM contributors
      `);
      
      // Calculate percentage
      const percentage = totalCount > 0 
        ? ((botCount / totalCount) * 100).toFixed(2) 
        : '0.00';
      
      return {
        botCount,
        totalCount,
        percentage
      };
    });
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error getting bot count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get bot count' },
      { status: 500 }
    );
  }
} 