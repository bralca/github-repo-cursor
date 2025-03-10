
# Epic 2: Homepage Integration - Implementation Prompts

This document contains detailed AI prompts for implementing the user stories in [Epic 2: Homepage Integration](../epics/EPIC_2_HOMEPAGE.md). Each prompt is designed to help complete a specific task, with clear instructions and context for the AI.

## Task Tracking

| Story | Task | Status | AI Provider |
|-------|------|--------|------------|
| 2.1 Homepage Data Infrastructure | 2.1.1 Shared Data Fetching Patterns | ⬜ Not Started | Lovable |
| 2.1 Homepage Data Infrastructure | 2.1.2 Data Transformation Utilities | ⬜ Not Started | Lovable |
| 2.1 Homepage Data Infrastructure | 2.1.3 Error Handling Strategy | ⬜ Not Started | Lovable |
| 2.1 Homepage Data Infrastructure | 2.1.4 Performance Optimization Utilities | ⬜ Not Started | Lovable |
| 2.1 Homepage Data Infrastructure | 2.1.5 Shared Loading Components | ⬜ Not Started | Lovable |
| 2.2 Stats Overview Integration | 2.2.1 Database Aggregation Function | ⬜ Not Started | Lovable |
| 2.2 Stats Overview Integration | 2.2.2 Stats Query Hook | ⬜ Not Started | Lovable |
| 2.2 Stats Overview Integration | 2.2.3 StatsOverview Component Update | ⬜ Not Started | Lovable |
| 2.2 Stats Overview Integration | 2.2.4 Animation & Interaction | ⬜ Not Started | Lovable |
| 2.2 Stats Overview Integration | 2.2.5 Testing & Optimization | ⬜ Not Started | Lovable |
| 2.3 Top Contributors Integration | 2.3.1 Contributor Score Database Function | ⬜ Not Started | Lovable |
| 2.3 Top Contributors Integration | 2.3.2 Top Contributors Query Hook | ⬜ Not Started | Lovable |
| 2.3 Top Contributors Integration | 2.3.3 TopContributors Component Update | ⬜ Not Started | Lovable |
| 2.3 Top Contributors Integration | 2.3.4 Visual Enhancements | ⬜ Not Started | Lovable |
| 2.3 Top Contributors Integration | 2.3.5 Interactions & Performance | ⬜ Not Started | Lovable |
| 2.4 Developer Excellence Awards Integration | 2.4.1 Awards Database Schema | ⬜ Not Started | Lovable |
| 2.4 Developer Excellence Awards Integration | 2.4.2 Award Generation Algorithm | ⬜ Not Started | OpenAI GPT-4o |
| 2.4 Developer Excellence Awards Integration | 2.4.3 Excellence Awards Query Hook | ⬜ Not Started | Lovable |
| 2.4 Developer Excellence Awards Integration | 2.4.4 DeveloperExcellence Component Update | ⬜ Not Started | Lovable |
| 2.4 Developer Excellence Awards Integration | 2.4.5 Award Card Design | ⬜ Not Started | Lovable |
| 2.5 Trending Repositories Integration | 2.5.1 Star History Database Schema | ⬜ Not Started | Lovable |
| 2.5 Trending Repositories Integration | 2.5.2 Star History Tracking | ⬜ Not Started | OpenAI GPT-4o |
| 2.5 Trending Repositories Integration | 2.5.3 Growth Rate Calculation | ⬜ Not Started | Lovable |
| 2.5 Trending Repositories Integration | 2.5.4 Trending Repositories Query Hook | ⬜ Not Started | Lovable |
| 2.5 Trending Repositories Integration | 2.5.5 TrendingRepos Component Update | ⬜ Not Started | Lovable |
| 2.5 Trending Repositories Integration | 2.5.6 Growth Visualization | ⬜ Not Started | Lovable |
| 2.6 Hottest PRs Integration | 2.6.1 Review Intensity Database Implementation | ⬜ Not Started | Lovable |
| 2.6 Hottest PRs Integration | 2.6.2 PR Review Intensity Algorithm | ⬜ Not Started | OpenAI GPT-4o |
| 2.6 Hottest PRs Integration | 2.6.3 Hottest PRs Query Hook | ⬜ Not Started | Lovable |
| 2.6 Hottest PRs Integration | 2.6.4 HottestPRs Component Update | ⬜ Not Started | Lovable |
| 2.6 Hottest PRs Integration | 2.6.5 Enhanced PR Presentation | ⬜ Not Started | Lovable |
| 2.7 Homepage Integration Testing & Optimization | 2.7.1 Integration Testing | ⬜ Not Started | Lovable |
| 2.7 Homepage Integration Testing & Optimization | 2.7.2 Performance Optimization | ⬜ Not Started | Lovable |
| 2.7 Homepage Integration Testing & Optimization | 2.7.3 Network Optimization | ⬜ Not Started | Lovable |
| 2.7 Homepage Integration Testing & Optimization | 2.7.4 UI Polish & Consistency | ⬜ Not Started | Lovable |
| 2.7 Homepage Integration Testing & Optimization | 2.7.5 Analytics & Monitoring | ⬜ Not Started | Lovable |

## Story 2.1: Homepage Data Infrastructure

### Task 2.1.1: Shared Data Fetching Patterns

**Prompt for Lovable AI:**

```
Create shared data fetching patterns for the homepage components using React Query.

CONTEXT:
- Review the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) document to understand the component structure
- Refer to [Database Schema](../DATABASE_SCHEMA.md) to understand available data
- Look at existing patterns in the `hooks/useSupabaseQuery.ts` file

REQUIREMENTS:
1. Create a new file `src/hooks/homepage/useHomepageQuery.ts` that contains:
   - A base query hook that wraps React Query functionality
   - Common error handling patterns
   - Standardized retry logic (3 retries with exponential backoff)
   - Consistent stale time and caching strategies (5-minute stale time)
   - TypeScript interfaces for all return types

2. Add a Suspense boundary component in `src/components/home/HomepageSuspense.tsx` that:
   - Works with React Query's suspense mode
   - Provides a consistent loading experience
   - Includes fallback UI with skeleton components
   - Handles error states gracefully

3. Create an error boundary in `src/components/home/HomepageErrorBoundary.tsx` that:
   - Catches and displays errors from data fetching
   - Provides retry functionality
   - Logs errors to the console
   - Shows user-friendly error messages

The code should follow the established patterns in the codebase, be fully typed, and include JSDoc documentation for all exported functions and components.
```

### Task 2.1.2: Data Transformation Utilities

**Prompt for Lovable AI:**

```
Create data transformation utilities for the homepage components.

CONTEXT:
- Review the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) document to understand data requirements
- Examine existing utility functions in `src/utils/dataMappers.ts`
- All utilities should be fully typed and testable

REQUIREMENTS:
1. Create a new file `src/utils/homepage/formatters.ts` with the following utilities:
   - `formatNumber`: Format large numbers with compact notation (e.g., 1.2k, 3.5M)
   - `formatPercentage`: Format percentage values with proper precision
   - `formatDate`: Format dates in relative time (e.g., "2 days ago")
   - `formatDuration`: Format time durations (e.g., "3h 45m")

2. Create `src/utils/homepage/aggregators.ts` with:
   - `calculateGrowthRate`: Calculate percentage growth between two values
   - `sumByProperty`: Sum an array of objects by a specific property
   - `groupByProperty`: Group an array of objects by a property
   - `calculateAverage`: Calculate average of array values
   - `calculateMedian`: Calculate median of array values

3. Create `src/utils/homepage/normalizers.ts` with:
   - Functions to normalize API responses to consistent formats
   - Type guards to ensure data consistency
   - Default values for missing data

Each function should include:
- TypeScript type definitions
- JSDoc comments explaining purpose and parameters
- Input validation
- Error handling for edge cases

Make the utilities generic where appropriate, so they can be reused across the application.
```

### Task 2.1.3: Error Handling Strategy

**Prompt for Lovable AI:**

```
Implement a comprehensive error handling strategy for the homepage components.

CONTEXT:
- Review existing error handling in the codebase
- Understand React Query's error handling capabilities
- Consider both UI errors and data fetching errors

REQUIREMENTS:
1. Create `src/components/home/ErrorFallback.tsx` with:
   - Different visual states for different error types
   - Retry button for data fetching errors
   - User-friendly error messages
   - Option to report errors
   
2. Create `src/utils/homepage/errorHandlers.ts` with:
   - `createErrorMessage`: Convert error objects to user-friendly messages
   - `logError`: Log errors to console with contextual information
   - `isNetworkError`: Type guard to identify network-related errors
   - `isAuthError`: Type guard to identify authentication errors
   - `isDataError`: Type guard to identify data format/validation errors

3. Enhance React Query error handling in a `src/hooks/homepage/useErrorHandling.ts` hook that:
   - Provides consistent error handling for all homepage queries
   - Implements retry mechanism with exponential backoff
   - Handles specific error types differently (network vs. data errors)
   - Provides hooks for UI components to display appropriate error states

4. Create a fallback data mechanism in `src/utils/homepage/fallbackData.ts` that:
   - Provides empty states for all homepage data structures
   - Ensures UI doesn't break when data is unavailable
   - Makes it clear to users when they're seeing fallback data

The implementation should focus on maintaining a good user experience even when errors occur, with clear communication about what went wrong and how to recover.
```

### Task 2.1.4: Performance Optimization Utilities

**Prompt for Lovable AI:**

```
Create performance optimization utilities for homepage components.

CONTEXT:
- The homepage contains multiple data-heavy components
- Performance optimization is critical for a good user experience
- Review existing patterns in the codebase for optimization

REQUIREMENTS:
1. Create `src/utils/homepage/memoization.ts` with:
   - Custom hooks for memoizing expensive calculations
   - Utility functions that implement the React.memo pattern correctly
   - Helper for deep comparison of objects
   - Type-safe memoization utilities

2. Create `src/hooks/homepage/useOptimizedQuery.ts` that:
   - Implements stale-while-revalidate pattern
   - Adds query deduplication
   - Optimizes query parameters
   - Implements proper caching strategies
   - Adds conditional fetching to prevent unnecessary requests

3. Create `src/utils/homepage/queryOptimization.ts` with:
   - Functions to batch multiple queries
   - Utilities to optimize query parameters
   - Functions to determine if a query should be executed
   - Helpers to manage query dependencies

4. Add performance monitoring in `src/utils/homepage/performanceMonitoring.ts` with:
   - Functions to measure component render times
   - Utilities to track query performance
   - Helpers to identify performance bottlenecks
   - Console logging for performance metrics during development

The utilities should be designed for reuse across components and should significantly improve homepage performance, especially for users with slower connections or devices.
```

### Task 2.1.5: Shared Loading Components

**Prompt for Lovable AI:**

```
Create shared loading components for the homepage.

CONTEXT:
- Review the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) document
- Understand the layout and structure of each homepage component
- Use Tailwind CSS for styling
- Implement shadcn/ui components where appropriate

REQUIREMENTS:
1. Create `src/components/home/loaders/CardSkeleton.tsx` that:
   - Mimics the shape and structure of card components
   - Shows pulsing animation
   - Is responsive to different screen sizes
   - Accepts props to customize size and layout

2. Create `src/components/home/loaders/StatsSkeleton.tsx` that:
   - Matches the layout of the StatsOverview component
   - Shows pulsing animation for each statistic
   - Maintains the grid layout during loading

3. Create `src/components/home/loaders/TableSkeleton.tsx` that:
   - Mimics table rows and columns
   - Shows pulsing animation
   - Adjusts to different screen sizes
   - Accepts props for number of rows and columns

4. Create `src/components/home/loaders/ChartSkeleton.tsx` for any chart components:
   - Maintains the dimensions of the actual chart
   - Shows a placeholder animation
   - Prevents layout shift when real data loads

5. Create `src/components/home/loaders/index.ts` that:
   - Exports all loader components
   - Provides documentation on when to use each loader

Each skeleton component should:
- Maintain the same dimensions as the components they replace
- Prevent layout shifts when real content loads
- Use consistent design language
- Be accessible (proper aria attributes)
- Include subtle animations to indicate loading state

Implement all loader components using Tailwind CSS for styling and maintain consistency with the existing UI design.
```

## Story 2.2: Stats Overview Integration

### Task 2.2.1: Database Aggregation Function

**Prompt for Lovable AI:**

```
Create a Supabase function called `get_overview_stats()` that aggregates statistics for the homepage overview.

CONTEXT:
- Review the [Database Schema](../DATABASE_SCHEMA.md) document to understand available tables and relationships
- Understand the StatsOverview component requirements from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)
- Performance optimization is important as this will run on every homepage load

REQUIREMENTS:
1. Create a new SQL function in the Supabase project:

```sql
CREATE OR REPLACE FUNCTION get_overview_stats()
RETURNS JSONB
LANGUAGE SQL
AS $$
  -- Implementation here
$$;
```

2. The function should return a JSON object with the following statistics:
   - repository_count: Total number of repositories
   - active_contributors: Number of contributors with activity in the last 30 days
   - total_commits: Total number of commits across all repositories
   - total_prs: Total number of pull requests across all repositories
   - open_prs: Number of open pull requests
   - closed_prs: Number of closed pull requests
   - merged_prs: Number of merged pull requests
   - avg_merge_time_hours: Average time from PR creation to merge in hours
   - total_stars: Sum of stars across all repositories
   - total_forks: Sum of forks across all repositories

3. Optimize the query with:
   - Appropriate joins between tables
   - Efficient aggregation functions
   - Indexes on frequently queried columns
   - Proper error handling

4. Document the function with comments explaining:
   - The purpose of the function
   - Input parameters (if any are added later)
   - Return value structure
   - Performance considerations

The function should be efficient enough to handle large datasets without significant performance degradation.
```

### Task 2.2.2: Stats Query Hook

**Prompt for Lovable AI:**

```
Create a React Query hook named `useOverviewStats` that fetches statistics for the homepage overview.

CONTEXT:
- Review the `get_overview_stats()` Supabase function created in Task 2.2.1
- Examine existing React Query patterns in the codebase, particularly in `src/hooks/useSupabaseQuery.ts`
- Understand the StatsOverview component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)

REQUIREMENTS:
1. Create `src/hooks/homepage/useOverviewStats.ts` that:
   - Uses React Query to fetch data from the `get_overview_stats()` function
   - Implements proper TypeScript interfaces for the return data
   - Includes loading, error, and success states
   - Adds appropriate caching with stale time of 5 minutes
   - Implements automatic refetching every 15 minutes
   - Adds error handling with 3 retries on failure

2. The hook should return an object with the following structure:
```typescript
interface OverviewStats {
  repositoryCount: number;
  activeContributors: number;
  totalCommits: number;
  totalPRs: number;
  openPRs: number;
  closedPRs: number;
  mergedPRs: number;
  avgMergeTimeHours: number;
  totalStars: number;
  totalForks: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

3. Implement proper error handling:
   - Return helpful error messages
   - Log errors to console in development
   - Provide a refetch function for retry functionality

4. Add comprehensive JSDoc documentation:
   - Document return types
   - Explain caching behavior
   - Document error handling behavior
   - Provide usage examples

The hook should handle all edge cases gracefully and provide a consistent interface for components to consume.
```

### Task 2.2.3: StatsOverview Component Update

**Prompt for Lovable AI:**

```
Update the `StatsOverview` component to use real data from the `useOverviewStats` hook.

CONTEXT:
- The component is located at `src/components/home/StatsOverview.tsx`
- The component currently uses mock data
- Review the `useOverviewStats` hook created in Task 2.2.2
- Examine the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) for component specifications

REQUIREMENTS:
1. Update `src/components/home/StatsOverview.tsx` to:
   - Replace mock data with real data from the `useOverviewStats` hook
   - Add loading state using skeleton loaders from Task 2.1.5
   - Implement error handling with error fallback from Task 2.1.3
   - Maintain the existing UI design and layout
   - Add proper number formatting using utilities from Task 2.1.2

2. The component should display:
   - Total repositories count
   - Active contributors count
   - Total commits count
   - Total PRs with a breakdown of open/closed/merged
   - PR success rate (merged PRs / total PRs as percentage)
   - Average merge time in hours

3. Add tooltips to each statistic that:
   - Show exact values when hovering over rounded numbers
   - Provide additional context about what the statistic means
   - Use the Tooltip component from shadcn/ui

4. Ensure the component is responsive:
   - Display as grid on desktop
   - Stack vertically on mobile
   - Adjust text sizes appropriately for different screens

5. The component should gracefully handle:
   - Loading states
   - Error states with retry functionality
   - Empty or null data values
   - Extremely large numbers

The updated component should maintain its current visual design while using real data and providing appropriate loading and error states.
```

### Task 2.2.4: Animation & Interaction

**Prompt for Lovable AI:**

```
Add animations and interactions to the StatsOverview component.

CONTEXT:
- The StatsOverview component has been updated to use real data in Task 2.2.3
- Review the component at `src/components/home/StatsOverview.tsx`
- Subtle animations will enhance the user experience
- Use Tailwind CSS for animations where possible

REQUIREMENTS:
1. Add a count-up animation for numeric values:
   - Create `src/components/ui/animated-counter.tsx` component
   - Animate from 0 to the actual value when the component loads
   - Make the animation speed proportional to the value
   - Allow customization of duration and easing function
   - Add prop to disable animation for accessibility

2. Add hover effects to each statistic card:
   - Subtle scale transform
   - Shadow increase
   - Background color shift
   - Transition all properties smoothly

3. Add transitions for data changes:
   - Animate values when they update from refetching
   - Use color indication (green/red) for increasing/decreasing values
   - Implement smooth transitions between states (loading/error/success)

4. Add micro-interactions:
   - Pulse animation on hover for interactive elements
   - Tooltip animations for smooth appearance/disappearance
   - Visual feedback for any clickable elements

5. Ensure all animations are:
   - Subtle and not distracting
   - Performance optimized (use CSS transforms and opacity)
   - Respectful of reduced motion preferences
   - Consistent with the overall design language

Implement these animations and interactions while maintaining the component's existing functionality and design.
```

### Task 2.2.5: Testing & Optimization

**Prompt for Lovable AI:**

```
Optimize and test the StatsOverview component for performance and edge cases.

CONTEXT:
- The StatsOverview component now uses real data and has animations
- Performance optimization is important for the homepage
- Edge cases need to be handled gracefully
- Review the updates made in Tasks 2.2.3 and 2.2.4

REQUIREMENTS:
1. Implement performance optimizations:
   - Use React.memo for the component and its children
   - Optimize render performance with useMemo and useCallback hooks
   - Implement the stale-while-revalidate pattern for data fetching
   - Reduce unnecessary re-renders
   - Add key props where appropriate for list items

2. Test with various data scenarios:
   - Create `src/utils/homepage/statsMockGenerators.ts` with:
     - Functions to generate test data with different characteristics
     - Edge case data generators (extremely large/small values, nulls, etc.)
   - Test the component with:
     - Empty data
     - Partial data
     - Extremely large numbers
     - Zero values
     - Negative values (if applicable)

3. Add error boundaries and fallbacks:
   - Wrap component in an error boundary to catch rendering errors
   - Provide fallback UI for individual sections if data is problematic
   - Add default values for missing or invalid data

4. Optimize for various device conditions:
   - Test performance on slower devices
   - Optimize for different network conditions
   - Ensure responsive design works on all screen sizes
   - Test with various browser zoom levels

5. Check accessibility:
   - Ensure proper contrast ratios for all text
   - Add appropriate ARIA attributes
   - Test keyboard navigation
   - Respect reduced motion preferences

Document any findings or optimizations made during this task in comments for future reference.
```

## Story 2.3: Top Contributors Integration

### Task 2.3.1: Contributor Score Database Function

**Prompt for Lovable AI:**

```
Create a Supabase function called `calculate_contribution_scores()` that calculates scores for contributors.

CONTEXT:
- Review the [Database Schema](../DATABASE_SCHEMA.md) document to understand contributors table
- Understand the TopContributors component requirements from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)
- The calculation should consider multiple factors about a contributor's activity

REQUIREMENTS:
1. Create a new SQL function in the Supabase project:

```sql
CREATE OR REPLACE FUNCTION calculate_contribution_scores()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation here
END;
$$;
```

2. Create a SQL function to retrieve top contributors:

```sql
CREATE OR REPLACE FUNCTION get_top_contributors(limit_count INTEGER DEFAULT 5)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation here
END;
$$;
```

3. The contribution score calculation should consider:
   - Direct commits (30% weight)
   - PR quality - merged vs rejected ratio (25% weight)
   - Code review participation (20% weight)
   - Issue resolution (15% weight)
   - Activity consistency (10% weight)

4. The `get_top_contributors` function should return a JSON array with contributors ordered by score, including:
   - id: The contributor's unique identifier
   - username: The contributor's GitHub username
   - name: The contributor's display name (if available)
   - avatar: URL to the contributor's avatar
   - impact_score: The calculated impact score
   - active_streak_days: Consecutive days with contributions
   - direct_commits: Number of direct commits
   - pull_requests_merged: Number of merged pull requests
   - pull_requests_rejected: Number of rejected pull requests
   - code_reviews: Number of code reviews performed

5. Optimize the functions with:
   - Appropriate indexes
   - Efficient calculation logic
   - Error handling
   - Caching where appropriate

Ensure the functions are performant even with large datasets and include detailed comments explaining the scoring algorithm.
```

### Task 2.3.2: Top Contributors Query Hook

**Prompt for Lovable AI:**

```
Create a React Query hook named `useTopContributors` that fetches top contributors from Supabase.

CONTEXT:
- Review the `get_top_contributors()` Supabase function created in Task 2.3.1
- Examine existing React Query patterns in the codebase
- Understand the TopContributors component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)

REQUIREMENTS:
1. Create `src/hooks/homepage/useTopContributors.ts` that:
   - Accepts a parameter for the number of contributors to fetch (default to 5)
   - Uses React Query to fetch data from the `get_top_contributors()` function
   - Implements proper TypeScript interfaces for the return data
   - Includes loading, error, and success states
   - Adds appropriate caching with stale time of 5 minutes
   - Implements automatic refetching as needed
   - Adds error handling with retries on failure

2. The hook should return an object with the following structure:
```typescript
interface TopContributorsResult {
  contributors: Contributor[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface Contributor {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
  impactScore: number;
  activeStreakDays: number;
  directCommits: number;
  pullRequestsMerged: number;
  pullRequestsRejected: number;
  codeReviews: number;
}
```

3. Implement proper error handling:
   - Return helpful error messages
   - Log errors to console in development
   - Provide a refetch function for retry functionality

4. Add comprehensive JSDoc documentation:
   - Document parameters and return types
   - Explain caching behavior
   - Document error handling behavior
   - Provide usage examples

The hook should be reusable and provide a consistent interface for components to consume.
```

### Task 2.3.3: TopContributors Component Update

**Prompt for Lovable AI:**

```
Update the `TopContributors` component to use real data from the `useTopContributors` hook.

CONTEXT:
- The component is located at `src/components/home/TopContributors.tsx`
- The component currently uses mock data
- Review the `useTopContributors` hook created in Task 2.3.2
- Examine the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) for component specifications

REQUIREMENTS:
1. Update `src/components/home/TopContributors.tsx` to:
   - Replace mock data with real data from the `useTopContributors` hook
   - Add loading state using skeleton loaders
   - Implement error handling with error fallback
   - Maintain the existing UI design and layout
   - Add proper formatting for numbers and dates

2. The component should display each contributor with:
   - Rank position (1, 2, 3, etc.)
   - Avatar image with fallback for missing images
   - Username or display name
   - Impact score prominently displayed
   - Commit and PR statistics
   - Active streak with a flame icon 🔥

3. Implement responsive design:
   - Display as grid or list depending on screen size
   - Adjust information density for different screens
   - Ensure all content is readable on mobile

4. Add sorting options:
   - Allow sorting by different metrics (score, commits, PRs)
   - Maintain selected sorting when data refreshes
   - Animate transitions between sort orders

5. The component should gracefully handle:
   - Loading states
   - Error states with retry functionality
   - Empty data (no contributors)
   - Missing avatar images
   - Varying lengths of usernames and statistics

The updated component should maintain its current visual design while using real data and providing appropriate loading and error states.
```

### Task 2.3.4: Visual Enhancements

**Prompt for Lovable AI:**

```
Add visual enhancements to the TopContributors component.

CONTEXT:
- The TopContributors component has been updated to use real data in Task 2.3.3
- Review the component at `src/components/home/TopContributors.tsx`
- Visual enhancements will improve the user experience and data comprehension
- Use Tailwind CSS for styling and shadcn/ui components where appropriate

REQUIREMENTS:
1. Add rank badges with appropriate styling:
   - Gold badge for rank #1
   - Silver badge for rank #2
   - Bronze badge for rank #3
   - Numbered badges for remaining ranks
   - Make badges visually distinctive

2. Implement streak indicator:
   - Add flame icon for contributors with active streaks
   - Size/color of flame varies based on streak length
   - Add tooltip showing exact streak duration
   - Add subtle animation to the flame icon

3. Create hover effects for contributor cards:
   - Subtle lift/shadow effect on hover
   - Highlight key metrics on hover
   - Show additional information in a tooltip
   - Smooth transitions for all hover effects

4. Add data visualization elements:
   - Mini sparkline or bar chart for contribution history
   - Visual indicator for PR success rate
   - Color coding for metrics (green for good, yellow for average, red for needs improvement)
   - Progress bars or gauges for relative comparisons

5. Improve the responsive layout:
   - Adjust information density based on screen size
   - Maintain focus on key metrics across all devices
   - Ensure touch targets are appropriate for mobile
   - Optimize spacing and typography for readability

All visual enhancements should complement the existing design language and improve the user's ability to understand the data at a glance.
```

### Task 2.3.5: Interactions & Performance

**Prompt for Lovable AI:**

```
Add interactions and optimize performance for the TopContributors component.

CONTEXT:
- The TopContributors component now uses real data and has visual enhancements
- Interactive elements will improve user engagement
- Performance optimization is important for smooth user experience
- Review the updates made in Tasks 2.3.3 and 2.3.4

REQUIREMENTS:
1. Add click actions:
   - Make contributor cards clickable to view detailed profile
   - Add subtle visual feedback for clickable elements
   - Implement navigation to contributor details page
   - Add keyboard navigation support

2. Implement optimistic UI updates:
   - Show immediate feedback when interacting with the component
   - Apply optimistic updates before server confirmation
   - Handle rollback gracefully if server requests fail
   - Maintain UI consistency during loading states

3. Optimize image loading:
   - Implement lazy loading for avatar images
   - Add image placeholders while loading
   - Use appropriate image sizes for different devices
   - Handle image loading errors gracefully

4. Improve rendering performance:
   - Implement virtualization for large lists
   - Use memo and callback hooks to prevent unnecessary re-renders
   - Optimize component tree to minimize render depth
   - Separate pure and impure components appropriately

5. Add performance monitoring:
   - Track render times and component updates
   - Log performance metrics to console in development
   - Add comments explaining performance considerations
   - Document optimizations for future reference

The component should feel responsive and interactive while maintaining excellent performance even with larger datasets.
```

## Story 2.4: Developer Excellence Awards Integration

### Task 2.4.1: Awards Database Schema

**Prompt for Lovable AI:**

```
Create a database schema for the Developer Excellence Awards feature.

CONTEXT:
- Review the [Database Schema](../DATABASE_SCHEMA.md) document to understand existing tables
- Understand the DeveloperExcellence component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)
- The schema needs to store AI-generated awards based on commit analysis

REQUIREMENTS:
1. Create a SQL script to add the following table to the Supabase database:

```sql
CREATE TABLE commit_awards (
  id SERIAL PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributors(id),
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  justification TEXT NOT NULL,
  score INTEGER NOT NULL,
  commit_ids TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_period VARCHAR(20) NOT NULL,
  
  CONSTRAINT valid_category CHECK (category IN (
    'Code Quality Champion',
    'Documentation Hero',
    'Bug Squasher',
    'Feature Innovator',
    'Refactoring Wizard',
    'Performance Optimizer'
  )),
  
  CONSTRAINT valid_time_period CHECK (time_period IN ('week', 'month'))
);

CREATE INDEX idx_commit_awards_contributor ON commit_awards(contributor_id);
CREATE INDEX idx_commit_awards_category ON commit_awards(category);
CREATE INDEX idx_commit_awards_time_period ON commit_awards(time_period);
```

2. Create a function to get excellence awards:

```sql
CREATE OR REPLACE FUNCTION get_excellence_awards(time_period VARCHAR DEFAULT 'week')
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation here
END;
$$;
```

3. The `get_excellence_awards` function should:
   - Accept a time_period parameter ('week' or 'month')
   - Join the commit_awards table with contributors to get contributor details
   - Return a JSON array with award information including:
     - Award category
     - Award title
     - Contributor name and avatar
     - Justification for the award
     - Score
     - Created date

4. Add appropriate indexes for performance
5. Include comments explaining the schema design and functions

The schema should be designed to efficiently store and retrieve awards data for the DeveloperExcellence component.
```

### Task 2.4.2: Award Generation Algorithm

**Prompt for OpenAI GPT-4o:**

```
Create a TypeScript module that implements an AI-powered excellence awards algorithm for developers based on commit analysis.

CONTEXT:
- The module should analyze commits to identify patterns of excellence
- Review the commit_awards table schema from Task 2.4.1
- Understand the DeveloperExcellence component requirements from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)
- The algorithm will generate awards in different categories based on commit quality and impact

REQUIREMENTS:
1. Create `src/utils/awards/excellenceAwards.ts` that exports:
   - An `analyzeCommitsForAwards` function that processes commits to identify excellence patterns
   - Functions to generate awards based on specific excellence criteria
   - Types for award categories and scoring

2. Implement analysis logic for these award categories:
   - Code Quality Champion: Identifies clean, well-structured commits that improve code quality
   - Documentation Hero: Recognizes significant documentation improvements
   - Bug Squasher: Identifies effective bug fixes
   - Feature Innovator: Recognizes innovative feature implementations
   - Refactoring Wizard: Identifies effective code refactoring
   - Performance Optimizer: Recognizes performance improvements

3. For each category, implement scoring logic based on:
   - Commit message analysis (keywords, sentiment, clarity)
   - Diff analysis (code structure changes, complexity reduction)
   - Code quality metrics (when available)
   - Contextual understanding of changes

4. Implement a main algorithm that:
   - Processes batches of commits
   - Calculates scores for each award category
   - Determines thresholds for awarding excellence badges
   - Generates justifications for each award
   - Groups related commits for a single award

5. The module should include these interfaces:
```typescript
interface CommitData {
  hash: string;
  title: string;
  message: string;
  author: string;
  authorId: string;
  date: string;
  diff: string;
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
}

interface AwardCandidate {
  category: string;
  contributorId: string;
  score: number;
  justification: string;
  commitIds: string[];
  title: string;
}
```

6. The main function should be capable of:
   - Running as a scheduled task
   - Processing commits from a specific time period
   - Storing results in the commit_awards table
   - Handling rate limiting and performance constraints

The code should be well-documented, testable, and follow best practices for maintainability and readability.
```

### Task 2.4.3: Excellence Awards Query Hook

**Prompt for Lovable AI:**

```
Create a React Query hook named `useExcellenceAwards` that fetches developer excellence awards.

CONTEXT:
- Review the `get_excellence_awards()` Supabase function created in Task 2.4.1
- Examine existing React Query patterns in the codebase
- Understand the DeveloperExcellence component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)

REQUIREMENTS:
1. Create `src/hooks/homepage/useExcellenceAwards.ts` that:
   - Accepts a parameter for time period ('week' or 'month', default to 'week')
   - Uses React Query to fetch data from the `get_excellence_awards()` function
   - Implements proper TypeScript interfaces for the return data
   - Includes loading, error, and success states
   - Adds appropriate caching with stale time of 1 hour
   - Implements automatic refetching when time period changes
   - Adds error handling with retries on failure

2. The hook should return an object with the following structure:
```typescript
interface ExcellenceAwardsResult {
  awards: Award[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface Award {
  id: number;
  category: string;
  title: string;
  contributor: {
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  };
  justification: string;
  score: number;
  createdAt: string;
  commitIds: string[];
}
```

3. Implement proper error handling:
   - Return helpful error messages
   - Log errors to console in development
   - Provide a refetch function for retry functionality

4. Add comprehensive JSDoc documentation:
   - Document parameters and return types
   - Explain caching behavior
   - Document error handling behavior
   - Provide usage examples

The hook should manage the query cache effectively and revalidate data when appropriate.
```

### Task 2.4.4: DeveloperExcellence Component Update

**Prompt for Lovable AI:**

```
Update the `DeveloperExcellence` component to use real data from the `useExcellenceAwards` hook.

CONTEXT:
- The component is located at `src/components/home/DeveloperExcellence.tsx`
- The component currently uses mock data
- Review the `useExcellenceAwards` hook created in Task 2.4.3
- Examine the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) for component specifications

REQUIREMENTS:
1. Update `src/components/home/DeveloperExcellence.tsx` to:
   - Replace mock data with real data from the `useExcellenceAwards` hook
   - Add loading state using skeleton loaders
   - Implement error handling with error fallback
   - Maintain the existing UI design and layout
   - Add proper formatting for text and dates

2. Implement a time period toggle:
   - Add UI control to switch between 'week' and 'month' views
   - Update the query parameter when the toggle changes
   - Show visual feedback during data loading
   - Persist selection in local storage

3. The component should display each award with:
   - Award category with appropriate icon
   - Award title
   - Contributor avatar and name
   - Award justification
   - Award score or rating
   - Relative time for award creation (e.g., "2 days ago")

4. Implement responsive design:
   - Display as grid on desktop
   - Stack vertically on mobile
   - Adjust text size and layout for different screens
   - Ensure all content is readable on mobile

5. The component should gracefully handle:
   - Loading states
   - Error states with retry functionality
   - Empty data (no awards)
   - Missing avatar images
   - Varying lengths of text in justifications

The updated component should maintain its current visual design while using real data and providing appropriate loading and error states.
```

### Task 2.4.5: Award Card Design

**Prompt for Lovable AI:**

```
Create and implement a visually distinctive design for different award categories in the DeveloperExcellence component.

CONTEXT:
- The DeveloperExcellence component has been updated to use real data in Task 2.4.4
- Review the component at `src/components/home/DeveloperExcellence.tsx`
- Each award category should have a unique visual treatment
- Use Tailwind CSS for styling and shadcn/ui components where appropriate

REQUIREMENTS:
1. Create `src/components/home/AwardCard.tsx` that:
   - Accepts an award object as a prop
   - Applies different styling based on award category
   - Follows a consistent layout structure for all categories
   - Implements appropriate animations and hover effects

2. Design unique visual treatments for each category:
   - Code Quality Champion: Clean, minimalist design with blue accents
   - Documentation Hero: Book/document themed with amber/gold accents
   - Bug Squasher: Debug-themed with green accents
   - Feature Innovator: Innovation-themed with purple accents
   - Refactoring Wizard: Transformation-themed with teal accents
   - Performance Optimizer: Speed-themed with red accents

3. For each category, implement:
   - Unique icon that represents the category
   - Distinctive color scheme
   - Appropriate imagery or background pattern
   - Category-specific badge or emblem

4. Add interactive elements:
   - Hover effects that enhance the category theme
   - Click to expand and show more details
   - Animations that reflect the category (e.g., speed lines for performance)
   - Smooth transitions between states

5. Ensure accessible design:
   - Maintain sufficient contrast ratios
   - Include alternative text for icons
   - Ensure keyboard navigability
   - Test with screen readers

The award cards should be visually distinctive while maintaining a cohesive design language that fits with the rest of the application.
```

## Story 2.5: Trending Repositories Integration

### Task 2.5.1: Star History Database Schema

**Prompt for Lovable AI:**

```
Create a database schema for tracking repository star history.

CONTEXT:
- Review the [Database Schema](../DATABASE_SCHEMA.md) document to understand the repositories table
- Understand the TrendingRepos component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)
- The schema needs to track star counts over time to calculate growth trends

REQUIREMENTS:
1. Create a SQL script to add the following table and column to the Supabase database:

```sql
-- Add growth_rate column to repositories table
ALTER TABLE repositories
ADD COLUMN growth_rate NUMERIC DEFAULT 0;

-- Create star_history table
CREATE TABLE star_history (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES repositories(id),
  date DATE NOT NULL,
  stars_count INTEGER NOT NULL,
  cumulative BOOLEAN DEFAULT true,
  
  CONSTRAINT unique_repo_date UNIQUE (repository_id, date)
);

CREATE INDEX idx_star_history_repository ON star_history(repository_id);
CREATE INDEX idx_star_history_date ON star_history(date);
```

2. Create a function to get trending repositories:

```sql
CREATE OR REPLACE FUNCTION get_trending_repositories(limit_count INTEGER DEFAULT 5)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation here
END;
$$;
```

3. The `get_trending_repositories` function should:
   - Return repositories ordered by growth_rate in descending order
   - Limit results to the specified count
   - Include all necessary repository information:
     - Repository ID, name, description, URL
     - Current star count
     - Growth rate
     - Primary language
     - Fork count

4. Add appropriate indexes for performance
5. Include comments explaining the schema design and functions

The schema should be designed to efficiently store daily star counts and calculate growth trends for repositories.
```

### Task 2.5.2: Star History Tracking

**Prompt for OpenAI GPT-4o:**

```
Create a TypeScript module that implements star history tracking for repositories using the GitHub API.

CONTEXT:
- The module should fetch star counts from GitHub and store them in the star_history table
- Review the star_history table schema from Task 2.5.1
- This will run as a scheduled task to keep star history up to date
- Rate limiting and incremental updates are important for efficiency

REQUIREMENTS:
1. Create `src/utils/repositories/starHistoryTracker.ts` that exports:
   - A `fetchAndStoreStarHistory` function that gets star data from GitHub
   - A `calculateGrowthRates` function to compute repository growth rates
   - Helpers for handling GitHub API pagination and rate limiting
   - Types for star history data structures

2. Implement GitHub API integration using:
   - GraphQL API for efficient data fetching
   - Pagination handling for repositories with many stars
   - Rate limit tracking and exponential backoff
   - Authentication with GitHub tokens

3. The main function should:
   - Fetch current star counts for all tracked repositories
   - Store daily snapshots in the star_history table
   - Update the stars column in the repositories table
   - Skip repositories that were updated recently (incremental updates)
   - Handle failures gracefully with logging and retries

4. Implement growth rate calculation:
   - Calculate short-term growth (7 days) with 70% weight
   - Calculate medium-term growth (30 days) with 30% weight
   - Normalize growth rates for repositories of different sizes
   - Update the growth_rate column in the repositories table

5. The module should include these interfaces:
```typescript
interface StarHistoryEntry {
  repositoryId: number;
  date: string;
  starsCount: number;
}

interface GrowthMetrics {
  repositoryId: number;
  shortTermGrowth: number; // 7-day growth
  mediumTermGrowth: number; // 30-day growth
  normalizedGrowthRate: number; // Combined weighted score
}
```

6. The code should include:
   - Comprehensive error handling
   - Detailed logging
   - Performance optimizations
   - Rate limit awareness
   - Incremental update strategy

The module should be designed to run efficiently as a scheduled task, respecting GitHub API limits while keeping star history data up to date.
```

### Task 2.5.3: Growth Rate Calculation

**Prompt for Lovable AI:**

```
Create a SQL function to calculate repository growth rates based on star history.

CONTEXT:
- Review the star_history table schema from Task 2.5.1
- The function will update the growth_rate column in the repositories table
- Growth rates should be calculated using weighted averages of different time periods
- These calculations will determine which repositories are trending

REQUIREMENTS:
1. Create a SQL function in the Supabase database:

```sql
CREATE OR REPLACE FUNCTION calculate_repository_growth_rates()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation here
END;
$$;
```

2. The function should:
   - Calculate short-term growth rate (last 7 days) for each repository
   - Calculate medium-term growth rate (last 30 days) for each repository
   - Apply weights to combine these rates (70% short-term, 30% medium-term)
   - Normalize scores across repositories of different sizes
   - Update the growth_rate column in the repositories table
   - Handle repositories with insufficient history data

3. The calculation should consider:
   - Absolute star count increases
   - Percentage growth relative to repository size
   - Growth acceleration (increasing rate of star acquisition)
   - Minimum thresholds to filter out noise
   - Normalization to make scores comparable across repositories

4. Add detailed comments explaining:
   - The calculation methodology
   - Weighting and normalization approaches
   - Handling of edge cases
   - Performance considerations

The function should be optimized for performance and run as part of a scheduled task to keep growth rates up to date.
```

### Task 2.5.4: Trending Repositories Query Hook

**Prompt for Lovable AI:**

```
Create a React Query hook named `useTrendingRepositories` that fetches trending repositories.

CONTEXT:
- Review the `get_trending_repositories()` Supabase function created in Task 2.5.1
- Examine existing React Query patterns in the codebase
- Understand the TrendingRepos component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)

REQUIREMENTS:
1. Create `src/hooks/homepage/useTrendingRepositories.ts` that:
   - Accepts a parameter for the number of repositories to fetch (default to 5)
   - Uses React Query to fetch data from the `get_trending_repositories()` function
   - Implements proper TypeScript interfaces for the return data
   - Includes loading, error, and success states
   - Adds appropriate caching with stale time of 30 minutes
   - Implements automatic refetching as needed
   - Adds error handling with retries on failure

2. The hook should return an object with the following structure:
```typescript
interface TrendingRepositoriesResult {
  repositories: Repository[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface Repository {
  id: number;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  growthRate: number;
}
```

3. Implement proper error handling:
   - Return helpful error messages
   - Log errors to console in development
   - Provide a refetch function for retry functionality

4. Add comprehensive JSDoc documentation:
   - Document parameters and return types
   - Explain caching behavior
   - Document error handling behavior
   - Provide usage examples

The hook should manage the query cache effectively and revalidate data when appropriate.
```

### Task 2.5.5: TrendingRepos Component Update

**Prompt for Lovable AI:**

```
Update the `TrendingRepos` component to use real data from the `useTrendingRepositories` hook.

CONTEXT:
- The component is located at `src/components/home/TrendingRepos.tsx`
- The component currently uses mock data
- Review the `useTrendingRepositories` hook created in Task 2.5.4
- Examine the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) for component specifications

REQUIREMENTS:
1. Update `src/components/home/TrendingRepos.tsx` to:
   - Replace mock data with real data from the `useTrendingRepositories` hook
   - Add loading state using skeleton loaders
   - Implement error handling with error fallback
   - Maintain the existing UI design and layout
   - Add proper formatting for numbers and text

2. The component should display each repository with:
   - Repository name with link to GitHub repo
   - Repository description (truncated if too long)
   - Star count with star icon
   - Fork count with fork icon
   - Primary language with appropriate language color dot
   - Growth indicator showing recent star count increase
   - Trending indicator (up arrow with growth percentage)

3. Implement responsive design:
   - Display as grid on desktop
   - Stack vertically on mobile
   - Adjust text size and layout for different screens
   - Ensure all content is readable on mobile

4. Add interactions:
   - Hover effects for repository cards
   - Click to navigate to GitHub repository
   - Tooltips for additional information on hover
   - Smooth transitions between states

5. The component should gracefully handle:
   - Loading states
   - Error states with retry functionality
   - Empty data (no trending repositories)
   - Missing description or language
   - Repositories with very long names or descriptions

The updated component should maintain its current visual design while using real data and providing appropriate loading and error states.
```

### Task 2.5.6: Growth Visualization

**Prompt for Lovable AI:**

```
Add growth visualization to the TrendingRepos component.

CONTEXT:
- The TrendingRepos component has been updated to use real data in Task 2.5.5
- Review the component at `src/components/home/TrendingRepos.tsx`
- Visual indicators of growth will help users understand which repositories are trending
- Use Tailwind CSS for styling and consider using recharts for mini charts

REQUIREMENTS:
1. Create `src/components/home/repositories/GrowthIndicator.tsx` that:
   - Accepts a growth rate and star count as props
   - Displays a visually appealing growth indicator
   - Uses appropriate colors to indicate growth magnitude
   - Formats growth rate as percentage with "+" sign
   - Shows an up arrow or trend line icon

2. Add mini sparkline charts:
   - Create `src/components/home/repositories/StarSparkline.tsx`
   - Show recent star history as a small line chart
   - Keep the chart simple and compact
   - Use subtle styling that fits with the overall design
   - Add tooltip showing exact values on hover

3. Implement growth highlights:
   - Add color coding based on growth rate
   - Use gradient backgrounds that reflect growth intensity
   - Add subtle animations for top trending repositories
   - Ensure accessibility with proper contrast

4. Add comparative indicators:
   - Show how each repository's growth compares to average
   - Add percentile ranking ("Top 5% growth")
   - Include trending duration ("Trending for 3 days")
   - Display trend acceleration/deceleration

5. Ensure all visualizations:
   - Are responsive and work on all screen sizes
   - Have appropriate fallbacks when data is limited
   - Include proper alt text and accessibility features
   - Maintain performance with efficient rendering

The growth visualizations should enhance the user's understanding of repository trends without overwhelming the UI or causing performance issues.
```

## Story 2.6: Hottest PRs Integration

### Task 2.6.1: Review Intensity Database Implementation

**Prompt for Lovable AI:**

```
Implement database changes to support pull request review intensity tracking.

CONTEXT:
- Review the [Database Schema](../DATABASE_SCHEMA.md) document to understand the merge_requests table
- Understand the HottestPRs component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)
- The review intensity score will help identify the most actively discussed PRs

REQUIREMENTS:
1. Create a SQL script to modify the merge_requests table in the Supabase database:

```sql
-- Add review_intensity column to merge_requests table
ALTER TABLE merge_requests
ADD COLUMN review_intensity NUMERIC DEFAULT 0;

-- Create index for efficient querying
CREATE INDEX idx_merge_requests_review_intensity ON merge_requests(review_intensity);
```

2. Create a function to get hottest pull requests:

```sql
CREATE OR REPLACE FUNCTION get_hottest_pull_requests(limit_count INTEGER DEFAULT 5)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation here
END;
$$;
```

3. The `get_hottest_pull_requests` function should:
   - Return open pull requests ordered by review_intensity in descending order
   - Limit results to the specified count
   - Include all necessary PR information:
     - PR ID, title, description, URL
     - Author information
     - Repository information
     - Review intensity score
     - Comment count
     - Created date and age
     - Status (open, closed, merged)

4. Add appropriate indexes for performance
5. Include comments explaining the schema changes and functions

The database changes should support efficient querying and sorting of pull requests by review intensity.
```

### Task 2.6.2: PR Review Intensity Algorithm

**Prompt for OpenAI GPT-4o:**

```
Create a TypeScript module that calculates review intensity for pull requests.

CONTEXT:
- The module should analyze PR activity to calculate a review intensity score
- Review the merge_requests table modifications from Task 2.6.1
- Understand what makes a PR "hot" in terms of discussion and activity
- This will run as a scheduled task to update review intensity scores

REQUIREMENTS:
1. Create `src/utils/pullRequests/reviewIntensity.ts` that exports:
   - A `calculateReviewIntensity` function that computes intensity scores
   - Helper functions for individual scoring components
   - A batch processing function for updating scores in the database
   - Types for review intensity metrics

2. Implement review intensity calculation based on:
   - Number of comments (40% weight)
   - Number of unique participants (30% weight)
   - Changes requested frequency (20% weight)
   - Recency of activity (10% weight)

3. The main calculation should:
   - Normalize each metric to a 0-100 scale
   - Apply appropriate weights
   - Account for PR age and size
   - Identify controversial PRs with conflicting opinions
   - Detect rapid back-and-forth discussions
   - Consider the involvement of high-profile reviewers

4. Implement a database update function that:
   - Processes all open PRs
   - Calculates and stores the review_intensity score
   - Optimizes for performance with large numbers of PRs
   - Handles incremental updates

5. The module should include these interfaces:
```typescript
interface PullRequestActivity {
  pullRequestId: number;
  comments: PullRequestComment[];
  reviewers: PullRequestReviewer[];
  events: PullRequestEvent[];
}

interface ReviewIntensityScore {
  pullRequestId: number;
  commentScore: number;
  participantScore: number;
  changesRequestedScore: number;
  recencyScore: number;
  totalIntensity: number;
}
```

6. The code should include:
   - Comprehensive error handling
   - Detailed logging
   - Performance optimizations
   - Clear documentation of the scoring algorithm
   - Unit tests for core calculations

The module should be designed to run efficiently as a scheduled task, analyzing PR activity and updating intensity scores in the database.
```

### Task 2.6.3: Hottest PRs Query Hook

**Prompt for Lovable AI:**

```
Create a React Query hook named `useHottestPullRequests` that fetches the most active pull requests.

CONTEXT:
- Review the `get_hottest_pull_requests()` Supabase function created in Task 2.6.1
- Examine existing React Query patterns in the codebase
- Understand the HottestPRs component from [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md)

REQUIREMENTS:
1. Create `src/hooks/homepage/useHottestPullRequests.ts` that:
   - Accepts a parameter for the number of PRs to fetch (default to 5)
   - Uses React Query to fetch data from the `get_hottest_pull_requests()` function
   - Implements proper TypeScript interfaces for the return data
   - Includes loading, error, and success states
   - Adds appropriate caching with stale time of 5 minutes
   - Implements automatic refetching as needed
   - Adds error handling with retries on failure

2. The hook should return an object with the following structure:
```typescript
interface HottestPullRequestsResult {
  pullRequests: PullRequest[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface PullRequest {
  id: number;
  title: string;
  url: string;
  repository: {
    id: number;
    name: string;
  };
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
  commentCount: number;
  reviewIntensity: number;
  status: 'open' | 'closed' | 'merged';
}
```

3. Implement proper error handling:
   - Return helpful error messages
   - Log errors to console in development
   - Provide a refetch function for retry functionality

4. Add comprehensive JSDoc documentation:
   - Document parameters and return types
   - Explain caching behavior
   - Document error handling behavior
   - Provide usage examples

The hook should manage the query cache effectively and revalidate data when appropriate.
```

### Task 2.6.4: HottestPRs Component Update

**Prompt for Lovable AI:**

```
Update the `HottestPRs` component to use real data from the `useHottestPullRequests` hook.

CONTEXT:
- The component is located at `src/components/home/HottestPRs.tsx`
- The component currently uses mock data
- Review the `useHottestPullRequests` hook created in Task 2.6.3
- Examine the [Homepage Architecture](../HOMEPAGE_ARCHITECTURE.md) for component specifications

REQUIREMENTS:
1. Update `src/components/home/HottestPRs.tsx` to:
   - Replace mock data with real data from the `useHottestPullRequests` hook
   - Add loading state using skeleton loaders
   - Implement error handling with error fallback
   - Maintain the existing UI design and layout
   - Add proper formatting for text and dates

2. The component should display each pull request with:
   - PR title with link to GitHub PR
   - Author avatar and username
   - Repository name
   - PR age in relative format (e.g., "2 days ago")
   - Comment count with icon
   - Status badge (open, closed, merged)
   - Review intensity indicator

3. Implement responsive design:
   - Display as grid on desktop
   - Stack vertically on mobile
   - Adjust text size and layout for different screens
   - Ensure all content is readable on mobile

4. Add interactions:
   - Hover effects for PR cards
   - Click to navigate to GitHub pull request
   - Tooltips for additional information on hover
   - Smooth transitions between states

5. The component should gracefully handle:
   - Loading states
   - Error states with retry functionality
   - Empty data (no hot PRs)
   - Missing avatar images
   - PRs with very long titles

The updated component should maintain its current visual design while using real data and providing appropriate loading and error states.
```

### Task 2.6.5: Enhanced PR Presentation

**Prompt for Lovable AI:**

```
Add enhanced presentation features to the HottestPRs component.

CONTEXT:
- The HottestPRs component has been updated to use real data in Task 2.6.4
- Review the component at `src/components/home/HottestPRs.tsx`
- Visual enhancements will improve the user's ability to understand PR activity
- Use Tailwind CSS for styling and shadcn/ui components where appropriate

REQUIREMENTS:
1. Create `src/components/home/pullRequests/StatusBadge.tsx` that:
   - Accepts a PR status as a prop ('open', 'closed', 'merged')
   - Displays a visually distinctive badge for each status
   - Uses appropriate colors (green for merged, red for closed, yellow for open)
   - Includes status icon and text
   - Has hover effect with tooltip showing status details

2. Add review intensity visualization:
   - Create `src/components/home/pullRequests/IntensityIndicator.tsx`
   - Display review intensity as a visual indicator (heat bars, flame icon, etc.)
   - Use color gradient to represent intensity level
   - Add tooltip showing exact score and what it means
   - Include subtle animation for high-intensity PRs

3. Improve comment count display:
   - Show comment icon with count
   - Use color coding for comment volume
   - Add tooltip showing comment breakdown
   - Include micro-chart of comment activity if possible

4. Enhance the PR card design:
   - Add subtle border color based on PR status
   - Include repository language indicator if available
   - Show PR number alongside title
   - Add hover state that highlights key information
   - Implement smooth transitions between states

5. Add metadata display:
   - Show PR age prominently
   - Include last activity timestamp
   - Display number of commits if available
   - Show review status indicators
   - Add labels/tags if applicable

The enhanced presentation should make it immediately clear which PRs are generating the most discussion while maintaining a clean, uncluttered UI.
```

## Story 2.7: Homepage Integration Testing & Optimization

### Task 2.7.1: Integration Testing

**Prompt for Lovable AI:**

```
Implement integration testing for all homepage components.

CONTEXT:
- All homepage components now use real data from Supabase
- Components need to work together seamlessly
- Testing should verify proper loading sequences and error handling
- Focus on both visual integration and data flow

REQUIREMENTS:
1. Create `src/tests/homepage/integrationTests.ts` that:
   - Tests all components working together on the homepage
   - Verifies proper loading sequence
   - Checks error handling across components
   - Tests with different data scenarios

2. Create mock data generators in `src/tests/homepage/mockData.ts`:
   - Generate different data scenarios (empty, partial, complete)
   - Create edge case data (very large numbers, missing values)
   - Simulate error conditions
   - Model real-world data patterns

3. Add visual verification in `src/components/home/HomePage.tsx`:
   - Implement developer mode for testing
   - Add visual indicators for component state
   - Include performance metrics display
   - Create debug controls for testing different states

4. Test specific integration scenarios:
   - All components loading simultaneously
   - Some components in error state while others load correctly
   - Data refreshing while user is interacting with components
   - Error recovery and retry behavior
   - Empty state handling across components

5. Document findings and recommendations:
   - Add comments about discovered issues
   - Document performance bottlenecks
   - Note any UI inconsistencies
   - Suggest improvements for future implementation

The integration testing should ensure all components work together correctly and handle various data and error scenarios gracefully.
```

### Task 2.7.2: Performance Optimization

**Prompt for Lovable AI:**

```
Optimize the performance of the homepage components.

CONTEXT:
- The homepage contains multiple data-heavy components
- Performance optimization is crucial for a good user experience
- Focus on reducing unnecessary renders and optimizing data fetching
- Use React's performance tools and best practices

REQUIREMENTS:
1. Implement staggered loading strategy:
   - Create `src/components/home/StaggeredLoader.tsx`
   - Load critical components first
   - Defer non-critical component loading
   - Add smooth reveal animations
   - Minimize layout shift during loading

2. Add query result caching:
   - Optimize React Query cache configuration
   - Implement persistent caching where appropriate
   - Add prefetching for likely-to-be-needed data
   - Implement optimistic updates for better perceived performance

3. Optimize component rendering:
   - Use React.memo for pure components
   - Implement useMemo for expensive calculations
   - Add useCallback for event handlers
   - Split large components into smaller, focused ones
   - Use virtualization for long lists

4. Reduce unnecessary re-renders:
   - Audit component render cycles
   - Fix prop drilling with context where appropriate
   - Optimize state management to avoid cascading updates
   - Use key props correctly for lists
   - Implement shouldComponentUpdate where needed

5. Add performance monitoring:
   - Create `src/utils/homepage/performanceTracking.ts`
   - Measure and log component render times
   - Track query performance
   - Identify components that render too frequently
   - Add debug mode for visualizing renders

The optimizations should result in measurable performance improvements for the homepage, especially for initial load time and interactivity.
```

### Task 2.7.3: Network Optimization

**Prompt for Lovable AI:**

```
Optimize network usage for homepage components.

CONTEXT:
- Homepage components make multiple API calls to Supabase
- Network optimization will improve load times and reduce server costs
- Focus on reducing request count and payload sizes
- Implement proper caching and revalidation strategies

REQUIREMENTS:
1. Implement request batching:
   - Combine multiple queries into single requests where possible
   - Create `src/hooks/homepage/useBatchedQueries.ts`
   - Group related data fetching operations
   - Optimize query dependencies

2. Add prefetching for critical data:
   - Identify high-priority data needs
   - Implement background prefetching
   - Use idle time to fetch likely-to-be-needed data
   - Add intelligent preloading based on user behavior

3. Create retry strategies:
   - Implement exponential backoff for failed requests
   - Add custom retry logic based on error types
   - Prioritize retries for critical components
   - Add fallback mechanisms for persistent failures

4. Optimize payload sizes:
   - Review and refine database queries to fetch only needed fields
   - Implement data transformations on the server side
   - Use compression where appropriate
   - Minimize redundancy in returned data

5. Add connection resilience:
   - Handle offline scenarios gracefully
   - Implement request queuing for offline operations
   - Add reconnection logic
   - Sync local and remote data efficiently

The network optimizations should reduce bandwidth usage, improve response times, and make the application more resilient to network issues.
```

### Task 2.7.4: UI Polish & Consistency

**Prompt for Lovable AI:**

```
Polish the homepage UI and ensure visual consistency across all components.

CONTEXT:
- All homepage components now use real data
- Visual consistency is important for a professional appearance
- Focus on spacing, alignment, typography, and transitions
- Ensure responsive behavior works across all screen sizes

REQUIREMENTS:
1. Ensure consistent spacing and alignment:
   - Audit all components for consistent margins and padding
   - Align similar elements across different components
   - Implement consistent grid gaps and layouts
   - Fix any misalignments or visual inconsistencies

2. Verify responsive behavior:
   - Test all breakpoints (mobile, tablet, desktop)
   - Ensure components adapt appropriately to different widths
   - Fix any layout issues on smaller screens
   - Verify touch targets are appropriate for mobile

3. Add smooth transitions:
   - Implement consistent transition effects for all components
   - Add subtle animations for state changes
   - Ensure loading states transition smoothly to loaded content
   - Create seamless error state transitions

4. Standardize loading and error states:
   - Ensure all components use the same loading indicators
   - Implement consistent error message styling
   - Add retry buttons with standard styling
   - Create unified empty state designs

5. Enhance visual hierarchy:
   - Review typography for consistent sizing and weights
   - Ensure color usage follows the design system
   - Verify contrast ratios for accessibility
   - Implement consistent iconography
   - Polish hover and focus states

The UI polish should result in a cohesive, professional appearance across all homepage components with smooth transitions between states.
```

### Task 2.7.5: Analytics & Monitoring

**Prompt for Lovable AI:**

```
Implement analytics and monitoring for the homepage components.

CONTEXT:
- Monitoring performance and usage is important for future improvements
- Analytics will help understand which components are most valuable
- Focus on non-intrusive tracking that respects user privacy
- Use console logging during development

REQUIREMENTS:
1. Add performance metrics tracking:
   - Create `src/utils/analytics/performanceTracking.ts`
   - Measure component load times
   - Track time-to-interactive for each component
   - Monitor query performance
   - Collect render times and counts

2. Implement error logging:
   - Create `src/utils/analytics/errorTracking.ts`
   - Log all errors with contextual information
   - Track error rates and types
   - Identify common failure patterns
   - Create error severity classification

3. Add user interaction tracking:
   - Monitor which components are most interacted with
   - Track click-through rates on links
   - Measure time spent on different sections
   - Record hover patterns and scrolling behavior
   - Collect feedback on usefulness of data

4. Build performance monitoring dashboard:
   - Create `src/components/admin/PerformanceMetrics.tsx`
   - Display key performance indicators
   - Show error rates and patterns
   - Visualize component load times
   - Track trend lines over time

5. Implement developer tools:
   - Add debug mode toggle
   - Create performance overlay
   - Add network request inspector
   - Implement component boundary visualization
   - Create state inspector for debugging

The analytics and monitoring implementation should provide valuable insights for future optimizations while remaining unobtrusive to users.
```

