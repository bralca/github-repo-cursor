/**
 * Environment variable validation utility
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL'
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

/**
 * Get a validated environment variable
 * @param key The environment variable key
 * @param defaultValue Optional default value if not found
 * @param required Whether the variable is required
 * @returns The environment variable value
 */
export function getEnv(
  key: RequiredEnvVar,
  defaultValue?: string,
  required = true
): string {
  const value = process.env[key] || defaultValue;

  if (required && !value) {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value || '';
}

/**
 * Validate all required environment variables
 * @returns True if all required environment variables are present
 */
export function validateEnv(): boolean {
  try {
    requiredEnvVars.forEach((key) => {
      getEnv(key);
    });
    return true;
  } catch (error) {
    console.error('Environment validation failed:', error);
    return false;
  }
}

/**
 * Environment variables
 */
export const env = {
  supabase: {
    url: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  },
  app: {
    url: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000', false)
  }
} as const; 