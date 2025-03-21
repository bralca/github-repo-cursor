import fs from 'fs/promises';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import fetch from 'node-fetch';
import chalk from 'chalk';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface ValidationResult {
  url: string;
  statusCode: number;
  success: boolean;
  error?: string;
}

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

async function validateSitemap() {
  console.log(chalk.blue('Starting sitemap URL validation...'));
  console.log(chalk.blue(`Using base URL: ${BASE_URL}`));
  
  // Get the sitemap index
  const sitemapIndexPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  console.log(chalk.blue(`Reading sitemap index from: ${sitemapIndexPath}`));
  
  try {
    // Parse the sitemap index to get individual sitemap files
    const sitemapUrls = await parseXml(sitemapIndexPath);
    console.log(chalk.blue(`Found ${sitemapUrls.length} sitemap files in index`));
    
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
      
      console.log(chalk.blue(`Processing sitemap: ${sitemapPath}`));
      
      const pageUrls = await parseXml(sitemapPath);
      console.log(chalk.blue(`Found ${pageUrls.length} URLs in sitemap`));
      allUrls.push(...pageUrls);
    }
    
    console.log(chalk.blue(`Total URLs to validate: ${allUrls.length}`));
    
    // Validate URLs in batches to avoid overwhelming the server
    const BATCH_SIZE = 25;
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
      const batch = allUrls.slice(i, i + BATCH_SIZE);
      console.log(chalk.blue(`Processing batch ${i/BATCH_SIZE + 1}/${Math.ceil(allUrls.length/BATCH_SIZE)}`));
      
      const batchResults = await Promise.all(batch.map(url => checkUrl(url)));
      results.push(...batchResults);
      
      // Small delay to avoid hammering the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summarize results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(chalk.green(`\n✅ ${successful.length} URLs returned successful status codes`));
    
    if (failed.length > 0) {
      console.log(chalk.red(`\n❌ ${failed.length} URLs failed validation:`));
      
      failed.forEach(result => {
        console.log(chalk.red(`  - ${result.url}: ${result.statusCode} ${result.error || ''}`));
      });
      
      // Group failures by status code
      const byStatusCode = failed.reduce((acc, curr) => {
        const key = curr.statusCode || 'Error';
        if (!acc[key]) acc[key] = 0;
        acc[key]++;
        return acc;
      }, {} as Record<string | number, number>);
      
      console.log(chalk.red('\nFailures by status code:'));
      Object.entries(byStatusCode).forEach(([code, count]) => {
        console.log(chalk.red(`  - ${code}: ${count}`));
      });
    }
    
    // Output summary
    console.log(chalk.blue(`\nSummary: ${successful.length}/${results.length} URLs validated successfully (${(successful.length/results.length*100).toFixed(2)}%)`));
  } catch (error) {
    console.error(chalk.red('Error validating sitemap:'), error);
  }
}

// Run the validation
validateSitemap().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 