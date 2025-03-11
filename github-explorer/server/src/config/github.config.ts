import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define schema for GitHub API configuration
const githubConfigSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, 'GitHub token is required'),
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),
  GITHUB_API_VERSION: z.string().default('2022-11-28'),
  GITHUB_ACCEPT_HEADER: z.string().default('application/vnd.github+json'),
  GITHUB_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  GITHUB_RETRY_AFTER: z.coerce.number().int().positive().default(1000),
  GITHUB_RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  GITHUB_DEFAULT_PER_PAGE: z.coerce.number().int().positive().default(100),
  GITHUB_MAX_ITEMS_PER_REQUEST: z.coerce.number().int().positive().default(1000),
});

// Parse and validate environment variables
const githubConfig = githubConfigSchema.parse({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_API_URL: process.env.GITHUB_API_URL,
  GITHUB_API_VERSION: process.env.GITHUB_API_VERSION,
  GITHUB_ACCEPT_HEADER: process.env.GITHUB_ACCEPT_HEADER,
  GITHUB_MAX_RETRIES: process.env.GITHUB_MAX_RETRIES,
  GITHUB_RETRY_AFTER: process.env.GITHUB_RETRY_AFTER,
  GITHUB_RATE_LIMIT_ENABLED: process.env.GITHUB_RATE_LIMIT_ENABLED,
  GITHUB_DEFAULT_PER_PAGE: process.env.GITHUB_DEFAULT_PER_PAGE,
  GITHUB_MAX_ITEMS_PER_REQUEST: process.env.GITHUB_MAX_ITEMS_PER_REQUEST,
});

export default githubConfig; 