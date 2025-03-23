import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import fetch from 'node-fetch';

interface ValidationResult {
  url: string;
  statusCode: number;
  success: boolean;
  error?: string;
}

interface ValidationSummary {
  total: number;
  successful: number;
  failed: number;
  byStatusCode: Record<string, number>;
  failedUrls: ValidationResult[];
}

/**
 * Parses an XML sitemap file and extracts URLs
 */
async function parseXml(filePath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Handle sitemap index
    const sitemapNodes = xmlDoc.getElementsByTagName('sitemap');
    if (sitemapNodes.length > 0) {
      const sitemapFiles: string[] = [];
      for (let i = 0; i < sitemapNodes.length; i++) {
        const locNode = sitemapNodes[i].getElementsByTagName('loc')[0];
        if (locNode && locNode.textContent) {
          sitemapFiles.push(locNode.textContent);
        }
      }
      return sitemapFiles;
    }
    
    // Handle regular sitemap
    const urlNodes = xmlDoc.getElementsByTagName('url');
    const urls: string[] = [];
    
    for (let i = 0; i < urlNodes.length; i++) {
      const locNode = urlNodes[i].getElementsByTagName('loc')[0];
      if (locNode && locNode.textContent) {
        urls.push(locNode.textContent);
      }
    }
    
    return urls;
  } catch (error) {
    console.error(`Error parsing XML file ${filePath}:`, error);
    return [];
  }
}

/**
 * Checks the HTTP status code of a URL
 */
async function checkUrl(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return {
      url,
      statusCode: response.status,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    return {
      url,
      statusCode: 0,
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * API handler for validating sitemap URLs
 */
export async function validateSitemapUrls(request: NextRequest) {
  console.log('SERVER-SIDE: Starting sitemap URL validation');
  
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://github-explorer.example.com');
    const sitemapIndexPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    console.log('SERVER-SIDE: Reading sitemap index from:', sitemapIndexPath);
    
    // Parse the sitemap index to get individual sitemap files
    const sitemapUrls = await parseXml(sitemapIndexPath);
    console.log(`SERVER-SIDE: Found ${sitemapUrls.length} sitemap files in index`);
    
    const allUrls: string[] = [];
    
    // Process each sitemap file
    for (const sitemapUrl of sitemapUrls) {
      let sitemapPath = '';
      
      // Convert URL to local file path
      if (sitemapUrl.startsWith(BASE_URL)) {
        const relativePath = sitemapUrl.replace(BASE_URL, '');
        sitemapPath = path.join(process.cwd(), 'public', relativePath);
      } else {
        sitemapPath = path.join(process.cwd(), 'public', 'sitemaps', path.basename(sitemapUrl));
      }
      
      console.log(`SERVER-SIDE: Processing sitemap: ${sitemapPath}`);
      
      const pageUrls = await parseXml(sitemapPath);
      console.log(`SERVER-SIDE: Found ${pageUrls.length} URLs in sitemap`);
      allUrls.push(...pageUrls);
    }
    
    console.log(`SERVER-SIDE: Total URLs to validate: ${allUrls.length}`);
    
    // Validate URLs in batches to avoid overwhelming the server
    const BATCH_SIZE = 25;
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
      const batch = allUrls.slice(i, i + BATCH_SIZE);
      console.log(`SERVER-SIDE: Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allUrls.length/BATCH_SIZE)}`);
      
      const batchResults = await Promise.all(batch.map(url => checkUrl(url)));
      results.push(...batchResults);
      
      // Small delay to avoid hammering the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summarize results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Group failures by status code
    const byStatusCode = results.reduce((acc, curr) => {
      const key = curr.statusCode.toString();
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);
    
    const summary: ValidationSummary = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      byStatusCode,
      failedUrls: failed.slice(0, 50) // Limit to first 50 failed URLs to keep response size reasonable
    };
    
    console.log(`SERVER-SIDE: Validation complete. ${successful.length}/${results.length} URLs validated successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap URL validation completed',
      summary
    });
  } catch (error: any) {
    console.error('SERVER-SIDE ERROR validating sitemap URLs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate sitemap URLs',
        message: error.message
      },
      { status: 500 }
    );
  }
} 