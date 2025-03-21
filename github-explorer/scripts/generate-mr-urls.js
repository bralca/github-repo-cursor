const { generateRepositorySlug, generateMergeRequestSlug } = require('@/lib/url-utils');

const data = [
  { repoName: 'ShoulderSurfing', repoId: '61964757', mrTitle: 'Mexican Spanish Translation', mrId: '282' },
  { repoName: 'jellyseerr', repoId: '467856408', mrTitle: 'fix(ui): correct seasons badge order', mrId: '1485' },
  { repoName: 'ws2wh', repoId: '871350522', mrTitle: '26 CVE 2025 22870   medium', mrId: '27' }
];

data.forEach(item => {
  const repoSlug = generateRepositorySlug(item.repoName, item.repoId);
  const mrSlug = generateMergeRequestSlug(item.mrTitle, item.mrId);
  console.log(`${item.repoName} PR #${item.mrId}:`);
  console.log(`URL: /${repoSlug}/merge-requests/${mrSlug}`);
  console.log('---');
}); 