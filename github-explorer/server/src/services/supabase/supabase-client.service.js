// This file is kept for import compatibility only.
// Supabase is only used for auth in the frontend.

export const supabaseClientFactory = {
  createClient() {
    return null;
  },
  getClient() {
    return null;
  }
};

export class SupabaseClient {
  constructor() {
    // No-op constructor
  }
  
  getClient() {
    return null;
  }
} 