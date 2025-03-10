
# Epic 5: Merge Requests Page Integration

This epic focuses on integrating real data into the Merge Requests (Pull Requests) page, including PR listings, detailed views, review information, and analytics.

## Goals

- Replace mock PR data with real information from the database
- Implement PR metrics calculations (review time, cycle time, complexity)
- Add detailed PR timeline and activity tracking
- Create comprehensive review and commenting system integration
- Build visualizations for PR analytics

## User Stories

### Story 5.1: PR List View Integration (2-3 days)

**Description**: Implement a filterable, sortable list of pull requests with real data from the Supabase database, replacing the existing mock data implementation.

**Tasks**:
- **Task 5.1.1**: Create the `usePullRequests` React Query hook (4 hours)
  - Implement filtering by status, author, repository, date range
  - Add pagination support with both limit/offset
  - Create sorting options for different fields
  - Add search functionality for PR title and description

- **Task 5.1.2**: Update the `PullRequestList` component (6 hours)
  - Replace mock data with the new `usePullRequests` hook
  - Implement UI for filters including status tabs, repository selector
  - Add date range filter and search input
  - Create loading, error, and empty states
  - Implement URL parameter persistence for filters

- **Task 5.1.3**: Add column sorting and pagination controls (3 hours)
  - Implement sortable columns with indicators
  - Create pagination component with navigation controls
  - Add per-page size selector
  - Ensure responsive design across all screen sizes

**Acceptance Criteria**:
- PR list shows real data from the Supabase database
- All filters (status, author, repository, date range) work correctly
- Search functionality filters PRs by title and description
- Column sorting works for all sortable fields
- Pagination correctly limits and navigates through PRs
- URL reflects current filter state and is shareable
- Loading, error, and empty states are properly handled
- UI is responsive across all screen sizes

**Technical Considerations**:
- Use existing `StatusBadge` and `StatusFilter` components
- Leverage existing UI components from shadcn/ui
- Optimize database queries for performance
- Use query key structure that maximizes cache hits

---

### Story 5.2: PR Details View Integration (3-4 days)

**Description**: Implement comprehensive PR details view with real data, providing a complete overview of a single pull request.

**Tasks**:
- **Task 5.2.1**: Create the `usePullRequestDetails` React Query hook (5 hours)
  - Fetch complete PR information including relations to repositories
  - Calculate derived metrics (time to review, cycle time, complexity)
  - Implement optimistic updates for status changes
  - Add real-time subscription for updates if needed

- **Task 5.2.2**: Create PR Details Page Component (8 hours)
  - Build tabbed interface (Overview, Files, Activity, Analytics)
  - Create PR header with title, author, and status information
  - Implement PR description display with markdown rendering
  - Create repository context section
  - Build branch information display

- **Task 5.2.3**: Implement PR metrics visualization (6 hours)
  - Create metrics cards for key PR metrics
  - Build visualizations for size, complexity, impact
  - Add comparison against repository averages
  - Implement responsive design for different screen sizes

**Acceptance Criteria**:
- PR details view shows complete information for a single PR
- All metadata (dates, status, author, repository) is correctly displayed
- PR description is rendered with proper markdown formatting
- Metrics are accurately calculated and visualized
- Tabs navigate between different PR information sections
- Loading and error states are appropriately handled
- UI is responsive across all screen sizes

**Technical Considerations**:
- Use shadcn/ui Tabs component for the tabbed interface
- Leverage Recharts for data visualization
- Consider performance implications for large PRs
- Implement skeleton loaders for better UX during loading

---

### Story 5.3: PR Review Information Integration (2-3 days)

**Description**: Implement reviewer information and review status tracking, allowing users to see who reviewed the PR and their feedback.

**Tasks**:
- **Task 5.3.1**: Create required database tables for PR reviewers (3 hours)
  - Create `pull_request_reviewers` table with appropriate schema
  - Implement foreign key relationships to PRs and contributors
  - Add indexes for query optimization

- **Task 5.3.2**: Implement React Query hooks for reviewers (4 hours)
  - Create `usePullRequestReviewers` hook for fetching reviewers
  - Implement `useUpdateReviewStatus` mutation hook
  - Add `useAssignReviewer` mutation hook
  - Create TypeScript types for reviewer data

- **Task 5.3.3**: Build reviewer components (5 hours)
  - Create reviewer list component with avatar, name, status
  - Implement status update UI for authorized users
  - Build reviewer assignment component with search
  - Add loading, empty, and error states

**Acceptance Criteria**:
- Database schema correctly stores reviewer information
- Reviewer list shows actual reviewers with correct status
- Status updates are persisted to the database
- Reviewer assignment works correctly
- Components handle loading and error states gracefully
- UI is responsive across all screen sizes

**Technical Considerations**:
- Use existing Avatar component for reviewer display
- Consider permissions for status updates
- Optimize reviewer queries for performance
- Implement optimistic updates for better UX

---

### Story 5.4: PR Comments Integration (2-3 days)

**Description**: Implement PR comments with threading support, allowing users to view and interact with review discussions.

**Tasks**:
- **Task 5.4.1**: Create database structure for PR comments (3 hours)
  - Implement `pull_request_comments` table with appropriate schema
  - Add support for threaded comments with parent-child relationships
  - Create indexes for efficient queries

- **Task 5.4.2**: Implement React Query hooks for comments (5 hours)
  - Create `usePullRequestComments` hook for fetching comments
  - Add `useAddComment` mutation hook
  - Implement `useEditComment` mutation hook
  - Create `useResolveComment` mutation hook

- **Task 5.4.3**: Build comment components (6 hours)
  - Create comment thread component with proper indentation
  - Implement comment editor with markdown support
  - Add reply and resolve buttons
  - Build file-specific comment display
  - Implement loading, empty, and error states

**Acceptance Criteria**:
- Database schema correctly stores comment information
- Comments are displayed with proper threading
- Users can add new comments and replies
- Comments show correct author information and timestamps
- File-specific comments show file and line context
- Components handle loading and error states gracefully
- UI is responsive across all screen sizes

**Technical Considerations**:
- Use markdown renderer for comment content
- Optimize comment queries, especially for large PRs
- Consider real-time updates for active discussions
- Implement proper authorization for comment actions

---

### Story 5.5: PR Metrics and Analytics Integration (2-3 days)

**Description**: Implement PR metrics calculations and analytics visualizations to provide insights into PR patterns and performance.

**Tasks**:
- **Task 5.5.1**: Extend database schema for PR metrics (3 hours)
  - Add metrics columns to merge_requests table
  - Create stored procedures for metrics calculation
  - Implement indexes for performance

- **Task 5.5.2**: Create metrics calculation utilities (5 hours)
  - Implement review time calculation
  - Add cycle time calculation
  - Create complexity scoring algorithm
  - Implement impact and quality scoring

- **Task 5.5.3**: Build analytics visualization components (6 hours)
  - Create metrics cards with trend indicators
  - Implement time-series charts for PR patterns
  - Build distribution charts for size and complexity
  - Add comparison visualizations against averages

**Acceptance Criteria**:
- Database schema correctly stores calculated metrics
- Metrics calculation algorithms produce accurate results
- Visualizations clearly represent PR patterns and insights
- Analytics update based on filter changes
- Components handle loading and error states gracefully
- UI is responsive across all screen sizes

**Technical Considerations**:
- Use Recharts for data visualization
- Optimize calculations for performance
- Consider caching strategies for expensive calculations
- Use consistent color schemes across visualizations

---

### Story 5.6: PR Timeline Integration (2 days)

**Description**: Implement a detailed timeline of PR events and activities, showing the chronological progression of a PR.

**Tasks**:
- **Task 5.6.1**: Create database structure for PR activities (3 hours)
  - Implement `pull_request_activities` table with appropriate schema
  - Add activity types and actor relationships
  - Create indexes for efficient queries

- **Task 5.6.2**: Implement React Query hook for timeline (4 hours)
  - Create `usePullRequestTimeline` hook for fetching activities
  - Add filtering by activity type
  - Implement chronological ordering
  - Add TypeScript types for activity data

- **Task 5.6.3**: Build timeline visualization component (5 hours)
  - Create vertical timeline with activity icons
  - Implement activity type filters
  - Add detailed information display
  - Build responsive design for different screen sizes

**Acceptance Criteria**:
- Database schema correctly stores activity information
- Timeline shows events in correct chronological order
- Different activity types are visually distinguished
- Filtering by activity type works correctly
- Timeline is easy to navigate and understand
- Components handle loading and error states gracefully
- UI is responsive across all screen sizes

**Technical Considerations**:
- Use consistent icons for different activity types
- Optimize queries for timelines with many activities
- Consider virtual scrolling for very active PRs
- Implement clear visual hierarchy for better readability

---

### Story 5.7: Performance Optimization and Testing (2 days)

**Description**: Optimize performance of the Merge Requests page and implement comprehensive testing.

**Tasks**:
- **Task 5.7.1**: Implement query optimization techniques (4 hours)
  - Add proper indexing for frequent query patterns
  - Implement query result caching
  - Optimize join operations
  - Add pagination for all list views

- **Task 5.7.2**: Add frontend optimizations (5 hours)
  - Implement code splitting for large components
  - Add memoization for expensive calculations
  - Optimize rendering with virtualization for long lists
  - Implement skeleton loaders for better perceived performance

- **Task 5.7.3**: Implement comprehensive testing (6 hours)
  - Add unit tests for utility functions
  - Implement integration tests for data hooks
  - Create UI component tests
  - Add end-to-end tests for critical user flows

**Acceptance Criteria**:
- Page load times are under 2 seconds on typical connections
- All lists handle large datasets efficiently
- Filtering and sorting operations are responsive
- Tests cover critical functionality
- No regressions in existing functionality
- All components handle edge cases gracefully

**Technical Considerations**:
- Use React Query's built-in caching capabilities
- Consider implementing virtual scrolling for long lists
- Optimize database indexes for common query patterns
- Use performance profiling to identify bottlenecks

## Dependencies

- Epic 1: Foundation & Infrastructure
  - Story 1.1: Database Schema
  - Story 1.3: Supabase Core Query Hooks
  - Story 1.5: GitHub API Integration

## Implementation Sequence

The recommended implementation sequence is:

1. Story 5.1: PR List View Integration
2. Story 5.2: PR Details View Integration
3. Story 5.3: PR Review Information Integration
4. Story 5.4: PR Comments Integration
5. Story 5.5: PR Metrics and Analytics Integration
6. Story 5.6: PR Timeline Integration
7. Story 5.7: Performance Optimization and Testing

This sequence ensures that core functionality is implemented first, followed by more advanced features, and finally optimization and testing.

## Definition of Done

- All PR-related components display real data from the database
- Filtering, sorting, and pagination work correctly in the PR list
- PR details view shows comprehensive information from multiple tables
- Review information and comments are correctly displayed
- Metrics calculations use real data and defined algorithms
- Timeline visualizes actual PR events in chronological order
- All components handle loading, empty, and error states gracefully
- Code follows project coding standards
- Documentation is complete and up-to-date
- Tests are implemented and passing

