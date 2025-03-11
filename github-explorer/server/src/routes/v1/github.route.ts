import { Router } from 'express';
import githubController from '../../controllers/v1/github.controller';
import validationMiddleware from '../../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Rate limit endpoint
router.get('/rate-limit', githubController.getRateLimit.bind(githubController));

// Repository endpoints
router.get(
  '/repos/:owner/:repo',
  validationMiddleware({
    params: z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    }),
  }),
  githubController.getRepository.bind(githubController)
);

// Pull requests endpoints
router.get(
  '/repos/:owner/:repo/pulls',
  validationMiddleware({
    params: z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    }),
    query: z.object({
      state: z.enum(['open', 'closed', 'all']).optional(),
      page: z.string().optional(),
      per_page: z.string().optional(),
    }).optional(),
  }),
  githubController.getPullRequests.bind(githubController)
);

// Commits endpoints
router.get(
  '/repos/:owner/:repo/commits',
  validationMiddleware({
    params: z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    }),
    query: z.object({
      page: z.string().optional(),
      per_page: z.string().optional(),
      since: z.string().optional(),
      until: z.string().optional(),
    }).optional(),
  }),
  githubController.getCommits.bind(githubController)
);

router.get(
  '/repos/:owner/:repo/commits/:ref',
  validationMiddleware({
    params: z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
      ref: z.string().min(1, 'Commit reference is required'),
    }),
  }),
  githubController.getCommit.bind(githubController)
);

// Contributors endpoints
router.get(
  '/users/:username',
  validationMiddleware({
    params: z.object({
      username: z.string().min(1, 'Username is required'),
    }),
  }),
  githubController.getContributor.bind(githubController)
);

router.get(
  '/repos/:owner/:repo/contributors',
  validationMiddleware({
    params: z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
    }),
    query: z.object({
      page: z.string().optional(),
      per_page: z.string().optional(),
    }).optional(),
  }),
  githubController.getRepositoryContributors.bind(githubController)
);

// Sync endpoint
router.post(
  '/sync',
  validationMiddleware({
    body: z.object({
      owner: z.string().min(1, 'Owner is required'),
      repo: z.string().min(1, 'Repository name is required'),
      syncPullRequests: z.boolean().optional(),
      syncCommits: z.boolean().optional(),
      syncContributors: z.boolean().optional(),
      maxItems: z.number().int().positive().optional(),
    }),
  }),
  githubController.syncGitHubData.bind(githubController)
);

export default router; 