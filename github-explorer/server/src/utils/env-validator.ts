import { z } from 'zod';
import { createLogger } from './logger';

const logger = createLogger('EnvValidator');

/**
 * Schema for validating environment variables
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().positive().default(3001),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug', 'verbose']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),

  // GitHub API
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),
  GITHUB_TOKEN: z.string().optional(),

  // Pipeline config
  PIPELINE_SCHEDULE: z.string().optional(),
  PIPELINE_TIMEOUT: z.coerce.number().positive().default(60 * 60 * 1000),
  PIPELINE_MAX_RETRIES: z.coerce.number().nonnegative().default(3),

  // Optional Supabase config
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
});

/**
 * Type for the validated environment
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates the environment variables
 * @returns Validated and processed environment variables
 */
export function validateEnv(): EnvConfig {
  const envVars = {
    ...process.env,
  };

  try {
    // Parse and validate environment variables
    const validatedEnv = envSchema.parse(envVars);

    // Log validation success
    logger.info('Environment variables validated successfully');

    if (validatedEnv.NODE_ENV === 'production') {
      // Check for missing critical variables in production
      if (!validatedEnv.GITHUB_TOKEN) {
        logger.warn('GITHUB_TOKEN is not set in production mode. Pipeline operations may be limited.');
      }
    }

    // Log non-sensitive config for debugging
    logger.debug('Using configuration', {
      NODE_ENV: validatedEnv.NODE_ENV,
      PORT: validatedEnv.PORT,
      LOG_LEVEL: validatedEnv.LOG_LEVEL,
      CORS_ORIGIN: validatedEnv.CORS_ORIGIN,
      GITHUB_API_URL: validatedEnv.GITHUB_API_URL,
      // Don't log sensitive tokens
      GITHUB_TOKEN: validatedEnv.GITHUB_TOKEN ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      SUPABASE_URL: validatedEnv.SUPABASE_URL || '[NOT CONFIGURED]',
      SUPABASE_KEY: validatedEnv.SUPABASE_KEY ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      SUPABASE_SERVICE_KEY: validatedEnv.SUPABASE_SERVICE_KEY ? '[CONFIGURED]' : '[NOT CONFIGURED]',
    });

    return validatedEnv;
  } catch (error) {
    // Log validation errors
    logger.error('Environment validation failed', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      logger.error(`Validation errors:\n${formattedErrors}`);
    }
    
    // In production, we want to fail immediately if environment is invalid
    if (process.env.NODE_ENV === 'production') {
      logger.error('Invalid environment variables in production, exiting');
      process.exit(1);
    }
    
    // In development, we can use defaults and continue with a warning
    logger.warn('Using default environment values where possible');
    
    // Return parsed env with defaults (may be incomplete)
    return envSchema.parse(envVars);
  }
}

/**
 * Singleton instance of the validated environment
 */
export const env = validateEnv(); 