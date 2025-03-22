import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles operations related to contributor rankings
 */
export async function handleContributorRankings(request: NextRequest) {
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
      case 'calculate':
        return await calculateRankings();
        
      case 'get_latest':
        return await getLatestRankings();
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in contributor rankings API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate contributor rankings and store in database
 */
async function calculateRankings() {
  try {
    // Check if the table exists, create if not
    await ensureRankingsTableExists();
    
    // Execute the ranking calculation query
    await withDb(async (db) => {
      // Create a temporary table to store our calculation results
      await db.run(`
        -- Code Architect
        CREATE TEMPORARY TABLE temp_rankings AS
        WITH commit_metrics AS (
          SELECT 
            c.contributor_id,
            COUNT(DISTINCT c.github_id) AS commit_count,
            SUM(c.additions) AS lines_added,
            SUM(c.deletions) AS lines_removed,
            SUM(c.additions + c.deletions) AS total_lines
          FROM commits c
          WHERE c.contributor_id IS NOT NULL
          GROUP BY c.contributor_id
        ),
        contributor_metrics AS (
          SELECT
            cm.contributor_id,
            cm.commit_count,
            cm.lines_added,
            cm.lines_removed,
            cm.total_lines,
            c.github_id,
            c.username,
            c.name,
            COALESCE(c.followers, 0) AS followers,
            -- Calculate profile completeness (0-100%)
            (
              CASE WHEN c.username IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN c.name IS NOT NULL THEN 10 ELSE 0 END + 
              CASE WHEN c.avatar IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN c.bio IS NOT NULL THEN 15 ELSE 0 END +
              CASE WHEN c.company IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN c.location IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN c.blog IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN c.twitter_username IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN c.top_languages IS NOT NULL THEN 15 ELSE 0 END
            ) AS profile_completeness,
            -- Count repositories contributed to
            (
              SELECT COUNT(DISTINCT cr.repository_id) 
              FROM contributor_repository cr 
              WHERE cr.contributor_id = cm.contributor_id
            ) AS repos_contributed
          FROM commit_metrics cm
          JOIN contributors c ON cm.contributor_id = c.id
        ),
        max_metrics AS (
          SELECT
            MAX(total_lines) AS max_lines,
            MAX(commit_count) AS max_commits,
            MAX(followers) AS max_followers,
            MAX(repos_contributed) AS max_repos
          FROM contributor_metrics
        ),
        -- Calculate code efficiency score from PR vs commits
        code_efficiency AS (
          SELECT
            c.contributor_id,
            c.pull_request_id,
            SUM(c.additions + c.deletions) AS total_commit_changes,
            mr.additions + mr.deletions AS total_pr_changes
          FROM commits c
          JOIN merge_requests mr ON c.pull_request_id = mr.id
          WHERE c.pull_request_id IS NOT NULL
          GROUP BY c.contributor_id, c.pull_request_id
        ),
        code_efficiency_final AS (
          SELECT
            contributor_id,
            AVG(
              CASE 
                WHEN total_commit_changes = 0 THEN 0
                ELSE 
                  1 - ABS(
                    (total_pr_changes - total_commit_changes) / 
                    NULLIF(total_commit_changes, 0)
                  )
              END
            ) * 100 AS efficiency_score
          FROM code_efficiency
          GROUP BY contributor_id
        ),
        -- Calculate collaboration score - rewards developers who work on PRs with multiple contributors
        collaboration_metrics AS (
          SELECT 
            c.contributor_id,
            AVG(contributor_counts.contributor_count) AS avg_collaborators_per_pr,
            MAX(contributor_counts.contributor_count) AS max_collaborators_on_pr
          FROM commits c
          JOIN (
            SELECT 
              pull_request_id, 
              COUNT(DISTINCT contributor_id) AS contributor_count
            FROM commits
            WHERE pull_request_id IS NOT NULL
            GROUP BY pull_request_id
          ) contributor_counts ON c.pull_request_id = contributor_counts.pull_request_id
          WHERE c.pull_request_id IS NOT NULL
          GROUP BY c.contributor_id
        ),
        -- Calculate repository popularity score based on stars and forks
        repo_popularity AS (
          SELECT
            cr.contributor_id,
            -- Calculate weighted popularity of repositories contributor works on
            SUM(
              -- Stars count 70%, forks count 30%
              (COALESCE(r.stars, 0) * 0.7) + (COALESCE(r.forks, 0) * 0.3)
            ) AS total_popularity,
            -- Calculate average popularity per repo
            AVG(
              (COALESCE(r.stars, 0) * 0.7) + (COALESCE(r.forks, 0) * 0.3)
            ) AS avg_popularity,
            -- Count how many popular repos (1000+ stars) contributor works on
            SUM(CASE WHEN r.stars >= 1000 THEN 1 ELSE 0 END) AS popular_repos_count,
            COUNT(r.id) AS total_repos
          FROM contributor_repository cr
          JOIN repositories r ON cr.repository_id = r.id
          GROUP BY cr.contributor_id
        ),
        normalized_metrics AS (
          SELECT
            cm.*,
            -- Normalize metrics to 0-100 scale
            (cm.total_lines * 100.0 / NULLIF(mm.max_lines, 1)) AS code_volume_score,
            (cm.commit_count * 100.0 / NULLIF(mm.max_commits, 1)) AS commit_impact_score,
            (cm.followers * 100.0 / NULLIF(mm.max_followers, 1)) AS followers_score,
            (cm.repos_contributed * 100.0 / NULLIF(mm.max_repos, 1)) AS repo_influence_score,
            -- Include code efficiency score or default to 50 if no data
            COALESCE(ce.efficiency_score, 50) AS code_efficiency_score,
            -- Calculate collaboration score (0-100)
            -- Formula: base 30 points + up to 70 points based on average team size
            -- This heavily rewards working in teams vs solo
            CASE
              WHEN collab.avg_collaborators_per_pr IS NULL THEN 30 -- Default for no data
              ELSE MIN(
                100, -- Cap at 100
                30 + (70 * (COALESCE(collab.avg_collaborators_per_pr, 1) - 1) / 3) -- Scale up to 4 collaborators
              )
            END AS collaboration_score,
            -- Calculate repository popularity score (0-100)
            -- This considers both total popularity and number of popular repos
            CASE
              WHEN rp.total_popularity IS NULL THEN 0 -- No repos
              ELSE MIN(
                100, -- Cap at 100
                -- 60% based on total popularity (log scale to handle extreme values)
                (LN(COALESCE(rp.total_popularity, 1) + 1) / LN(25000) * 60) +
                -- 40% based on number of popular repos (capped at 5)
                (MIN(COALESCE(rp.popular_repos_count, 0), 5) * 8)
              )
            END AS repo_popularity_score
          FROM contributor_metrics cm, max_metrics mm
          LEFT JOIN code_efficiency_final ce ON cm.contributor_id = ce.contributor_id
          LEFT JOIN collaboration_metrics collab ON cm.contributor_id = collab.contributor_id
          LEFT JOIN repo_popularity rp ON cm.contributor_id = rp.contributor_id
        ),
        final_scores AS (
          SELECT
            nm.contributor_id,
            nm.github_id AS contributor_github_id,
            nm.username,
            nm.name,
            -- Calculate total score using weighted average (now including repo popularity)
            (
              nm.code_volume_score * 0.10 + 
              nm.commit_impact_score * 0.10 + 
              nm.code_efficiency_score * 0.15 +
              nm.collaboration_score * 0.20 +
              nm.repo_popularity_score * 0.20 +
              COALESCE(nm.repo_influence_score, 0) * 0.10 + 
              COALESCE(nm.followers_score, 0) * 0.05 + 
              nm.profile_completeness * 0.10
            ) AS total_score,
            nm.code_volume_score,
            nm.code_efficiency_score,
            nm.commit_impact_score,
            nm.collaboration_score,
            nm.repo_popularity_score,
            nm.followers_score,
            nm.repo_influence_score,
            nm.profile_completeness,
            nm.followers,
            nm.commit_count,
            nm.lines_added,
            nm.lines_removed,
            nm.repos_contributed,
            RANK() OVER (ORDER BY 
              (
                nm.code_volume_score * 0.10 + 
                nm.commit_impact_score * 0.10 + 
                nm.code_efficiency_score * 0.15 +
                nm.collaboration_score * 0.20 +
                nm.repo_popularity_score * 0.20 +
                COALESCE(nm.repo_influence_score, 0) * 0.10 + 
                COALESCE(nm.followers_score, 0) * 0.05 + 
                nm.profile_completeness * 0.10
              ) DESC
            ) AS rank_position
          FROM normalized_metrics nm
        )
        
        SELECT * FROM final_scores
      `);
      
      // Insert from temp table to the actual rankings table
      await db.run(`
        INSERT INTO contributor_rankings
        (id, contributor_id, contributor_github_id, rank_position, total_score, 
         code_volume_score, code_efficiency_score, commit_impact_score, collaboration_score, 
         repo_popularity_score, repo_influence_score, followers_score, profile_completeness_score, 
         followers_count, raw_lines_added, raw_lines_removed, raw_commits_count, repositories_contributed, 
         calculation_timestamp)
        SELECT 
          hex(randomblob(16)), -- Generate a random UUID for each row
          contributor_id,
          contributor_github_id,
          rank_position,
          total_score,
          code_volume_score,
          code_efficiency_score,
          commit_impact_score,
          collaboration_score,
          repo_popularity_score,
          repo_influence_score,
          followers_score,
          profile_completeness,
          followers,
          lines_added,
          lines_removed,
          commit_count,
          repos_contributed,
          CURRENT_TIMESTAMP
        FROM temp_rankings
      `);
      
      // Drop the temporary table
      await db.run(`DROP TABLE temp_rankings`);
      
      // Get the count of rankings generated
      const { count } = await db.get(`
        SELECT COUNT(*) as count 
        FROM contributor_rankings 
        WHERE calculation_timestamp = (
          SELECT MAX(calculation_timestamp) FROM contributor_rankings
        )
      `);
      
      return { count };
    });
    
    // Get historical rankings count and latest timestamp
    const stats = await withDb(async (db) => {
      const { count } = await db.get(`
        SELECT COUNT(*) AS count FROM (
          SELECT DISTINCT calculation_timestamp FROM contributor_rankings
        )
      `);
      
      const { latest } = await db.get(`
        SELECT MAX(calculation_timestamp) AS latest FROM contributor_rankings
      `);
      
      const { contributors } = await db.get(`
        SELECT COUNT(DISTINCT contributor_id) AS contributors 
        FROM contributor_rankings
        WHERE calculation_timestamp = (
          SELECT MAX(calculation_timestamp) FROM contributor_rankings
        )
      `);
      
      return {
        calculationsCount: count,
        latestCalculation: latest,
        contributorsRanked: contributors
      };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Contributor rankings calculated successfully',
      stats
    });
  } catch (error: any) {
    console.error('Error calculating contributor rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate rankings' },
      { status: 500 }
    );
  }
}

/**
 * Get the latest contributor rankings
 */
async function getLatestRankings() {
  try {
    const rankings = await withDb(async (db) => {
      const rankings = await db.all(`
        SELECT 
          cr.rank_position,
          cr.contributor_id,
          cr.contributor_github_id,
          cr.total_score,
          cr.code_volume_score,
          cr.code_efficiency_score,
          cr.commit_impact_score,
          cr.repo_influence_score,
          cr.followers_score,
          cr.profile_completeness_score,
          cr.followers_count,
          cr.raw_lines_added,
          cr.raw_lines_removed,
          cr.raw_commits_count,
          cr.repositories_contributed,
          cr.calculation_timestamp,
          c.username,
          c.name,
          c.avatar,
          c.location,
          c.twitter_username,
          c.top_languages
        FROM contributor_rankings cr
        JOIN contributors c ON cr.contributor_id = c.id
        WHERE cr.calculation_timestamp = (
          SELECT MAX(calculation_timestamp) FROM contributor_rankings
        )
        ORDER BY cr.rank_position ASC
        LIMIT 100
      `);
      
      return rankings;
    });
    
    return NextResponse.json({
      rankings
    });
  } catch (error: any) {
    console.error('Error getting latest contributor rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get rankings' },
      { status: 500 }
    );
  }
}

/**
 * Ensure the contributor_rankings table exists
 */
async function ensureRankingsTableExists() {
  await withDb(async (db) => {
    // Check if the table already exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='contributor_rankings'
    `);
    
    // If the table doesn't exist, create it
    if (!tableExists) {
      await db.run(`
        CREATE TABLE contributor_rankings (
          id TEXT PRIMARY KEY,
          contributor_id TEXT NOT NULL,
          contributor_github_id INTEGER NOT NULL,
          rank_position INTEGER NOT NULL,
          total_score REAL NOT NULL,
          code_volume_score REAL NOT NULL,
          code_efficiency_score REAL NOT NULL,
          commit_impact_score REAL NOT NULL,
          collaboration_score REAL NOT NULL,
          repo_popularity_score REAL NOT NULL,
          repo_influence_score REAL NOT NULL,
          followers_score REAL NOT NULL,
          profile_completeness_score REAL NOT NULL,
          followers_count INTEGER,
          raw_lines_added INTEGER,
          raw_lines_removed INTEGER,
          raw_commits_count INTEGER,
          repositories_contributed INTEGER,
          calculation_timestamp TIMESTAMP NOT NULL
        )
      `);
      
      // Create indices for efficient querying
      await db.run(`CREATE INDEX idx_contributor_rankings_contributor_id ON contributor_rankings(contributor_id)`);
      await db.run(`CREATE INDEX idx_contributor_rankings_timestamp ON contributor_rankings(calculation_timestamp)`);
      await db.run(`CREATE INDEX idx_contributor_rankings_rank ON contributor_rankings(rank_position)`);
    } else {
      // Check for missing columns and add them if needed
      
      // Check if the collaboration_score column exists
      try {
        await db.get(`SELECT collaboration_score FROM contributor_rankings LIMIT 1`);
      } catch (e: any) {
        // If the column doesn't exist, add it
        if (e.message.includes('no such column')) {
          await db.run(`ALTER TABLE contributor_rankings ADD COLUMN collaboration_score REAL DEFAULT 30`);
        }
      }
      
      // Check if the repo_popularity_score column exists
      try {
        await db.get(`SELECT repo_popularity_score FROM contributor_rankings LIMIT 1`);
      } catch (e: any) {
        // If the column doesn't exist, add it
        if (e.message.includes('no such column')) {
          await db.run(`ALTER TABLE contributor_rankings ADD COLUMN repo_popularity_score REAL DEFAULT 0`);
        }
      }
    }
  });
} 