/**
 * Utility types for database operations
 * This file contains type utilities for working with the Supabase database.
 */

import { Database } from '../supabase';

/**
 * A convenience type for accessing table rows
 * Example: TableRow<'repositories'> gives you the row type for repositories table
 */
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * A convenience type for insert operations
 * Example: TableInsert<'repositories'> gives you the insert type for repositories table
 */
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * A convenience type for update operations
 * Example: TableUpdate<'repositories'> gives you the update type for repositories table
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Extract only the specified keys from a table row
 * Example: SelectedColumns<'repositories', 'id' | 'name'>
 */
export type SelectedColumns<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row']
> = Pick<Database['public']['Tables'][T]['Row'], K>;

/**
 * Make certain properties required even if they are optional in the database
 * Example: RequiredColumns<'repositories', 'description' | 'license'>
 */
export type RequiredColumns<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row']
> = Omit<Database['public']['Tables'][T]['Row'], K> & 
  Required<Pick<Database['public']['Tables'][T]['Row'], K>>;

/**
 * Create a type with all properties of a table that match a specific type
 * Example: PropertiesOfType<'repositories', string>
 */
export type PropertiesOfType<
  T extends keyof Database['public']['Tables'],
  PropType
> = {
  [K in keyof Database['public']['Tables'][T]['Row'] as 
    Database['public']['Tables'][T]['Row'][K] extends PropType ? K : never]: 
    Database['public']['Tables'][T]['Row'][K]
};

/**
 * Extract just the ID type of a table
 * Example: IdType<'repositories'> // number
 */
export type IdType<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'] extends { id: infer U } ? U : never;

/**
 * Filter tables by a condition
 * Example: JoinableTable<'repositories', 'contributors'> 
 */
export type JoinableTable<
  T extends keyof Database['public']['Tables'],
  U extends keyof Database['public']['Tables']
> = {
  [K in keyof Database['public']['Tables'][T]['Row']]: 
    K extends `${string}_id` ? 
      K extends `${infer TableName}_id` ? 
        TableName extends U ? 
          K : 
          never : 
        never : 
      never
};

/**
 * A utility type for pagination parameters
 */
export type PaginationParams = {
  page?: number;
  limit?: number;
};

/**
 * A utility type for sort parameters
 */
export type SortParams<T extends keyof Database['public']['Tables']> = {
  column: keyof Database['public']['Tables'][T]['Row'];
  order: 'asc' | 'desc';
};

/**
 * Response wrapping type with metadata
 */
export type DatabaseResponse<T> = {
  data: T | null;
  error: Error | null;
  count: number | null;
  status: number;
};

/**
 * Extract nested tables based on foreign key relationship
 * Example: RelatedTable<'commits', 'repository_id'> // 'repositories'
 */
export type RelatedTable<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row'] & string
> = K extends `${infer RelatedTable}_id` ? 
  RelatedTable extends keyof Database['public']['Tables'] ? 
    RelatedTable : 
    never : 
  never;

/**
 * A utility type for creating a join between two tables
 * Example: JoinedTables<'commits', 'repositories'>
 */
export type JoinedTables<
  T extends keyof Database['public']['Tables'],
  U extends keyof Database['public']['Tables']
> = 
  Database['public']['Tables'][T]['Row'] & {
    [K in U]: Database['public']['Tables'][U]['Row']
  }; 