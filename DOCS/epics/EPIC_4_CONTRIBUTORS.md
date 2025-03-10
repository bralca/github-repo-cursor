
# Epic 4: Contributors Page Integration

This epic focuses on integrating real data into the Contributors page, including detailed contributor profiles, contribution metrics, historical data, and activity visualizations.

## Goals

- Replace mock data with real contributor information from the database
- Implement contribution metrics calculations
- Create interactive visualizations for contribution history
- Add contributor profile details with GitHub data integration
- Ensure responsive design and performance optimization

## User Stories

### Story 4.1: Contributors Data Infrastructure

**Description**: Create the foundation for contributors data integration, implementing the core hooks and utilities needed for fetching and processing contributor data.

**Tasks**:

**Task 4.1.1: Contributor Data Models & Types (2-3 hours)**
- Review existing contributor type definitions in `src/types/user.ts`
- Extend types to support all contributor metadata fields from the database
- Create interfaces for contributor metrics and activity data
- Define types for contribution history data

**Task 4.1.2: Contributor Base Query Hook (3-4 hours)**
- Create `useContributorData` hook using React Query
- Implement proper error handling and loading states
- Add caching configuration for optimal performance
- Create pagination support for listing multiple contributors

**Task 4.1.3: Contributor Selection Hook (2-3 hours)**
- Enhance the existing `ContributorSelector` component to use real data
- Create a hook for handling contributor selection state
- Implement local storage for recent contributor selections
- Add search functionality for finding contributors

**Task 4.1.4: Contributor Data Transformation Utilities (2-3 hours)**
- Create helpers for processing contributor statistics
- Implement date formatting for contribution timestamps
- Add utilities for contribution data normalization
- Create contributor metrics calculation functions

**Acceptance Criteria**:
- All contributor data hooks fetch real data from Supabase
- Contributor selection persists across page navigation
- Error handling gracefully manages API failures
- Loading states are implemented for all data fetching operations
- Data models properly represent the database schema

### Story 4.2: Contributor Profile Integration

**Description**: Update the ContributorHero component to display real contributor profile data and personal information.

**Tasks**:

**Task 4.2.1: Contributor Profile Hook (3-4 hours)**
- Create `useContributorProfile(username)` hook with React Query
- Implement fetching contributor details from Supabase
- Add GitHub profile data integration where needed
- Create proper type definitions for the profile data

**Task 4.2.2: ContributorHero Component Integration (3-4 hours)**
- Update ContributorHero component to use real profile data
- Implement avatar image loading with fallbacks
- Add location, bio, and other GitHub profile information
- Create loading and error states for the component

**Task 4.2.3: Profile Stats Display (2-3 hours)**
- Implement the statistics section of the profile
- Add follower count, repository count, and other GitHub statistics
- Create visual indicators for different contributor levels
- Implement responsive design for mobile viewing

**Task 4.2.4: Profile Links and External Resources (2-3 hours)**
- Add links to GitHub profile, blog, and other external resources
- Implement social media links if available
- Create "View on GitHub" button functionality
- Add copy username to clipboard functionality

**Acceptance Criteria**:
- ContributorHero displays real contributor information
- Profile statistics show accurate data from the database
- All external links work correctly
- Component handles loading, error, and empty states gracefully
- UI is responsive and works well on mobile devices

### Story 4.3: Contribution Metrics Integration

**Description**: Implement the ContributionSummary component with real metrics data and interactive charts.

**Tasks**:

**Task 4.3.1: Contribution Metrics Hook (3-4 hours)**
- Create `useContributorMetrics(username, timeframe)` hook
- Implement calculation of key metrics like impact score
- Add time-period filtering (last week, month, year, all time)
- Create proper type definitions for metrics data

**Task 4.3.2: Metrics Cards Implementation (2-3 hours)**
- Update the metrics cards in ContributionSummary to use real data
- Create visual indicators for high/medium/low metrics
- Implement trend indicators (increasing/decreasing)
- Add tooltips with metric explanations

**Task 4.3.3: Contribution Distribution Chart (3-4 hours)**
- Implement pie/donut chart for contribution type distribution
- Create legend with accurate percentages
- Add interactive tooltips for each segment
- Ensure accessible color scheme and labels

**Task 4.3.4: Contribution Comparison Chart (3-4 hours)**
- Implement bar chart comparing user metrics to team averages
- Add time period selector for different comparison ranges
- Create interactive tooltips with detailed information
- Implement responsive design for the chart

**Acceptance Criteria**:
- ContributionSummary displays accurate metrics from the database
- Charts correctly visualize contribution distribution
- Metric cards show current values with trend indicators
- Time period filters work correctly
- Component handles loading, error, and empty states gracefully

### Story 4.4: Contribution History Integration

**Description**: Implement the ProgressTimeline component to show historical contribution data with interactive visualization.

**Tasks**:

**Task 4.4.1: Contribution History Hook (3-4 hours)**
- Create `useContributionHistory(username, options)` hook
- Implement time-series data fetching from Supabase
- Add date range filtering options
- Create data aggregation for different time granularities (day/week/month)

**Task 4.4.2: Timeline Visualization (4-5 hours)**
- Update ProgressTimeline component to use real historical data
- Implement line chart for contribution frequency over time
- Add date range selector component
- Create interactive hover tooltips with daily details

**Task 4.4.3: Activity Heatmap (4-5 hours)**
- Implement ContributorActivityHeatmap with real data
- Create calendar grid visualization similar to GitHub's contribution graph
- Add color intensity scaling based on contribution count
- Implement tooltips for individual days

**Task 4.4.4: Contribution Streak Detection (2-3 hours)**
- Implement algorithm to detect contribution streaks
- Create visual indicators for current and longest streaks
- Add streak statistics to the timeline view
- Implement tooltips with streak details

**Acceptance Criteria**:
- ProgressTimeline shows real contribution history from the database
- Activity heatmap displays accurate daily contribution counts
- Date range selection works correctly
- Timeline is interactive with tooltips showing detailed information
- Component appropriately handles sparse or empty contribution periods

### Story 4.5: Contributor Merge Requests Integration

**Description**: Update the ContributorMergeRequests component to display real pull request data specific to the selected contributor.

**Tasks**:

**Task 4.5.1: Contributor PRs Hook (3-4 hours)**
- Create `useContributorMergeRequests(username, options)` hook
- Implement fetching PR data filtered by contributor
- Add sorting and filtering options (status, date, repository)
- Create pagination for large PR lists

**Task 4.5.2: PR Table Implementation (3-4 hours)**
- Update ContributorMergeRequests component to use real PR data
- Implement sortable and filterable table
- Add status badges for different PR states
- Create mobile-friendly card view for small screens

**Task 4.5.3: PR Impact Calculation (2-3 hours)**
- Implement algorithm to calculate impact of each PR
- Create visual indicators for high-impact PRs
- Add metrics like lines changed, files modified, and review count
- Implement tooltip with detailed impact breakdown

**Task 4.5.4: PR Filtering Controls (2-3 hours)**
- Add filter controls for status, repository, and date range
- Implement search functionality for PR titles
- Create saved filter functionality
- Add clear filters button

**Acceptance Criteria**:
- ContributorMergeRequests displays real PR data for the selected contributor
- Table/card view works well on different devices
- Sorting and filtering function correctly
- PR impact is accurately calculated and displayed
- Component handles loading, error, and empty states gracefully

### Story 4.6: Recent Activity Integration

**Description**: Implement the RecentActivity component to show a feed of the contributor's latest actions across repositories.

**Tasks**:

**Task 4.6.1: Activity Data Hook (3-4 hours)**
- Create `useContributorActivity(username, options)` hook
- Implement infinite scrolling with cursor-based pagination
- Add filtering by activity type and time period
- Create proper type definitions for activity data

**Task 4.6.2: Activity Feed Implementation (3-4 hours)**
- Update RecentActivity component to use real activity data
- Create different card designs for various activity types
- Implement relative timestamps ('2 hours ago', 'yesterday', etc.)
- Add links to related items (commits, PRs, issues)

**Task 4.6.3: Activity Grouping (2-3 hours)**
- Implement logic to group related activities
- Create expandable activity groups
- Add repository context to each activity
- Implement activity summary for groups

**Task 4.6.4: Real-time Updates (3-4 hours)**
- Implement real-time updates using Supabase subscriptions
- Add new activity indicators
- Create smooth animations for new items
- Implement proper cache invalidation for new data

**Acceptance Criteria**:
- RecentActivity shows a real-time feed of contributor actions
- Different activity types are visually distinguished
- Infinite scrolling loads more items smoothly
- Activities link to the correct corresponding items
- Component handles loading, error, and empty states gracefully

### Story 4.7: Contributors Page Performance Optimization

**Description**: Optimize the Contributors page for performance, especially with large datasets and complex visualizations.

**Tasks**:

**Task 4.7.1: Query Optimization (3-4 hours)**
- Implement selective column fetching
- Create optimized join queries
- Add proper indexing for database queries
- Implement data denormalization where beneficial

**Task 4.7.2: Frontend Caching Strategy (3-4 hours)**
- Configure React Query caching for optimal performance
- Implement cache invalidation strategies
- Add prefetching for frequently accessed data
- Create local storage persistence for certain datasets

**Task 4.7.3: Code Splitting (2-3 hours)**
- Implement dynamic imports for heavy components
- Add lazy loading for visualizations
- Create suspense boundaries with fallbacks
- Implement route-based code splitting

**Task 4.7.4: Component Optimization (3-4 hours)**
- Implement memoization for expensive calculations
- Add virtualization for long lists
- Create windowing techniques for large datasets
- Optimize re-renders with React.memo and useMemo

**Acceptance Criteria**:
- Contributors page loads quickly even with large datasets
- Interactions feel responsive and smooth
- Memory usage remains reasonable
- Network requests are optimized
- Page passes Lighthouse performance benchmarks

## Dependencies

- Epic 1: Foundation & Infrastructure

## Definition of Done

- Contributors page displays real data for all components
- Contributor profiles show accurate GitHub information
- Metrics are calculated using the defined algorithms
- History visualization uses real contribution data
- All components handle loading, empty, and error states
- Performance is optimized for large datasets
- UI is responsive and accessible across devices

## Testing Approach

- **Unit Tests**: Test individual hooks and utility functions
- **Integration Tests**: Verify that components work together correctly
- **E2E Tests**: Test the full Contributors page experience
- **Accessibility Tests**: Verify WCAG compliance
- **Performance Tests**: Ensure good performance with large datasets
- **Responsive Tests**: Verify layouts on various screen sizes
