/**
 * Type guards for Supabase database responses
 * This file contains functions to validate and ensure type safety for data
 * returned from the Supabase database.
 */

import { Database } from '../supabase';
import { TableRow } from './database';

/**
 * Type guard for checking if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for checking if an object has a specific property
 */
export function hasProperty<K extends string>(
  obj: unknown, 
  property: K
): obj is Record<K, unknown> {
  return isObject(obj) && property in obj;
}

/**
 * Type guard for checking if a value is an array
 */
export function isArray<T>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Type guard for checking if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for checking if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for checking if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for checking if a value is a date string
 */
export function isDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard for checking if a value matches a repository row
 */
export function isRepositoryRow(value: unknown): value is TableRow<'repositories'> {
  if (!isObject(value)) return false;
  
  return (
    hasProperty(value, 'id') && isNumber(value.id) &&
    hasProperty(value, 'name') && isString(value.name) &&
    hasProperty(value, 'url') && isString(value.url)
    // We could check all properties, but these are the minimal required ones
  );
}

/**
 * Type guard for checking if a value matches a contributor row
 */
export function isContributorRow(value: unknown): value is TableRow<'contributors'> {
  if (!isObject(value)) return false;
  
  return (
    hasProperty(value, 'id') && isString(value.id) &&
    hasProperty(value, 'username') && isString(value.username)
  );
}

/**
 * Type guard for checking if a value matches a merge request row
 */
export function isMergeRequestRow(value: unknown): value is TableRow<'merge_requests'> {
  if (!isObject(value)) return false;
  
  return (
    hasProperty(value, 'id') && isNumber(value.id)
    // We could check more properties, but this is the minimal required one
  );
}

/**
 * Type guard for checking if a value matches a commit row
 */
export function isCommitRow(value: unknown): value is TableRow<'commits'> {
  if (!isObject(value)) return false;
  
  return (
    hasProperty(value, 'id') && isString(value.id) &&
    hasProperty(value, 'hash') && isString(value.hash) &&
    hasProperty(value, 'title') && isString(value.title) &&
    hasProperty(value, 'author') && isString(value.author) &&
    hasProperty(value, 'date') && isDateString(value.date) &&
    hasProperty(value, 'diff') && isString(value.diff)
  );
}

/**
 * Type guard for checking if a value is an array of a specific row type
 */
export function isTableRowArray<T extends keyof Database['public']['Tables']>(
  value: unknown,
  typeGuard: (item: unknown) => item is TableRow<T>
): value is Array<TableRow<T>> {
  return isArray(value) && value.every(item => typeGuard(item));
}

/**
 * Specific type guards for arrays of each table
 */
export function isRepositoryArray(value: unknown): value is Array<TableRow<'repositories'>> {
  return isTableRowArray(value, isRepositoryRow);
}

export function isContributorArray(value: unknown): value is Array<TableRow<'contributors'>> {
  return isTableRowArray(value, isContributorRow);
}

export function isMergeRequestArray(value: unknown): value is Array<TableRow<'merge_requests'>> {
  return isTableRowArray(value, isMergeRequestRow);
}

export function isCommitArray(value: unknown): value is Array<TableRow<'commits'>> {
  return isTableRowArray(value, isCommitRow);
}

/**
 * Type assertion functions (throws error if type doesn't match)
 */
export function assertIsRepository(
  value: unknown
): asserts value is TableRow<'repositories'> {
  if (!isRepositoryRow(value)) {
    throw new Error('Value is not a valid repository');
  }
}

export function assertIsContributor(
  value: unknown
): asserts value is TableRow<'contributors'> {
  if (!isContributorRow(value)) {
    throw new Error('Value is not a valid contributor');
  }
}

export function assertIsMergeRequest(
  value: unknown
): asserts value is TableRow<'merge_requests'> {
  if (!isMergeRequestRow(value)) {
    throw new Error('Value is not a valid merge request');
  }
}

export function assertIsCommit(
  value: unknown
): asserts value is TableRow<'commits'> {
  if (!isCommitRow(value)) {
    throw new Error('Value is not a valid commit');
  }
} 