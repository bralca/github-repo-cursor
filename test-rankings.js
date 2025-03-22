// Get max values for normalization
max_values AS (
  SELECT 
    COALESCE(MAX(cm.total_lines), 1) AS max_lines,
    COALESCE(MAX(cm.commit_count), 1) AS max_commits,
    COALESCE((SELECT MAX(followers) FROM contributors), 1) AS max_followers,
    COALESCE(MAX(rm.repos_contributed), 1) AS max_repos,
    COALESCE(MAX(rm.avg_repo_popularity), 1) AS max_popularity
  FROM commit_metrics cm
  CROSS JOIN (
    SELECT 
      MAX(repos_contributed) AS max_repos,
      MAX(avg_repo_popularity) AS max_popularity 
    FROM repo_metrics
  ) AS mr
), 