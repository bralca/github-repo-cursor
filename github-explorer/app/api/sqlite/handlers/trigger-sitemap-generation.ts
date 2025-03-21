import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { withDb } from '@/lib/database/connection';

// Add type definitions at the top of the file
interface CommitRecord {
  id: number;
  github_id: string;
  full_name: string;
  committed_at?: string;
  repository_github_id: number;
  repository_name: string;
  merge_request_github_id?: number;
  merge_request_title?: string;
  contributor_github_id?: number;
  contributor_name?: string;
  contributor_username?: string;
  filename?: string;
}

interface RepositoryRecord {
  id: number;
  github_id: number;
  full_name: string;
  name: string;
}

interface ContributorRecord {
  id: number;
  github_id: number;
  username: string;
  name?: string;
}

interface MergeRequestRecord {
  id: number;
  github_id: number;
  full_name: string;
  repository_github_id: number;
  title: string;
}

interface SitemapResult {
  filename: string;
  entity_type: string;
  url_count: number;
  additional_info?: {
    total_commit_records?: number;
    explanation?: string;
  };
}

// Get the base URL from environment variables or use a default
const getBaseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://github-explorer.example.com');

/**
 * Helper function to generate URL-friendly slugs
 */
function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')    // Remove non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '')          // Trim hyphens from end
    .substring(0, 50);           // Truncate to reasonable length
}

/**
 * Generate repository URL according to pattern: /repository-name-githubID
 */
function generateRepoUrl(name: string, githubId: number | string): string {
  return `/${generateSlug(name)}-${githubId}`;
}

/**
 * Generate contributor URL according to pattern: /name-username-githubID
 */
function generateContributorUrl(name: string, username: string, githubId: number | string): string {
  const namePart = name ? `${generateSlug(name)}-` : '';
  return `/contributors/${namePart}${generateSlug(username)}-${githubId}`;
}

/**
 * Generate merge request URL according to pattern: /repository-name-githubID/merge-requests/merge_request-title-githubid
 */
function generateMergeRequestUrl(repoName: string, repoGithubId: number | string, title: string, mrGithubId: number | string): string {
  return `${generateRepoUrl(repoName, repoGithubId)}/merge-requests/${generateSlug(title)}-${mrGithubId}`;
}

/**
 * Generate commit URL according to pattern: 
 * /repository-name-githubID/merge-requests/merge_request-title-githubid/commits/name-username-githubID/filename-githubID
 */
function generateCommitUrl(
  repoName: string, 
  repoGithubId: number | string, 
  mrTitle: string | undefined, 
  mrGithubId: number | string | undefined,
  contributorName: string | undefined,
  contributorUsername: string | undefined,
  contributorGithubId: number | string | undefined,
  filename: string | undefined,
  commitId: string
): string | null {
  // Skip if any required components are missing
  if (!mrTitle || !mrGithubId || !contributorUsername || !contributorGithubId || !filename) {
    console.log(`SERVER-SIDE: Skipping commit ${commitId} due to missing data for full URL pattern`);
    return null;
  }
  
  const repoUrl = generateRepoUrl(repoName, repoGithubId);
  const mrSegment = `merge-requests/${generateSlug(mrTitle)}-${mrGithubId}`;
  
  const contributorNamePart = contributorName ? `${generateSlug(contributorName)}-` : '';
  const contributorSegment = `${contributorNamePart}${generateSlug(contributorUsername)}-${contributorGithubId}`;
  
  const fileSegment = `${generateSlug(filename)}-${commitId}`;
  
  return `${repoUrl}/${mrSegment}/commits/${contributorSegment}/${fileSegment}`;
}

/**
 * Triggers the sitemap generation
 * 
 * This function runs on the server side in the Next.js API route.
 * It directly generates sitemap files in the public directory.
 */
export async function triggerSitemapGeneration(request: NextRequest) {
  console.log('SERVER-SIDE: Starting sitemap generation process');
  
  try {
    // Ensure the sitemaps directory exists in public
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapsDir = path.join(publicDir, 'sitemaps');
    
    console.log('SERVER-SIDE: Creating sitemaps directory at', sitemapsDir);
    
    try {
      await fs.mkdir(sitemapsDir, { recursive: true });
    } catch (err) {
      console.log('SERVER-SIDE: Directory already exists or cannot be created');
    }
    
    // Get entity counts from the database
    console.log('SERVER-SIDE: Fetching entity counts from database');
    const counts = await withDb(async (db) => {
      return {
        repositories: await db.get('SELECT COUNT(*) as count FROM repositories'),
        contributors: await db.get('SELECT COUNT(*) as count FROM contributors'),
        merge_requests: await db.get('SELECT COUNT(*) as count FROM merge_requests'),
        commits: await db.get('SELECT COUNT(*) as count FROM commits')
      };
    });
    
    console.log('SERVER-SIDE: Entity counts retrieved:', counts);
    
    // Generate sitemap for repositories
    console.log('SERVER-SIDE: Generating repositories sitemap');
    const repoSitemap = await generateRepositoriesSitemap();
    
    // Generate sitemap for contributors
    console.log('SERVER-SIDE: Generating contributors sitemap');
    const contributorSitemap = await generateContributorsSitemap();
    
    // Generate sitemap for merge requests
    console.log('SERVER-SIDE: Generating merge requests sitemap');
    const mergeSitemap = await generateMergeRequestsSitemap();
    
    // Generate sitemap for commits
    console.log('SERVER-SIDE: Generating commits sitemap');
    const commitsSitemap = await generateCommitsSitemap();
    
    // Generate sitemap index that points to all sitemaps
    console.log('SERVER-SIDE: Generating sitemap index');
    await generateSitemapIndex([
      { file: 'repositories-sitemap.xml', count: counts.repositories?.count || 0 },
      { file: 'contributors-sitemap.xml', count: counts.contributors?.count || 0 },
      { file: 'merge-requests-sitemap.xml', count: counts.merge_requests?.count || 0 },
      { file: 'commits-sitemap.xml', count: commitsSitemap.url_count }
    ]);
    
    console.log('SERVER-SIDE: Sitemap generation completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap generation completed',
      entityCounts: {
        repositories: counts.repositories?.count || 0,
        contributors: counts.contributors?.count || 0,
        mergeRequests: counts.merge_requests?.count || 0,
        commits: commitsSitemap.additional_info?.total_commit_records || 0
      }
    });
  } catch (error: any) {
    console.error('SERVER-SIDE ERROR generating sitemap:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate sitemap',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Generate the repositories sitemap
 */
async function generateRepositoriesSitemap() {
  const sitemap = await withDb(async (db) => {
    const repositories = await db.all<RepositoryRecord[]>('SELECT id, github_id, full_name, name FROM repositories LIMIT 49000');
    
    const baseUrl = getBaseUrl();
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const repo of repositories) {
      const repoPath = generateRepoUrl(repo.name || repo.full_name.split('/').pop() || '', repo.github_id);
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${repoPath}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    
    return { xml, count: repositories.length };
  });
  
  // Write sitemap to file
  await fs.writeFile(
    path.join(process.cwd(), 'public', 'sitemaps', 'repositories-sitemap.xml'),
    sitemap.xml
  );
  
  return sitemap;
}

/**
 * Generate the contributors sitemap
 */
async function generateContributorsSitemap() {
  const sitemap = await withDb(async (db) => {
    const contributors = await db.all<ContributorRecord[]>('SELECT id, github_id, username, name FROM contributors LIMIT 49000');
    
    const baseUrl = getBaseUrl();
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const contributor of contributors) {
      if (contributor.username) {
        const contributorPath = generateContributorUrl(contributor.name || '', contributor.username, contributor.github_id);
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${contributorPath}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    }
    
    xml += '</urlset>';
    
    return { xml, count: contributors.length };
  });
  
  // Write sitemap to file
  await fs.writeFile(
    path.join(process.cwd(), 'public', 'sitemaps', 'contributors-sitemap.xml'),
    sitemap.xml
  );
  
  return sitemap;
}

/**
 * Generate the merge requests sitemap
 */
async function generateMergeRequestsSitemap() {
  const sitemap = await withDb(async (db) => {
    const mergeRequests = await db.all<MergeRequestRecord[]>(`
      SELECT mr.id, mr.github_id, r.full_name, mr.title, r.github_id as repository_github_id
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      LIMIT 49000
    `);
    
    const baseUrl = getBaseUrl();
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const mr of mergeRequests) {
      const repoName = mr.full_name.split('/').pop() || '';
      const mrPath = generateMergeRequestUrl(repoName, mr.repository_github_id, mr.title, mr.github_id);
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${mrPath}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    
    return { xml, count: mergeRequests.length };
  });
  
  // Write sitemap to file
  await fs.writeFile(
    path.join(process.cwd(), 'public', 'sitemaps', 'merge-requests-sitemap.xml'),
    sitemap.xml
  );
  
  return sitemap;
}

/**
 * Generate the commits sitemap
 */
async function generateCommitsSitemap(): Promise<SitemapResult> {
  try {
    console.log("SERVER-SIDE: Generating commits sitemap...");
    
    // Count total commits (without grouping)
    const totalCountResult = await withDb(async (db) => {
      return await db.get<{ count: number }>('SELECT COUNT(*) as count FROM commits');
    });
    const totalCommits = totalCountResult?.count || 0;
    
    // Get unique commits with all the data needed for URL generation
    const result = await withDb(async (db) => {
      return await db.all<CommitRecord[]>(`
        SELECT 
          c.id, 
          c.github_id, 
          r.full_name, 
          c.committed_at, 
          r.github_id as repository_github_id, 
          r.name as repository_name,
          mr.github_id as merge_request_github_id,
          mr.title as merge_request_title,
          con.github_id as contributor_github_id,
          con.name as contributor_name,
          con.username as contributor_username,
          c.filename
        FROM commits c
        JOIN repositories r ON c.repository_id = r.id
        LEFT JOIN merge_requests mr ON c.pull_request_id = mr.id
        LEFT JOIN contributors con ON c.contributor_id = con.id
        GROUP BY c.github_id, r.full_name
        LIMIT 49000
      `);
    });
    
    const uniqueCommits = result.length;
    console.log(`SERVER-SIDE: Found ${uniqueCommits} unique commits out of ${totalCommits} total commit records in the database`);
    console.log(`SERVER-SIDE: The difference is because we store individual file changes as separate commit records, but in the sitemap we need only one URL per unique commit SHA per repository`);
    
    const baseUrl = getBaseUrl();
    let skippedCount = 0;
    
    const urlEntries = result.map((commit: CommitRecord) => {
      const commitPath = generateCommitUrl(
        commit.repository_name || commit.full_name.split('/').pop() || '',
        commit.repository_github_id,
        commit.merge_request_title,
        commit.merge_request_github_id,
        commit.contributor_name,
        commit.contributor_username,
        commit.contributor_github_id,
        commit.filename,
        commit.github_id
      );
      
      // Skip this commit if URL generation returned null
      if (commitPath === null) {
        skippedCount++;
        return null;
      }
      
      const lastmod = commit.committed_at ? new Date(commit.committed_at).toISOString() : new Date().toISOString();
      
      return `
        <url>
          <loc>${baseUrl}${commitPath}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.6</priority>
        </url>
      `;
    }).filter(Boolean).join("");  // Filter out null entries
    
    const includedCommits = uniqueCommits - skippedCount;
    console.log(`SERVER-SIDE: Included ${includedCommits} commits in sitemap, skipped ${skippedCount} commits with incomplete data`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urlEntries}
      </urlset>`;

    await fs.writeFile(path.join(process.cwd(), 'public', 'sitemaps', 'commits-sitemap.xml'), xml);
    
    return {
      filename: "commits-sitemap.xml",
      entity_type: "commits",
      url_count: includedCommits,
      additional_info: {
        total_commit_records: totalCommits,
        explanation: "Only includes commits with complete data for URL generation. Grouped by unique commit SHA per repository."
      }
    };
  } catch (error) {
    console.error("SERVER-SIDE ERROR generating commits sitemap:", error);
    throw error;
  }
}

/**
 * Generate the sitemap index
 */
async function generateSitemapIndex(sitemaps: Array<{ file: string, count: number }>) {
  const baseUrl = getBaseUrl();
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add individual sitemaps
  for (const sitemap of sitemaps) {
    if (sitemap.count > 0) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${baseUrl}/sitemaps/${sitemap.file}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }
  }
  
  xml += '</sitemapindex>';
  
  // Write sitemap index to file
  await fs.writeFile(
    path.join(process.cwd(), 'public', 'sitemap.xml'),
    xml
  );
  
  return { xml, count: sitemaps.length };
} 