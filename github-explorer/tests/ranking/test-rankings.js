// Test script for developer rankings
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database - the database is at the workspace root
const dbPath = path.resolve(__dirname, '../../../github_explorer.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database');
  
  // Run the ranking calculation
  calculateRankings();
});

function calculateRankings() {
  console.log('Calculating rankings...');
  
  const query = `
    WITH commit_metrics AS (
      SELECT 
        c.contributor_id,
        COUNT(DISTINCT c.id) AS commit_count,
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
    normalized_metrics AS (
      SELECT
        cm.*,
        -- Normalize metrics to 0-100 scale
        (cm.total_lines * 100.0 / NULLIF(mm.max_lines, 1)) AS code_volume_score,
        (cm.commit_count * 100.0 / NULLIF(mm.max_commits, 1)) AS commit_impact_score,
        (cm.followers * 100.0 / NULLIF(mm.max_followers, 1)) AS followers_score,
        (cm.repos_contributed * 100.0 / NULLIF(mm.max_repos, 1)) AS repo_influence_score
      FROM contributor_metrics cm, max_metrics mm
    ),
    final_scores AS (
      SELECT
        nm.contributor_id,
        nm.github_id AS contributor_github_id,
        nm.username,
        nm.name,
        -- Calculate total score using weighted average
        (
          nm.code_volume_score * 0.25 + 
          nm.commit_impact_score * 0.25 + 
          COALESCE(nm.repo_influence_score, 0) * 0.15 + 
          COALESCE(nm.followers_score, 0) * 0.15 + 
          nm.profile_completeness * 0.2
        ) AS total_score,
        nm.code_volume_score,
        nm.commit_impact_score,
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
            nm.code_volume_score * 0.25 + 
            nm.commit_impact_score * 0.25 + 
            COALESCE(nm.repo_influence_score, 0) * 0.15 + 
            COALESCE(nm.followers_score, 0) * 0.15 + 
            nm.profile_completeness * 0.2
          ) DESC
        ) AS rank_position
      FROM normalized_metrics nm
    )
    
    -- Get the top 10 developers by score
    SELECT
      username,
      name,
      total_score,
      code_volume_score,
      commit_impact_score,
      followers_score,
      repo_influence_score,
      profile_completeness,
      rank_position,
      followers,
      commit_count,
      lines_added,
      lines_removed,
      repos_contributed
    FROM final_scores
    ORDER BY total_score DESC
    LIMIT 10;
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error executing query:', err.message);
      closeDbAndExit(1);
    }
    
    console.log('Rankings calculated successfully:');
    console.table(rows);
    
    closeDbAndExit(0);
  });
}

function closeDbAndExit(code) {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(code);
  });
} 