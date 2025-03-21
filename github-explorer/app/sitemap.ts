import { MetadataRoute } from 'next';

/**
 * Generates a sitemap index listing all the various entity sitemaps
 * This follows the Sitemap Index format: https://www.sitemaps.org/protocol.html#index
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Base URL for the application
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://github-explorer.example.com';
  
  // Today's date in ISO format for lastModified
  const today = new Date().toISOString();
  
  // Static pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/repositories`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contributors`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/merge-requests`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/commits`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ] as MetadataRoute.Sitemap;
  
  // Define sitemap index entries
  // Each points to a specific entity type sitemap
  const sitemapIndex = [
    {
      url: `${baseUrl}/sitemaps/repositories-sitemap.xml`,
      lastModified: today,
    },
    {
      url: `${baseUrl}/sitemaps/contributors-sitemap.xml`,
      lastModified: today,
    },
    {
      url: `${baseUrl}/sitemaps/merge-requests-sitemap.xml`,
      lastModified: today,
    },
    {
      url: `${baseUrl}/sitemaps/commits-sitemap.xml`,
      lastModified: today,
    },
  ] as MetadataRoute.Sitemap;
  
  // Return both static pages and sitemap index entries
  return [...staticPages, ...sitemapIndex];
} 