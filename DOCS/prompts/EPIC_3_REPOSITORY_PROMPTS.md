
# EPIC 3: Repository Page Integration Prompts

This document contains structured prompts for implementing the Repository Page integration, organized by user stories and tasks. Each prompt includes detailed instructions, expected inputs/outputs, and implementation guidance.

## Table of Contents
1. [Story 3.1: Repository Data Infrastructure](#story-31-repository-data-infrastructure)
2. [Story 3.2: Repository Details Component Integration](#story-32-repository-details-component-integration)
3. [Story 3.3: Repository Health Metrics Integration](#story-33-repository-health-metrics-integration)
4. [Story 3.4: Repository Activity Timeline Integration](#story-34-repository-activity-timeline-integration)
5. [Story 3.5: Contribution Heatmap Integration](#story-35-contribution-heatmap-integration)
6. [Story 3.6: Repository Contributors Integration](#story-36-repository-contributors-integration)
7. [Story 3.7: Merge Requests Table Integration](#story-37-merge-requests-table-integration)
8. [Story 3.8: Repository Page Performance Optimization](#story-38-repository-page-performance-optimization)

---

## Story 3.1: Repository Data Infrastructure

### Task 3.1.1: Repository Data Models & Types
**Status**: 🟡 Partially implemented

**Prompt**:
```
Extend the existing repository type definitions in src/types/repository.ts to support all necessary repository metadata fields and health metrics. The types should include:

1. Comprehensive repository metadata fields:
   - Primary language
   - License information
   - Repository size in KB
   - Open issues count
   - Watchers count
   - Last update timestamp
   - Health percentage

2. Repository health-related interfaces:
   - Overall health score
   - Component health metrics
   - Contribution patterns

3. Update the existing mapper functions:
   - Enhance mapDbRepositoryToRepository to handle all new fields
   - Ensure mapRepositoryToDbRepository correctly formats data for the database

The implementation should maintain type safety throughout the application and be backward compatible with existing code.
```

### Task 3.1.2: Repository Base Query Hook
**Status**: 🟢 Implemented

**Prompt**:
```
Enhance the existing useRepositoryData hook in src/hooks/useRepositoryData.ts to fetch comprehensive repository data using React Query. The hook should:

1. Accept a repository ID parameter
2. Fetch repository details from the repositories table
3. Include related merge requests in the same query or as a separate query
4. Transform the database results into the Repository interface model
5. Implement proper error handling with detailed error messages
6. Add appropriate logging for debugging
7. Configure optimal caching strategy with appropriate stale time
8. Enable/disable the query based on the availability of the repository ID
9. Add proper TypeScript typing for all return values

The hook should handle the case where the repository ID is null or invalid and should return loading states that are easy to use in UI components.
```

### Task 3.1.3: Repository Selection Hook
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a useRepositorySelector hook in src/hooks/useRepositorySelector.ts that manages repository selection with the following features:

1. State management for the currently selected repository ID
2. Local storage persistence for the selected repository
3. Functions to select, change, and clear the current repository
4. Repository search capabilities with fuzzy matching
5. Recent selections history (last 5 selections)
6. Optional default repository ID parameter
7. TypeScript interfaces for all public methods and return values
8. Integration with React Query for optimal data fetching

The hook should be used across the application to maintain consistent repository selection and improve user experience with persistence between sessions. Include a clear function signature and usage examples in comments.
```

### Task 3.1.4: Repository Context Provider
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a Repository Context Provider to share repository selection and data across components. Implement the following files:

1. src/contexts/RepositoryContext.tsx:
   - Define the context with TypeScript interfaces
   - Create the provider component with repository selection state
   - Implement functions for selecting, changing, and clearing repositories
   - Add loading and error states

2. src/hooks/useRepository.ts:
   - Create a custom hook to consume the repository context
   - Add TypeScript typing for the hook's return value
   - Include helper functions for common repository operations

3. Update src/App.tsx:
   - Wrap the application with the RepositoryProvider
   - Keep the existing providers intact

The context should use the previously implemented hooks internally and provide a clean API for components to access repository data without prop drilling.
```

### Task 3.1.5: Repository Data Transformation Utilities
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a set of repository data transformation utilities in src/utils/repositoryUtils.ts that includes:

1. Functions to process repository statistics:
   - Calculate percentage changes for growth metrics
   - Format large numbers with appropriate units (K, M)
   - Normalize metrics for comparison

2. Date formatting utilities:
   - Convert timestamps to relative time strings (e.g., "2 days ago")
   - Format dates consistently across the application
   - Group dates into appropriate time buckets (day, week, month)

3. Repository data normalization functions:
   - Ensure all required fields have valid default values
   - Handle missing or null data gracefully
   - Normalize strings for search and comparison

4. Repository metrics calculation helpers:
   - Calculate commit frequency
   - Determine activity levels
   - Compute growth rates

Include thorough JSDoc comments and TypeScript type definitions for all functions. Write the utilities to be pure functions without side effects.
```

## Story 3.2: Repository Details Component Integration

### Task 3.2.1: Repository Metadata Card
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a RepositoryMetadataCard component in src/components/repository/RepositoryMetadataCard.tsx that displays comprehensive repository information:

1. Component structure:
   - Accept repositoryId as a prop
   - Use the useRepositoryData hook to fetch repository data
   - Display loading, error, and empty states appropriately

2. UI elements to include:
   - Repository name and description with proper truncation
   - Owner/organization information with avatar
   - Stars, watchers, and forks with formatted counts
   - Primary language with appropriate badge/icon
   - License information
   - Repository size with appropriate units
   - Creation and last update dates in relative format

3. Design requirements:
   - Use Tailwind CSS for styling
   - Create a responsive layout that works on all screen sizes
   - Implement proper skeleton loading state
   - Add hover effects for interactive elements
   - Use shadcn/ui components where appropriate

4. Add appropriate icon indicators from lucide-react
5. Implement a copy-to-clipboard feature for the repository URL
6. Add a direct link to open the repository on GitHub

Use Typescript for all component props and state. Ensure the component gracefully handles all possible data states.
```

### Task 3.2.2: Repository Statistics Grid
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a CompactStatCard component and a StatisticsGrid for displaying repository metrics:

1. src/components/repository/CompactStatCard.tsx:
   - Create a reusable card component for displaying a single statistic
   - Props: title, value, icon, trend (up/down/neutral), percent change
   - Show trend indicators with appropriate colors
   - Add tooltips for additional context

2. src/components/repository/StatisticsGrid.tsx:
   - Create a grid layout for displaying multiple CompactStatCard components
   - Accept repositoryId as a prop
   - Fetch required statistics data using appropriate hooks
   - Implement responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
   - Add skeleton loading states for each card

3. Statistics to include:
   - Stars count with month-over-month growth
   - Forks count with trend
   - Open issues count with trend
   - Commit frequency (daily/weekly average)
   - Contributor count
   - Recent activity level (high/medium/low)

Use Tailwind CSS for styling and shadcn/ui components where appropriate. Ensure proper TypeScript typing for all props and data.
```

### Task 3.2.3: Repository Creation and Update Info
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a RepositoryTimeInfo component in src/components/repository/RepositoryTimeInfo.tsx that displays detailed timestamp information:

1. Component features:
   - Show repository creation date in relative and absolute formats
   - Display last update time with relative formatting
   - Add owner/organization information with avatar
   - Include visual indicators for recent updates

2. Implementation details:
   - Accept repositoryId as a prop
   - Use the useRepositoryData hook to fetch required data
   - Create a clean, compact design using Tailwind CSS
   - Implement hover tooltips for detailed date information
   - Add skeleton loading state
   - Make it responsive for all screen sizes

3. Utility functions:
   - Create date formatting helpers in src/utils/dateUtils.ts
   - Add functions for relative time display
   - Implement time ago calculations

Use appropriate shadcn/ui components and lucide-react icons. Add TypeScript interfaces for all component props and state variables.
```

### Task 3.2.4: Repository Actions
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a RepositoryActions component in src/components/repository/RepositoryActions.tsx that provides interactive repository-related actions:

1. Component features:
   - "Copy Repository ID" button with toast notification
   - "Open in GitHub" button that links to the repository URL
   - "Refresh Data" button that triggers data refetch
   - "Export Metadata" dropdown with options (JSON, CSV)

2. Implementation details:
   - Accept repositoryId as a prop
   - Use shadcn/ui Button and DropdownMenu components
   - Add appropriate lucide-react icons
   - Implement clipboard functionality for copying ID
   - Add success/error toast notifications using sonner
   - Create a responsive button layout that works on all devices

3. Additional helpers:
   - Create utility functions for data export in src/utils/exportUtils.ts
   - Implement proper TypeScript interfaces
   - Add internationalization support for action labels

Ensure proper error handling for all actions and provide clear user feedback for each operation.
```

### Task 3.2.5: Mobile Optimization
**Status**: 🔴 Not implemented

**Prompt**:
```
Optimize all repository components for mobile devices by implementing:

1. Responsive layouts:
   - Create a RepositoryMobileView component that reorganizes content for small screens
   - Implement collapsible sections for dense information
   - Adjust typography scales for better readability
   - Optimize touch targets for better mobile interaction

2. Implementation details:
   - Use Tailwind CSS responsive modifiers consistently
   - Create a useIsMobile hook if needed
   - Implement conditional rendering for different screen sizes
   - Test on various screen sizes (small phone, large phone, tablet)

3. Mobile-specific features:
   - Add swipe gestures for navigating between repository sections
   - Implement compact versions of data visualizations
   - Create touch-friendly action buttons

4. Performance optimizations:
   - Reduce data load for mobile devices if appropriate
   - Optimize image sizes for different screen resolutions
   - Implement lazy loading for off-screen content

Test the implementation on actual mobile devices or using Chrome DevTools device emulation.
```

## Story 3.3: Repository Health Metrics Integration

### Task 3.3.1: Health Metrics Data Hook
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a useRepositoryHealth hook in src/hooks/useRepositoryHealth.ts that fetches and processes repository health metrics:

1. Hook functionality:
   - Accept repositoryId as a parameter
   - Fetch health-related data from the repositories table
   - Process and calculate component health scores
   - Return well-structured health data with TypeScript types

2. Data structure to return:
   - Overall health percentage (0-100)
   - Component scores with labels and descriptions:
     - Commit activity (frequency and consistency)
     - PR review process (time to review, comments)
     - Documentation (readme, inline comments)
     - Test coverage
     - Issue resolution time

3. Implementation details:
   - Use React Query for data fetching
   - Implement appropriate caching strategy
   - Add error handling for missing data
   - Include logging for debugging
   - Make the query dependent on repositoryId existence

4. Additional features:
   - Add functions to calculate trends (improving/declining)
   - Implement health score calculation algorithm
   - Provide recommendations based on low scores

The hook should handle cases where health data is not yet available and provide meaningful defaults.
```

### Task 3.3.2: Health Score Visualization
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a HealthScoreDisplay component in src/components/repository/HealthScoreDisplay.tsx that visualizes the overall repository health:

1. Component features:
   - Large circular progress indicator showing overall health percentage
   - Color coding based on health level:
     - Green (>80%): Good health
     - Yellow (60-80%): Moderate concerns
     - Red (<60%): Needs attention
   - Animated progress for better UX
   - Textual indicator of health status

2. Implementation details:
   - Accept health data as props or fetch using useRepositoryHealth
   - Use shadcn/ui Progress component or custom SVG
   - Create smooth color transitions between health levels
   - Implement responsive sizing for different screen sizes
   - Add skeleton loading state
   - Include tooltip with health score explanation

3. Additional elements:
   - Add trend indicator (improving/declining)
   - Include small historical sparkline if data is available
   - Show change percentage since last calculation

Use Tailwind CSS for styling and ensure the component works well on all screen sizes. Include proper TypeScript typing for all props and state variables.
```

### Task 3.3.3: Component Health Metrics
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a ComponentHealthMetrics visualization in src/components/repository/ComponentHealthMetrics.tsx:

1. Component features:
   - Radar/Spider chart showing the 5 component health metrics
   - Bar chart alternative for accessibility
   - Interactive tooltips showing score and explanation for each component
   - Visual indicators for areas needing improvement

2. Implementation details:
   - Use Recharts for visualization
   - Accept health data as props or fetch using useRepositoryHealth
   - Implement responsive design that works on all screen sizes
   - Create a toggle between radar chart and bar chart views
   - Add appropriate color coding for each component
   - Implement skeleton loading state
   - Handle empty data gracefully

3. Additional functionality:
   - Add click interaction to show detailed information for each component
   - Include percent changes since previous measurement if available
   - Implement filtering/toggling of individual components

Use Tailwind CSS for styling and ensure proper TypeScript typing for all props and state variables. The visualizations should be accessible and include appropriate ARIA attributes.
```

### Task 3.3.4: Health Metrics Cards
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a set of HealthMetricCard components in src/components/repository/HealthMetricCards.tsx:

1. Component features:
   - Individual cards for each health component
   - Visual score indicator (progress bar or gauge)
   - Trend indicator (up/down arrow with percentage)
   - Brief explanation of the metric
   - Expandable details section

2. Implementation details:
   - Create a reusable HealthMetricCard component
   - Accept health component data as props
   - Implement responsive card layout using Tailwind CSS
   - Use appropriate shadcn/ui components
   - Add expand/collapse functionality for details
   - Include skeleton loading state
   - Color code cards based on score (red/yellow/green)

3. Cards to include (one for each health component):
   - Commit Activity Card
   - PR Review Process Card
   - Documentation Card
   - Test Coverage Card
   - Issue Resolution Card

4. Each card should include:
   - Current score out of 100
   - Brief explanation of what the metric measures
   - Trend compared to previous period
   - One key recommendation for improvement
   - Expandable details with more context

Use proper TypeScript interfaces for all component props and ensure the cards work well on all screen sizes.
```

### Task 3.3.5: Health History Tracking
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a HealthHistoryChart component in src/components/repository/HealthHistoryChart.tsx that displays historical health data:

1. Component features:
   - Line chart showing overall health score over time
   - Selectable time ranges (1 month, 3 months, 6 months, 1 year)
   - Option to view individual component metrics over time
   - Interactive tooltips with detailed information
   - Trend analysis indicators

2. Implementation details:
   - Use Recharts for the visualization
   - Create a custom hook for fetching historical health data
   - Implement responsive chart sizing for all devices
   - Add appropriate color coding for health levels
   - Include visual indicators for significant changes
   - Implement skeleton loading state
   - Handle empty or sparse data gracefully

3. Additional features:
   - Add annotations for major repository events
   - Implement zooming and panning for detailed exploration
   - Include export functionality for chart data

Use Tailwind CSS for styling and ensure proper TypeScript typing for all props and state variables. The chart should include appropriate ARIA attributes for accessibility.
```

## Story 3.4: Repository Activity Timeline Integration

### Task 3.4.1: Timeline Data Hook
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a useRepositoryTimeline hook in src/hooks/useRepositoryTimeline.ts that fetches and processes repository activity timeline data:

1. Hook functionality:
   - Accept parameters:
     - repositoryId (required)
     - timeRange (optional: 'week', 'month', 'year', 'all')
     - eventTypes (optional: array of event types to include)
     - pagination parameters (page, limit)
   - Fetch activity data from appropriate tables (commits, merge_requests, etc.)
   - Process and format the data for timeline visualization
   - Return paginated timeline data with TypeScript types

2. Data structure to return:
   - Array of timeline events with:
     - id
     - type (commit, merge_request, issue, release, etc.)
     - timestamp
     - actor (user who performed the action)
     - title/description
     - metadata specific to the event type
   - Pagination information (total count, next page)
   - Aggregated statistics (events per day/week)

3. Implementation details:
   - Use React Query's useInfiniteQuery for pagination
   - Implement filtering by event type and time range
   - Add proper error handling
   - Include logging for debugging
   - Make the query dependent on repositoryId existence

4. Data processing functions:
   - Group events by day/week for dense periods
   - Sort events chronologically
   - Normalize different event types to a common format

The hook should handle cases where no activity data is available and provide meaningful empty states.
```

### Task 3.4.2: Timeline Component Structure
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a RepositoryTimeline component in src/components/repository/RepositoryTimeline.tsx:

1. Component structure:
   - Accept repositoryId as a prop
   - Use useRepositoryTimeline to fetch data
   - Implement a vertical timeline layout
   - Create proper loading, error, and empty states

2. UI implementation:
   - Design a responsive vertical timeline using Tailwind CSS
   - Create event cards for different activity types
   - Implement time markers and connecting lines
   - Group dense activity periods with expandable sections
   - Add scroll virtualization for large datasets

3. Component organization:
   - Create a main Timeline container component
   - Implement TimelineEvent subcomponent for individual events
   - Add TimelineGroup for grouped events
   - Create TimelineControls for filtering and navigation

4. Mobile considerations:
   - Optimize layout for narrow screens
   - Adjust typography and spacing for better readability
   - Implement touch-friendly interactions

Use appropriate shadcn/ui components and ensure proper TypeScript typing for all props and state variables. The timeline should be keyboard navigable and include appropriate ARIA attributes for accessibility.
```

### Task 3.4.3: Event Type Visualization
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a set of TimelineEventCard components in src/components/repository/TimelineEventCards.tsx for different event types:

1. Create the following event card components:
   - CommitEventCard
   - MergeRequestEventCard
   - IssueEventCard
   - ReleaseEventCard
   - ForkEventCard

2. Each card should include:
   - Distinctive icon for the event type
   - Color coding for visual differentiation
   - Title and description of the event
   - Timestamp in relative format
   - Actor information with avatar
   - Relevant metadata specific to the event type
   - Expandable details section

3. Implementation details:
   - Create a base TimelineEventCard component
   - Extend it for each specific event type
   - Use appropriate shadcn/ui components
   - Implement responsive card layouts
   - Add hover interactions for additional details
   - Include skeleton loading states
   - Handle long text gracefully with truncation

4. Additional features:
   - Add click handlers to navigate to detailed views
   - Implement tooltips for additional context
   - Include appropriate animations for expanding/collapsing

Use Tailwind CSS for styling and lucide-react icons. Ensure proper TypeScript typing for all components and props. The cards should be accessible and keyboard navigable.
```

### Task 3.4.4: Timeline Filtering & Controls
**Status**: 🔴 Not implemented

**Prompt**:
```
Create TimelineControls component in src/components/repository/TimelineControls.tsx:

1. Component features:
   - Time range selector (week, month, year, all time)
   - Event type filter buttons with counts
   - Search input for filtering events by text
   - Density control (compact/normal/expanded)
   - Sort direction toggle (newest/oldest first)

2. Implementation details:
   - Use shadcn/ui components (ToggleGroup, Select, Input)
   - Implement responsive layout that adapts to screen size
   - Create mobile-friendly collapsed version for small screens
   - Add sticky positioning for persistent access while scrolling
   - Implement filter state management with useReducer or useState
   - Connect filters to the useRepositoryTimeline hook

3. User experience enhancements:
   - Add visual feedback for active filters
   - Implement filter badges showing active filters
   - Create "Clear filters" button when filters are applied
   - Add tooltips explaining each control
   - Persist filter preferences in localStorage

4. Additional features:
   - Create preset filter combinations (e.g., "Recent PRs", "My activity")
   - Add export functionality for filtered timeline
   - Implement saving custom filter presets

Use Tailwind CSS for styling and ensure proper TypeScript typing for all props and state. The controls should be accessible and include appropriate ARIA attributes.
```

### Task 3.4.5: Timeline Interactions
**Status**: 🔴 Not implemented

**Prompt**:
```
Enhance the Repository Timeline with interactive features:

1. Implement the following interactions:
   - Click handlers for timeline events
   - Expandable event details panel
   - Navigation to related pages (commit details, PR page)
   - Hover effects for timeline events
   - Keyboard navigation support

2. Create a TimelineEventDetails component:
   - Detailed view of a selected timeline event
   - Slide-in panel or modal dialog
   - Comprehensive information based on event type
   - Related events or context
   - Action buttons relevant to the event type

3. Specific interaction features:
   - For commit events: Show diff summary, link to full commit view
   - For PR events: Show description, reviewers, status
   - For issue events: Show description, labels, status
   - For release events: Show release notes, version number

4. Implementation details:
   - Create proper state management for selected events
   - Implement smooth animations for transitions
   - Add appropriate keyboard shortcuts
   - Ensure all interactions are accessible
   - Optimize for both desktop and mobile use

Use shadcn/ui Dialog or Sheet components for the details panel. Ensure proper TypeScript typing for all components and handlers. The interactions should be intuitive and enhance the user experience without being overwhelming.
```

## Story 3.5: Contribution Heatmap Integration

### Task 3.5.1: Heatmap Data Hook
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a useContributionHeatmap hook in src/hooks/useContributionHeatmap.ts:

1. Hook functionality:
   - Accept parameters:
     - repositoryId (required)
     - timeRange (optional: '3months', '6months', 'year', 'all')
   - Fetch contribution data from the commits table
   - Aggregate contributions by day
   - Process data into a format suitable for heatmap visualization
   - Return formatted heatmap data with TypeScript types

2. Data structure to return:
   - Array of day entries with:
     - date (YYYY-MM-DD format)
     - count (number of contributions)
     - intensity (calculated level for visualization, 0-4)
     - details (optional breakdown by contribution type)
   - Date range information (startDate, endDate)
   - Statistics (total contributions, max per day, average)

3. Implementation details:
   - Use React Query for data fetching
   - Implement date range calculations based on timeRange
   - Add proper error handling
   - Include loading states
   - Make the query dependent on repositoryId existence

4. Data processing functions:
   - Fill in missing days with zero counts
   - Calculate intensity levels based on count distribution
   - Group days into weeks and months for rendering
   - Support different contribution types if available

The hook should handle cases where no contribution data is available and provide a complete year of data with zero counts when appropriate.
```

### Task 3.5.2: Heatmap Calendar Grid
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a ContributionHeatmap component in src/components/repository/ContributionHeatmap.tsx:

1. Component features:
   - GitHub-style calendar heatmap visualization
   - Week-based grid layout (7 rows for days, columns for weeks)
   - Color intensity based on contribution count
   - Month and weekday labels
   - Legend explaining the color intensities

2. Implementation details:
   - Use useContributionHeatmap hook to fetch data
   - Create a custom grid implementation using Tailwind CSS
   - Implement responsive sizing that works on all screen sizes
   - Add appropriate color scaling for contribution intensity
   - Create month separators and labels
   - Include weekday labels (Mon, Wed, Fri)
   - Implement skeleton loading state
   - Handle empty data gracefully

3. Design considerations:
   - Use a color scheme that matches the application theme
   - Implement proper spacing between cells
   - Create rounded corners for grid cells
   - Ensure sufficient contrast for accessibility
   - Add proper text labels and ARIA attributes

4. Additional features:
   - Implement proper month label positioning
   - Handle edge cases for partial years
   - Create a smooth transition when data changes

Ensure proper TypeScript typing for all props and state variables. The heatmap should be accessible and include appropriate ARIA attributes for screen readers.
```

### Task 3.5.3: Heatmap Interactions
**Status**: 🔴 Not implemented

**Prompt**:
```
Enhance the ContributionHeatmap with interactive features:

1. Implement the following interactions:
   - Tooltips showing detailed information on hover
   - Click handler to select a specific day
   - Keyboard navigation between days
   - Focus indicators for keyboard navigation

2. Create a DayTooltip component:
   - Show date in readable format
   - Display contribution count
   - Include breakdown by contribution type if available
   - Add comparison to average day
   - Show streaks information if applicable

3. Implement a DayDetailsDialog component:
   - Modal dialog showing detailed day information
   - List of all contributions on the selected day
   - Links to related items (commits, PRs)
   - Statistics for the day compared to average
   - Context in relation to surrounding days

4. Implementation details:
   - Create custom hooks for tooltip and dialog state
   - Position tooltips appropriately based on viewport
   - Implement smooth animations for tooltips
   - Add keyboard shortcuts for navigation
   - Ensure all interactions are accessible

Use shadcn/ui components (Tooltip, Dialog) where appropriate. Ensure proper TypeScript typing for all components and handlers. The interactions should enhance the user experience without being overwhelming.
```

### Task 3.5.4: Heatmap Controls
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a HeatmapControls component in src/components/repository/HeatmapControls.tsx:

1. Component features:
   - Time range selector (3 months, 6 months, 1 year, all time)
   - Contribution type filter (all, commits, PRs, issues)
   - Color scheme selector (default, high contrast, colorblind-friendly)
   - View options (week starts Sunday/Monday)
   - Export functionality

2. Implementation details:
   - Use shadcn/ui components (SegmentedControl, Select, Checkbox)
   - Create responsive layout that adapts to different screen sizes
   - Implement mobile-friendly collapsed version
   - Connect controls to the useContributionHeatmap hook
   - Add state management for control options
   - Persist preferences in localStorage

3. User experience enhancements:
   - Add tooltips explaining each control
   - Implement smooth transitions when changing options
   - Create visual feedback for active selections
   - Add keyboard shortcuts for common actions

4. Additional features:
   - Add option to toggle weekday labels
   - Implement zoom level control for the heatmap
   - Create a "Jump to date" feature for quick navigation
   - Add option to download heatmap as an image

Use Tailwind CSS for styling and ensure proper TypeScript typing for all props and state. The controls should be accessible and include appropriate ARIA attributes.
```

### Task 3.5.5: Heatmap Accessibility
**Status**: 🔴 Not implemented

**Prompt**:
```
Enhance the ContributionHeatmap with accessibility features:

1. Implement the following accessibility improvements:
   - Add proper ARIA roles, labels, and descriptions
   - Implement keyboard navigation pattern
   - Create high contrast mode
   - Add screen reader announcements for data changes
   - Ensure all interactive elements are properly accessible

2. Technical implementation:
   - Add aria-label attributes to all heatmap cells
   - Implement aria-live regions for dynamic content
   - Create keyboard focus management system
   - Add focus indicators that meet WCAG requirements
   - Implement semantic HTML structure

3. Specific enhancements:
   - Add textual representation of the data for screen readers
   - Implement arrow key navigation between days
   - Create Skip links for keyboard users
   - Add announcements for selected days and time range changes
   - Implement proper heading structure

4. Testing requirements:
   - Test with keyboard-only navigation
   - Verify screen reader compatibility
   - Check color contrast ratios
   - Test with browser zoom
   - Ensure mobile accessibility

Include detailed comments explaining accessibility implementations. Use proper ARIA patterns following best practices. The component should meet WCAG 2.1 AA standards at minimum.
```

## Story 3.6: Repository Contributors Integration

### Task 3.6.1: Contributors Data Hook
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a useRepositoryContributors hook in src/hooks/useRepositoryContributors.ts:

1. Hook functionality:
   - Accept parameters:
     - repositoryId (required)
     - sortBy (optional: 'commits', 'impact', 'recent')
     - pagination parameters (page, limit)
     - filterOptions (optional: search term, role)
   - Fetch contributors data from appropriate tables
   - Process and format the data for display
   - Return paginated contributor data with TypeScript types

2. Data structure to return:
   - Array of contributors with:
     - id
     - username
     - name
     - avatar URL
     - contribution count
     - role classification
     - impact score
     - lines added/removed
     - recent activity indicators
   - Pagination information (total count, hasMore)
   - Aggregated statistics (total contributors, contribution distribution)

3. Implementation details:
   - Use React Query's useInfiniteQuery for pagination
   - Implement sorting logic for different sort options
   - Add filtering capabilities
   - Handle error states and loading
   - Optimize data fetching with appropriate query keys

4. Data processing functions:
   - Calculate additional metrics (impact per contribution)
   - Format data for display
   - Group contributors by role if needed
   - Process time-based metrics (recent activity)

The hook should handle cases where no contributors exist and provide appropriate empty states.
```

### Task 3.6.2: Contributor Cards
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a ContributorCard component in src/components/repository/ContributorCard.tsx:

1. Component features:
   - Display contributor avatar
   - Show username and full name
   - Present contribution metrics
   - Include role classification badge
   - Show impact score visualization
   - Add recent activity indicator

2. Implementation details:
   - Create a card-based design using Tailwind CSS
   - Use shadcn/ui Avatar component for user avatars
   - Implement responsive layout that works on all screen sizes
   - Add appropriate hover effects
   - Include skeleton loading state
   - Handle missing data gracefully (fallback avatar, etc.)

3. Metrics visualization:
   - Create compact bar or pie charts for contribution breakdown
   - Use color coding for different contribution types
   - Implement mini sparklines for recent activity if applicable
   - Add visual indicators for impact score (gauge, stars, etc.)

4. Interactive features:
   - Add hover tooltips with additional details
   - Implement click handler to view detailed contributor profile
   - Include quick links to relevant GitHub profiles

Use proper TypeScript interfaces for the component props. Ensure the card design is consistent with the overall application design system.
```

### Task 3.6.3: Contributors Grid Layout
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a ContributorsGrid component in src/components/repository/ContributorsGrid.tsx:

1. Component features:
   - Display a grid of ContributorCard components
   - Implement responsive grid layout
   - Add pagination or infinite scrolling
   - Provide list view alternative for mobile
   - Include loading, error, and empty states

2. Implementation details:
   - Use Tailwind CSS grid for layout
   - Accept repositoryId as a prop
   - Use useRepositoryContributors hook to fetch data
   - Create responsive grid that adjusts columns based on screen size:
     - 4 columns on large screens
     - 3 columns on medium screens
     - 2 columns on tablets
     - List view on mobile
   - Implement proper spacing between cards
   - Add skeleton loading grid during data fetch

3. Mobile optimization:
   - Create a compact list view for small screens
   - Implement touch-friendly card design
   - Optimize avatar sizes for different screens
   - Ensure smooth scrolling performance

4. Empty and error states:
   - Design appropriate empty state with illustration
   - Create helpful error messages with retry button
   - Add contextual guidance for empty results

Use proper TypeScript interfaces for all props and state. The grid should be accessible and include appropriate ARIA attributes.
```

### Task 3.6.4: Contributor Filtering & Sorting
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a ContributorsFilterBar component in src/components/repository/ContributorsFilterBar.tsx:

1. Component features:
   - Search input for filtering by name or username
   - Sort dropdown with options (most contributions, recent activity, impact)
   - Filter buttons for contributor roles
   - Time range selector (all time, past month, past 3 months, past year)
   - View toggle (grid/list)

2. Implementation details:
   - Use shadcn/ui components (Input, Select, ToggleGroup)
   - Create responsive layout that collapses on mobile
   - Implement debounced search functionality
   - Connect filter and sort options to useRepositoryContributors
   - Add sticky positioning for persistent access while scrolling
   - Style using Tailwind CSS

3. User experience enhancements:
   - Add filter badges showing active filters
   - Implement "Clear filters" button
   - Create count indicators showing results for each filter
   - Add tooltips explaining each filter option
   - Store filter preferences in localStorage

4. Additional features:
   - Create saved filter functionality
   - Implement preset filters for common queries
   - Add export functionality for filtered contributors

Ensure proper TypeScript typing for all props and state variables. The filter bar should be accessible and include appropriate ARIA attributes.
```

### Task 3.6.5: Contributor Details Dialog
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a ContributorDetailsDialog component in src/components/repository/ContributorDetailsDialog.tsx:

1. Component features:
   - Modal dialog showing detailed contributor information
   - Comprehensive profile information section
   - Contribution breakdown with visualizations
   - Recent activity timeline
   - Repository-specific contribution metrics
   - Links to GitHub profile and related pages

2. Implementation details:
   - Use shadcn/ui Dialog component
   - Create responsive layout that works well on all screens
   - Implement tabs for organizing different information sections
   - Add loading states for each data section
   - Create close button and escape key handler
   - Style using Tailwind CSS

3. Sections to include:
   - Profile section with avatar, name, bio, location
   - Contribution metrics section with charts
   - Activity timeline with recent contributions
   - Impact analysis with visualization
   - Related repositories section if applicable

4. Data visualization:
   - Create a contribution breakdown pie chart
   - Implement a time-based activity chart
   - Add contribution calendar (mini heatmap)
   - Show impact metrics with appropriate visualizations

Use Recharts for data visualizations and ensure proper TypeScript typing for all props and state. The dialog should be accessible and include appropriate keyboard navigation.
```

## Story 3.7: Merge Requests Table Integration

### Task 3.7.1: Merge Requests Data Hook
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a useRepositoryMergeRequests hook in src/hooks/useRepositoryMergeRequests.ts:

1. Hook functionality:
   - Accept parameters:
     - repositoryId (required)
     - sortBy and sortOrder (column and direction)
     - filterOptions (status, author, labels)
     - pagination parameters (page, limit)
   - Fetch merge requests data from merge_requests table
   - Process and format the data for display
   - Return paginated merge request data with TypeScript types

2. Data structure to return:
   - Array of merge requests with all necessary fields
   - Pagination information (total count, hasMore)
   - Sort and filter state
   - Loading and error states

3. Implementation details:
   - Use React Query for data fetching
   - Implement sorting logic for different columns
   - Add filtering capabilities
   - Handle error states appropriately
   - Optimize data loading with cursor-based pagination
   - Support both infinite scrolling and traditional pagination

4. Additional functionality:
   - Implement data transformation helpers
   - Add caching strategy with appropriate invalidation
   - Create utility functions for common operations

The hook should handle cases where no merge requests exist and provide appropriate empty states. Include proper TypeScript interfaces for all parameters and return values.
```

### Task 3.7.2: Merge Requests Table Component
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a MergeRequestsTable component in src/components/repository/MergeRequestsTable.tsx:

1. Component features:
   - Display merge requests in a sortable, filterable table
   - Implement responsive table with card view for mobile
   - Add column sorting functionality
   - Include row selection for batch actions
   - Provide pagination controls
   - Show loading, error, and empty states

2. Implementation details:
   - Use shadcn/ui Table components or ScrollableTable
   - Accept repositoryId as a prop
   - Use useRepositoryMergeRequests hook to fetch data
   - Create column definitions with proper sorting
   - Implement responsive behavior that adapts to screen size
   - Add skeleton loading state during data fetch
   - Handle empty and error states appropriately

3. Columns to include:
   - Title with link to GitHub
   - Status badge (open, merged, closed)
   - Author with avatar
   - Branch information
   - Created date (relative format)
   - Code changes (additions/deletions)
   - Review status
   - Labels/tags

4. Mobile optimization:
   - Create card view for small screens
   - Show essential information in compact format
   - Implement swipe gestures for additional actions
   - Ensure touch targets are appropriately sized

Use appropriate TypeScript interfaces for all props and state. Ensure the table is accessible with proper ARIA attributes and keyboard navigation.
```

### Task 3.7.3: Merge Request Row Components
**Status**: 🔴 Not implemented

**Prompt**:
```
Create specialized components for the Merge Requests Table rows:

1. Implement MergeRequestBranchInfo component:
   - Visual representation of source and target branches
   - Directional arrow showing merge flow
   - Branch name truncation for long names
   - Tooltips with full branch names
   - Visual indicators for protected branches

2. Create StatusBadge component:
   - Color-coded badges for different PR states
   - Visual icons to reinforce status
   - Tooltip with additional status details
   - Support for custom/combined statuses
   - Accessible color schemes and labels

3. Implement CodeChangesIndicator component:
   - Visual representation of lines added/removed
   - Mini bar chart showing proportions
   - Tooltip with detailed numbers
   - Color coding (green for additions, red for deletions)
   - Size indicator for number of files changed

4. Create AuthorInfo component:
   - Author avatar with fallback
   - Username display
   - Role or organization badge if available
   - Timestamp for submission
   - Hover card with additional author details

Each component should be implemented in its own file with proper TypeScript interfaces. Ensure all components are responsive and work well within the table context on both desktop and mobile views.
```

### Task 3.7.4: Merge Request Filtering
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a MergeRequestFilters component in src/components/repository/MergeRequestFilters.tsx:

1. Component features:
   - Status filter (Open, Closed, Merged, All)
   - Author filter with search and selection
   - Label/tag filter with multi-select
   - Date range picker
   - Text search for titles and descriptions
   - Saved filters functionality

2. Implementation details:
   - Use shadcn/ui components (Select, Popover, DatePicker)
   - Create responsive layout that adapts to screen sizes
   - Implement collapsible sections for mobile
   - Connect filters to useRepositoryMergeRequests hook
   - Add immediate feedback when filters are applied
   - Style using Tailwind CSS

3. User experience enhancements:
   - Add filter badges showing active filters
   - Implement "Clear filters" button
   - Create count indicators for each filter option
   - Add tooltips explaining filter options
   - Store filter preferences in localStorage

4. Additional features:
   - Create preset filters for common queries
   - Implement filter history
   - Add export functionality for filtered results
   - Create shareable filter URLs

Ensure proper TypeScript typing for all props and state variables. The filters should be accessible and include appropriate ARIA attributes for screen readers.
```

### Task 3.7.5: Merge Request Details Panel
**Status**: 🔴 Not implemented

**Prompt**:
```
Create a MergeRequestDetailsPanel component in src/components/repository/MergeRequestDetailsPanel.tsx:

1. Component features:
   - Expandable panel showing detailed PR information
   - List of commits included in the PR
   - Files changed with stats
   - Review information and status
   - Timeline of PR activities
   - Description and comments

2. Implementation details:
   - Use shadcn/ui Collapsible or Sheet component
   - Accept merge request ID as prop
   - Fetch detailed data with a custom hook
   - Create responsive layout that works on all screens
   - Implement tabs for organizing different sections
   - Style using Tailwind CSS

3. Sections to include:
   - Overview section with description and status
   - Commits section with list of included commits
   - Files changed section with stats and types
   - Reviews section with reviewer information
   - Timeline showing PR activities in chronological order
   - Related issues and PRs if applicable

4. Interactive features:
   - Collapsible file tree for changed files
   - Expandable commit messages
   - Links to related items
   - Quick actions for common operations

Use proper TypeScript interfaces for all props and state. Ensure the panel is accessible and includes appropriate keyboard navigation.
```

## Story 3.8: Repository Page Performance Optimization

### Task 3.8.1: Query Optimization
**Status**: 🔴 Not implemented

**Prompt**:
```
Optimize database queries for the Repository page:

1. Implement selective column fetching:
   - Review all database queries in repository hooks
   - Update to select only required columns
   - Create specialized queries for specific data needs
   - Implement proper TypeScript typing for partial entities

2. Optimize join queries:
   - Analyze current join patterns
   - Implement more efficient join strategies
   - Create database views for frequently accessed data
   - Consider denormalization for performance-critical queries

3. Enhance query parameters:
   - Add proper filtering in WHERE clauses
   - Implement LIMIT and OFFSET for pagination
   - Use ORDER BY only when necessary
   - Leverage database functions for calculations

4. Implement query monitoring:
   - Add query execution time logging
   - Create performance metrics collection
   - Implement query optimization suggestions
   - Add warning logs for slow queries

Update all repository-related hooks to use these optimized query patterns. Document the optimization approaches and measure performance improvements.
```

### Task 3.8.2: Frontend Caching Strategy
**Status**: 🔴 Not implemented

**Prompt**:
```
Implement a comprehensive caching strategy for repository data:

1. Optimize React Query configuration:
   - Review and update staleTime settings for all queries
   - Implement query key factories for consistent keys
   - Configure proper caching behavior for different data types
   - Add prefetching for known navigation paths

2. Implement cache persistence:
   - Configure React Query persistence plugin
   - Determine appropriate cache storage mechanism
   - Set up cache garbage collection
   - Implement cache invalidation strategies

3. Add data deduplication:
   - Create shared query keys for common data
   - Implement data transformers for normalized cache
   - Configure proper structure sharing
   - Add cache hit logging for performance analysis

4. Cache management:
   - Create a cache control panel for developers
   - Implement manual cache clearing functionality
   - Add cache debugging tools
   - Create cache analytics collection

Document the caching strategy and measure performance improvements. Create a cache behavior guide for future development.
```

### Task 3.8.3: Virtualization for Large Datasets
**Status**: 🔴 Not implemented

**Prompt**:
```
Implement virtualization techniques for large datasets on the Repository page:

1. Add virtualized lists:
   - Integrate virtualization for timeline component
   - Implement windowing for large tables
   - Create virtualized grid for contributors
   - Add infinite scrolling for paginated data

2. Technical implementation:
   - Use React Virtualized or similar library
   - Configure appropriate row heights and buffer sizes
   - Implement dynamic measurement for variable content
   - Add scroll restoration for navigation
   - Create placeholder UI for virtualized items

3. Optimize rendering:
   - Implement component memoization
   - Add should-update optimizations
   - Create chunked rendering for complex items
   - Use lightweight placeholder components

4. Data loading optimization:
   - Implement progressive data loading
   - Create data ranges based on viewport
   - Add scroll position based prefetching
   - Implement data prioritization for visible items

Document virtualization decisions and measure performance improvements. Focus on maintaining smooth scrolling performance even with thousands of items.
```

### Task 3.8.4: Code Splitting
**Status**: 🔴 Not implemented

**Prompt**:
```
Implement code splitting for the Repository page components:

1. Add dynamic imports:
   - Convert large components to use React.lazy
   - Implement code splitting for visualization components
   - Create separate chunks for third-party libraries
   - Add dynamic loading for rarely used features

2. Route-based splitting:
   - Implement code splitting based on routes
   - Create separate bundles for different repository views
   - Add prefetching for likely navigation paths
   - Optimize import order for critical path rendering

3. Create Suspense boundaries:
   - Add React.Suspense around lazy components
   - Implement meaningful fallback UI
   - Create nested suspense boundaries for component trees
   - Add error boundaries for failed chunk loading

4. Bundle optimization:
   - Analyze bundle size with appropriate tools
   - Identify and reduce large dependencies
   - Implement tree shaking optimizations
   - Create module federation for shared code

Document code splitting strategy and measure bundle size improvements. Create guidelines for future component development.
```

### Task 3.8.5: Asset Optimization
**Status**: 🔴 Not implemented

**Prompt**:
```
Optimize assets for the Repository page:

1. Implement image optimization:
   - Create responsive image loading for avatars
   - Add lazy loading for off-screen images
   - Implement proper image sizing and formats
   - Add image placeholders during loading

2. Optimize font loading:
   - Implement font loading strategy with font-display
   - Add preload for critical fonts
   - Create fallback font stacks
   - Reduce font variations where possible

3. Add resource hints:
   - Implement preconnect for external resources
   - Add prefetch for likely navigation
   - Create preload for critical resources
   - Configure proper DNS-prefetch for third-party domains

4. Optimize SVG usage:
   - Review and optimize SVG assets
   - Inline critical SVGs
   - Create SVG sprite sheets for repeated icons
   - Implement proper SVG accessibility

Document asset optimization strategy and measure performance improvements. Create guidelines for asset usage in future development.
```

## Task Status Legend
- 🔴 Not implemented
- 🟡 Partially implemented
- 🟢 Implemented
- ⚫ Blocked

---

## Implementation Checklist Template

When implementing tasks, update their status in the list above and use this template to track implementation details:

### [Task ID]: [Task Name]
- [ ] Create core component/hook structure
- [ ] Implement data fetching
- [ ] Add styling and responsive design
- [ ] Implement loading and error states
- [ ] Add TypeScript interfaces
- [ ] Test on multiple screen sizes
- [ ] Add accessibility features
- [ ] Document component API
