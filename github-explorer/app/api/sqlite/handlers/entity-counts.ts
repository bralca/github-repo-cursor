import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for fetching counts of various entities in the database
 */
export async function handleEntityCounts(request: NextRequest) {
  try {
    console.log('Fetching entity counts from SQLite...');
    
    // Gather all entity counts from the database
    const counts = await withDb(async (db) => {
      const entityCounts: Record<string, number> = {};
      
      // Helper function to safely count entities from a table
      async function countEntities(tableName: string, outputKey: string, countEnriched = false) {
        try {
          // First check if the table exists
          const tableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
            [tableName]
          );
          
          if (!tableExists) {
            console.log(`Table ${tableName} does not exist`);
            entityCounts[outputKey] = 0;
            if (countEnriched) {
              entityCounts[`enriched_${outputKey}`] = 0;
            }
            return;
          }
          
          // Count total
          const result = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
          entityCounts[outputKey] = result?.count || 0;
          
          // Count enriched if requested
          if (countEnriched) {
            const enrichedResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName} WHERE is_enriched = 1`);
            entityCounts[`enriched_${outputKey}`] = enrichedResult?.count || 0;
          }
        } catch (e) {
          console.error(`Error counting ${tableName}:`, e);
          entityCounts[outputKey] = 0;
          if (countEnriched) {
            entityCounts[`enriched_${outputKey}`] = 0;
          }
        }
      }
      
      // Count entities from each table
      await countEntities('repositories', 'repositories', true);
      await countEntities('contributors', 'contributors', true);
      await countEntities('merge_requests', 'mergeRequests', true);
      await countEntities('commits', 'commits', true);
      await countEntities('files', 'files');
      await countEntities('comments', 'comments');
      
      return entityCounts;
    });
    
    console.log('Entity counts:', counts);
    return NextResponse.json(counts);
  } catch (error: any) {
    console.error('Error fetching entity counts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entity counts' },
      { status: 500 }
    );
  }
} 