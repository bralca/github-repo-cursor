
# Implementation Guidelines for All Epics

## IMPORTANT: Build on Existing Code

**All implementation work should build upon the existing codebase. Do not rebuild functionality from scratch.**

This project has an existing foundation with established patterns, components, and utilities. When implementing new features:

1. **Review Existing Code First**
   - Always examine the current codebase to understand patterns and approaches
   - Look for similar implementations that can be extended or adapted
   - Use existing utilities, hooks, and components rather than rebuilding them

2. **Extend, Don't Replace**
   - Extend existing implementations rather than creating new ones that duplicate functionality
   - Follow established patterns for consistency across the codebase
   - Preserve backward compatibility with existing code

3. **Use Consistent Conventions**
   - Maintain the same naming conventions for consistency
   - Follow the project's coding style and patterns
   - Match the architectural approach for new components and hooks

4. **Leverage Existing UI Components**
   - Use the established UI component library (shadcn/ui)
   - Maintain visual consistency with existing UI elements
   - Extend existing component patterns for new UI elements

5. **Data Flow Consistency**
   - Follow established data fetching patterns (React Query hooks)
   - Maintain consistent error handling approaches
   - Use existing validation patterns

6. **Documentation**
   - Document new code in a manner consistent with existing documentation
   - Add comments explaining how new code relates to existing functionality
   - Update documentation when extending existing features

## Implementation Process

When implementing a new feature or enhancement:

1. **Assessment Phase**
   - Identify relevant existing code in the codebase
   - Understand current implementation patterns
   - Determine what can be reused or extended

2. **Design Phase**
   - Plan how to build upon existing functionality
   - Determine necessary modifications to existing code
   - Design extensions that maintain consistency

3. **Implementation Phase**
   - Extend existing functions and components
   - Follow established coding patterns
   - Use existing utilities and helper functions
   - Ensure backward compatibility

4. **Testing Phase**
   - Ensure modifications don't break existing functionality
   - Verify integration with existing systems
   - Test both new and existing functionality

5. **Documentation Phase**
   - Document how new code builds upon existing systems
   - Explain design decisions and integration points
   - Update documentation of modified existing code

## Data Fetching & Pagination

When implementing data fetching and pagination:

1. **Use Established Hooks**
   - Use the `useSupabaseQuery` hook for base Supabase queries
   - Use the `usePagination` hook for paginated data
   - Follow the pattern of creating specific hooks for different data types

2. **Pagination Methods**
   - Support both offset-based and cursor-based pagination
   - Use offset pagination for smaller datasets and when total count is needed
   - Use cursor pagination for large datasets and infinite scrolling

3. **Pagination Implementation Best Practices**
   - Be explicit about pagination method: 'offset' or 'cursor'
   - For cursor-based pagination, always specify a cursorField that is indexed in the database
   - Handle edge cases like empty results or last page scenarios
   - Cache cursors between page transitions to maintain consistency

4. **Handle Loading and Error States**
   - Always handle loading states with appropriate UI feedback
   - Provide clear error messages for query failures
   - Use skeleton loaders for improved user experience during loading

5. **Optimize Performance**
   - Use `keepPreviousData` to maintain UI consistency during page changes
   - Implement proper caching strategies for frequently accessed data
   - Add indices to database tables for frequently paginated columns

By building upon the existing codebase rather than starting from scratch, we maintain a consistent, maintainable, and efficient application.
