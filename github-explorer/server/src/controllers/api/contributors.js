import { pool } from '../../db/db-pool.js';
import { handleDbError } from '../../utils/db-utils.js';

/**
 * Get all contributors with pagination
 */
export async function getContributors(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM contributors');
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get contributors with pagination
    const contributorsQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) AS commit_count,
        COUNT(DISTINCT mr.id) AS merge_request_count
      FROM 
        contributors c
      LEFT JOIN 
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN 
        merge_requests mr ON c.id = mr.author_id
      GROUP BY 
        c.id
      ORDER BY 
        c.followers DESC, c.repositories DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(contributorsQuery, [limit, offset]);
    
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get contributor by ID
 */
export async function getContributorById(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Get contributor details
    const contributorQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) AS commit_count,
        COUNT(DISTINCT mr.id) AS merge_request_count,
        SUM(cm.additions) AS lines_added,
        SUM(cm.deletions) AS lines_removed,
        COUNT(DISTINCT cr.repository_id) AS repositories_contributed
      FROM 
        contributors c
      LEFT JOIN 
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN 
        merge_requests mr ON c.id = mr.author_id
      LEFT JOIN
        contributor_repository cr ON c.id = cr.contributor_id  
      WHERE 
        c.id = ? OR c.github_id = ?
      GROUP BY 
        c.id
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id, id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributor = contributorResult.rows[0];
    
    // Get repositories the contributor has contributed to
    const reposQuery = `
      SELECT DISTINCT 
        r.*,
        cr.commit_count,
        cr.pull_requests,
        cr.reviews,
        cr.lines_added,
        cr.lines_removed,
        cr.first_contribution_date,
        cr.last_contribution_date
      FROM 
        repositories r
      JOIN 
        contributor_repository cr ON r.id = cr.repository_id
      WHERE 
        cr.contributor_id = ?
      ORDER BY 
        cr.commit_count DESC
      LIMIT 5
    `;
    
    const reposResult = await pool.query(reposQuery, [contributor.id]);
    
    // Get recent commits by contributor
    const commitsQuery = `
      SELECT 
        cm.*,
        r.full_name AS repository_name
      FROM 
        commits cm
      JOIN 
        repositories r ON cm.repository_id = r.id
      WHERE 
        cm.contributor_id = ?
      ORDER BY 
        cm.committed_at DESC
      LIMIT 10
    `;
    
    const commitsResult = await pool.query(commitsQuery, [contributor.id]);
    
    // Get merge requests by contributor
    const mergeRequestsQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      WHERE 
        mr.author_id = ?
      ORDER BY 
        mr.created_at DESC
      LIMIT 10
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [contributor.id]);
    
    // Get top languages used by contributor
    const languagesQuery = `
      WITH language_stats AS (
        SELECT 
          r.primary_language AS language,
          COUNT(DISTINCT cm.id) AS commit_count,
          SUM(cm.additions + cm.deletions) AS code_changes
        FROM 
          commits cm
        JOIN 
          repositories r ON cm.repository_id = r.id
        WHERE 
          cm.contributor_id = ? AND
          r.primary_language IS NOT NULL
        GROUP BY 
          r.primary_language
      )
      SELECT 
        language,
        commit_count,
        code_changes,
        CAST(code_changes * 100.0 / (SELECT SUM(code_changes) FROM language_stats) AS INTEGER) AS percentage
      FROM 
        language_stats
      ORDER BY 
        code_changes DESC
      LIMIT 5
    `;
    
    const languagesResult = await pool.query(languagesQuery, [contributor.id]);
    
    // Get activity metrics
    const activityQuery = `
      SELECT
        COUNT(DISTINCT cm.id) AS total_commits,
        COUNT(DISTINCT mr.id) AS total_pull_requests,
        COUNT(DISTINCT CASE WHEN mr.state = 'merged' THEN mr.id END) AS merged_pull_requests,
        COUNT(DISTINCT CASE WHEN mr.state = 'closed' AND mr.merged_at IS NULL THEN mr.id END) AS rejected_pull_requests,
        AVG(mr.review_time_hours) AS avg_review_time_hours,
        AVG(mr.cycle_time_hours) AS avg_cycle_time_hours,
        JULIANDAY(MAX(COALESCE(cm.committed_at, mr.created_at))) - JULIANDAY(MIN(COALESCE(cm.committed_at, mr.created_at))) AS active_days
      FROM
        contributors c
      LEFT JOIN
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN
        merge_requests mr ON c.id = mr.author_id
      WHERE
        c.id = ?
    `;
    
    const activityResult = await pool.query(activityQuery, [contributor.id]);
    
    // Return all data
    res.json({
      ...contributor,
      repositories: reposResult.rows,
      recent_commits: commitsResult.rows,
      merge_requests: mergeRequestsResult.rows,
      top_languages: languagesResult.rows,
      activity_metrics: activityResult.rows[0]
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get contributor by GitHub ID or username
 */
export async function getContributorByLogin(req, res) {
  // Get parameter from either login or id parameter
  const login = req.params.login || req.params.id;
  
  if (!login) {
    return res.status(400).json({ error: 'Contributor identifier is required' });
  }
  
  try {
    console.log(`[Server] Looking up contributor with identifier: ${login}`);
    
    // Get contributor details - use proper SQLite syntax for type conversion
    const contributorQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) AS commit_count,
        COUNT(DISTINCT mr.id) AS merge_request_count,
        SUM(cm.additions) AS lines_added,
        SUM(cm.deletions) AS lines_removed,
        COUNT(DISTINCT cr.repository_id) AS repositories_contributed
      FROM 
        contributors c
      LEFT JOIN 
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN 
        merge_requests mr ON c.id = mr.author_id
      LEFT JOIN
        contributor_repository cr ON c.id = cr.contributor_id
      WHERE 
        c.github_id = ? OR c.username = ?
      GROUP BY 
        c.id
    `;
    
    const contributorResult = await pool.query(contributorQuery, [login, login]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributor = contributorResult.rows[0];
    
    // Get repositories the contributor has contributed to
    const reposQuery = `
      SELECT DISTINCT 
        r.*,
        cr.commit_count,
        cr.pull_requests,
        cr.reviews,
        cr.lines_added,
        cr.lines_removed,
        cr.first_contribution_date,
        cr.last_contribution_date
      FROM 
        repositories r
      JOIN 
        contributor_repository cr ON r.id = cr.repository_id
      WHERE 
        cr.contributor_id = ?
      ORDER BY 
        cr.commit_count DESC
      LIMIT 5
    `;
    
    const reposResult = await pool.query(reposQuery, [contributor.id]);
    
    // Get recent commits by contributor
    const commitsQuery = `
      SELECT 
        cm.*,
        r.full_name AS repository_name
      FROM 
        commits cm
      JOIN 
        repositories r ON cm.repository_id = r.id
      WHERE 
        cm.contributor_id = ?
      ORDER BY 
        cm.committed_at DESC
      LIMIT 10
    `;
    
    const commitsResult = await pool.query(commitsQuery, [contributor.id]);
    
    // Get merge requests by contributor
    const mergeRequestsQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      WHERE 
        mr.author_id = ?
      ORDER BY 
        mr.created_at DESC
      LIMIT 10
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [contributor.id]);
    
    // Get top languages used by contributor
    const languagesQuery = `
      WITH language_stats AS (
        SELECT 
          r.primary_language AS language,
          COUNT(DISTINCT cm.id) AS commit_count,
          SUM(cm.additions + cm.deletions) AS code_changes
        FROM 
          commits cm
        JOIN 
          repositories r ON cm.repository_id = r.id
        WHERE 
          cm.contributor_id = ? AND
          r.primary_language IS NOT NULL
        GROUP BY 
          r.primary_language
      )
      SELECT 
        language,
        commit_count,
        code_changes,
        CAST(code_changes * 100.0 / (SELECT SUM(code_changes) FROM language_stats) AS INTEGER) AS percentage
      FROM 
        language_stats
      ORDER BY 
        code_changes DESC
      LIMIT 5
    `;
    
    const languagesResult = await pool.query(languagesQuery, [contributor.id]);
    
    // Get activity metrics
    const activityQuery = `
      SELECT
        COUNT(DISTINCT cm.id) AS total_commits,
        COUNT(DISTINCT mr.id) AS total_pull_requests,
        COUNT(DISTINCT CASE WHEN mr.state = 'merged' THEN mr.id END) AS merged_pull_requests,
        COUNT(DISTINCT CASE WHEN mr.state = 'closed' AND mr.merged_at IS NULL THEN mr.id END) AS rejected_pull_requests,
        AVG(mr.review_time_hours) AS avg_review_time_hours,
        AVG(mr.cycle_time_hours) AS avg_cycle_time_hours,
        JULIANDAY(MAX(COALESCE(cm.committed_at, mr.created_at))) - JULIANDAY(MIN(COALESCE(cm.committed_at, mr.created_at))) AS active_days
      FROM
        contributors c
      LEFT JOIN
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN
        merge_requests mr ON c.id = mr.author_id
      WHERE
        c.id = ?
    `;
    
    const activityResult = await pool.query(activityQuery, [contributor.id]);
    
    // Return all data
    res.json({
      ...contributor,
      repositories: reposResult.rows,
      recent_commits: commitsResult.rows,
      merge_requests: mergeRequestsResult.rows,
      top_languages: languagesResult.rows,
      activity_metrics: activityResult.rows[0]
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get contributor activity data for heatmap visualization
 */
export async function getContributorActivity(req, res) {
  console.log('[DEBUG] Starting getContributorActivity function');
  const { id } = req.params;
  const timeframe = req.query.timeframe || '1year'; // Default to 1 year
  
  console.log(`[DEBUG] Parameters: id=${id}, timeframe=${timeframe}`);
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  // Calculate date range based on timeframe
  console.log('[DEBUG] Calculating date range');
  let startDate;
  const now = new Date();
  console.log(`[DEBUG] now=${now}`);
  const endDate = now.toISOString().split('T')[0]; // Today in YYYY-MM-DD format
  console.log(`[DEBUG] endDate=${endDate}`);
  
  // Determine start date based on timeframe
  if (timeframe === '30days') {
    console.log('[DEBUG] timeframe=30days, creating date');
    let date = new Date(now);
    console.log('[DEBUG] setting date');
    date.setDate(date.getDate() - 30);
    console.log(`[DEBUG] date after setting: ${date}`);
    startDate = date.toISOString().split('T')[0];
    console.log(`[DEBUG] startDate=${startDate}`);
  } else if (timeframe === '90days') {
    console.log('[DEBUG] timeframe=90days, creating date');
    let date = new Date(now);
    console.log('[DEBUG] setting date');
    date.setDate(date.getDate() - 90);
    console.log(`[DEBUG] date after setting: ${date}`);
    startDate = date.toISOString().split('T')[0];
    console.log(`[DEBUG] startDate=${startDate}`);
  } else if (timeframe === '6months') {
    console.log('[DEBUG] timeframe=6months, creating date');
    let date = new Date(now);
    console.log('[DEBUG] setting date');
    date.setMonth(date.getMonth() - 6);
    console.log(`[DEBUG] date after setting: ${date}`);
    startDate = date.toISOString().split('T')[0];
    console.log(`[DEBUG] startDate=${startDate}`);
  } else if (timeframe === '1year') {
    console.log('[DEBUG] timeframe=1year, creating date');
    let date = new Date(now);
    console.log('[DEBUG] setting date');
    date.setFullYear(date.getFullYear() - 1);
    console.log(`[DEBUG] date after setting: ${date}`);
    startDate = date.toISOString().split('T')[0];
    console.log(`[DEBUG] startDate=${startDate}`);
  } else if (timeframe === 'all') {
    console.log('[DEBUG] timeframe=all, no startDate constraint');
    startDate = null; // No start date constraint
  } else {
    // Default to 1 year
    console.log('[DEBUG] timeframe=default, creating date');
    let date = new Date(now);
    console.log('[DEBUG] setting date');
    date.setFullYear(date.getFullYear() - 1);
    console.log(`[DEBUG] date after setting: ${date}`);
    startDate = date.toISOString().split('T')[0];
    console.log(`[DEBUG] startDate=${startDate}`);
  }
  
  try {
    console.log('[DEBUG] Starting database operations');
    // Verify the contributor exists
    const contributorQuery = `
      SELECT id FROM contributors WHERE github_id = ?
    `;
    
    console.log('[DEBUG] Executing contributor query');
    const contributorResult = await pool.query(contributorQuery, [id]);
    console.log(`[DEBUG] Contributor query result: ${JSON.stringify(contributorResult.rows)}`);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributorId = contributorResult.rows[0].id;
    console.log(`[DEBUG] Retrieved contributorId: ${contributorId}`);
    
    // Get daily commit counts
    console.log('[DEBUG] Building activity query');
    let activityQuery = `
      SELECT 
        date(committed_at) as commit_date,
        COUNT(DISTINCT id) as count
      FROM 
        commits
      WHERE 
        contributor_id = ?
    `;
    
    const params = [contributorId];
    
    if (startDate) {
      console.log(`[DEBUG] Adding startDate filter: ${startDate}`);
      activityQuery += ` AND date(committed_at) >= ?`;
      params.push(startDate);
    }
    
    activityQuery += `
      GROUP BY 
        date(committed_at)
      ORDER BY 
        commit_date
    `;
    
    console.log('[DEBUG] Executing activity query');
    const activityResult = await pool.query(activityQuery, params);
    console.log(`[DEBUG] Activity query returned ${activityResult.rows.length} rows`);
    
    // Get total commits and date range
    console.log('[DEBUG] Building stats query');
    let statsQuery = `
      SELECT 
        COUNT(DISTINCT id) as total_commits,
        MIN(date(committed_at)) as first_commit_date,
        MAX(date(committed_at)) as last_commit_date
      FROM 
        commits
      WHERE 
        contributor_id = ?
    `;
    
    const statsParams = [contributorId];
    
    if (startDate) {
      console.log(`[DEBUG] Adding startDate filter: ${startDate}`);
      statsQuery += ` AND date(committed_at) >= ?`;
      statsParams.push(startDate);
    }
    
    console.log('[DEBUG] Executing stats query');
    const statsResult = await pool.query(statsQuery, statsParams);
    console.log(`[DEBUG] Stats query result: ${JSON.stringify(statsResult.rows[0])}`);
    
    // Get monthly averages
    console.log('[DEBUG] Building monthly query');
    let monthlyQuery = `
      SELECT 
        month_group as month,
        AVG(daily_count) as average
      FROM (
        SELECT 
          date(committed_at) as day,
          strftime('%Y-%m', committed_at) as month_group,
          COUNT(DISTINCT id) as daily_count
        FROM 
          commits
        WHERE 
          contributor_id = ?
    `;
    
    const monthlyParams = [contributorId];
    
    if (startDate) {
      console.log(`[DEBUG] Adding startDate filter: ${startDate}`);
      monthlyQuery += ` AND date(committed_at) >= ?`;
      monthlyParams.push(startDate);
    }
    
    monthlyQuery += `
        GROUP BY 
          day
      )
      GROUP BY 
        month_group
      ORDER BY 
        month_group
    `;
    
    console.log('[DEBUG] Executing monthly query');
    const monthlyResult = await pool.query(monthlyQuery, monthlyParams);
    console.log(`[DEBUG] Monthly query returned ${monthlyResult.rows.length} rows`);
    
    // Create the activity object
    console.log('[DEBUG] Creating activity object');
    const activity = {};
    
    // Only populate the date range if we have data and a start date
    console.log('[DEBUG] Checking conditions for date range generation');
    console.log(`[DEBUG] startDate=${startDate}, statsResult rows=${statsResult.rows.length}, first_commit_date=${statsResult.rows[0]?.first_commit_date}`);
    
    if (startDate && statsResult.rows.length > 0 && statsResult.rows[0].first_commit_date) {
      console.log('[DEBUG] Generating date range');
      // Get start and end dates from the query results or use the calculated ones
      const firstCommitDate = statsResult.rows[0].first_commit_date;
      console.log(`[DEBUG] firstCommitDate=${firstCommitDate}`);
      const lastCommitDate = statsResult.rows[0].last_commit_date;
      console.log(`[DEBUG] lastCommitDate=${lastCommitDate}`);
      
      // Determine the actual start and end dates for the range
      const rangeStart = startDate > firstCommitDate ? startDate : firstCommitDate;
      console.log(`[DEBUG] rangeStart=${rangeStart}`);
      const rangeEnd = endDate;
      console.log(`[DEBUG] rangeEnd=${rangeEnd}`);
      
      // Convert to Date objects once
      console.log('[DEBUG] Creating Date objects');
      const startObj = new Date(rangeStart);
      console.log(`[DEBUG] startObj=${startObj}`);
      const endObj = new Date(rangeEnd);
      console.log(`[DEBUG] endObj=${endObj}`);
      
      // Generate array of dates between start and end
      console.log('[DEBUG] Generating dates array');
      const dates = [];
      console.log('[DEBUG] Creating currentDate');
      let currentDate = new Date(startObj);
      console.log(`[DEBUG] currentDate initial=${currentDate}`);
      
      console.log('[DEBUG] Starting date loop');
      // Loop through dates without modifying the original date objects
      console.log(`[DEBUG] Comparing ${currentDate} <= ${endObj} = ${currentDate <= endObj}`);
      while (currentDate <= endObj) {
        console.log(`[DEBUG] Loop iteration, currentDate=${currentDate}`);
        dates.push(new Date(currentDate));
        console.log('[DEBUG] Setting date');
        console.log(`[DEBUG] Before: currentDate=${currentDate}, date=${currentDate.getDate()}`);
        currentDate.setDate(currentDate.getDate() + 1);
        console.log(`[DEBUG] After: currentDate=${currentDate}`);
      }
      console.log(`[DEBUG] Dates array length=${dates.length}`);
      
      // Populate the activity object with zeros for each date
      console.log('[DEBUG] Populating activity object');
      dates.forEach((date, i) => {
        console.log(`[DEBUG] Processing date ${i}: ${date}`);
        const dateStr = date.toISOString().split('T')[0];
        console.log(`[DEBUG] dateStr=${dateStr}`);
        activity[dateStr] = 0;
      });
      console.log(`[DEBUG] Activity object has ${Object.keys(activity).length} dates`);
    }
    
    // Fill in actual commit counts
    console.log('[DEBUG] Filling in actual commit counts');
    activityResult.rows.forEach((row, i) => {
      console.log(`[DEBUG] Processing row ${i}: ${JSON.stringify(row)}`);
      activity[row.commit_date] = parseInt(row.count);
    });
    console.log('[DEBUG] Filled in activity data');
    
    // Format monthly averages
    console.log('[DEBUG] Formatting monthly averages');
    const monthlyAverages = monthlyResult.rows.map((row, i) => {
      console.log(`[DEBUG] Processing month ${i}: ${JSON.stringify(row)}`);
      return {
        month: row.month,
        average: parseFloat(row.average).toFixed(1)
      };
    });
    console.log(`[DEBUG] Monthly averages array length=${monthlyAverages.length}`);
    
    // Return formatted response
    console.log('[DEBUG] Preparing response');
    const response = {
      total_commits: statsResult.rows[0]?.total_commits || 0,
      first_commit_date: statsResult.rows[0]?.first_commit_date || null,
      last_commit_date: statsResult.rows[0]?.last_commit_date || null,
      activity,
      monthly_averages: monthlyAverages
    };
    console.log('[DEBUG] Response prepared, sending JSON');
    
    res.json(response);
    console.log('[DEBUG] Response sent successfully');
  } catch (error) {
    console.error('[DEBUG] Error caught:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    handleDbError(error, res);
  }
}

/**
 * Get contributor code impact metrics
 */
export async function getContributorImpact(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Verify the contributor exists
    const contributorQuery = `
      SELECT id FROM contributors WHERE github_id = ?
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributorId = contributorResult.rows[0].id;
    
    // Get impact metrics from commits
    const impactQuery = `
      SELECT 
        SUM(additions) as added,
        SUM(deletions) as removed
      FROM 
        commits
      WHERE 
        contributor_id = ?
    `;
    
    const impactResult = await pool.query(impactQuery, [contributorId]);
    
    // Handle empty data case
    const added = parseInt(impactResult.rows[0].added) || 0;
    const removed = parseInt(impactResult.rows[0].removed) || 0;
    const total = added + removed;
    
    // Calculate percentages for visualization
    let addedPercentage = 0;
    let removedPercentage = 0;
    
    if (total > 0) {
      addedPercentage = Math.round((added / total) * 100);
      removedPercentage = 100 - addedPercentage; // Ensure they add up to 100%
    }
    
    // Get impact metrics by repository (for breakdown)
    const repoImpactQuery = `
      SELECT 
        r.full_name,
        SUM(cm.additions) as added,
        SUM(cm.deletions) as removed,
        (SUM(cm.additions) + SUM(cm.deletions)) as total
      FROM 
        commits cm
      JOIN
        repositories r ON cm.repository_id = r.id
      WHERE 
        cm.contributor_id = ?
      GROUP BY
        cm.repository_id
      ORDER BY
        total DESC
      LIMIT 5
    `;
    
    const repoImpactResult = await pool.query(repoImpactQuery, [contributorId]);
    
    // Format repository impact data
    const repositoryImpact = repoImpactResult.rows.map(repo => ({
      repository: repo.full_name,
      added: parseInt(repo.added) || 0,
      removed: parseInt(repo.removed) || 0,
      total: parseInt(repo.total) || 0,
      percentage: total > 0 ? Math.round((parseInt(repo.total) / total) * 100) : 0
    }));
    
    // Return the formatted response
    res.json({
      added,
      removed,
      total,
      ratio: {
        additions: addedPercentage,
        deletions: removedPercentage
      },
      repository_breakdown: repositoryImpact
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get repositories a contributor has contributed to
 */
export async function getContributorRepositories(req, res) {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const sortBy = req.query.sort_by || 'commit_count';
  const sortDirection = req.query.sort_direction === 'asc' ? 'ASC' : 'DESC';
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Verify the contributor exists
    const contributorQuery = `
      SELECT id FROM contributors WHERE github_id = ?
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributorId = contributorResult.rows[0].id;
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT cr.repository_id) as total
      FROM contributor_repository cr
      WHERE cr.contributor_id = ?
    `;
    
    const countResult = await pool.query(countQuery, [contributorId]);
    const totalCount = parseInt(countResult.rows[0].total) || 0;
    
    // Validate sort_by parameter to prevent SQL injection
    const validSortColumns = [
      'commit_count', 'stars', 'forks', 'last_contribution_date',
      'pull_requests', 'lines_added', 'lines_removed'
    ];
    
    const actualSortBy = validSortColumns.includes(sortBy) 
      ? sortBy 
      : 'commit_count';
    
    // Get repositories with pagination and sorting
    const reposQuery = `
      SELECT 
        r.*,
        cr.commit_count,
        cr.pull_requests,
        cr.reviews,
        cr.issues_opened,
        cr.first_contribution_date,
        cr.last_contribution_date,
        cr.lines_added,
        cr.lines_removed,
        (SELECT COUNT(DISTINCT mr.id) 
         FROM merge_requests mr 
         WHERE mr.repository_id = r.id AND mr.state = 'merged' AND mr.author_id = ?) as merged_pull_requests,
        (SELECT COUNT(DISTINCT mr.id) 
         FROM merge_requests mr 
         WHERE mr.repository_id = r.id AND mr.state = 'closed' AND mr.merged_at IS NULL AND mr.author_id = ?) as rejected_pull_requests
      FROM 
        repositories r
      JOIN 
        contributor_repository cr ON r.id = cr.repository_id
      WHERE 
        cr.contributor_id = ?
      ORDER BY 
        ${actualSortBy} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    const reposResult = await pool.query(reposQuery, [
      contributorId, 
      contributorId, 
      contributorId, 
      limit, 
      offset
    ]);
    
    // Return repositories with pagination metadata
    res.json({
      data: reposResult.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get merge requests created by a contributor
 */
export async function getContributorMergeRequests(req, res) {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const state = req.query.state || 'all'; // all, open, closed, merged
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Verify the contributor exists
    const contributorQuery = `
      SELECT id FROM contributors WHERE github_id = ?
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributorId = contributorResult.rows[0].id;
    
    // Build the query with state filter
    let stateFilter = '';
    if (state !== 'all') {
      stateFilter = `AND mr.state = '${state}'`;
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM merge_requests mr
      WHERE mr.author_id = ? ${stateFilter}
    `;
    
    const countResult = await pool.query(countQuery, [contributorId]);
    const totalCount = parseInt(countResult.rows[0].total) || 0;
    
    // Get merge requests with pagination
    const mrQuery = `
      SELECT 
        mr.*,
        r.full_name as repository_name,
        r.description as repository_description,
        c.username as merged_by_username,
        c.avatar as merged_by_avatar
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      LEFT JOIN
        contributors c ON mr.merged_by_id = c.id
      WHERE 
        mr.author_id = ? ${stateFilter}
      ORDER BY 
        mr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const mrResult = await pool.query(mrQuery, [contributorId, limit, offset]);
    
    // For each merge request, get the review data if available
    const mergeRequests = await Promise.all(mrResult.rows.map(async (mr) => {
      // Calculate time metrics if not already available
      let cycleTimeHours = mr.cycle_time_hours;
      let reviewTimeHours = mr.review_time_hours;
      
      if (mr.merged_at && !cycleTimeHours) {
        const mergedDate = new Date(mr.merged_at);
        const createdDate = new Date(mr.created_at);
        cycleTimeHours = Math.round((mergedDate - createdDate) / (1000 * 60 * 60));
      }
      
      return {
        ...mr,
        cycle_time_hours: cycleTimeHours,
        review_time_hours: reviewTimeHours,
        // Parse JSON fields that might be stored as text
        labels: typeof mr.labels === 'string' ? JSON.parse(mr.labels) : mr.labels
      };
    }));
    
    // Return merge requests with pagination metadata
    res.json({
      data: mergeRequests,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get a contributor's recent activity for timeline display
 */
export async function getContributorRecentActivity(req, res) {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Verify the contributor exists
    const contributorQuery = `
      SELECT id FROM contributors WHERE github_id = ?
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributorId = contributorResult.rows[0].id;
    
    // Get total count for pagination
    const countQuery = `
      SELECT 
        (SELECT COUNT(*) FROM commits WHERE contributor_id = ?) +
        (SELECT COUNT(*) FROM merge_requests WHERE author_id = ?) AS total
    `;
    
    const countResult = await pool.query(countQuery, [contributorId, contributorId]);
    const totalCount = parseInt(countResult.rows[0].total) || 0;
    
    // Get recent commits
    const commitsQuery = `
      SELECT 
        'commit' AS activity_type,
        cm.id,
        cm.github_id AS sha,
        cm.message,
        cm.committed_at AS timestamp,
        cm.additions,
        cm.deletions,
        cm.filename,
        cm.status,
        r.id AS repository_id,
        r.full_name AS repository_name,
        r.url AS repository_url,
        NULL AS pull_request_id,
        NULL AS pull_request_number,
        NULL AS pull_request_title,
        NULL AS pull_request_state
      FROM 
        commits cm
      JOIN 
        repositories r ON cm.repository_id = r.id
      WHERE 
        cm.contributor_id = ?
      ORDER BY 
        cm.committed_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const commitsResult = await pool.query(commitsQuery, [contributorId, limit / 2, offset]);
    
    // Get recent merge requests
    const mergeRequestsQuery = `
      SELECT 
        'pull_request' AS activity_type,
        mr.id,
        NULL AS sha,
        mr.description AS message,
        CASE 
          WHEN mr.merged_at IS NOT NULL THEN mr.merged_at
          WHEN mr.closed_at IS NOT NULL THEN mr.closed_at
          ELSE mr.created_at 
        END AS timestamp,
        mr.additions,
        mr.deletions,
        NULL AS filename,
        mr.state AS status,
        r.id AS repository_id,
        r.full_name AS repository_name,
        r.url AS repository_url,
        mr.id AS pull_request_id,
        mr.github_id AS pull_request_number,
        mr.title AS pull_request_title,
        mr.state AS pull_request_state
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      WHERE 
        mr.author_id = ?
      ORDER BY 
        timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [contributorId, limit / 2, offset]);
    
    // Combine and sort both activity types
    const combinedActivity = [
      ...commitsResult.rows,
      ...mergeRequestsResult.rows
    ].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }).slice(0, limit);
    
    // Format activity items for timeline visualization
    const timelineActivity = combinedActivity.map(item => {
      // Common fields for all activity types
      const baseActivity = {
        id: item.id,
        type: item.activity_type,
        timestamp: item.timestamp,
        repository: {
          id: item.repository_id,
          name: item.repository_name,
          url: item.repository_url
        }
      };
      
      // Add type-specific fields
      if (item.activity_type === 'commit') {
        return {
          ...baseActivity,
          message: item.message,
          sha: item.sha,
          filename: item.filename,
          status: item.status,
          additions: item.additions,
          deletions: item.deletions
        };
      } else if (item.activity_type === 'pull_request') {
        return {
          ...baseActivity,
          title: item.pull_request_title,
          number: item.pull_request_number,
          state: item.pull_request_state,
          additions: item.additions,
          deletions: item.deletions
        };
      }
      
      return baseActivity;
    });
    
    // Group activity by day for timeline display
    const groupedByDay = {};
    timelineActivity.forEach(activity => {
      const dateKey = activity.timestamp.split('T')[0];
      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = [];
      }
      groupedByDay[dateKey].push(activity);
    });
    
    // Convert to array format for easier frontend consumption
    const timelineData = Object.keys(groupedByDay)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        activities: groupedByDay[date]
      }));
    
    // Return the formatted timeline data with pagination
    res.json({
      data: timelineData,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get a contributor's ranking and score metrics
 */
export async function getContributorRankings(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Verify the contributor exists
    const contributorQuery = `
      SELECT id FROM contributors WHERE github_id = ?
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributorId = contributorResult.rows[0].id;
    
    // Get the most recent ranking calculation timestamp
    const latestCalculationQuery = `
      SELECT MAX(calculation_timestamp) as latest_timestamp
      FROM contributor_rankings
    `;
    
    const latestResult = await pool.query(latestCalculationQuery);
    
    if (!latestResult.rows[0].latest_timestamp) {
      return res.status(404).json({ error: 'No ranking data is available yet' });
    }
    
    const latestTimestamp = latestResult.rows[0].latest_timestamp;
    
    // Get the contributor's ranking data
    const rankingsQuery = `
      SELECT 
        cr.*,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND rank_position <= cr.rank_position) AS absolute_rank,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ?) AS total_ranked
      FROM 
        contributor_rankings cr
      WHERE 
        cr.contributor_id = ? 
        AND cr.calculation_timestamp = ?
    `;
    
    const rankingsResult = await pool.query(rankingsQuery, [
      latestTimestamp,
      latestTimestamp,
      contributorId,
      latestTimestamp
    ]);
    
    if (rankingsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No ranking data available for this contributor' });
    }
    
    const rankingData = rankingsResult.rows[0];
    
    // Calculate percentiles for each score
    const percentileQuery = `
      SELECT
        'total_score' as metric,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND total_score <= ?) * 100.0 / 
        (SELECT COUNT(*) FROM contributor_rankings WHERE calculation_timestamp = ?) AS percentile
      UNION
      SELECT
        'code_volume_score' as metric,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND code_volume_score <= ?) * 100.0 / 
        (SELECT COUNT(*) FROM contributor_rankings WHERE calculation_timestamp = ?) AS percentile
      UNION
      SELECT
        'code_efficiency_score' as metric,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND code_efficiency_score <= ?) * 100.0 / 
        (SELECT COUNT(*) FROM contributor_rankings WHERE calculation_timestamp = ?) AS percentile
      UNION
      SELECT
        'commit_impact_score' as metric,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND commit_impact_score <= ?) * 100.0 / 
        (SELECT COUNT(*) FROM contributor_rankings WHERE calculation_timestamp = ?) AS percentile
      UNION
      SELECT
        'repo_influence_score' as metric,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND repo_influence_score <= ?) * 100.0 / 
        (SELECT COUNT(*) FROM contributor_rankings WHERE calculation_timestamp = ?) AS percentile
      UNION
      SELECT
        'followers_score' as metric,
        (SELECT COUNT(*) FROM contributor_rankings 
         WHERE calculation_timestamp = ? AND followers_score <= ?) * 100.0 / 
        (SELECT COUNT(*) FROM contributor_rankings WHERE calculation_timestamp = ?) AS percentile
    `;
    
    const percentileParams = [
      latestTimestamp, rankingData.total_score, latestTimestamp,
      latestTimestamp, rankingData.code_volume_score, latestTimestamp,
      latestTimestamp, rankingData.code_efficiency_score, latestTimestamp,
      latestTimestamp, rankingData.commit_impact_score, latestTimestamp,
      latestTimestamp, rankingData.repo_influence_score, latestTimestamp,
      latestTimestamp, rankingData.followers_score, latestTimestamp
    ];
    
    const percentileResult = await pool.query(percentileQuery, percentileParams);
    
    // Format the percentiles into an object for easier frontend use
    const percentiles = {};
    percentileResult.rows.forEach(row => {
      percentiles[row.metric] = parseFloat(row.percentile).toFixed(1);
    });
    
    // Calculate ranking trend (change over time)
    const previousCalculationQuery = `
      SELECT calculation_timestamp
      FROM contributor_rankings
      WHERE calculation_timestamp < ?
      GROUP BY calculation_timestamp
      ORDER BY calculation_timestamp DESC
      LIMIT 1
    `;
    
    const previousResult = await pool.query(previousCalculationQuery, [latestTimestamp]);
    
    let trendData = null;
    
    if (previousResult.rows.length > 0) {
      const previousTimestamp = previousResult.rows[0].calculation_timestamp;
      
      const trendQuery = `
        SELECT 
          rank_position,
          total_score
        FROM 
          contributor_rankings
        WHERE 
          contributor_id = ? AND 
          calculation_timestamp = ?
      `;
      
      const previousRankingResult = await pool.query(trendQuery, [contributorId, previousTimestamp]);
      
      if (previousRankingResult.rows.length > 0) {
        const previousRanking = previousRankingResult.rows[0];
        
        trendData = {
          previous_timestamp: previousTimestamp,
          previous_rank: previousRanking.rank_position,
          previous_score: previousRanking.total_score,
          rank_change: previousRanking.rank_position - rankingData.rank_position,
          score_change: rankingData.total_score - previousRanking.total_score
        };
      }
    }
    
    // Format and return the response
    res.json({
      rank: rankingData.rank_position,
      absolute_rank: rankingData.absolute_rank,
      total_ranked: rankingData.total_ranked,
      percentile: parseFloat(percentiles.total_score),
      calculation_date: rankingData.calculation_timestamp,
      scores: {
        total: rankingData.total_score,
        code_volume: rankingData.code_volume_score,
        code_efficiency: rankingData.code_efficiency_score,
        commit_impact: rankingData.commit_impact_score,
        repo_influence: rankingData.repo_influence_score,
        followers: rankingData.followers_score,
        profile_completeness: rankingData.profile_completeness_score,
        collaboration: rankingData.collaboration_score,
        repo_popularity: rankingData.repo_popularity_score
      },
      percentiles: {
        total: parseFloat(percentiles.total_score),
        code_volume: parseFloat(percentiles.code_volume_score),
        code_efficiency: parseFloat(percentiles.code_efficiency_score),
        commit_impact: parseFloat(percentiles.commit_impact_score),
        repo_influence: parseFloat(percentiles.repo_influence_score),
        followers: parseFloat(percentiles.followers_score)
      },
      raw_metrics: {
        followers_count: rankingData.followers_count,
        lines_added: rankingData.raw_lines_added,
        lines_removed: rankingData.raw_lines_removed,
        commits_count: rankingData.raw_commits_count,
        repositories_contributed: rankingData.repositories_contributed
      },
      trend: trendData
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get a contributor's profile metadata
 */
export async function getContributorProfileMetadata(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Verify the contributor exists
    const contributorQuery = `
      SELECT 
        id, 
        first_contribution, 
        last_contribution,
        organizations,
        top_languages
      FROM 
        contributors 
      WHERE 
        github_id = ?
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributor = contributorResult.rows[0];
    const contributorId = contributor.id;
    
    // Calculate active period if not already stored
    let activePeriod = {};
    
    if (contributor.first_contribution && contributor.last_contribution) {
      // Use stored values if available
      const firstDate = new Date(contributor.first_contribution);
      const lastDate = new Date(contributor.last_contribution);
      const durationMillis = lastDate - firstDate;
      const durationDays = Math.floor(durationMillis / (1000 * 60 * 60 * 24));
      
      activePeriod = {
        first_contribution: contributor.first_contribution,
        last_contribution: contributor.last_contribution,
        duration_days: durationDays,
        duration_formatted: formatDuration(durationDays)
      };
    } else {
      // Calculate from commits if not stored
      const contributionDatesQuery = `
        SELECT 
          MIN(committed_at) AS first_contribution,
          MAX(committed_at) AS last_contribution
        FROM 
          commits
        WHERE 
          contributor_id = ?
      `;
      
      const contributionDatesResult = await pool.query(contributionDatesQuery, [contributorId]);
      
      if (contributionDatesResult.rows[0].first_contribution) {
        const firstDate = new Date(contributionDatesResult.rows[0].first_contribution);
        const lastDate = new Date(contributionDatesResult.rows[0].last_contribution);
        const durationMillis = lastDate - firstDate;
        const durationDays = Math.floor(durationMillis / (1000 * 60 * 60 * 24));
        
        activePeriod = {
          first_contribution: contributionDatesResult.rows[0].first_contribution,
          last_contribution: contributionDatesResult.rows[0].last_contribution,
          duration_days: durationDays,
          duration_formatted: formatDuration(durationDays)
        };
      }
    }
    
    // Get organizations from contributor data or fetch if needed
    let organizations = [];
    
    if (contributor.organizations) {
      // Parse if stored as JSON string
      organizations = typeof contributor.organizations === 'string' 
        ? JSON.parse(contributor.organizations) 
        : contributor.organizations;
    }
    
    // Get top languages from contributor data or fetch if needed
    let topLanguages = [];
    
    if (contributor.top_languages) {
      // Parse if stored as JSON string
      topLanguages = typeof contributor.top_languages === 'string' 
        ? JSON.parse(contributor.top_languages) 
        : contributor.top_languages;
    } else {
      // Calculate from commits
      const languagesQuery = `
        WITH language_stats AS (
          SELECT 
            r.primary_language AS language,
            COUNT(DISTINCT cm.id) AS commit_count,
            SUM(cm.additions + cm.deletions) AS code_changes
          FROM 
            commits cm
          JOIN 
            repositories r ON cm.repository_id = r.id
          WHERE 
            cm.contributor_id = ? AND
            r.primary_language IS NOT NULL
          GROUP BY 
            r.primary_language
        )
        SELECT 
          language,
          commit_count,
          code_changes,
          CAST(code_changes * 100.0 / (SELECT SUM(code_changes) FROM language_stats) AS INTEGER) AS percentage
        FROM 
          language_stats
        ORDER BY 
          code_changes DESC
        LIMIT 10
      `;
      
      const languagesResult = await pool.query(languagesQuery, [contributorId]);
      
      topLanguages = languagesResult.rows.map(row => ({
        name: row.language,
        percentage: parseInt(row.percentage)
      }));
    }
    
    // Return the formatted metadata
    res.json({
      active_period: activePeriod,
      organizations: organizations,
      top_languages: topLanguages
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Helper function to format duration in days to a readable string
 */
function formatDuration(days) {
  if (days < 30) {
    return `${days} days`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  } else {
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    
    if (remainingMonths === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    } else {
      const yearText = years === 1 ? '1 year' : `${years} years`;
      const monthText = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`;
      return `${yearText}, ${monthText}`;
    }
  }
} 