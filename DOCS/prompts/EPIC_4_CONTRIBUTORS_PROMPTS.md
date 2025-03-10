# Epic 4: Contributors Page Integration Prompts

This document contains detailed implementation prompts for all tasks within Epic 4, which focuses on integrating real data into the Contributors page. Each prompt is designed to provide specific instructions for implementing a particular component or feature.

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed

## Story 4.1: Contributors Data Infrastructure

### Prompt 4.1.1: Contributor Data Models & Types 🔴
```
Create comprehensive TypeScript types and interfaces for contributor data in the GitHub Explorer application. You need to:

1. Review the existing contributor type definitions in `src/types/user.ts` and extend them to support all metadata fields from the database
2. Create interfaces for the following:
   - Contributor profile details (username, avatar, bio, location, etc.)
   - Contributor metrics (impact score, commit count, PR count, etc.)
   - Contribution activity data (timestamps, action types, etc.)
   - Contribution history data (time series data for visualizations)

Make sure all types are properly documented with JSDoc comments and include appropriate nullable fields where data might be missing. These types will be used throughout the contributors section of the application, so they should be comprehensive and well-structured.

Expected Output:
- Updated or new type definitions in the appropriate files
- Type safety for all contributor-related data
- Full compatibility with the database schema
```

### Prompt 4.1.2: Contributor Base Query Hook 🔴
```
Implement a reusable React Query hook called `useContributorData` that will serve as the foundation for fetching contributor data from the database. This hook should:

1. Accept parameters for filtering contributors (by username, repository, date range, etc.)
2. Use React Query for data fetching, caching, and state management
3. Implement error handling for network failures, authentication issues, and data validation
4. Add proper loading states for initial load and background refreshes
5. Configure caching with appropriate stale times and revalidation strategies
6. Support pagination for listing multiple contributors with efficient data loading

The implementation should leverage Supabase queries and follow best practices for React Query. Make sure to handle race conditions in case of rapid parameter changes.

Expected Output:
- A new hook file with the `useContributorData` implementation
- Proper TypeScript types for all parameters and return values
- Well-documented code with JSDoc comments
- Comprehensive error handling and loading states
```

### Prompt 4.1.3: Contributor Selection Hook 🔴
```
Enhance the existing `ContributorSelector` component to use real data and implement a hook for managing contributor selection state. This hook should:

1. Create a `useContributorSelection` hook that manages the selected contributor
2. Implement local storage persistence for recent contributor selections
3. Add search functionality with debounced input for finding contributors by name
4. Include filtering options for sorting contributors (by activity, impact, alphabetical)
5. Provide methods for selecting, saving, and clearing contributor selections

The hook should integrate with the `useContributorData` hook and provide a seamless user experience for finding and selecting contributors. Make sure the component handles empty states and loading states appropriately.

Expected Output:
- A new hook for managing contributor selection
- Updates to the existing `ContributorSelector` component
- Local storage integration for persistence
- Search and filter functionality with proper TypeScript types
```

### Prompt 4.1.4: Contributor Data Transformation Utilities 🔴
```
Create a set of utility functions for processing and transforming contributor data for display and analysis. These utilities should:

1. Implement formatting helpers for contributor statistics (e.g., formatting large numbers, calculating percentages)
2. Create date formatting utilities for contribution timestamps with relative time support
3. Provide normalization functions for standardizing contribution data across different sources
4. Implement calculation functions for derived metrics like impact score, contribution velocity, and relative rankings

All utilities should be pure functions with comprehensive unit tests. Make sure they handle edge cases like missing data, zero values, and extreme outliers appropriately.

Expected Output:
- A new utility file with contributor data transformation functions
- Unit tests for all functions
- Proper TypeScript types and JSDoc documentation
- Handling of edge cases and error conditions
```

## Story 4.2: Contributor Profile Integration

### Prompt 4.2.1: Contributor Profile Hook 🔴
```
Create a `useContributorProfile` React Query hook that fetches detailed profile information for a specific contributor. This hook should:

1. Accept a username parameter to identify the contributor
2. Fetch comprehensive profile data from Supabase, including GitHub profile integration
3. Return the profile data with appropriate TypeScript types
4. Implement loading, error, and success states
5. Cache the profile data with appropriate invalidation strategies

The hook should integrate with any existing authentication system and handle permissions appropriately. Make sure to implement proper error handling for network issues, missing data, and rate limiting.

Expected Output:
- A new hook file implementing `useContributorProfile`
- Comprehensive TypeScript types for the profile data
- Well-documented code with JSDoc comments
- Integration with GitHub API for additional profile data when available
```

### Prompt 4.2.2: ContributorHero Component Integration 🔴
```
Update the `ContributorHero` component to display real contributor profile data from the database. The component should:

1. Use the `useContributorProfile` hook to fetch the contributor's profile data
2. Display the contributor's avatar image with appropriate fallbacks for missing images
3. Show the contributor's name, username, bio, and other profile information
4. Implement responsive design for optimal display on mobile and desktop
5. Create appropriate loading, error, and empty states

The component should follow the existing design system and use Tailwind CSS for styling. Make sure all UI elements are accessible and follow best practices for responsive design.

Expected Output:
- Updated `ContributorHero` component using real data
- Loading, error, and empty states
- Responsive design with Tailwind CSS
- Accessibility features including proper semantic HTML and ARIA attributes
```

### Prompt 4.2.3: Profile Stats Display 🔴
```
Implement the statistics section of the contributor profile component to display key metrics about the contributor. This component should:

1. Display follower count, repository count, and other GitHub statistics
2. Show contribution counts across different categories (commits, PRs, issues)
3. Implement visual indicators for different contributor levels (based on activity or impact)
4. Create tooltips with additional information about each statistic
5. Ensure responsive design for all viewport sizes

Use the shadcn/ui library for UI components and Tailwind CSS for styling. Make sure to implement appropriate loading states and handle missing or zero-value data gracefully.

Expected Output:
- A statistics section within the profile component
- Visual indicators for contributor levels
- Responsive design with Tailwind CSS
- Tooltips with additional context for each statistic
```

### Prompt 4.2.4: Profile Links and External Resources 🔴
```
Add functionality to display and interact with external links and resources related to the contributor. This should:

1. Add links to the contributor's GitHub profile, blog, and other external resources
2. Implement social media links if available in the profile data
3. Create a "View on GitHub" button with proper linking
4. Add a "Copy username to clipboard" functionality with user feedback
5. Ensure all links open in new tabs with proper security attributes

Use the appropriate shadcn/ui components for buttons and links. Make sure to implement proper hover states, feedback for user actions, and accessibility features.

Expected Output:
- External links section in the profile component
- Copy to clipboard functionality with feedback (using the toast component)
- Secure external links with proper attributes
- Accessible UI elements with keyboard navigation support
```

## Story 4.3: Contribution Metrics Integration

### Prompt 4.3.1: Contribution Metrics Hook 🔴
```
Create a `useContributorMetrics` React Query hook that calculates and fetches key metrics for a contributor. This hook should:

1. Accept parameters for the contributor username and time period (last week, month, year, all time)
2. Fetch and calculate metrics like impact score, PR velocity, commit frequency, and code review participation
3. Support comparison of metrics against team or project averages
4. Implement caching with appropriate invalidation strategies
5. Handle loading, error, and success states

The metrics calculation should follow the defined algorithms and handle edge cases appropriately. Make sure to implement proper TypeScript types for all parameters and return values.

Expected Output:
- A new hook file implementing `useContributorMetrics`
- Calculation logic for derived metrics
- Time period filtering functionality
- Comprehensive TypeScript types and documentation
```

### Prompt 4.3.2: Metrics Cards Implementation 🔴
```
Update the metrics cards in the `ContributionSummary` component to display real contributor metrics. These cards should:

1. Display key metrics like impact score, PR count, commit count, and code review participation
2. Implement visual indicators for high/medium/low metric values
3. Show trend indicators (increasing/decreasing) based on historical data
4. Include tooltips explaining each metric and how it's calculated
5. Ensure responsive layout for different screen sizes

Use the shadcn/ui Card component as a base and implement custom styling with Tailwind CSS. Make sure to handle loading states and empty/zero values appropriately.

Expected Output:
- Updated metrics cards using real data
- Visual indicators for metric values and trends
- Tooltips with explanations
- Responsive design with Tailwind CSS
```

### Prompt 4.3.3: Contribution Distribution Chart 🔴
```
Implement a pie/donut chart in the `ContributionSummary` component that visualizes the distribution of a contributor's activities. This chart should:

1. Display the distribution of contribution types (commits, PRs, reviews, comments)
2. Create a legend with accurate percentages for each category
3. Implement interactive tooltips that show detailed counts when hovering over segments
4. Use an accessible color scheme with sufficient contrast
5. Handle empty states and loading states appropriately

Use the Recharts library for implementing the chart. Make sure to follow best practices for data visualization and ensure the chart is accessible to all users.

Expected Output:
- A new pie/donut chart component for contribution distribution
- Interactive tooltips with detailed information
- Accessible color scheme and labels
- Responsive design that works well on all devices
```

### Prompt 4.3.4: Contribution Comparison Chart 🔴
```
Implement a bar chart in the `ContributionSummary` component that compares the contributor's metrics to team or project averages. This chart should:

1. Display a comparison of key metrics (impact, velocity, quality) between the user and team average
2. Include a time period selector (last week, month, quarter, year)
3. Implement interactive tooltips with detailed information on hover
4. Use consistent and accessible colors for visual distinction
5. Handle loading, error, and empty states appropriately

Use the Recharts library for implementing the bar chart. Ensure the chart is responsive and provides clear visual comparisons between the individual and team metrics.

Expected Output:
- A new bar chart component for metric comparison
- Time period selector with filtering functionality
- Interactive tooltips with context
- Responsive design that works on all devices
```

## Story 4.4: Contribution History Integration

### Prompt 4.4.1: Contribution History Hook 🔴
```
Create a `useContributionHistory` React Query hook that fetches time-series data for a contributor's activity. This hook should:

1. Accept parameters for the contributor username and optional date range
2. Fetch historical contribution data from Supabase with appropriate filtering
3. Support different time granularities (daily, weekly, monthly) for data aggregation
4. Implement data transformation functions for formatting the time-series data
5. Handle loading, error, and success states with appropriate TypeScript types

The hook should optimize data fetching to minimize payload size while providing sufficient detail for visualizations. Make sure to implement proper caching and invalidation strategies.

Expected Output:
- A new hook file implementing `useContributionHistory`
- Data transformation functions for different time granularities
- Date range filtering capabilities
- Comprehensive TypeScript types and documentation
```

### Prompt 4.4.2: Timeline Visualization 🔴
```
Update the `ProgressTimeline` component to visualize a contributor's historical activity using real data. This visualization should:

1. Implement a line chart showing contribution frequency over time
2. Add a date range selector component for filtering the displayed time period
3. Create interactive hover tooltips showing detailed daily contribution information
4. Handle sparse data periods gracefully with appropriate visual cues
5. Ensure responsive design that works well on all screen sizes

Use the Recharts library for implementing the line chart and shadcn/ui components for the date range selector. Make sure to implement proper loading states and handle edge cases like no data available.

Expected Output:
- Updated `ProgressTimeline` component using real historical data
- Date range selector with filtering functionality
- Interactive tooltips with daily details
- Responsive design that scales well on different devices
```

### Prompt 4.4.3: Activity Heatmap 🔴
```
Implement a `ContributorActivityHeatmap` component similar to GitHub's contribution graph. This heatmap should:

1. Display a calendar grid visualization showing contribution frequency by day
2. Use color intensity to represent contribution count (darker color = more contributions)
3. Implement tooltips showing the exact contribution count for each day
4. Support a full year of historical data with appropriate month/day labels
5. Ensure responsive design with a mobile-friendly alternative view for small screens

The heatmap should follow GitHub's familiar pattern while using the project's color scheme. Make sure to handle loading states and sparse/empty data gracefully.

Expected Output:
- A fully functional activity heatmap component
- Color intensity scaling based on contribution count
- Interactive tooltips with daily details
- Responsive design with mobile optimization
```

### Prompt 4.4.4: Contribution Streak Detection 🔴
```
Implement functionality to detect and display contribution streaks for a contributor. This feature should:

1. Calculate current streak (consecutive days with contributions)
2. Identify longest streak in the available historical data
3. Create visual indicators highlighting streak days in the timeline visualization
4. Add a summary section showing streak statistics
5. Implement tooltips with additional context about each streak

The streak detection algorithm should handle timezone differences appropriately and consider all types of contributions (commits, PRs, reviews, comments).

Expected Output:
- Streak detection algorithm implementation
- Visual indicators for streak days
- Statistical summary of current and longest streaks
- Tooltips with streak details
- Integration with existing timeline visualizations
```

## Story 4.5: Contributor Merge Requests Integration

### Prompt 4.5.1: Contributor PRs Hook 🔴
```
Create a `useContributorMergeRequests` React Query hook for fetching pull request data specific to a contributor. This hook should:

1. Accept parameters for the contributor username and filtering options
2. Support sorting by different criteria (creation date, update date, status)
3. Implement filtering by status (open, closed, merged) and repository
4. Provide pagination functionality for efficient data loading
5. Handle loading, error, and success states with appropriate TypeScript types

The hook should optimize database queries for performance and implement proper caching strategies with React Query.

Expected Output:
- A new hook file implementing `useContributorMergeRequests`
- Sorting and filtering functionality
- Pagination support with cursor-based navigation
- Comprehensive TypeScript types and documentation
```

### Prompt 4.5.2: PR Table Implementation 🔴
```
Update the `ContributorMergeRequests` component to display real pull request data for the selected contributor. This component should:

1. Implement a sortable and filterable table of pull requests
2. Add status badges for different PR states (open, closed, merged)
3. Display key information like title, creation date, repository, and status
4. Create a mobile-friendly card view for small screens as an alternative to the table
5. Support pagination for navigating through large sets of PRs

Use the shadcn/ui Table component and implement custom styling with Tailwind CSS. Ensure the component handles loading states and empty results appropriately.

Expected Output:
- Updated `ContributorMergeRequests` component using real PR data
- Sortable and filterable table with proper column headers
- Status badges for different PR states
- Mobile-friendly card view for small screens
- Pagination controls for navigating through results
```

### Prompt 4.5.3: PR Impact Calculation 🔴
```
Implement an algorithm to calculate and display the impact of each pull request. This feature should:

1. Calculate impact based on factors like lines changed, files modified, review count, and complexity
2. Create visual indicators for high-impact PRs in the table/card view
3. Add detailed metrics tooltips showing the impact breakdown
4. Implement sorting by impact score
5. Ensure consistent calculation across different repositories

The impact calculation should follow the defined algorithm and handle edge cases appropriately. Make sure to document the calculation methodology for transparency.

Expected Output:
- Impact calculation algorithm implementation
- Visual indicators for high-impact PRs
- Detailed tooltips with impact breakdown
- Sorting functionality by impact score
- Documentation of the calculation methodology
```

### Prompt 4.5.4: PR Filtering Controls 🔴
```
Implement comprehensive filtering controls for the contributor's pull requests. These controls should:

1. Add filter buttons/dropdowns for status (open, closed, merged)
2. Implement repository filtering with a searchable dropdown
3. Add date range filtering for PR creation or update time
4. Create a search box for filtering by PR title or description
5. Implement saved filters functionality for quick access to common filters
6. Add a clear filters button to reset all filters

Use shadcn/ui components for the filtering controls and implement proper state management for the filter conditions.

Expected Output:
- Filtering control components for the PR table
- Status, repository, and date range filters
- Search functionality for PR titles
- Saved filters with local storage persistence
- Clear filters button for resetting all filters
```

## Story 4.6: Recent Activity Integration

### Prompt 4.6.1: Activity Data Hook 🔴
```
Create a `useContributorActivity` React Query hook for fetching a feed of a contributor's latest actions. This hook should:

1. Accept parameters for the contributor username and filtering options
2. Implement infinite scrolling with cursor-based pagination
3. Support filtering by activity type (commit, PR, review, comment)
4. Implement filtering by time period (today, this week, this month)
5. Handle loading, error, and success states with appropriate TypeScript types

The hook should optimize data fetching for performance and implement efficient caching strategies.

Expected Output:
- A new hook file implementing `useContributorActivity`
- Infinite scrolling with cursor-based pagination
- Activity type and time period filtering
- Comprehensive TypeScript types and documentation
```

### Prompt 4.6.2: Activity Feed Implementation 🔴
```
Update the `RecentActivity` component to display a feed of the contributor's latest actions. This component should:

1. Display different card designs for various activity types (commits, PRs, reviews, comments)
2. Implement relative timestamps ('2 hours ago', 'yesterday')
3. Add links to related items (commits, PRs, issues) for each activity
4. Create appropriate loading, error, and empty states
5. Implement infinite scrolling for loading more activities as the user scrolls

Use shadcn/ui components for the activity cards and implement custom styling with Tailwind CSS. Ensure the component handles loading states and empty results appropriately.

Expected Output:
- Updated `RecentActivity` component using real activity data
- Different card designs for various activity types
- Relative timestamps with date-fns
- Links to related items for each activity
- Infinite scrolling implementation for loading more activities
```

### Prompt 4.6.3: Activity Grouping 🔴
```
Implement logic to group related activities in the recent activity feed. This feature should:

1. Group related activities by repository, PR, or issue
2. Create expandable/collapsible groups for viewing all related activities
3. Show a summary of grouped activities (e.g., "5 commits to repository X")
4. Implement proper sorting of activities within and between groups
5. Ensure groups are visually distinct from individual activities

The grouping logic should identify related activities based on common attributes and provide a more organized view of the activity feed.

Expected Output:
- Activity grouping algorithm implementation
- Expandable/collapsible groups in the activity feed
- Summary display for grouped activities
- Proper sorting and organization of activities
- Visual distinction between groups and individual activities
```

### Prompt 4.6.4: Real-time Updates 🔴
```
Implement real-time updates for the activity feed using Supabase subscriptions. This feature should:

1. Set up Supabase real-time subscriptions for new activities
2. Add new activity indicators when fresh data is available
3. Implement smooth animations for new items appearing in the feed
4. Create proper cache invalidation for seamless updates
5. Handle subscription errors and reconnection gracefully

The real-time updates should provide a seamless experience without disrupting the user's current view or scroll position.

Expected Output:
- Real-time subscription setup with Supabase
- New activity indicators with smooth animations
- Cache invalidation strategy for React Query
- Error handling and reconnection logic
- Smooth integration with the existing activity feed
```

## Story 4.7: Contributors Page Performance Optimization

### Prompt 4.7.1: Query Optimization 🔴
```
Optimize database queries for the Contributors page to improve performance. This task should:

1. Analyze and optimize the database queries used in all contributor-related hooks
2. Implement selective column fetching to reduce payload size
3. Create optimized join queries to minimize database roundtrips
4. Add proper indexing suggestions for database tables
5. Implement data denormalization where beneficial for read performance

The optimizations should significantly reduce load times and improve the overall responsiveness of the Contributors page.

Expected Output:
- Optimized database queries in all contributor hooks
- Selective column fetching implementation
- Efficient join strategies
- Documentation of indexing recommendations
- Data denormalization implementations where appropriate
```

### Prompt 4.7.2: Frontend Caching Strategy 🔴
```
Implement a comprehensive frontend caching strategy for contributor data. This task should:

1. Configure React Query caching with optimal stale times for different data types
2. Implement cache invalidation strategies for related data
3. Add prefetching for frequently accessed data to improve perceived performance
4. Create local storage persistence for certain datasets to reduce network requests
5. Implement background revalidation to keep data fresh without disrupting the user

The caching strategy should balance data freshness with performance considerations and handle edge cases like stale data appropriately.

Expected Output:
- Optimized React Query configuration for all hooks
- Cache invalidation strategy implementation
- Prefetching logic for commonly accessed data
- Local storage persistence for appropriate datasets
- Background revalidation implementation
```

### Prompt 4.7.3: Code Splitting 🔴
```
Implement code splitting strategies to reduce the initial bundle size of the Contributors page. This task should:

1. Add dynamic imports for heavy components like charts and visualizations
2. Implement lazy loading for components that aren't immediately visible
3. Create suspense boundaries with appropriate fallback components
4. Add route-based code splitting for the main Contributors page sections
5. Optimize third-party library imports to reduce bundle size

The code splitting should significantly improve initial load time while maintaining a smooth user experience.

Expected Output:
- Dynamic imports for heavy components
- Lazy loading implementation with React.lazy
- Suspense boundaries with fallback components
- Route-based code splitting configuration
- Optimized library imports
```

### Prompt 4.7.4: Component Optimization 🔴
```
Optimize the performance of React components on the Contributors page. This task should:

1. Implement memoization for expensive calculations and renders using useMemo and React.memo
2. Add virtualization for long lists like the activity feed and PR table
3. Implement windowing techniques for large datasets to minimize DOM elements
4. Optimize re-renders by preventing unnecessary updates
5. Add performance monitoring to identify and fix bottlenecks

The component optimizations should result in smoother interactions and better responsiveness, especially with large datasets.

Expected Output:
- Memoization implementation for expensive calculations
- Virtualization for long lists and tables
- Windowing techniques for large datasets
- Re-render optimization with React.memo and dependency array tuning
- Performance monitoring and bottleneck identification
```

## Implementation Approach

When implementing these tasks, follow these guidelines:

1. Start with the data infrastructure components before moving to UI components
2. Use React Query for all data fetching operations
3. Implement proper loading, error, and empty states for all components
4. Ensure all components are responsive and work well on mobile devices
5. Follow the established design system and use shadcn/ui components
6. Write comprehensive unit tests for all utility functions and hooks
7. Document all code with JSDoc comments and provide usage examples
8. Optimize performance at each stage of implementation

## Dependencies

This epic depends on:
- Epic 1: Foundation & Infrastructure (must be completed)
- Basic database schema with contributor data available
- Authentication system for accessing protected data

## Acceptance Criteria

For all tasks to be considered complete, the following criteria must be met:
- All components display real data from the database
- Loading, error, and empty states are properly implemented
- Performance meets or exceeds target metrics
- All features work correctly across different devices and screen sizes
- Code is well-documented and follows project conventions
- Unit tests pass for all utility functions and hooks
