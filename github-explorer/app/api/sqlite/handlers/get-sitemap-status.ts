import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Gets the current status of sitemap generation
 */
export async function getSitemapStatus(request: NextRequest) {
  try {
    // Check for sitemap files
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapIndexPath = path.join(publicDir, 'sitemap.xml');
    const sitemapsDir = path.join(publicDir, 'sitemaps');
    
    // Check if the main sitemap index exists
    let sitemapIndexExists = false;
    try {
      await fs.access(sitemapIndexPath);
      sitemapIndexExists = true;
    } catch (err) {
      console.log('Sitemap index does not exist yet');
    }
    
    // Check if the sitemaps directory exists
    let sitemapsExist = false;
    let sitemapFiles: string[] = [];
    try {
      await fs.access(sitemapsDir);
      sitemapsExist = true;
      
      // Get the list of sitemap files
      const files = await fs.readdir(sitemapsDir);
      sitemapFiles = files.filter(file => file.endsWith('.xml'));
    } catch (err) {
      console.log('Sitemaps directory does not exist yet');
    }
    
    // Get the last updated time
    let lastUpdated = null;
    if (sitemapIndexExists) {
      const stats = await fs.stat(sitemapIndexPath);
      lastUpdated = stats.mtime.getTime();
    }
    
    // Extract entity types and URL counts from filenames
    const sitemapMetadata = [];
    
    // Process each sitemap file to extract metadata
    for (const file of sitemapFiles) {
      try {
        const filePath = path.join(sitemapsDir, file);
        const stats = await fs.stat(filePath);
        
        // Extract entity type from filename (e.g., "repositories-sitemap.xml" -> "repositories")
        const entityType = file.replace('-sitemap.xml', '');
        
        // Read the file content to count <url> tags
        const content = await fs.readFile(filePath, 'utf-8');
        const urlCount = (content.match(/<url>/g) || []).length;
        
        sitemapMetadata.push({
          entity_type: entityType,
          url_count: urlCount,
          last_updated: stats.mtime.toISOString()
        });
      } catch (err) {
        console.error(`Error processing sitemap file ${file}:`, err);
      }
    }
    
    // Prepare the response
    const response = {
      sitemapExists: sitemapIndexExists,
      sitemapMetadata: sitemapMetadata,
      lastUpdated: lastUpdated,
      fileCount: sitemapFiles.length
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting sitemap status:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error retrieving sitemap status' },
      { status: 500 }
    );
  }
} 