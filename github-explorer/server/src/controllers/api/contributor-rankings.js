import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
import { randomUUID } from 'crypto';

/**
 * Handle contributor rankings operations
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function handleContributorRankings(req, res) {
  try {
    // Extract operation from request body
    const { operation, timeframe } = req.body;
    
    if (!operation) {
      return res.status(400).json({ error: 'Operation is required' });
    }
    
    // Handle different operations
    switch (operation) {
      case 'get_latest':
        return await getLatestRankings(req, res);
        
      case 'get_by_timeframe':
        return await getRankingsByTimeframe(req, res, timeframe);
        
      case 'calculate':
        return await calculateRankings(req, res);
        
      default:
        return res.status(400).json({ error: `Unknown operation: ${operation}` });
    }
  } catch (error) {
    console.error('Error in contributor rankings API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get the latest contributor rankings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getLatestRankings(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Step 1: Get the most recent timestamp
    const latestTimestamp = await db.get(
      `SELECT MAX(calculation_timestamp) as latest_timestamp FROM contributor_rankings`
    );
    
    if (!latestTimestamp.latest_timestamp) {
      return res.json({ rankings: [], timestamp: null });
    }
    
    // Step 2: Get rankings with contributor details
    const rankings = await db.all(`
      SELECT 
        cr.*,
        c.username,
        c.name,
        c.avatar,
        c.location,
        c.twitter_username,
        c.top_languages
      FROM contributor_rankings cr
      JOIN contributors c ON cr.contributor_id = c.id
      WHERE cr.calculation_timestamp = ?
      AND COALESCE(c.is_bot, 0) = 0
      ORDER BY cr.rank_position ASC
      LIMIT 100
    `, [latestTimestamp.latest_timestamp]);
    
    // Step 3: Get the most popular repository for each contributor
    for (const ranking of rankings) {
      const popularRepo = await db.get(`
        SELECT 
          r.name, 
          r.full_name, 
          r.url, 
          r.stars,
          r.github_id
        FROM repositories r
        JOIN contributor_repository cr ON r.id = cr.repository_id
        WHERE cr.contributor_id = ?
        ORDER BY r.stars DESC
        LIMIT 1
      `, [ranking.contributor_id]);
      
      if (popularRepo) {
        ranking.most_popular_repository = popularRepo;
      }
      
      // Step 4: Get the most collaborative merge request for each contributor
      const mostCollaborativeMR = await getMostCollaborativeMergeRequest(db, ranking.contributor_id);
      if (mostCollaborativeMR) {
        ranking.most_collaborative_merge_request = mostCollaborativeMR;
      }
    }
    
    return res.json({
      rankings,
      timestamp: latestTimestamp.latest_timestamp
    });
  } catch (error) {
    console.error('Error fetching latest rankings:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch latest rankings' });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Get contributor rankings for a specific timeframe
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} timeframe - Timeframe to get rankings for ('24h', '7d', '30d', 'all')
 */
async function getRankingsByTimeframe(req, res, timeframe) {
  let db = null;
  try {
    if (!timeframe || !['24h', '7d', '30d', 'all'].includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe. Must be one of: 24h, 7d, 30d, all' });
    }
    
    db = await openSQLiteConnection();
    
    // For now, we just return the latest rankings regardless of timeframe
    // In the future, we can implement filtering by date if needed
    const latestTimestamp = await db.get(
      `SELECT MAX(calculation_timestamp) as latest_timestamp FROM contributor_rankings`
    );
    
    if (!latestTimestamp.latest_timestamp) {
      return res.json({ rankings: [], timestamp: null });
    }
    
    // Get rankings with contributor details
    const rankings = await db.all(`
      SELECT 
        cr.*,
        c.username,
        c.name,
        c.avatar,
        c.location,
        c.twitter_username,
        c.top_languages
      FROM contributor_rankings cr
      JOIN contributors c ON cr.contributor_id = c.id
      WHERE cr.calculation_timestamp = ?
      AND COALESCE(c.is_bot, 0) = 0
      ORDER BY cr.rank_position ASC
      LIMIT 100
    `, [latestTimestamp.latest_timestamp]);
    
    // Get the most popular repository for each contributor
    for (const ranking of rankings) {
      const popularRepo = await db.get(`
        SELECT 
          r.name, 
          r.full_name, 
          r.url, 
          r.stars,
          r.github_id
        FROM repositories r
        JOIN contributor_repository cr ON r.id = cr.repository_id
        WHERE cr.contributor_id = ?
        ORDER BY r.stars DESC
        LIMIT 1
      `, [ranking.contributor_id]);
      
      if (popularRepo) {
        ranking.most_popular_repository = popularRepo;
      }
      
      // Get the most collaborative merge request for each contributor
      const mostCollaborativeMR = await getMostCollaborativeMergeRequest(db, ranking.contributor_id);
      if (mostCollaborativeMR) {
        ranking.most_collaborative_merge_request = mostCollaborativeMR;
      }
    }
    
    return res.json({
      rankings,
      timestamp: latestTimestamp.latest_timestamp,
      timeframe
    });
  } catch (error) {
    console.error(`Error fetching rankings for timeframe ${timeframe}:`, error);
    return res.status(500).json({ error: error.message || `Failed to fetch rankings for timeframe ${timeframe}` });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Get the most collaborative merge request for a contributor
 * @param {object} db - Database connection
 * @param {string} contributorId - Contributor ID
 * @returns {object|null} Most collaborative merge request or null if none found
 */
async function getMostCollaborativeMergeRequest(db, contributorId) {
  try {
    // Find merge requests where this contributor participated
    const mergeRequests = await db.all(`
      SELECT DISTINCT 
        c.pull_request_id
      FROM commits c
      JOIN merge_requests mr ON c.pull_request_id = mr.id
      JOIN repositories r ON mr.repository_id = r.id
      WHERE c.contributor_id = ?
      AND r.is_fork = 0
    `, [contributorId]);
    
    if (!mergeRequests || mergeRequests.length === 0) {
      return null;
    }
    
    // For each merge request, count distinct contributors and get details
    let mostCollaborative = null;
    let maxCollaborators = 0;
    
    for (const mr of mergeRequests) {
      const collaboratorInfo = await db.get(`
        SELECT 
          mr.id,
          mr.github_id as merge_request_github_id,
          mr.title,
          mr.state,
          r.name as repository_name,
          r.url as repository_url,
          r.github_id as repository_github_id,
          COUNT(DISTINCT CASE WHEN COALESCE(cont.is_bot, 0) = 0 THEN c.contributor_id END) as collaborator_count
        FROM merge_requests mr
        JOIN commits c ON c.pull_request_id = mr.id
        JOIN contributors cont ON c.contributor_id = cont.id
        JOIN repositories r ON mr.repository_id = r.id
        WHERE mr.id = ?
        GROUP BY mr.id
      `, [mr.pull_request_id]);
      
      if (collaboratorInfo && collaboratorInfo.collaborator_count > maxCollaborators) {
        maxCollaborators = collaboratorInfo.collaborator_count;
        mostCollaborative = collaboratorInfo;
      }
    }
    
    if (!mostCollaborative) {
      return null;
    }
    
    // Get collaborator details for the most collaborative merge request
    const collaborators = await db.all(`
      SELECT DISTINCT
        cont.id,
        cont.github_id,
        cont.username,
        cont.name,
        cont.avatar
      FROM commits c
      JOIN contributors cont ON c.contributor_id = cont.id
      WHERE c.pull_request_id = ?
      AND COALESCE(cont.is_bot, 0) = 0
      LIMIT 8
    `, [mostCollaborative.id]);
    
    return {
      id: mostCollaborative.id,
      github_id: mostCollaborative.merge_request_github_id,
      title: mostCollaborative.title,
      repository_name: mostCollaborative.repository_name,
      repository_url: mostCollaborative.repository_url,
      repository_github_id: mostCollaborative.repository_github_id,
      state: mostCollaborative.state,
      collaborator_count: maxCollaborators,
      collaborators: collaborators
    };
  } catch (error) {
    console.error('Error fetching most collaborative merge request:', error);
    return null;
  }
}

/**
 * Calculate contributor rankings and store in database
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function calculateRankings(req, res) {
  let db = null;
  try {
    console.log('Starting to calculate contributor rankings...');
    db = await openSQLiteConnection();
    
    // Generate a timestamp for this calculation batch
    const calculationTimestamp = new Date().toISOString();
    
    // Define the comprehensive ranking calculation SQL query
    // This follows the metric calculations shown in the UI
    const rankingQuery = `
      WITH commit_metrics AS (
        SELECT 
          c.contributor_id,
          COUNT(DISTINCT c.id) AS commit_count,
          SUM(c.additions) AS lines_added,
          SUM(c.deletions) AS lines_removed,
          SUM(c.additions + c.deletions) AS total_lines,
          -- For calculating code efficiency (how closely PR changes match commit changes)
          -- AVG means average when grouping by contributor
          AVG(CASE 
            WHEN c.pull_request_id IS NOT NULL THEN 
              -- Get 1 - |PR changes - commit changes| / commit changes
              -- Where PR changes = additions + deletions from the PR
              -- And commit changes = additions + deletions from the commit
              -- If perfect match, this is 1 (100% efficient)
              (1 - ABS((
                SELECT mr.additions + mr.deletions 
                FROM merge_requests mr 
                WHERE mr.id = c.pull_request_id
              ) - (c.additions + c.deletions)) / NULLIF((c.additions + c.deletions), 1))
            ELSE NULL
          END) AS code_efficiency
        FROM commits c
        -- Only consider commits from non-forked repositories for more accurate ranking
        JOIN repositories r ON c.repository_id = r.id
        WHERE c.contributor_id IS NOT NULL
        AND COALESCE(r.is_fork, 0) = 0
        GROUP BY c.contributor_id
      ),
      collaboration_metrics AS (
        SELECT 
          c.contributor_id,
          -- Calculate collaboration score based on average number of collaborators per PR
          AVG(CASE
            WHEN c.pull_request_id IS NOT NULL THEN (
              SELECT 100 * (1 - 1/POWER(COUNT(DISTINCT co.contributor_id), 0.8))
              FROM commits co
              WHERE co.pull_request_id = c.pull_request_id
              AND co.contributor_id IS NOT NULL
            )
            ELSE 0
          END) AS collaboration_score
        FROM commits c
        WHERE c.contributor_id IS NOT NULL
        AND c.pull_request_id IS NOT NULL
        GROUP BY c.contributor_id
      ),
      repository_metrics AS (
        SELECT 
          cr.contributor_id,
          COUNT(DISTINCT cr.repository_id) AS repos_contributed,
          -- Calculate repository popularity score:
          -- 60% from log scale of total popularity + 40% from number of popular repos
          (
            -- 60% component: ln(total_stars + 1) / ln(25000) × 60
            -- This scales logarithmically, capping at ln(25000) as "max" stars
            LN(SUM(COALESCE(r.stars, 0)) + 1) / LN(25000) * 60 +
            -- 40% component: min(count of repos with 1000+ stars, 5) × 8
            -- This rewards having multiple popular repos, up to 5
            MIN(COUNT(CASE WHEN COALESCE(r.stars, 0) >= 1000 THEN 1 END), 5) * 8
          ) AS repo_popularity_score
        FROM contributor_repository cr
        JOIN repositories r ON cr.repository_id = r.id
        WHERE COALESCE(r.is_fork, 0) = 0
        GROUP BY cr.contributor_id
      ),
      contributor_metrics AS (
        SELECT
          comit.contributor_id,
          comit.commit_count,
          comit.lines_added,
          comit.lines_removed,
          comit.total_lines,
          -- Code efficiency score capped at 100
          MIN(COALESCE(comit.code_efficiency * 100, 0), 100) AS code_efficiency_score,
          c.github_id,
          c.username,
          c.name,
          c.avatar,
          c.bio,
          c.company,
          c.location,
          c.blog,
          c.twitter_username,
          c.top_languages,
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
          ) AS profile_completeness_score,
          COALESCE(rm.repos_contributed, 0) AS repos_contributed,
          COALESCE(rm.repo_popularity_score, 0) AS repo_popularity_score,
          COALESCE(collab.collaboration_score, 0) AS collaboration_score
        FROM commit_metrics comit
        JOIN contributors c ON comit.contributor_id = c.id
        LEFT JOIN repository_metrics rm ON comit.contributor_id = rm.contributor_id
        LEFT JOIN collaboration_metrics collab ON comit.contributor_id = collab.contributor_id
      ),
      max_metrics AS (
        SELECT
          MAX(total_lines) AS max_lines,
          MAX(commit_count) AS max_commits,
          MAX(followers) AS max_followers,
          MAX(repos_contributed) AS max_repos
        FROM contributor_metrics
      ),
      final_scores AS (
        SELECT
          cm.contributor_id,
          cm.github_id AS contributor_github_id,
          cm.username,
          cm.name,
          cm.avatar,
          -- Code Volume Score: normalized total lines (5% weight)
          (cm.total_lines * 100.0 / NULLIF(mm.max_lines, 1)) AS code_volume_score,
          -- Code Efficiency Score: how closely PR changes match commit changes (15% weight)
          cm.code_efficiency_score,
          -- Commit Impact Score: normalized commit count (10% weight)
          (cm.commit_count * 100.0 / NULLIF(mm.max_commits, 1)) AS commit_impact_score,
          -- Team Collaboration Score: based on avg collaborators per PR (20% weight)
          COALESCE(cm.collaboration_score, 0) AS collaboration_score,
          -- Repository Popularity Score: based on stars/popularity (20% weight) 
          COALESCE(cm.repo_popularity_score, 0) AS repo_popularity_score,
          -- Repository Influence Score: normalized repos contributed (10% weight)
          (cm.repos_contributed * 100.0 / NULLIF(mm.max_repos, 1)) AS repo_influence_score,
          -- Followers Score: normalized followers count (15% weight)
          (cm.followers * 100.0 / NULLIF(mm.max_followers, 1)) AS followers_score,
          -- Profile Completeness Score: profile completeness points (5% weight)
          cm.profile_completeness_score,
          -- Raw metrics for reference
          cm.followers AS followers_count,
          cm.commit_count AS raw_commits_count,
          cm.lines_added AS raw_lines_added,
          cm.lines_removed AS raw_lines_removed,
          cm.repos_contributed AS repositories_contributed,
          -- Calculate total score using weighted average of all metrics
          (
            (cm.total_lines * 100.0 / NULLIF(mm.max_lines, 1)) * 0.05 + -- Code Volume (5%)
            cm.code_efficiency_score * 0.15 + -- Code Efficiency (15%)
            (cm.commit_count * 100.0 / NULLIF(mm.max_commits, 1)) * 0.10 + -- Commit Impact (10%)
            COALESCE(cm.collaboration_score, 0) * 0.20 + -- Team Collaboration (20%)
            COALESCE(cm.repo_popularity_score, 0) * 0.20 + -- Repository Popularity (20%)
            (cm.repos_contributed * 100.0 / NULLIF(mm.max_repos, 1)) * 0.10 + -- Repository Influence (10%)
            (cm.followers * 100.0 / NULLIF(mm.max_followers, 1)) * 0.15 + -- Followers (15%)
            cm.profile_completeness_score * 0.05 -- Profile (5%)
          ) AS total_score,
          -- Calculate rank position based on total score (descending)
          RANK() OVER (ORDER BY (
            (cm.total_lines * 100.0 / NULLIF(mm.max_lines, 1)) * 0.05 +
            cm.code_efficiency_score * 0.15 +
            (cm.commit_count * 100.0 / NULLIF(mm.max_commits, 1)) * 0.10 +
            COALESCE(cm.collaboration_score, 0) * 0.20 +
            COALESCE(cm.repo_popularity_score, 0) * 0.20 +
            (cm.repos_contributed * 100.0 / NULLIF(mm.max_repos, 1)) * 0.10 +
            (cm.followers * 100.0 / NULLIF(mm.max_followers, 1)) * 0.15 +
            cm.profile_completeness_score * 0.05
          ) DESC) AS rank_position
        FROM contributor_metrics cm, max_metrics mm
        -- Filter out bots
        WHERE COALESCE((SELECT is_bot FROM contributors WHERE id = cm.contributor_id), 0) = 0
      )
      SELECT 
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
        profile_completeness_score,
        followers_count,
        raw_commits_count,
        raw_lines_added,
        raw_lines_removed,
        repositories_contributed
      FROM final_scores
      ORDER BY rank_position ASC
    `;
    
    console.log('Executing ranking calculation query...');
    const rankingResults = await db.all(rankingQuery);
    console.log(`Calculated rankings for ${rankingResults.length} contributors`);
    
    // Insert the calculated rankings into the database
    if (rankingResults.length > 0) {
      console.log('Inserting calculated rankings into database...');
      
      // Use a transaction for better performance and atomicity
      await db.run('BEGIN TRANSACTION');
      
      // Track metrics for response
      let insertedCount = 0;
      let errorCount = 0;
      
      for (const ranking of rankingResults) {
        try {
          // Generate UUID for this ranking record
          const rankingId = randomUUID();
          
          await db.run(`
            INSERT INTO contributor_rankings (
              id,
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
              profile_completeness_score,
              followers_count,
              raw_lines_added,
              raw_lines_removed,
              raw_commits_count,
              repositories_contributed,
              calculation_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            rankingId,
            ranking.contributor_id,
            ranking.contributor_github_id,
            ranking.rank_position,
            ranking.total_score,
            ranking.code_volume_score,
            ranking.code_efficiency_score,
            ranking.commit_impact_score,
            ranking.collaboration_score,
            ranking.repo_popularity_score,
            ranking.repo_influence_score,
            ranking.followers_score,
            ranking.profile_completeness_score,
            ranking.followers_count,
            ranking.raw_lines_added,
            ranking.raw_lines_removed,
            ranking.raw_commits_count,
            ranking.repositories_contributed,
            calculationTimestamp
          ]);
          
          insertedCount++;
        } catch (insertError) {
          console.error(`Error inserting ranking for contributor ${ranking.contributor_id}:`, insertError);
          errorCount++;
        }
      }
      
      // Commit the transaction
      await db.run('COMMIT');
      console.log(`Successfully inserted ${insertedCount} rankings, errors: ${errorCount}`);
      
      // Get stats about calculation history
      const stats = {
        contributorsRanked: insertedCount,
        latestCalculation: calculationTimestamp,
        calculationsCount: 0
      };
      
      const calculationsCount = await db.get(`
        SELECT COUNT(DISTINCT calculation_timestamp) as count 
        FROM contributor_rankings
      `);
      
      if (calculationsCount) {
        stats.calculationsCount = calculationsCount.count;
      }
      
      return res.json({
        success: true,
        message: `Rankings calculated for ${insertedCount} contributors`,
        stats
      });
    } else {
      return res.json({
        success: false,
        message: 'No contributors found to rank',
        stats: {
          contributorsRanked: 0,
          latestCalculation: null,
          calculationsCount: 0
        }
      });
    }
  } catch (error) {
    console.error('Error calculating contributor rankings:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Error calculating rankings',
      message: 'Failed to calculate contributor rankings' 
    });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 