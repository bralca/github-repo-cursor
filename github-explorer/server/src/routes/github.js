import { Router } from 'express';
import { 
  getRepository, 
  getContributors, 
  getPullRequests, 
  getCommits,
  getRateLimit
} from '../controllers/github.js';

const router = Router();

// GET /github/rate-limit - Get rate limit information
router.get('/rate-limit', getRateLimit);

// GET /github/repos/:owner/:repo - Get repository details
router.get('/repos/:owner/:repo', getRepository);

// GET /github/repos/:owner/:repo/contributors - Get repository contributors
router.get('/repos/:owner/:repo/contributors', getContributors);

// GET /github/repos/:owner/:repo/pulls - Get repository pull requests
router.get('/repos/:owner/:repo/pulls', getPullRequests);

// GET /github/repos/:owner/:repo/commits - Get repository commits
router.get('/repos/:owner/:repo/commits', getCommits);

export default router; 