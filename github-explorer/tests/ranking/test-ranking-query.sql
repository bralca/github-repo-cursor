-- Test query for contributor rankings
WITH 
-- Get total code volume for each contributor (simplified)
code_volume AS (
  SELECT 
    c.contributor_id,
    c.contributor_github_id,
    SUM(c.additions) AS total_additions,
    SUM(c.deletions) AS total_deletions,
    SUM(c.additions + c.deletions) AS total_lines,
    COUNT(DISTINCT c.github_id) AS total_commits
  FROM commits c
  GROUP BY c.contributor_id, c.contributor_github_id
  LIMIT 5
),

-- Get max values for normalization
max_values AS (
  SELECT 
    MAX(total_lines) AS max_lines,
    MAX(total_commits) AS max_commits
  FROM code_volume
),

-- Get contributor profile metrics (simplified)
profile_metrics AS (
  SELECT 
    c.id AS contributor_id,
    c.github_id AS contributor_github_id,
    COALESCE(c.followers, 0) AS followers_count,
    -- Simplified profile completeness
    (
      CASE WHEN c.username IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN c.name IS NOT NULL THEN 10 ELSE 0 END + 
      CASE WHEN c.avatar IS NOT NULL THEN 10 ELSE 0 END
    ) AS profile_completeness
  FROM contributors c
  WHERE c.id IN (SELECT contributor_id FROM code_volume)
),

-- Get max profile values
max_profile_values AS (
  SELECT 
    MAX(followers_count) AS max_followers
  FROM profile_metrics
),

-- Simplified normalized metrics
normalized_metrics AS (
  SELECT 
    cv.contributor_id,
    cv.contributor_github_id,
    cv.total_additions,
    cv.total_deletions,
    cv.total_lines,
    cv.total_commits,
    (cv.total_lines * 100.0 / NULLIF(max_values.max_lines, 0)) AS norm_code_volume,
    (cv.total_commits * 100.0 / NULLIF(max_values.max_commits, 0)) AS norm_commit_count,
    pm.followers_count,
    (pm.followers_count * 100.0 / NULLIF(max_profile_values.max_followers, 0)) AS norm_followers,
    pm.profile_completeness
  FROM code_volume cv
  LEFT JOIN profile_metrics pm ON cv.contributor_id = pm.contributor_id
  CROSS JOIN max_values
  CROSS JOIN max_profile_values
),

-- Calculate final scores
ranked_scores AS (
  SELECT 
    nm.contributor_id,
    nm.contributor_github_id,
    nm.norm_code_volume * 0.5 + 
    nm.norm_commit_count * 0.3 + 
    nm.norm_followers * 0.1 + 
    nm.profile_completeness * 0.1 AS total_score,
    nm.norm_code_volume,
    nm.norm_commit_count,
    nm.norm_followers,
    nm.profile_completeness,
    nm.followers_count,
    nm.total_additions,
    nm.total_deletions,
    nm.total_commits
  FROM normalized_metrics nm
),

-- Add rank position
final_scores AS (
  SELECT 
    rs.*,
    RANK() OVER (ORDER BY rs.total_score DESC) AS rank_position
  FROM ranked_scores rs
)

-- Output the results
SELECT 
  rank_position,
  contributor_id,
  total_score,
  norm_code_volume,
  norm_commit_count,
  norm_followers,
  profile_completeness,
  followers_count,
  total_additions,
  total_deletions,
  total_commits
FROM final_scores
ORDER BY rank_position ASC; 