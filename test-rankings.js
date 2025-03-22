import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('github_explorer.db');

// Helper function for promises
const run = (query) => new Promise((resolve, reject) => {
  db.all(query, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

async function testCollaborationMetric() {
  console.log('Testing collaboration metrics...');
  
  // Get artbataev's ID
  const contributors = await run("SELECT id, username FROM contributors WHERE username = 'artbataev'");
  if (!contributors.length) {
    console.log('Contributor not found');
    return;
  }
  
  const contributor_id = contributors[0].id;
  console.log(`Found contributor: ${contributors[0].username} (${contributor_id})`);
  
  // Check collaboration metrics
  const collab = await run(`
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
    WHERE c.pull_request_id IS NOT NULL AND c.contributor_id = '${contributor_id}'
    GROUP BY c.contributor_id
  `);
  
  console.log('Collaboration metrics:', collab);
  
  if (collab.length > 0) {
    // Calculate collaboration score
    const score = Math.min(
      100,
      30 + (70 * (collab[0].avg_collaborators_per_pr - 1) / 3)
    );
    console.log('Calculated collaboration score:', score);
  } else {
    console.log('No collaboration data found');
  }
  
  // Check repository popularity
  console.log('\nTesting repository popularity metrics...');
  const repo_pop = await run(`
    SELECT
      cr.contributor_id,
      SUM((COALESCE(r.stars, 0) * 0.7) + (COALESCE(r.forks, 0) * 0.3)) AS total_popularity,
      AVG((COALESCE(r.stars, 0) * 0.7) + (COALESCE(r.forks, 0) * 0.3)) AS avg_popularity,
      SUM(CASE WHEN r.stars >= 1000 THEN 1 ELSE 0 END) AS popular_repos_count,
      COUNT(r.id) AS total_repos
    FROM contributor_repository cr
    JOIN repositories r ON cr.repository_id = r.id
    WHERE cr.contributor_id = '${contributor_id}'
    GROUP BY cr.contributor_id
  `);
  
  console.log('Repository popularity metrics:', repo_pop);
  
  if (repo_pop.length > 0) {
    // Calculate repository popularity score
    const score = Math.min(
      100,
      // 60% based on total popularity (log scale to handle extreme values)
      (Math.log(repo_pop[0].total_popularity + 1) / Math.log(25000) * 60) +
      // 40% based on number of popular repos (capped at 5)
      (Math.min(repo_pop[0].popular_repos_count, 5) * 8)
    );
    console.log('Calculated repository popularity score:', score);
  } else {
    console.log('No repository popularity data found');
  }
  
  // Close the database
  db.close();
}

testCollaborationMetric().catch(console.error);