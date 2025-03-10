
# Epic 5: Merge Requests Page Integration - Implementation Prompts

This document contains structured prompts for implementing Epic 5: Merge Requests Page Integration. Each prompt includes:
1. Which AI tool is recommended (Lovable AI or External OpenAI model)
2. Detailed context information (for external AI prompts)
3. Expected output format

## IMPORTANT: Build Upon Existing Code

All implementation work should build upon the existing codebase. Specifically:

1. **Review existing code first** - Always examine the current codebase to understand patterns before writing new code
2. **Extend, don't replace** - Build upon what's already implemented rather than rebuilding
3. **Use consistent conventions** - Follow the project's established naming and coding patterns
4. **Leverage existing UI components** - Use and extend existing components instead of creating new ones with duplicate functionality
5. **Maintain data flow consistency** - Follow established React Query patterns for data fetching
6. **Properly document** - Document how new code connects to existing systems

See [Implementation Guidelines](../prompts/IMPLEMENTATION_GUIDELINES.md) for more detailed guidance.

## Table of Contents

- [Story 5.1: PR List View Integration](#story-51-pr-list-view-integration)
- [Story 5.2: PR Details View Integration](#story-52-pr-details-view-integration)
- [Story 5.3: PR Review Information Integration](#story-53-pr-review-information-integration)
- [Story 5.4: PR Comments Integration](#story-54-pr-comments-integration)
- [Story 5.5: PR Metrics and Analytics Integration](#story-55-pr-metrics-and-analytics-integration)
- [Story 5.6: PR Timeline Integration](#story-56-pr-timeline-integration)

## Story 5.1: PR List View Integration

### Prompt 5.1.1: Implement usePullRequests React Query Hook

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- Our application uses React Query for data fetching and state management
- The database has a `merge_requests` table with the following schema:
  - id (int8, primary key)
  - title (text)
  - description (text, nullable)
  - author (text, references contributors.id)
  - author_avatar (text, nullable)
  - created_at (timestamptz)
  - updated_at (timestamptz, nullable)
  - merged_at (timestamptz, nullable)
  - closed_at (timestamptz, nullable)
  - status (text)
  - lines_added (integer)
  - lines_removed (integer)
  - review_comments (integer)
  - base_branch (text)
  - head_branch (text)
  - github_link (text)
  - repository_id (int8, nullable, references repositories.id)
  - labels (text array, nullable)
  - files_changed (integer, nullable)
  - commits (integer, nullable)
- The hook should use the following pattern:

```typescript
export function usePullRequests(
  filters: {
    status?: PRStatus | PRStatus[], 
    author?: string,
    repository_id?: number,
    search?: string,
    fromDate?: Date,
    toDate?: Date,
    sortBy?: 'created_at' | 'updated_at' | 'review_comments',
    sortOrder?: 'asc' | 'desc',
    limit?: number,
    offset?: number
  } = {}
) {
  // Implementation goes here
}
```

- We use Supabase as our backend
- The Supabase client is imported from `@/integrations/supabase/client`
- The hook needs to handle pagination, filtering, sorting, and search

**Prompt**:
Create a React Query hook named `usePullRequests` that fetches pull requests from our Supabase backend with support for filtering, pagination, and sorting. The hook should:

1. Review existing React Query hooks in the codebase to maintain consistency with established patterns
2. Build upon the existing data fetching approach used in other parts of the application
3. Accept a filter object parameter with support for status, author, repository ID, search text, date range, sorting parameters, and pagination limits
4. Use React Query's object syntax for configuration
5. Properly apply all filters to the Supabase query
6. Return the pull requests along with a total count for pagination
7. Include proper TypeScript type definitions
8. Handle errors gracefully

For the search functionality, implement a case-insensitive search on the title and description fields. The hook should be placed in a file called `src/hooks/usePullRequests.ts`.

### Prompt 5.1.2: Update PullRequestList Component to Use Real Data

**Recommended AI**: Lovable AI

**Prompt**:
Update the `PullRequestList` component to use real data from our backend instead of mock data. Implement the following changes:

1. Examine the existing `PullRequestList` component to understand its current implementation
2. Replace the mock data import with the `usePullRequests` hook while preserving all current component functionality
3. Add state variables for filters (status, search, pagination, etc.)
4. Pass the filters to the hook and use the returned data
5. Implement loading, error, and empty states
6. Create UI controls for filtering (status tabs, search input, pagination)
7. Make sure the component is responsive
8. Use URL parameters to preserve the filtering state

The component should display data in the same format as before, but now fetching from our backend using the `usePullRequests` hook.

## Story 5.2: PR Details View Integration

### Prompt 5.2.1: Implement usePullRequestDetails React Query Hook

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need to fetch detailed information about a single pull request
- The hook should use React Query and Supabase
- We need to calculate additional metrics based on the PR data:
  - Time to review: time between creation and first review
  - Time to merge: time between creation and merge
  - Cycle time: total time from creation to closure
  - PR size: calculated based on lines added/removed
  - Complexity: calculated based on files changed, review comments, etc.

- The hook should follow this pattern:

```typescript
export function usePullRequestDetails(prId: number) {
  return useQuery({
    queryKey: ['pullRequestDetails', prId],
    queryFn: async () => {
      // Implementation goes here
    },
    enabled: !!prId
  });
}
```

**Prompt**:
Create a React Query hook named `usePullRequestDetails` that fetches detailed information about a single pull request using its ID. The hook should:

1. Review existing React Query hooks in the codebase to understand the established patterns
2. Follow the same approach and style as other data fetching hooks in the project
3. Fetch complete PR information including relations to repositories and reviewers
4. Calculate derived metrics like time to review, time to merge, cycle time, PR size, complexity, and impact
5. Return the PR data in a structured format suitable for the UI
6. Implement proper error handling
7. Include TypeScript type definitions
8. Be optimized for performance

Include utility functions for calculating each metric. The hook should be placed in a file called `src/hooks/usePullRequestDetails.ts`.

### Prompt 5.2.2: Create PR Details View Component

**Recommended AI**: Lovable AI

**Prompt**:
Create a Pull Request Details view component that displays comprehensive information about a single pull request. The component should:

1. Examine any existing PR detail components or patterns in the codebase
2. Build upon and extend existing UI components and styles
3. Use the `usePullRequestDetails` hook to fetch data
4. Display a header with PR title, status, and author information
5. Show PR description with markdown rendering
6. Include PR metadata (dates, branches, repository)
7. Display PR metrics in a visually appealing way
8. Use a tabbed interface for different sections:
   - Overview (description, status, reviewers)
   - Files Changed (summary of changes)
   - Activity (timeline of events)
   - Analytics (metrics and insights)
9. Implement loading, error, and empty states
10. Be fully responsive

The component should be placed in `src/components/merge-requests/PullRequestDetails.tsx`.

## Story 5.3: PR Review Information Integration

### Prompt 5.3.1: Create Database Structure for PR Reviewers

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need to create a table structure for storing PR reviewer information
- The table should be named `pull_request_reviewers`
- It should reference both pull requests and contributors
- We use Supabase as our backend
- Status values should be one of: 'approved', 'requested_changes', 'commented', 'pending'

**Prompt**:
Create SQL statements to set up a `pull_request_reviewers` table in our Supabase database. The table should:

1. Review the existing database schema to ensure consistency with naming conventions and relationships
2. Have a primary key column named `id`
3. Include a foreign key column `pull_request_id` referencing `merge_requests.id`
4. Include a foreign key column `reviewer_id` referencing `contributors.id`
5. Include a `status` column that is restricted to valid review status values
6. Include timestamp columns for when the review was submitted and last updated
7. Have appropriate indexing for performance
8. Include any necessary constraints

Provide the complete SQL CREATE TABLE statement with all necessary constraints, indexes, and foreign key relationships. Also include any additional SQL statements needed for setting up this feature.

### Prompt 5.3.2: Implement PR Reviewer Components

**Recommended AI**: Lovable AI

**Prompt**:
Create components for displaying and managing PR reviewers. Implement:

1. Review any existing reviewer-related components in the codebase
2. Build upon the established component structure and design patterns
3. A `PullRequestReviewers` component that displays a list of reviewers and their status
4. A `ReviewerCard` component that shows a reviewer's avatar, name, and status
5. A modal for adding new reviewers with search functionality
6. A dropdown for updating review status (for authorized users)

The components should use the following hooks:
- `usePullRequestReviewers` (to fetch reviewers)
- `useUpdateReviewStatus` (to update status)
- `useAssignReviewer` (to add a new reviewer)

Make sure the components are visually appealing, handle loading and error states, and match the overall design of the application.

### Prompt 5.3.3: Implement PR Reviewer Hooks

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need to create React Query hooks for fetching and managing PR reviewers
- The hooks should interact with our Supabase backend
- We need hooks for:
  1. Fetching reviewers for a PR
  2. Updating review status
  3. Assigning new reviewers
- The hooks should be TypeScript-based and include proper type definitions

**Prompt**:
Create three React Query hooks for working with PR reviewers:

1. Review existing React Query hooks in the codebase to maintain consistent patterns
2. `usePullRequestReviewers(prId: number)`: Fetches all reviewers for a given PR
3. `useUpdateReviewStatus()`: A mutation hook for updating a reviewer's status
4. `useAssignReviewer()`: A mutation hook for assigning a new reviewer to a PR

Each hook should:
- Use React Query's object syntax
- Include proper TypeScript types
- Interact with the Supabase client
- Handle errors appropriately
- Include proper query invalidation

Place these hooks in a file called `src/hooks/usePullRequestReviewers.ts`.

## Story 5.4: PR Comments Integration

### Prompt 5.4.1: Create Database Structure for PR Comments

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need a table for storing PR comments
- The table should support threaded comments (parent-child relationships)
- Comments can be general or attached to specific files and line numbers
- Comments can be resolved or unresolved
- We use Supabase as our backend

**Prompt**:
Create SQL statements to set up a `pull_request_comments` table in our Supabase database. The table should:

1. Review the existing database schema to ensure consistency with naming conventions
2. Follow established patterns for foreign key relationships and indexes
3. Have a primary key column named `id`
4. Include a foreign key column `pull_request_id` referencing `merge_requests.id`
5. Include a column for the GitHub comment ID (`github_id`) to avoid duplicates
6. Include a foreign key column `author` referencing `contributors.id`
7. Include columns for comment content, file path, line number, and position
8. Support threaded comments through a self-referencing `parent_id` column
9. Include a boolean `is_resolved` column
10. Include timestamp columns for creation and updates
11. Have appropriate indexing for performance

Provide the complete SQL CREATE TABLE statement with all necessary constraints, indexes, and foreign key relationships. Also include any additional SQL statements needed for setting up this feature.

### Prompt 5.4.2: Implement PR Comments Hooks

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need React Query hooks for fetching and managing PR comments
- Comments can be threaded (have parent-child relationships)
- Comments can be filtered (show/hide resolved)
- We need mutation hooks for adding, editing, and resolving comments
- The hooks should use Supabase and React Query

**Prompt**:
Create React Query hooks for working with PR comments:

1. Review existing React Query hooks in the codebase to follow established patterns
2. `usePullRequestComments(prId: number, options?: { includeResolved?: boolean })`: Fetches comments for a PR
3. `useAddComment()`: A mutation hook for adding a new comment
4. `useEditComment()`: A mutation hook for editing an existing comment
5. `useResolveComment()`: A mutation hook for marking a comment as resolved

Each hook should:
- Use React Query's object syntax
- Include proper TypeScript types
- Handle nested comment threads correctly
- Implement proper error handling
- Include appropriate query invalidation

Place these hooks in a file called `src/hooks/usePullRequestComments.ts`.

### Prompt 5.4.3: Implement PR Comments Components

**Recommended AI**: Lovable AI

**Prompt**:
Create components for displaying and managing PR comments. Implement:

1. Examine any existing comment-related components in the codebase
2. Extend and build upon established UI patterns and component structures
3. A `CommentList` component that displays comments with threading
4. A `CommentItem` component for individual comments with reply and resolve buttons
5. A `CommentEditor` component with markdown support for adding/editing comments
6. Toggle controls for showing/hiding resolved comments
7. Visual indication for file-specific comments that shows file context

The components should use the following hooks:
- `usePullRequestComments`
- `useAddComment`
- `useEditComment`
- `useResolveComment`

Make sure the components handle loading and error states, support markdown rendering, and match the overall design of the application. Place these components in a directory called `src/components/merge-requests/comments/`.

## Story 5.5: PR Metrics and Analytics Integration

### Prompt 5.5.1: Update Database Schema for PR Metrics

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need to add metrics columns to the `merge_requests` table
- Metrics include review time, cycle time, complexity score, impact score, and quality score
- These metrics will be calculated in the backend and stored for improved query performance
- We use Supabase as our backend

**Prompt**:
Create SQL statements to add metrics columns to the `merge_requests` table in our Supabase database. The changes should:

1. Review the existing `merge_requests` table structure to ensure compatibility
2. Follow established naming conventions and data types
3. Add a column `review_time_hours` (float) for tracking time to first review
4. Add a column `cycle_time_hours` (float) for tracking total PR lifecycle time
5. Add a column `complexity_score` (integer) for storing calculated complexity
6. Add a column `impact_score` (integer) for storing calculated impact
7. Add a column `quality_score` (integer) for storing calculated quality

Provide the complete SQL ALTER TABLE statements needed to implement these changes. Also include any additional SQL statements needed for setting up this feature, such as indexes or constraints.

### Prompt 5.5.2: Implement PR Metrics Calculation Logic

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need utilities for calculating various PR metrics
- The metrics will be calculated based on PR data and stored in the database
- Calculations include:
  - Review time: time between PR creation and first review
  - Cycle time: total time from creation to closure
  - PR size: based on lines added/removed
  - Complexity: based on files changed, review comments, etc.
  - Impact: based on code areas affected and potential risk
  - Quality: based on review thoroughness and code style
- The utilities should be TypeScript-based and include proper type definitions

**Prompt**:
Create utility functions for calculating PR metrics based on pull request data. Implement:

1. Review any existing utility functions in the codebase to ensure consistency
2. Extend existing patterns and approaches where possible
3. `calculateReviewTime(pr: PullRequest): number`: Calculate hours from PR creation to first review
4. `calculateCycleTime(pr: PullRequest): number`: Calculate hours from PR creation to closure/merge
5. `determinePRSize(linesAdded: number, linesRemoved: number): 'small' | 'medium' | 'large' | 'extra_large'`: Categorize PR by size
6. `calculateComplexity(pr: PullRequest): number`: Calculate complexity score (1-100)
7. `calculateImpact(pr: PullRequest): number`: Calculate impact score (1-100)
8. `calculateQuality(pr: PullRequest): number`: Calculate quality score (1-100)

Each function should:
- Have detailed JSDoc comments explaining the calculation algorithm
- Include proper error handling for edge cases
- Be optimized for performance
- Use TypeScript for type safety

Place these functions in a file called `src/utils/prMetricsCalculation.ts`.

### Prompt 5.5.3: Implement PR Analytics Components

**Recommended AI**: Lovable AI

**Prompt**:
Create components for displaying PR metrics and analytics. Implement:

1. Examine existing analytics components in the codebase for patterns and styles
2. Build upon and extend existing visualization approaches
3. A `PRMetricsCard` component that shows key metrics for a single PR
4. A `PRTrends` component that displays charts for PR patterns over time
5. A `PRDistribution` component that shows PR size and complexity distribution
6. A `PRComparison` component that compares a PR's metrics against team averages

The components should:
- Use Recharts for data visualization
- Include tooltips for explaining each metric
- Be responsive and visually appealing
- Include loading and error states
- Use a consistent color scheme
- Follow established UI component patterns in the codebase

Place these components in a directory called `src/components/merge-requests/analytics/`.

## Story 5.6: PR Timeline Integration

### Prompt 5.6.1: Create Database Structure for PR Activities

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need a table for storing PR activity events
- Activities include: created, commented, reviewed, approved, changes requested, merged, closed, reopened, assigned, labeled, etc.
- Each activity has an actor (contributor) and a timestamp
- Some activities have additional details stored as JSON
- We use Supabase as our backend

**Prompt**:
Create SQL statements to set up a `pull_request_activities` table in our Supabase database. The table should:

1. Review existing database tables to ensure consistent naming and structure
2. Follow established patterns for indexes and constraints
3. Have a primary key column named `id`
4. Include a foreign key column `pull_request_id` referencing `merge_requests.id`
5. Include a foreign key column `actor` referencing `contributors.id`
6. Include a column `activity_type` for the type of activity
7. Include a JSONB column `details` for activity-specific data
8. Include a timestamp column for when the activity occurred
9. Have appropriate indexing for performance

Provide the complete SQL CREATE TABLE statement with all necessary constraints, indexes, and foreign key relationships. Also include any additional SQL statements needed for setting up this feature.

### Prompt 5.6.2: Implement PR Timeline Hook

**Recommended AI**: External OpenAI (GPT-4o)

**Context Information**:
- We need a React Query hook for fetching PR timeline activities
- The hook should support filtering by activity type
- Activities should be returned in chronological order
- Each activity includes: type, timestamp, actor info, and details
- The hook should use Supabase and React Query

**Prompt**:
Create a React Query hook named `usePullRequestTimeline` for fetching timeline activities for a pull request. The hook should:

1. Review existing React Query hooks to ensure consistency with established patterns
2. Build upon the existing data fetching approach
3. Accept a PR ID and optional filters (activity types)
4. Fetch activities with their associated actor information
5. Order activities chronologically
6. Transform raw data into a format suitable for the UI
7. Include proper TypeScript types
8. Handle errors gracefully

The hook should follow this pattern:

```typescript
export function usePullRequestTimeline(
  prId: number, 
  filters: { activityTypes?: string[] } = {}
) {
  // Implementation goes here
}
```

Place the hook in a file called `src/hooks/usePullRequestTimeline.ts`.

### Prompt 5.6.3: Implement PR Timeline Component

**Recommended AI**: Lovable AI

**Prompt**:
Create a component for displaying a chronological timeline of PR activities. Implement:

1. Examine any existing timeline components in the codebase
2. Build upon established UI patterns and component structures
3. A `PRTimeline` component that shows a vertical timeline of activities
4. Activity items with icons, colors, and formatting based on activity type
5. Filter controls for showing/hiding specific activity types
6. Detailed information display for each activity
7. Actor information with avatar and name
8. Relative timestamps (e.g., "2 days ago")

The component should:
- Use the `usePullRequestTimeline` hook
- Be visually appealing with appropriate icons for each activity type
- Handle loading, empty, and error states
- Be responsive
- Support interactive filtering
- Follow the established design patterns in the application

Place the component in a file called `src/components/merge-requests/PRTimeline.tsx`.

## Implementation Sequence

To build Epic 5 effectively, implement the stories in this order:

1. Story 5.1: PR List View Integration
2. Story 5.2: PR Details View Integration
3. Story 5.3: PR Review Information Integration
4. Story 5.4: PR Comments Integration
5. Story 5.5: PR Metrics and Analytics Integration
6. Story 5.6: PR Timeline Integration

This sequence respects the dependencies between components and ensures that fundamental features are implemented before more advanced ones.
