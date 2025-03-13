# Epic 8: Admin Dashboard Enhancement - Implementation Prompts

This document outlines the specific prompts needed to implement Epic 8, organized by user story and with AI tool recommendations for each task.

## IMPORTANT: Build Upon Existing Admin Dashboard

All implementation work should build upon the existing admin dashboard. Specifically:

1. **Review existing components first** - Examine the current admin components in `src/components/admin/` before writing new code
2. **Extend, don't replace** - Build upon existing components like `PipelineStats`, `StatsCard`, etc.
3. **Use consistent UI patterns** - Follow the established admin dashboard design patterns
4. **Leverage existing data flow patterns** - Extend existing hooks like `usePipelineControls`, `useGitHubSync`
5. **Maintain consistency** - Keep the dashboard's visual and functional consistency
6. **Use Supabase REST API client for all database operations** - All CRUD (Create, Read, Update, Delete) operations with Supabase must use the Supabase REST API client, not the SDK or other methods
7. **Use server's cron job management** - All pipeline operations should be scheduled via the server's cron job management system, not directly with Supabase
8. **Keep it simple and minimal** - Focus only on essential functionality for pipeline scheduling and monitoring

## Implementation Status Overview

| Story | Status | Priority |
|-------|--------|----------|
| 8.1 Pipeline Control Dashboard Implementation | 🔴 Not Started | Critical |
| 8.2 Simple Pipeline History | 🔴 Not Started | High |
| 8.3 Cron Job Management | 🔴 Not Started | Critical |

## Story 8.1: Pipeline Control Dashboard Implementation

### Prompt 8.1.1: Pipeline Control Cards Implementation (Lovable AI) 🔴 Not Started

**Context**: The admin dashboard needs a set of control cards for monitoring the data pipeline processes. Based on the design, we need four main cards: GitHub Sync, Data Processing, Data Enrichment, and AI Analysis.

**Prompt**:
Create or enhance the pipeline status cards for the admin dashboard. Each card should display status for a specific pipeline stage with consistent design:

1. First, examine existing components in `src/components/admin/` to understand the current structure
2. Create or enhance the `StatsCard` component to support:
   - Title and description
   - Icon display
   - Count of items to be processed
   - Status indicator (scheduled, running, idle, error)
   - Last run time and next scheduled run
   - Success/error feedback

3. Implement the GitHub Sync card:
   - Label: "GitHub Sync"
   - Description: "Fetch recent merge requests from GitHub"
   - Display count of unprocessed MRs (51,138 in design)
   - Show current status (scheduled, running, idle, error)
   - Display next scheduled run time
   - Show last run time and status

4. Implement the Data Processing card:
   - Label: "Data Processing"
   - Description: "Process unprocessed MRs in batches of 500"
   - Display count of unprocessed MRs (51,138 in design)
   - Show current status (scheduled, running, idle, error)
   - Display next scheduled run time
   - Show last run time and status

5. Implement the Data Enrichment card:
   - Label: "Data Enrichment"
   - Description: "Enrich data with additional GitHub information"
   - Display count of entities to enrich (0 in design)
   - Show current status (scheduled, running, idle, error)
   - Display next scheduled run time
   - Show last run time and status

6. Implement the AI Analysis card:
   - Label: "AI Analysis"
   - Description: "Analyze unanalyzed commits using AI"
   - Display count of unanalyzed commits (1 in design)
   - Show current status (scheduled, running, idle, error)
   - Display next scheduled run time
   - Show last run time and status

7. Ensure consistent error handling across all cards
8. Implement proper data fetching for real-time counts using Supabase REST API client
9. Create or update hooks for fetching pipeline status
10. Ensure all cards are responsive

All data fetching and CRUD operations with Supabase must use the Supabase REST API client.

Each card should use the same base component but with specific data.

```tsx
// Example StatsCard component structure (implement or enhance existing)
interface StatsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  statLabel: string;
  statValue: number;
  status: 'scheduled' | 'running' | 'idle' | 'error';
  lastRunTime: string;
  nextRunTime: string;
  errorMessage?: string;
}

// Example GitHub Sync card usage
<StatsCard 
  title="GitHub Sync"
  description="Fetch recent merge requests from GitHub"
  icon={<GitHubIcon />}
  statLabel="Unprocessed MRs"
  statValue={unprocessedMRsCount}
  status={status}
  lastRunTime={lastRun ? format(new Date(lastRun), 'PPpp') : 'Never'}
  nextRunTime={nextRun ? format(new Date(nextRun), 'PPpp') : 'Not scheduled'}
  errorMessage={error}
/>
```

### Prompt 8.1.2: Entity Stats Overview (Lovable AI) 🔴 Not Started

**Context**: The admin dashboard needs a section showing statistics about processed entities in the database. The design shows a card with counts for repositories, merge requests, contributors, and commits.

**Prompt**:
Create a component for displaying statistics about processed entities in the database. The component should:

1. Create a new component or enhance `src/components/admin/ProcessedEntitiesOverview.tsx`
2. Display a card with:
   - Heading "Processed Entities Overview"
   - Subheading "Current count of processed entities in the database"
   - Four statistics in a responsive grid:
     - Repositories count with icon
     - Merge Requests count with icon
     - Contributors count with icon
     - Commits count with icon
   - Each statistic should show the count number prominently

3. Implement data fetching:
   - Create a hook that fetches counts from all relevant database tables using Supabase REST API client
   - Use React Query for efficient data fetching and caching
   - Handle loading states with skeletons or spinners
   - Implement error handling with appropriate user feedback

4. Ensure responsive design:
   - Stats should display in a 2x2 grid on mobile
   - Stats should display in a 4x1 row on desktop
   - Maintain consistent spacing and alignment
   - Use the same styling patterns as other admin components

5. Style according to design:
   - Use same card styling as other admin components
   - Include appropriate icons for each entity type
   - Use consistent typography for labels and numbers
   - Ensure proper spacing between elements

All Supabase database operations must use the REST API client.

```tsx
// Example of the component structure (implement completely)
export const ProcessedEntitiesOverview = () => {
  const { data, isLoading, error } = useDatabaseStats();
  
  if (isLoading) {
    return <EntityStatsLoading />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed Entities Overview</CardTitle>
        <CardDescription>
          Current count of processed entities in the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem icon={<DatabaseIcon />} label="Repositories" value={data.repositoryCount} />
          <StatItem icon={<GitMergeIcon />} label="Merge Requests" value={data.mergeRequestCount} />
          <StatItem icon={<UsersIcon />} label="Contributors" value={data.contributorCount} />
          <StatItem icon={<GitCommitIcon />} label="Commits" value={data.commitCount} />
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for each stat
const StatItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};
```

### Prompt 8.1.3: Pipeline Schedule Management (Lovable AI) 🔴 Not Started

**Context**: The admin dashboard needs a tabbed interface with a "Schedule Management" tab that allows administrators to manage the cron jobs for different pipeline processes.

**Prompt**:
Create a Schedule Management interface for the admin dashboard that enables administrators to manage pipeline cron jobs. The component should:

1. Create a new component `src/components/admin/ScheduleManagement.tsx`
2. Implement a tabbed interface with "Entity Stats" and "Schedule Management" tabs
3. Ensure the tabs are properly integrated with the existing admin dashboard layout

4. For the Schedule Management tab, implement a Pipeline Schedules component that includes:
   - Card with proper heading and description
   - Table of current cron job schedules for each pipeline component
   - Status indicators for each job (active, paused, error)
   - Next run time display for each job
   - Last run status and time
   - Enable/disable toggle for each job
   - Edit button for modifying schedules

5. Implement a schedule editor modal that includes:
   - Cron expression editor with validation
   - Visual helper for cron syntax
   - Human-readable explanation of schedule
   - Next run time preview
   - Timezone selection
   - Save and cancel buttons

6. Implement integration with the server's cron job management:
   - Use the existing server API endpoints for managing cron jobs
   - Implement hooks for fetching job schedules and statuses
   - Add functions for enabling/disabling scheduled jobs
   - Include methods for creating and updating schedules
   - Add validation for cron expressions
   - Use Supabase REST API client for any necessary database operations

7. Ensure proper state management:
   - Track active/inactive status
   - Display last run information
   - Show next scheduled run time
   - Handle validation errors

8. Add proper error handling and user feedback:
   - Show confirmation for schedule changes
   - Display clear error messages
   - Provide help text for cron syntax
   - Include loading states

Use the server's existing cron job management system instead of directly integrating with Supabase cron functionality.

```tsx
// Example of the component structure (implement completely)
export const ScheduleManagement = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const [editingSchedule, setEditingSchedule] = useState<PipelineSchedule | null>(null);
  
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">Entity Stats</TabsTrigger>
          <TabsTrigger value="schedules">Schedule Management</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <ProcessedEntitiesOverview />
        </TabsContent>
        <TabsContent value="schedules">
          <PipelineSchedules 
            onEditSchedule={setEditingSchedule} 
          />
        </TabsContent>
      </Tabs>
      
      {editingSchedule && (
        <ScheduleEditorModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
};

export const PipelineSchedules = ({ onEditSchedule }) => {
  const { data: schedules, isLoading, error, refetch } = useServerCronJobs();
  const { toggleJobStatus } = useJobControls();
  
  if (isLoading) {
    return <TableSkeleton />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Schedules</CardTitle>
        <CardDescription>
          Manage automated pipeline job schedules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Schedule (Cron)</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules && schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.pipelineType}</TableCell>
                    <TableCell>{schedule.cronExpression}</TableCell>
                    <TableCell>{formatDate(schedule.nextRunAt)}</TableCell>
                    <TableCell>
                      {schedule.lastRunAt ? formatDate(schedule.lastRunAt) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.isActive ? "success" : "secondary"}>
                        {schedule.isActive ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={() => toggleJobStatus(schedule.id, !schedule.isActive)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEditSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No schedules found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Prompt 8.1.4: Admin Dashboard Integration (Lovable AI) 🔴 Not Started

**Context**: We need to integrate the pipeline control cards, entity stats, and schedule management components into a cohesive admin dashboard UI.

**Prompt**:
Create the necessary components to integrate all pipeline management features into a cohesive admin dashboard. The implementation should:

1. Examine existing admin dashboard structure and layout
2. Create or enhance the main admin dashboard page component
3. Implement proper layout for the pipeline control section:
   - Include all pipeline control cards in a responsive grid
   - Position the entity stats component appropriately
   - Integrate schedule management section with proper tabbing

4. Apply consistent styling across all components:
   - Use the same card styling throughout
   - Maintain consistent spacing and alignment
   - Apply responsive design principles
   - Follow the established admin UI patterns

5. Implement proper state management:
   - Fetch data efficiently using React Query
   - Avoid redundant fetches
   - Cache data where appropriate
   - Handle loading and error states consistently

6. Add simple navigation and usability features:
   - Clear section headers
   - Intuitive tab labels
   - Appropriate visual hierarchy
   - Consistent UI patterns

All data fetching and CRUD operations with Supabase must use the REST API client.

```tsx
// Example integration component
export const PipelineManagementDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pipeline Management</h2>
          <p className="text-muted-foreground">
            Monitor and control pipeline operations
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PipelineControlCard 
          type="github_sync"
          title="GitHub Sync"
          description="Fetch recent merge requests from GitHub"
          icon={<GitHubIcon />}
          statLabel="Unprocessed MRs"
        />
        <PipelineControlCard 
          type="data_processing"
          title="Data Processing"
          description="Process unprocessed MRs in batches"
          icon={<DatabaseIcon />}
          statLabel="Unprocessed MRs"
        />
        <PipelineControlCard 
          type="data_enrichment"
          title="Data Enrichment"
          description="Enrich data with additional information"
          icon={<LayersIcon />}
          statLabel="Entities to Enrich"
        />
        <PipelineControlCard 
          type="ai_analysis"
          title="AI Analysis" 
          description="Analyze unanalyzed commits using AI"
          icon={<BrainIcon />}
          statLabel="Unanalyzed Commits"
        />
      </div>
      
      <ScheduleManagement />
    </div>
  );
};
```

## Story 8.2: Simple Pipeline History

### Prompt 8.2.1: Simple Pipeline History UI (Lovable AI) 🔴 Not Started

**Context**: We need a minimal interface to view the history of pipeline runs and their statuses.

**Prompt**:
Create a simple UI component to display the history of pipeline runs. The component should:

1. Create a `PipelineHistory.tsx` component that:
   - Shows a table of recent pipeline runs
   - Displays the pipeline type, start time, end time, and status
   - Includes a simple filter to view by pipeline type
   - Limits to displaying the most recent runs (e.g., last 20)

2. Implement data fetching:
   - Create a hook that fetches pipeline history data using Supabase REST API client
   - Handle loading states with appropriate indicators
   - Implement error handling with user-friendly feedback

3. Style the component according to design:
   - Use consistent card styling with other admin components
   - Apply appropriate status colors (green for success, red for error, etc.)
   - Ensure responsive design works on all devices

4. Add minimal filtering:
   - Allow filtering by pipeline type
   - Provide a simple date range selection (if needed)
   - Implement client-side filtering for simplicity

All data fetching and CRUD operations with Supabase must use the REST API client.

```tsx
// Example component structure
export const PipelineHistory = () => {
  const [pipelineType, setPipelineType] = useState<string | null>(null);
  const { data, isLoading, error } = usePipelineHistory({ limit: 20, pipelineType });
  
  if (isLoading) {
    return <TableSkeleton />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-xl">Pipeline Run History</CardTitle>
          <CardDescription>
            Recent pipeline execution history
          </CardDescription>
        </div>
        <Select value={pipelineType || ''} onValueChange={(value) => setPipelineType(value || null)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="github_sync">GitHub Sync</SelectItem>
            <SelectItem value="data_processing">Data Processing</SelectItem>
            <SelectItem value="data_enrichment">Data Enrichment</SelectItem>
            <SelectItem value="ai_analysis">AI Analysis</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Items Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{run.pipelineType}</TableCell>
                    <TableCell>{formatDate(run.startedAt)}</TableCell>
                    <TableCell>{run.completedAt ? formatDate(run.completedAt) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(run.status)}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDuration(run.durationSeconds)}</TableCell>
                    <TableCell>{run.itemsProcessed || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No pipeline history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

function getStatusVariant(status: string) {
  switch (status) {
    case 'success': return 'success';
    case 'failed': return 'destructive';
    case 'in_progress': return 'default';
    case 'cancelled': return 'secondary';
    default: return 'outline';
  }
}

function formatDuration(seconds?: number) {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${(seconds / 60).toFixed(1)}m`;
}
```

### Prompt 8.2.2: Basic Error Handling (Lovable AI) 🔴 Not Started

**Context**: We need a minimal interface to view errors that occur during pipeline execution and provide options to retry failed jobs.

**Prompt**:
Create a basic error handling component for the pipeline management dashboard. The component should:

1. Create a `PipelineErrors.tsx` component that:
   - Shows a table of recent pipeline errors
   - Displays the pipeline type, error time, error message, and status
   - Includes a retry button for failed pipeline runs
   - Provides basic error details on expansion

2. Implement data fetching:
   - Create a hook that fetches pipeline error data using Supabase REST API client
   - Handle loading states with appropriate indicators
   - Implement error handling with user-friendly feedback

3. Add retry functionality:
   - Implement a retry button for failed pipeline runs
   - Connect to server API for triggering job reruns
   - Show loading state during retry operation
   - Display success/failure feedback

4. Style the component according to design:
   - Use consistent card styling with other admin components
   - Apply appropriate error styling and icons
   - Ensure responsive design works on all devices

All data fetching and CRUD operations with Supabase must use the REST API client.

```tsx
// Example component structure
export const PipelineErrors = () => {
  const { data, isLoading, error, refetch } = usePipelineErrors({ limit: 10 });
  const { retryPipelineRun, isRetrying } = useRetryPipeline();
  
  const handleRetry = async (runId: string) => {
    await retryPipelineRun(runId);
    refetch();
  };
  
  if (isLoading) {
    return <TableSkeleton />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-xl">Pipeline Errors</CardTitle>
          <CardDescription>
            Recent pipeline errors and failures
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Error Time</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((errorItem) => (
                  <TableRow key={errorItem.id}>
                    <TableCell>{errorItem.pipelineType}</TableCell>
                    <TableCell>{formatDate(errorItem.timestamp)}</TableCell>
                    <TableCell className="max-w-md truncate">{errorItem.errorMessage}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(errorItem.runId)}
                        disabled={isRetrying}
                      >
                        {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No errors found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Story 8.3: Cron Job Management

### Prompt 8.3.1: Server-Based Cron Job Integration (Lovable AI) 🔴 Not Started

**Context**: We need to integrate with the server's existing cron job management system to provide a UI for managing scheduled pipeline operations.

**Prompt**:
Create a client-side integration with the server's cron job management system. Implement:

1. First, examine the server's cron job management API:
   - Identify the available endpoints and parameters
   - Understand the data formats and requirements
   - Document the server's job scheduling capabilities

2. Create client-side service functions in `src/services/cronJobService.ts`:
   ```typescript
   export interface CronJob {
     id: string;
     jobName: string;
     pipelineType: string;
     cronExpression: string;
     isActive: boolean;
     parameters?: Record<string, any>;
     lastRunAt?: string;
     lastRunStatus?: string;
     nextRunAt?: string;
     timeZone: string;
   }
   
   export async function fetchCronJobs(): Promise<CronJob[]>;
   
   export async function createCronJob(params: {
     jobName: string;
     pipelineType: string;
     cronExpression: string;
     isActive?: boolean;
     parameters?: Record<string, any>;
     timeZone?: string;
   }): Promise<string>;
   
   export async function updateCronJob(
     id: string,
     updates: Partial<CronJob>
   ): Promise<void>;
   
   export async function toggleCronJobStatus(
     id: string,
     isActive: boolean
   ): Promise<void>;
   
   export async function deleteCronJob(id: string): Promise<void>;
   
   export async function getJobExecutionHistory(
     jobId: string,
     limit: number = 10
   ): Promise<JobExecution[]>;
   ```

3. Create React hooks for accessing the cron job API:
   - `useServerCronJobs.ts`: For fetching and managing cron jobs
   - `useJobControls.ts`: For controlling job status and execution

4. Implement a basic cron job management UI:
   - Create or enhance components for displaying job status
   - Add controls for enabling/disabling jobs
   - Include job history display
   - Implement start/stop controls

Use the server's API endpoints for all cron job management operations rather than implementing custom database operations.

### Prompt 8.3.2: Cron Schedule Editor (Lovable AI) 🔴 Not Started

**Context**: We need a user-friendly editor for cron expressions to help administrators schedule pipeline operations without needing to manually write cron syntax.

**Prompt**:
Create a simple cron expression editor component for the admin dashboard. Implement:

1. Create a new component `src/components/admin/CronExpressionEditor.tsx`
2. Implement a form-based interface for building cron expressions with:
   - Minute selection (0-59)
   - Hour selection (0-23)
   - Day of month selection (1-31)
   - Month selection (1-12 or JAN-DEC)
   - Day of week selection (0-6 or SUN-SAT)
   - Special schedules (@hourly, @daily, @weekly, @monthly)

3. Add a human-readable preview section:
   - Show plain English description of the schedule
   - Display next execution times (next 3 occurrences)

4. Create validation for cron expressions:
   - Detect invalid combinations
   - Show helpful error messages
   - Suggest fixes for common mistakes

5. Add a direct text editor for advanced users:
   - Allow direct editing of cron expression
   - Validate and parse entered expressions
   - Synchronize with the visual editor

6. Implement timezone handling:
   - Allow selection of timezone
   - Show execution times in selected timezone

All components should be user-friendly with clear labels, tooltips, and informative error messages to make cron scheduling accessible to administrators without requiring deep technical knowledge.

```tsx
// Example component structure
export const CronExpressionEditor = ({ 
  value, 
  onChange,
  timeZone,
  onTimeZoneChange
}: {
  value: string;
  onChange: (value: string) => void;
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
}) => {
  // State for each cron component
  const [minute, setMinute] = useState<string>("0");
  const [hour, setHour] = useState<string>("0");
  const [dayOfMonth, setDayOfMonth] = useState<string>("*");
  const [month, setMonth] = useState<string>("*");
  const [dayOfWeek, setDayOfWeek] = useState<string>("*");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [nextExecutions, setNextExecutions] = useState<Date[]>([]);
  const [humanReadable, setHumanReadable] = useState<string>("");
  
  // Parse and update from value
  useEffect(() => {
    if (!value) return;
    
    try {
      const parts = value.split(" ");
      if (parts.length === 5) {
        setMinute(parts[0]);
        setHour(parts[1]);
        setDayOfMonth(parts[2]);
        setMonth(parts[3]);
        setDayOfWeek(parts[4]);
      }
    } catch (e) {
      console.error("Failed to parse cron expression", e);
    }
  }, [value]);
  
  // Build cron expression from components
  const buildCronExpression = useCallback(() => {
    const expression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    onChange(expression);
    
    // Calculate next executions
    calculateNextExecutions(expression, timeZone).then(setNextExecutions);
    
    // Update human readable description
    getHumanReadableDescription(expression).then(setHumanReadable);
  }, [minute, hour, dayOfMonth, month, dayOfWeek, timeZone, onChange]);
  
  useEffect(() => {
    if (!isAdvancedMode) {
      buildCronExpression();
    }
  }, [minute, hour, dayOfMonth, month, dayOfWeek, isAdvancedMode, buildCronExpression]);
  
  return (
    <div className="space-y-4">
      {/* Rest of component implementation */}
    </div>
  );
};
```

## Implementation Sequence Recommendation

For most efficient implementation, follow this sequence:
1. Start with Story 8.1 (Pipeline Control Dashboard) to create the main interface
2. Follow with Story 8.3 (Cron Job Management) to implement the scheduling functionality
3. Finish with Story 8.2 (Simple Pipeline History) to add the history tracking UI

Each story can be implemented independently, but the earlier stories provide foundations for later ones.
