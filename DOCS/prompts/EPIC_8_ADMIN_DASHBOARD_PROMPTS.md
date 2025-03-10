
# Epic 8: Admin Dashboard Enhancement - Implementation Prompts

This document outlines the specific prompts needed to implement Epic 8, organized by user story and with AI tool recommendations for each task.

## IMPORTANT: Build Upon Existing Admin Dashboard

All implementation work should build upon the existing admin dashboard. Specifically:

1. **Review existing components first** - Examine the current admin components in `src/components/admin/` before writing new code
2. **Extend, don't replace** - Build upon existing components like `PipelineStats`, `StatsCard`, etc.
3. **Use consistent UI patterns** - Follow the established admin dashboard design patterns
4. **Leverage existing data flow patterns** - Extend existing hooks like `usePipelineControls`, `useGitHubSync`
5. **Maintain consistency** - Keep the dashboard's visual and functional consistency

## Implementation Status Overview

| Story | Status | Priority |
|-------|--------|----------|
| 8.1 Pipeline History & Audit Trails | 🔴 Not Started | High |
| 8.2 Advanced Monitoring Dashboard | 🔴 Not Started | High |
| 8.3 Enhanced Error Handling & Recovery | 🔴 Not Started | Medium |
| 8.4 User Management for Admin Access | 🔴 Not Started | Medium |
| 8.5 Pipeline Configuration & Scheduling | 🔴 Not Started | High |
| 8.6 Enhanced Data Management Tools | 🔴 Not Started | Low |
| 8.7 Advanced Analytics & Reporting | 🔴 Not Started | Low |
| 8.8 Performance Optimization & Testing | 🔴 Not Started | Medium |

## Story 8.1: Pipeline History & Audit Trails

### Prompt 8.1.1: Create Pipeline History Database Structure (Lovable AI) 🔴 Not Started

**Context**: We need a database table to store the history of pipeline operations for auditing and troubleshooting. This should track each run of the GitHub sync, data processing, enrichment, and AI analysis pipeline stages.

**Prompt**:
Create the SQL statements to set up a `pipeline_history` table in our Supabase database. The schema should:

1. Include a primary key `id` column
2. Include a `pipeline_type` column with values like 'github_sync', 'data_processing', 'enrichment', 'ai_analysis'
3. Include `started_at` and `completed_at` timestamp columns
4. Include a `status` column with values like 'success', 'failed', 'in_progress', 'cancelled'
5. Include an `error_details` JSONB column for storing error information
6. Include a `metadata` JSONB column for storing operation-specific details
7. Include performance metrics columns like `duration_seconds`, `items_processed`, `memory_used_mb`
8. Create appropriate indexes for efficient querying
9. Set up Row Level Security policies to restrict access to admin users only

The implementation should be in SQL format ready to execute in Supabase.

```sql
-- Example schema (implement fully):
CREATE TABLE IF NOT EXISTS pipeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  error_details JSONB,
  metadata JSONB,
  duration_seconds FLOAT,
  items_processed INTEGER,
  memory_used_mb FLOAT,
  created_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_history_pipeline_type ON pipeline_history(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_status ON pipeline_history(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_started_at ON pipeline_history(started_at);

-- Set up RLS policies
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_policy ON pipeline_history FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');
```

### Prompt 8.1.2: Implement Pipeline History Logging Service (Lovable AI) 🔴 Not Started

**Context**: We need a service to log pipeline operations to the pipeline_history table we just created. This service should be used by all pipeline operations.

**Prompt**:
Create a TypeScript service for logging pipeline operations to the pipeline_history table. This service should:

1. Review the existing pipeline operations in the codebase (especially in `useGitHubSync.ts` and `usePipelineControls.ts`)
2. Create a new service file `src/services/pipelineHistoryService.ts`
3. Implement functions for:
   - Starting a pipeline operation record
   - Updating a pipeline operation with completion or error information
   - Retrieving pipeline history with filtering and pagination
4. Use the Supabase client for database operations
5. Include proper TypeScript type definitions
6. Add error handling and ensure all operations are properly logged
7. Create a React Query hook that consumes this service for the UI

The implementation should be designed to integrate with existing pipeline operations with minimal changes to their code.

```typescript
// Example implementation (implement fully):
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';

export type PipelineType = 'github_sync' | 'data_processing' | 'enrichment' | 'ai_analysis';
export type PipelineStatus = 'in_progress' | 'success' | 'failed' | 'cancelled';

export interface PipelineHistoryRecord {
  id: string;
  pipeline_type: PipelineType;
  started_at: string;
  completed_at?: string;
  status: PipelineStatus;
  error_details?: any;
  metadata?: any;
  duration_seconds?: number;
  items_processed?: number;
  memory_used_mb?: number;
  created_by: string;
}

// Function to start a pipeline operation
export async function startPipelineOperation(
  pipelineType: PipelineType,
  user: User,
  initialMetadata: any = {}
): Promise<string> {
  // Implementation
}

// Function to complete a pipeline operation
export async function completePipelineOperation(
  id: string,
  status: PipelineStatus,
  metrics: {
    itemsProcessed?: number;
    memoryUsedMb?: number;
    errorDetails?: any;
    additionalMetadata?: any;
  } = {}
): Promise<void> {
  // Implementation
}

// Function to get pipeline history with filtering and pagination
export async function getPipelineHistory(
  filters: {
    pipelineTypes?: PipelineType[];
    status?: PipelineStatus[];
    dateRange?: { start: Date; end: Date };
  } = {},
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 10 }
): Promise<{ data: PipelineHistoryRecord[]; totalCount: number }> {
  // Implementation
}
```

### Prompt 8.1.3: Create Pipeline History UI Component (Lovable AI) 🔴 Not Started

**Context**: We need a UI component to display the pipeline history in the admin dashboard. This component should allow filtering, sorting, and pagination of pipeline history records.

**Prompt**:
Create a React component for displaying pipeline operation history in the admin dashboard. The component should:

1. Review existing admin dashboard components like `PipelineStats` to maintain consistent styling
2. Create a new component file `src/components/admin/PipelineHistory.tsx`
3. Use the pipeline history service created in the previous task
4. Include UI controls for:
   - Filtering by pipeline type, status, and date range
   - Sorting by various columns
   - Pagination
5. Display pipeline history records in a table with:
   - Pipeline type with appropriate icon
   - Start and end timestamps with duration
   - Status with color-coded indicators
   - Performance metrics like items processed
   - Actions column with buttons to view details or retry failed operations
6. Include a detail view/modal for seeing complete information about a selected history record
7. Show a visual indicator for in-progress operations
8. Handle loading, error, and empty states appropriately
9. Use React Query for data fetching and state management
10. Be fully responsive

The component should integrate visually and functionally with the existing admin dashboard.

### Prompt 8.1.4: Implement Admin Actions Audit Trail (Lovable AI) 🔴 Not Started

**Context**: We need to track all administrative actions performed in the system for accountability and troubleshooting. This is separate from pipeline history and focuses on user-initiated actions.

**Prompt**:
Create a complete audit trail system for tracking admin actions in the application. Implement:

1. Review the existing admin dashboard functionality to identify all actions that should be audited
2. Create a database table for storing audit records:
   ```sql
   CREATE TABLE IF NOT EXISTS admin_audit_log (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     action TEXT NOT NULL,
     entity_type TEXT NOT NULL,
     entity_id TEXT,
     previous_state JSONB,
     new_state JSONB,
     performed_by UUID REFERENCES auth.users(id) NOT NULL,
     performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     client_ip TEXT,
     user_agent TEXT
   );
   
   -- Add indexes and RLS policies
   ```

3. Create an audit service in `src/services/auditService.ts`:
   ```typescript
   // Function signatures
   export async function logAdminAction(params: {
     action: string;
     entityType: string;
     entityId?: string;
     previousState?: any;
     newState?: any;
     clientIp?: string;
     userAgent?: string;
   }): Promise<void>;
   
   export async function getAuditLogs(filters, pagination): Promise<{ data: AuditLogRecord[]; totalCount: number }>;
   ```

4. Create a React component `src/components/admin/AuditTrail.tsx` for displaying the audit logs with:
   - Filterable, sortable table of audit records
   - Detail view for examining changes
   - Export functionality
   - Pagination

5. Update all admin actions throughout the app to use the audit service

The implementation should be thorough but minimally invasive to existing code.

## Story 8.2: Advanced Monitoring Dashboard

### Prompt 8.2.1: Implement Real-time Metrics Collection (Lovable AI) 🔴 Not Started

**Context**: We need to implement real-time metrics collection for pipeline operations, database performance, and system utilization to power an advanced monitoring dashboard.

**Prompt**:
Create a comprehensive metrics collection system for the admin dashboard. Implement:

1. Review existing monitoring capabilities in the application
2. Create a database table for storing metrics:
   ```sql
   CREATE TABLE IF NOT EXISTS system_metrics (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     metric_type TEXT NOT NULL,
     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     value FLOAT NOT NULL,
     dimensions JSONB,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   
   -- Create time-series optimized index
   CREATE INDEX IF NOT EXISTS idx_system_metrics_time_series 
   ON system_metrics(metric_type, timestamp DESC);
   
   -- Add RLS policies
   ```

3. Create a metrics service in `src/services/metricsService.ts`:
   ```typescript
   export async function recordMetric(
     metricType: string,
     value: number,
     dimensions: Record<string, string | number> = {}
   ): Promise<void>;
   
   export async function getMetrics(
     metricType: string,
     timeRange: { start: Date; end: Date },
     aggregation: 'minute' | 'hour' | 'day' = 'hour'
   ): Promise<MetricDataPoint[]>;
   ```

4. Instrument key application areas:
   - Pipeline operations (time per stage, items processed)
   - Database queries (query times, row counts)
   - API calls (response times, error rates)
   - System resources (memory usage, processing time)

5. Create helper utilities for common metrics recording patterns

The implementation should be non-invasive and have minimal performance impact.

### Prompt 8.2.2: Build Metrics Visualization Components (Lovable AI) 🔴 Not Started

**Context**: We need visualization components for the metrics collected in the previous task. These components should display real-time and historical metrics in an intuitive way.

**Prompt**:
Create React components for visualizing system metrics in the admin dashboard. Implement:

1. Review existing data visualization patterns in the application
2. Create a series of visualization components in `src/components/admin/metrics/`:
   - `TimeSeriesChart.tsx`: For displaying metrics over time with zooming capability
   - `MetricsGauge.tsx`: For displaying current values with thresholds
   - `HeatMapChart.tsx`: For visualizing patterns across time dimensions
   - `MetricsComparison.tsx`: For comparing metrics across different time periods
   - `MetricsSummary.tsx`: For displaying key statistics and trends

3. Create a metrics dashboard page/component that arranges these visualizations in a logical way
4. Implement real-time updates using React Query's refetchInterval
5. Add controls for selecting metrics, time ranges, and aggregation levels
6. Include appropriate loading, error, and empty states
7. Ensure all components are responsive
8. Add tooltip explanations for metrics

The components should use Recharts for visualization and follow the application's existing design patterns.

### Prompt 8.2.3: Develop Alerting System for Pipeline Issues (Lovable AI) 🔴 Not Started

**Context**: We need an alerting system to notify administrators of issues with pipeline operations, performance problems, or data quality concerns.

**Prompt**:
Create an alerting system for the admin dashboard that detects and notifies administrators of issues. Implement:

1. Review existing notification systems in the application
2. Create a database structure for alert definitions and triggered alerts:
   ```sql
   -- Alert definitions table
   CREATE TABLE IF NOT EXISTS alert_definitions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     description TEXT,
     metric_type TEXT NOT NULL,
     condition_type TEXT NOT NULL,
     threshold FLOAT NOT NULL,
     enabled BOOLEAN NOT NULL DEFAULT TRUE,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ
   );
   
   -- Triggered alerts table
   CREATE TABLE IF NOT EXISTS triggered_alerts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     definition_id UUID REFERENCES alert_definitions(id) NOT NULL,
     triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     value FLOAT NOT NULL,
     resolved_at TIMESTAMPTZ,
     resolved_by UUID REFERENCES auth.users(id),
     notification_sent BOOLEAN NOT NULL DEFAULT FALSE
   );
   ```

3. Create an alert service in `src/services/alertService.ts`:
   ```typescript
   // Functions for managing alert definitions
   export async function createAlertDefinition(alertDef: AlertDefinitionInput): Promise<string>;
   export async function updateAlertDefinition(id: string, updates: Partial<AlertDefinitionInput>): Promise<void>;
   export async function deleteAlertDefinition(id: string): Promise<void>;
   export async function getAlertDefinitions(): Promise<AlertDefinition[]>;
   
   // Functions for checking and managing triggered alerts
   export async function checkMetricAgainstAlerts(metricType: string, value: number): Promise<void>;
   export async function getActiveAlerts(): Promise<TriggeredAlert[]>;
   export async function resolveAlert(id: string): Promise<void>;
   ```

4. Create React components for alert management:
   - `AlertDefinitions.tsx`: For creating and managing alert definitions
   - `ActiveAlerts.tsx`: For viewing and resolving active alerts
   - `AlertHistory.tsx`: For reviewing past alerts

5. Implement a notification system for delivering alerts to administrators

The alerting system should be flexible enough to handle different types of metrics and conditions.

### Prompt 8.2.4: Create Data Quality Monitoring (Lovable AI) 🔴 Not Started

**Context**: We need to implement monitoring for data quality issues such as missing data, inconsistencies, or validation failures to ensure the integrity of our GitHub data.

**Prompt**:
Create a data quality monitoring system for the admin dashboard. Implement:

1. Review existing data structures and validation patterns
2. Define data quality metrics and checks:
   - Completeness: Percentage of required fields that are filled
   - Consistency: Data values that match expected patterns or relationships
   - Timeliness: Age of data relative to expected update frequency
   - Accuracy: Validation against expected ranges or formats

3. Create a database table for storing data quality metrics:
   ```sql
   CREATE TABLE IF NOT EXISTS data_quality_metrics (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     entity_type TEXT NOT NULL,
     check_type TEXT NOT NULL,
     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     pass_rate FLOAT NOT NULL,
     records_checked INTEGER NOT NULL,
     records_failed INTEGER NOT NULL,
     details JSONB,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

4. Create a data quality service in `src/services/dataQualityService.ts`:
   ```typescript
   export async function runDataQualityCheck(
     entityType: string,
     checkType: string,
     query: string,
     failureCondition: string
   ): Promise<DataQualityResult>;
   
   export async function getDataQualityTrends(
     entityType: string,
     checkType?: string,
     timeRange?: { start: Date; end: Date }
   ): Promise<DataQualityTrend[]>;
   ```

5. Create React components for data quality monitoring:
   - `DataQualityDashboard.tsx`: Overview of data quality metrics
   - `DataQualityDetails.tsx`: Detailed view of quality issues
   - `DataQualityTrends.tsx`: Visualization of quality trends over time

6. Integrate data quality checks into the pipeline process

The implementation should provide actionable insights into data quality issues.

## Story 8.3: Enhanced Error Handling & Recovery

### Prompt 8.3.1: Implement Comprehensive Error Tracking (Lovable AI) 🔴 Not Started

**Context**: We need to enhance error tracking throughout the application with better context, categorization, and metadata to facilitate diagnostics and recovery.

**Prompt**:
Create a comprehensive error tracking system for the admin dashboard. Implement:

1. Review current error handling approaches in the application
2. Create a database table for error logging:
   ```sql
   CREATE TABLE IF NOT EXISTS error_logs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     error_type TEXT NOT NULL,
     source TEXT NOT NULL,
     message TEXT NOT NULL,
     stack_trace TEXT,
     context JSONB,
     severity TEXT NOT NULL,
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     resolved_at TIMESTAMPTZ,
     resolution_notes TEXT
   );
   
   -- Add indexes
   CREATE INDEX IF NOT EXISTS idx_error_logs_type_source ON error_logs(error_type, source);
   CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
   CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
   ```

3. Create an error service in `src/services/errorService.ts`:
   ```typescript
   export enum ErrorSeverity {
     LOW = 'low',
     MEDIUM = 'medium',
     HIGH = 'high',
     CRITICAL = 'critical'
   }
   
   export async function logError(params: {
     errorType: string;
     source: string;
     message: string;
     stackTrace?: string;
     context?: any;
     severity: ErrorSeverity;
     userId?: string;
   }): Promise<string>;
   
   export async function resolveError(id: string, resolutionNotes?: string): Promise<void>;
   
   export async function getErrors(
     filters: {
       errorTypes?: string[];
       sources?: string[];
       severities?: ErrorSeverity[];
       resolved?: boolean;
       dateRange?: { start: Date; end: Date };
     },
     pagination: { page: number; pageSize: number }
   ): Promise<{ data: ErrorLog[]; totalCount: number }>;
   ```

4. Create a utility for wrapping functions with error logging:
   ```typescript
   export function withErrorLogging<T, Args extends any[]>(
     fn: (...args: Args) => Promise<T>,
     options: {
       source: string;
       errorType: string;
       severity: ErrorSeverity;
       contextFromArgs?: (...args: Args) => any;
     }
   ): (...args: Args) => Promise<T>;
   ```

5. Apply error logging to key application areas, especially pipeline operations

The implementation should be easily applicable to existing code with minimal changes.

### Prompt 8.3.2: Build Error Diagnostics Interface (Lovable AI) 🔴 Not Started

**Context**: We need a UI for administrators to diagnose and troubleshoot errors recorded by the error tracking system created in the previous task.

**Prompt**:
Create React components for error diagnostics in the admin dashboard. Implement:

1. Review existing admin dashboard components to maintain consistent styling
2. Create an error diagnostics page/component with:
   - Filterable, sortable table of errors
   - Severity indicators and status badges
   - Grouping of related errors
   - Pagination and search functionality

3. Create a detailed error view component with:
   - Complete error details including stack trace
   - Context information in a readable format
   - Timeline of occurrences for recurring errors
   - Related system metrics at the time of error
   - Actions for resolving or ignoring errors

4. Add visualization components for error trends and patterns:
   - Error occurrence over time
   - Distribution by type and source
   - Impact assessment

5. Implement real-time updates for new errors

The interface should make it easy to identify, understand, and address critical issues quickly.

### Prompt 8.3.3: Develop Automated Recovery Mechanisms (Lovable AI) 🔴 Not Started

**Context**: We need automated recovery mechanisms for common errors to reduce administrative overhead and improve system resilience.

**Prompt**:
Create an automated recovery system for handling common errors in pipeline operations. Implement:

1. Review common error patterns in the application, especially in pipeline processes
2. Create a database table for recovery configurations:
   ```sql
   CREATE TABLE IF NOT EXISTS recovery_configurations (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     error_pattern TEXT NOT NULL,
     max_retries INTEGER NOT NULL DEFAULT 3,
     retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
     recovery_action TEXT NOT NULL,
     action_parameters JSONB,
     enabled BOOLEAN NOT NULL DEFAULT TRUE,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ
   );
   ```

3. Create a recovery service in `src/services/recoveryService.ts`:
   ```typescript
   export enum RecoveryActionType {
     RETRY = 'retry',
     PARTIAL_RETRY = 'partial_retry',
     ROLLBACK = 'rollback',
     SKIP = 'skip',
     CUSTOM = 'custom'
   }
   
   export async function registerRecoveryConfiguration(config: RecoveryConfigInput): Promise<string>;
   
   export async function attemptRecovery(
     error: Error,
     context: {
       source: string;
       operation: string;
       data?: any;
     }
   ): Promise<{
     successful: boolean;
     action: RecoveryActionType;
     message: string;
   }>;
   
   export async function getRecoveryConfigurations(): Promise<RecoveryConfiguration[]>;
   ```

4. Create React components for managing recovery configurations:
   - `RecoveryConfigurations.tsx`: For viewing and editing recovery rules
   - `RecoveryHistory.tsx`: For viewing the history of recovery attempts

5. Integrate the recovery system with the pipeline operations:
   - Add recovery attempts to error handling
   - Record recovery attempts in the pipeline history
   - Notify administrators of successful or failed recoveries

The implementation should balance automation with safety, allowing administrators to configure the level of automated intervention.

### Prompt 8.3.4: Add Error Analytics and Reporting (Lovable AI) 🔴 Not Started

**Context**: We need analytics and reporting capabilities for errors to identify trends, common issues, and areas for improvement.

**Prompt**:
Create error analytics and reporting capabilities for the admin dashboard. Implement:

1. Define key error metrics and KPIs:
   - Error rate by source/component
   - Mean time to resolution
   - Impact severity distribution
   - Most common error types
   - Recovery success rate

2. Create a database view for error analytics:
   ```sql
   CREATE OR REPLACE VIEW error_analytics AS
   SELECT
     date_trunc('day', created_at) AS date,
     error_type,
     source,
     severity,
     COUNT(*) AS occurrence_count,
     AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) AS avg_resolution_time_seconds,
     COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) AS resolved_count
   FROM
     error_logs
   GROUP BY
     date_trunc('day', created_at),
     error_type,
     source,
     severity;
   ```

3. Create an error analytics service in `src/services/errorAnalyticsService.ts`:
   ```typescript
   export async function getErrorTrends(
     timeRange: { start: Date; end: Date },
     groupBy: 'day' | 'week' | 'month' = 'day'
   ): Promise<ErrorTrend[]>;
   
   export async function getErrorDistribution(
     dimension: 'type' | 'source' | 'severity',
     timeRange?: { start: Date; end: Date }
   ): Promise<ErrorDistribution[]>;
   
   export async function getErrorMetrics(
     timeRange?: { start: Date; end: Date }
   ): Promise<ErrorMetrics>;
   ```

4. Create React components for error analytics:
   - `ErrorTrends.tsx`: For visualizing error trends over time
   - `ErrorDistribution.tsx`: For displaying error distributions
   - `ErrorMetrics.tsx`: For showing key error metrics
   - `ErrorReport.tsx`: For generating comprehensive error reports

5. Add export functionality for error reports

The analytics should provide actionable insights for improving system reliability.

## Story 8.4: User Management for Admin Access

### Prompt 8.4.1: Create Admin Roles and Permissions System (Lovable AI) 🔴 Not Started

**Context**: We need a role-based access control system for the admin dashboard to allow different levels of administrative access for different users.

**Prompt**:
Create a role-based access control system for the admin dashboard. Implement:

1. Define a role hierarchy and permission structure:
   - Roles: Super Admin, System Admin, Data Admin, Read-only Admin
   - Permission categories: Pipeline Control, Data Management, User Management, System Configuration, Analytics

2. Create database tables for roles and permissions:
   ```sql
   -- Roles table
   CREATE TABLE IF NOT EXISTS admin_roles (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL UNIQUE,
     description TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ
   );
   
   -- Permissions table
   CREATE TABLE IF NOT EXISTS admin_permissions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL UNIQUE,
     description TEXT,
     category TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   
   -- Role-Permission mapping
   CREATE TABLE IF NOT EXISTS role_permissions (
     role_id UUID REFERENCES admin_roles(id) NOT NULL,
     permission_id UUID REFERENCES admin_permissions(id) NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (role_id, permission_id)
   );
   
   -- User-Role mapping
   CREATE TABLE IF NOT EXISTS user_roles (
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     role_id UUID REFERENCES admin_roles(id) NOT NULL,
     assigned_by UUID REFERENCES auth.users(id),
     assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (user_id, role_id)
   );
   ```

3. Create initial seed data for roles and permissions

4. Create a permissions service in `src/services/permissionsService.ts`:
   ```typescript
   export async function getUserPermissions(userId: string): Promise<string[]>;
   
   export async function checkPermission(userId: string, permission: string): Promise<boolean>;
   
   export async function assignRoleToUser(userId: string, roleId: string): Promise<void>;
   
   export async function removeRoleFromUser(userId: string, roleId: string): Promise<void>;
   
   export async function getRoles(): Promise<AdminRole[]>;
   
   export async function getPermissions(): Promise<AdminPermission[]>;
   ```

5. Create a React hook for permission checking:
   ```typescript
   export function usePermission(permission: string): boolean {
     // Implementation
   }
   ```

6. Update existing admin components to use permission checks

The implementation should be comprehensive but flexible, allowing for future extensions.

### Prompt 8.4.2: Build User Management Interface (Lovable AI) 🔴 Not Started

**Context**: We need a user management interface for administrators to manage user accounts, roles, and permissions.

**Prompt**:
Create React components for user management in the admin dashboard. Implement:

1. Review existing admin dashboard components to maintain consistent styling
2. Create a user management page/component with:
   - User listing with search and filtering
   - Role assignment interface
   - User status management (active/inactive)
   - Pagination and sorting

3. Create a role management component with:
   - Role listing and details
   - Permission assignment to roles
   - Role creation and editing

4. Create a user invitation component for adding new admin users:
   - Email invitation form
   - Role pre-assignment
   - Invitation tracking

5. Add audit logging for all user management actions

The interface should be intuitive and secure, with appropriate confirmation dialogs for sensitive actions.

### Prompt 8.4.3: Implement Access Control Throughout Admin Features (Lovable AI) 🔴 Not Started

**Context**: We need to apply the roles and permissions system to all admin features to enforce access control.

**Prompt**:
Implement access control throughout the admin dashboard features. This task involves:

1. Review all admin components and identify permission requirements
2. Create a permission configuration file that maps components and actions to required permissions:
   ```typescript
   // src/config/adminPermissions.ts
   export const ADMIN_PERMISSIONS = {
     PIPELINE: {
       VIEW: 'pipeline:view',
       CONTROL: 'pipeline:control',
       CONFIGURE: 'pipeline:configure'
     },
     DATA: {
       VIEW: 'data:view',
       EDIT: 'data:edit',
       DELETE: 'data:delete'
     },
     USERS: {
       VIEW: 'users:view',
       MANAGE: 'users:manage',
       ASSIGN_ROLES: 'users:assign_roles'
     },
     // Additional permission categories
   };
   ```

3. Create a higher-order component for permission-based rendering:
   ```typescript
   export function withPermission<P>(
     Component: React.ComponentType<P>,
     permission: string,
     fallback?: React.ReactNode
   ): React.FC<P>;
   ```

4. Create UI components for permission-based rendering:
   ```typescript
   export const PermissionGuard: React.FC<{
     permission: string;
     fallback?: React.ReactNode;
     children: React.ReactNode;
   }>;
   ```

5. Apply permission checks to all admin routes and components:
   - Add route guards to admin pages
   - Use PermissionGuard for conditional rendering of UI elements
   - Apply permission checks to all action handlers

6. Update the UI to hide or disable features based on permissions

7. Add informative feedback when a user attempts an unauthorized action

The implementation should be thorough but maintainable, centralizing permission logic where possible.

### Prompt 8.4.4: Add Authentication Enhancements for Admin Access (Lovable AI) 🔴 Not Started

**Context**: We need enhanced authentication for admin access, including stronger security measures, session management, and additional verification for sensitive operations.

**Prompt**:
Implement enhanced authentication for admin access. This task involves:

1. Review current authentication implementation
2. Create a session management system for admin users:
   ```sql
   CREATE TABLE IF NOT EXISTS admin_sessions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     expires_at TIMESTAMPTZ NOT NULL,
     last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     ip_address TEXT,
     user_agent TEXT,
     is_active BOOLEAN NOT NULL DEFAULT TRUE
   );
   ```

3. Create an admin authentication service in `src/services/adminAuthService.ts`:
   ```typescript
   export async function loginAdmin(email: string, password: string): Promise<{
     user: User;
     session: AdminSession;
   }>;
   
   export async function logoutAdmin(): Promise<void>;
   
   export async function requireAdditionalVerification(
     actionType: 'sensitive_data' | 'user_management' | 'system_configuration'
   ): Promise<boolean>;
   
   export async function verifyAdminAction(
     actionType: string,
     verificationCode: string
   ): Promise<boolean>;
   ```

4. Create React components for enhanced admin authentication:
   - `AdminLogin.tsx`: For secure admin login
   - `SessionManagement.tsx`: For viewing and managing active sessions
   - `ActionVerification.tsx`: For additional verification of sensitive actions

5. Implement security enhancements:
   - Inactivity timeout for admin sessions
   - IP restriction options
   - Failed login attempt tracking
   - Additional verification for sensitive operations

The implementation should balance security with usability, providing strong protection without excessive friction.

## Story 8.5: Pipeline Configuration & Scheduling

### Prompt 8.5.1: Create Pipeline Configuration System (Lovable AI) 🔴 Not Started

**Context**: We need a flexible configuration system for pipeline operations to allow administrators to customize pipeline behavior without code changes.

**Prompt**:
Create a configuration system for pipeline operations. Implement:

1. Review existing pipeline operations to identify configurable parameters
2. Create a database structure for storing configurations:
   ```sql
   CREATE TABLE IF NOT EXISTS pipeline_configurations (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     pipeline_type TEXT NOT NULL,
     configuration_name TEXT NOT NULL,
     is_active BOOLEAN NOT NULL DEFAULT FALSE,
     parameters JSONB NOT NULL,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ,
     version INTEGER NOT NULL DEFAULT 1,
     UNIQUE(pipeline_type, configuration_name, version)
   );
   ```

3. Create a configuration service in `src/services/pipelineConfigService.ts`:
   ```typescript
   export async function createConfiguration(
     pipelineType: string,
     name: string,
     parameters: Record<string, any>
   ): Promise<string>;
   
   export async function updateConfiguration(
     id: string,
     updates: Partial<{
       name: string;
       parameters: Record<string, any>;
       isActive: boolean;
     }>
   ): Promise<void>;
   
   export async function getActiveConfiguration(
     pipelineType: string
   ): Promise<PipelineConfiguration | null>;
   
   export async function getConfigurationHistory(
     pipelineType: string,
     name: string
   ): Promise<PipelineConfiguration[]>;
   ```

4. Define schema validation for pipeline parameters:
   ```typescript
   // Configuration schemas for each pipeline type
   export const PIPELINE_CONFIG_SCHEMAS = {
     github_sync: z.object({
       batch_size: z.number().min(1).max(100),
       include_forks: z.boolean(),
       include_archived: z.boolean(),
       max_repositories: z.number().optional(),
       // Additional parameters
     }),
     
     data_processing: z.object({
       // Processing parameters
     }),
     
     // Additional pipeline types
   };
   ```

5. Update pipeline operations to use configurations

The configuration system should be flexible, validated, and versioned to ensure safe changes.

### Prompt 8.5.2: Develop Configuration Interface (Lovable AI) 🔴 Not Started

**Context**: We need a user interface for administrators to manage pipeline configurations created in the previous task.

**Prompt**:
Create React components for managing pipeline configurations in the admin dashboard. Implement:

1. Review existing admin dashboard components to maintain consistent styling
2. Create a configuration management page/component with:
   - List of available pipeline types and their configurations
   - Configuration editing interface with validation
   - Version history and comparison
   - Activation/deactivation controls

3. Create a configuration editor component with:
   - Form fields based on pipeline type
   - Inline validation with error messages
   - Default values and descriptions
   - JSON view option for advanced users

4. Create a configuration testing component that allows:
   - Testing a configuration without activating it
   - Viewing test results
   - Comparing results with current active configuration

5. Add configuration export/import functionality

The interface should be user-friendly with appropriate guidance and validation to prevent errors.

### Prompt 8.5.3: Implement Pipeline Scheduling (Lovable AI) 🔴 Not Started

**Context**: We need scheduling capabilities for pipeline operations to run automatically at specified times or intervals.

**Prompt**:
Create a scheduling system for pipeline operations. Implement:

1. Create a database structure for schedules:
   ```sql
   CREATE TABLE IF NOT EXISTS pipeline_schedules (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     pipeline_type TEXT NOT NULL,
     schedule_name TEXT NOT NULL,
     cron_expression TEXT NOT NULL,
     configuration_id UUID REFERENCES pipeline_configurations(id),
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     last_run_at TIMESTAMPTZ,
     next_run_at TIMESTAMPTZ,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ,
     time_zone TEXT NOT NULL DEFAULT 'UTC'
   );
   ```

2. Create a scheduling service in `src/services/schedulingService.ts`:
   ```typescript
   export async function createSchedule(params: {
     pipelineType: string;
     name: string;
     cronExpression: string;
     configurationId?: string;
     timeZone?: string;
   }): Promise<string>;
   
   export async function updateSchedule(
     id: string,
     updates: Partial<{
       name: string;
       cronExpression: string;
       configurationId: string;
       isActive: boolean;
       timeZone: string;
     }>
   ): Promise<void>;
   
   export async function getSchedules(
     pipelineType?: string
   ): Promise<PipelineSchedule[]>;
   
   export async function calculateNextRunTime(
     cronExpression: string,
     timeZone: string = 'UTC'
   ): Promise<Date>;
   ```

3. Create a cron job runner that:
   - Checks for due schedules
   - Triggers pipeline operations with specified configurations
   - Updates last_run_at and next_run_at values

4. Create React components for schedule management:
   - `ScheduleList.tsx`: For viewing all schedules
   - `ScheduleEditor.tsx`: For creating and editing schedules
   - `ScheduleHistory.tsx`: For viewing schedule execution history

5. Add cron expression builder UI with:
   - Visual cron expression building
   - Human-readable descriptions
   - Timezone handling
   - Validation and conflict detection

The scheduling system should be reliable, with appropriate error handling and notification for failed scheduled runs.

### Prompt 8.5.4: Add Notification System for Scheduled Runs (Lovable AI) 🔴 Not Started

**Context**: We need a notification system to keep administrators informed about scheduled pipeline operations.

**Prompt**:
Create a notification system for scheduled pipeline operations. Implement:

1. Create a database structure for notifications and preferences:
   ```sql
   -- Notification preferences
   CREATE TABLE IF NOT EXISTS notification_preferences (
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     notification_type TEXT NOT NULL,
     enabled BOOLEAN NOT NULL DEFAULT TRUE,
     channels JSONB NOT NULL DEFAULT '["app"]',
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ,
     PRIMARY KEY (user_id, notification_type)
   );
   
   -- Notifications
   CREATE TABLE IF NOT EXISTS notifications (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     type TEXT NOT NULL,
     title TEXT NOT NULL,
     message TEXT NOT NULL,
     link TEXT,
     read_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. Create a notification service in `src/services/notificationService.ts`:
   ```typescript
   export enum NotificationType {
     SCHEDULE_UPCOMING = 'schedule_upcoming',
     SCHEDULE_STARTED = 'schedule_started',
     SCHEDULE_COMPLETED = 'schedule_completed',
     SCHEDULE_FAILED = 'schedule_failed'
   }
   
   export enum NotificationChannel {
     APP = 'app',
     EMAIL = 'email',
     SLACK = 'slack'
   }
   
   export async function sendNotification(params: {
     userId: string;
     type: NotificationType;
     title: string;
     message: string;
     link?: string;
   }): Promise<void>;
   
   export async function getUserNotifications(
     userId: string,
     includeRead: boolean = false,
     limit: number = 20
   ): Promise<Notification[]>;
   
   export async function markNotificationAsRead(
     id: string
   ): Promise<void>;
   
   export async function updateNotificationPreferences(
     userId: string,
     preferences: Record<NotificationType, {
       enabled: boolean;
       channels: NotificationChannel[];
     }>
   ): Promise<void>;
   ```

3. Create React components for notifications:
   - `NotificationCenter.tsx`: For displaying notifications
   - `NotificationPreferences.tsx`: For managing notification settings

4. Integrate notifications with pipeline scheduling:
   - Pre-run notifications for upcoming scheduled runs
   - Start notifications when scheduled runs begin
   - Completion notifications with summary
   - Failure notifications with error details

5. Implement real-time notifications for the admin dashboard

The notification system should be non-intrusive but informative, with appropriate priority levels for different types of notifications.

## Story 8.6: Enhanced Data Management Tools

### Prompt 8.6.1: Implement Data Validation and Repair Tools (Lovable AI) 🔴 Not Started

**Context**: We need tools for validating and repairing data integrity issues in the GitHub data stored in our database.

**Prompt**:
Create data validation and repair tools for the admin dashboard. Implement:

1. Define key data validation rules:
   - Entity relationships (e.g., commits must have valid repository references)
   - Required fields are present and non-null
   - Data format validation (e.g., dates, URLs)
   - Business rule validation (e.g., merge request status consistency)

2. Create a validation service in `src/services/dataValidationService.ts`:
   ```typescript
   export interface ValidationRule {
     id: string;
     entityType: string;
     name: string;
     description: string;
     severity: 'low' | 'medium' | 'high' | 'critical';
     validationQuery: string;
   }
   
   export async function runValidation(
     ruleId: string
   ): Promise<{
     ruleId: string;
     passed: boolean;
     failedRecords: number;
     totalRecords: number;
     sampleFailures: any[];
   }>;
   
   export async function runAllValidations(
     entityType?: string
   ): Promise<ValidationResult[]>;
   
   export async function repairData(
     ruleId: string,
     options?: {
       dryRun: boolean;
       limit?: number;
     }
   ): Promise<{
     recordsFixed: number;
     recordsSkipped: number;
     details: any[];
   }>;
   ```

3. Create predefined validation rules for common issues

4. Create React components for data validation:
   - `DataValidationDashboard.tsx`: Overview of validation status
   - `ValidationRulesList.tsx`: For viewing and running validation rules
   - `ValidationResults.tsx`: For viewing validation results
   - `DataRepairTool.tsx`: For repairing data issues

5. Implement automatic repair actions for common issues

The tools should be powerful but safe, with appropriate safeguards for data-modifying operations.

### Prompt 8.6.2: Develop Data Cleanup Utilities (Lovable AI) 🔴 Not Started

**Context**: We need utilities for cleaning up unnecessary or duplicate data to maintain database health and performance.

**Prompt**:
Create data cleanup utilities for the admin dashboard. Implement:

1. Define key cleanup operations:
   - Duplicate detection and merging
   - Orphaned record cleanup
   - Old data archiving
   - Selective data purging

2. Create a cleanup service in `src/services/dataCleanupService.ts`:
   ```typescript
   export interface CleanupOperation {
     id: string;
     name: string;
     description: string;
     entityType: string;
     impact: 'low' | 'medium' | 'high';
     query: string;
     requiresConfirmation: boolean;
   }
   
   export async function analyzeCleanupOperation(
     operationId: string
   ): Promise<{
     recordsAffected: number;
     spaceFreed: number;
     sampleRecords: any[];
   }>;
   
   export async function executeCleanupOperation(
     operationId: string,
     options?: {
       dryRun: boolean;
       limit?: number;
     }
   ): Promise<{
     recordsProcessed: number;
     spaceFreed: number;
     details: any[];
   }>;
   
   export async function getAllCleanupOperations(): Promise<CleanupOperation[]>;
   ```

3. Create predefined cleanup operations for common scenarios

4. Create React components for data cleanup:
   - `DataCleanupDashboard.tsx`: Overview of cleanup options
   - `CleanupOperationsList.tsx`: For viewing and running cleanup operations
   - `CleanupResults.tsx`: For viewing cleanup results
   - `DataArchiveTool.tsx`: For archiving old data

5. Implement data export functionality for backup before cleanup

The utilities should prioritize safety, with clear previews of affected data and confirmation prompts for destructive operations.

### Prompt 8.6.3: Create Database Optimization Tools (Lovable AI) 🔴 Not Started

**Context**: We need tools for optimizing database performance, including index management, query analysis, and table optimization.

**Prompt**:
Create database optimization tools for the admin dashboard. Implement:

1. Define key optimization areas:
   - Index usage analysis
   - Query performance monitoring
   - Table and index size analysis
   - Optimization recommendations

2. Create a database optimization service in `src/services/dbOptimizationService.ts`:
   ```typescript
   export async function analyzeIndexUsage(): Promise<{
     indices: Array<{
       tableName: string;
       indexName: string;
       indexSize: string;
       scanCount: number;
       lastUsed: string;
     }>;
   }>;
   
   export async function analyzeTableSizes(): Promise<{
     tables: Array<{
       tableName: string;
       totalSize: string;
       indexSize: string;
       rowCount: number;
       lastVacuum: string;
     }>;
   }>;
   
   export async function getSlowQueries(
     limit: number = 10
   ): Promise<{
     queries: Array<{
       query: string;
       avgTime: number;
       calls: number;
       rows: number;
     }>;
   }>;
   
   export async function getOptimizationRecommendations(): Promise<{
     recommendations: Array<{
       type: 'index' | 'vacuum' | 'configuration';
       description: string;
       impact: 'low' | 'medium' | 'high';
       sql?: string;
     }>;
   }>;
   ```

3. Create React components for database optimization:
   - `DatabaseOptimizationDashboard.tsx`: Overview of database health
   - `IndexAnalysis.tsx`: For viewing and managing indices
   - `QueryPerformance.tsx`: For analyzing slow queries
   - `OptimizationRecommendations.tsx`: For viewing and applying optimization recommendations

4. Implement manual optimization controls:
   - VACUUM
   - REINDEX
   - CREATE INDEX

The tools should provide clear insights into database performance with actionable recommendations.

### Prompt 8.6.4: Add Data Quality Reporting (Lovable AI) 🔴 Not Started

**Context**: We need comprehensive data quality reporting to track and improve the quality of our GitHub data over time.

**Prompt**:
Create a data quality reporting system for the admin dashboard. Implement:

1. Define key data quality metrics:
   - Completeness: Percentage of populated non-null values
   - Accuracy: Conformance to expected patterns and ranges
   - Consistency: Logical consistency between related data
   - Timeliness: Age of data relative to expected update frequency

2. Create a data quality reporting service in `src/services/dataQualityReportService.ts`:
   ```typescript
   export async function generateDataQualityReport(
     entityTypes?: string[]
   ): Promise<{
     overview: {
       overallScore: number;
       metrics: Record<string, number>;
       entityScores: Record<string, number>;
     };
     details: Array<{
       entityType: string;
       metricType: string;
       score: number;
       sampleIssues: any[];
     }>;
   }>;
   
   export async function getDataQualityTrends(
     timeRange: { start: Date; end: Date },
     interval: 'day' | 'week' | 'month' = 'day'
   ): Promise<Array<{
     date: string;
     overall: number;
     metrics: Record<string, number>;
   }>>;
   
   export async function scheduleDataQualityReport(
     schedule: {
       frequency: 'daily' | 'weekly' | 'monthly';
       recipients: string[];
     }
   ): Promise<void>;
   ```

3. Create React components for data quality reporting:
   - `DataQualityDashboard.tsx`: Overview of data quality metrics
   - `DataQualityDetails.tsx`: Detailed view of quality issues by entity type
   - `DataQualityTrends.tsx`: Visualization of quality trends over time
   - `ScheduledReports.tsx`: For managing scheduled quality reports

4. Implement export functionality for reports in various formats

The reporting system should provide actionable insights with clear visualizations of data quality trends.

## Story 8.7: Advanced Analytics & Reporting

### Prompt 8.7.1: Create Custom Report Builder (Lovable AI) 🔴 Not Started

**Context**: We need a flexible custom report builder for administrators to create and save their own reports based on GitHub data.

**Prompt**:
Create a custom report builder for the admin dashboard. Implement:

1. Define a report structure:
   ```typescript
   export interface ReportDefinition {
     id: string;
     name: string;
     description: string;
     query: string;
     parameters: Array<{
       name: string;
       type: 'string' | 'number' | 'date' | 'boolean' | 'select';
       required: boolean;
       defaultValue?: any;
       options?: any[];
     }>;
     visualization: {
       type: 'table' | 'bar' | 'line' | 'pie' | 'metric';
       config: any;
     };
     createdBy: string;
     createdAt: string;
     updatedAt: string;
     isPublic: boolean;
   }
   ```

2. Create a database structure for reports:
   ```sql
   CREATE TABLE IF NOT EXISTS custom_reports (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     description TEXT,
     query TEXT NOT NULL,
     parameters JSONB NOT NULL DEFAULT '[]',
     visualization JSONB NOT NULL,
     created_by UUID REFERENCES auth.users(id) NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ,
     is_public BOOLEAN NOT NULL DEFAULT FALSE
   );
   ```

3. Create a reporting service in `src/services/reportingService.ts`:
   ```typescript
   export async function createReport(
     definition: Omit<ReportDefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
   ): Promise<string>;
   
   export async function updateReport(
     id: string,
     updates: Partial<Omit<ReportDefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
   ): Promise<void>;
   
   export async function getReport(
     id: string
   ): Promise<ReportDefinition>;
   
   export async function getReports(
     options?: {
       createdBy?: string;
       isPublic?: boolean;
     }
   ): Promise<ReportDefinition[]>;
   
   export async function runReport(
     id: string,
     parameters?: Record<string, any>
   ): Promise<{
     data: any[];
     metadata: {
       columns: string[];
       rowCount: number;
       executionTime: number;
     };
   }>;
   ```

4. Create React components for the report builder:
   - `ReportBuilder.tsx`: Visual report design interface
   - `ReportParameterEditor.tsx`: For configuring report parameters
   - `ReportVisualizationEditor.tsx`: For configuring visualizations
   - `SavedReports.tsx`: For accessing saved reports
   - `ReportViewer.tsx`: For viewing and interacting with reports

5. Implement SQL query validation and security checks

The report builder should be powerful yet user-friendly, with appropriate guardrails to prevent performance issues.

### Prompt 8.7.2: Develop Executive Dashboard (Lovable AI) 🔴 Not Started

**Context**: We need an executive dashboard that provides high-level metrics and trends from our GitHub data for strategic decision-making.

**Prompt**:
Create an executive dashboard for high-level GitHub insights. Implement:

1. Define key executive metrics:
   - Development velocity trends
   - Code quality indicators
   - Team performance metrics
   - Project health scores
   - Delivery predictability

2. Create an executive metrics service in `src/services/executiveMetricsService.ts`:
   ```typescript
   export async function getVelocityMetrics(
     timeRange: { start: Date; end: Date },
     interval: 'day' | 'week' | 'month' = 'week'
   ): Promise<Array<{
     date: string;
     commits: number;
     pullRequests: number;
     linesOfCode: number;
     contributors: number;
   }>>;
   
   export async function getCodeQualityMetrics(
     timeRange?: { start: Date; end: Date }
   ): Promise<{
     current: {
       commitQuality: number;
       prQuality: number;
       testCoverage: number;
     };
     trends: Array<{
       date: string;
       commitQuality: number;
       prQuality: number;
       testCoverage: number;
     }>;
   }>;
   
   export async function getTeamPerformanceMetrics(
     timeRange?: { start: Date; end: Date }
   ): Promise<{
     teams: Array<{
       name: string;
       velocity: number;
       quality: number;
       collaboration: number;
     }>;
   }>;
   
   // Additional metric functions
   ```

3. Create React components for the executive dashboard:
   - `ExecutiveDashboard.tsx`: Main dashboard layout
   - `VelocityTrends.tsx`: Visualization of development velocity
   - `QualityIndicators.tsx`: Code quality metrics
   - `TeamPerformance.tsx`: Team performance comparison
   - `ProjectHealth.tsx`: Project health indicators
   - `DeliveryPredictability.tsx`: Delivery metrics and predictions

4. Add time period comparison functionality

5. Implement goal tracking against targets

The executive dashboard should present complex data in an accessible, actionable format with clear visualizations and minimal noise.

### Prompt 8.7.3: Build Export and Integration Capabilities (Lovable AI) 🔴 Not Started

**Context**: We need export and integration capabilities for sharing GitHub analytics data with external systems and generating reports in various formats.

**Prompt**:
Create export and integration capabilities for the admin dashboard. Implement:

1. Define supported export formats:
   - PDF reports
   - CSV/Excel data exports
   - JSON API endpoints
   - Dashboard embedding

2. Create an export service in `src/services/exportService.ts`:
   ```typescript
   export enum ExportFormat {
     PDF = 'pdf',
     CSV = 'csv',
     EXCEL = 'excel',
     JSON = 'json'
   }
   
   export async function exportReport(
     reportId: string,
     format: ExportFormat,
     parameters?: Record<string, any>
   ): Promise<{
     url: string;
     filename: string;
     expiresAt: string;
   }>;
   
   export async function exportDashboard(
     dashboardId: string,
     format: ExportFormat.PDF
   ): Promise<{
     url: string;
     filename: string;
     expiresAt: string;
   }>;
   
   export async function exportData(
     query: string,
     format: ExportFormat,
     parameters?: Record<string, any>
   ): Promise<{
     url: string;
     filename: string;
     expiresAt: string;
   }>;
   ```

3. Create React components for export functionality:
   - `ExportOptions.tsx`: For configuring export settings
   - `ScheduledExports.tsx`: For managing scheduled exports
   - `ApiIntegration.tsx`: For managing API access and tokens

4. Implement integration capabilities:
   - REST API endpoints for data access
   - Webhook notifications for significant events
   - Embeddable dashboard components

5. Add security controls for exports and integrations

The export and integration capabilities should be flexible and secure, with appropriate controls for sensitive data.

### Prompt 8.7.4: Implement Scheduled Reporting (Lovable AI) 🔴 Not Started

**Context**: We need the ability to schedule automated report generation and delivery to keep stakeholders informed without manual effort.

**Prompt**:
Create a scheduled reporting system for the admin dashboard. Implement:

1. Create a database structure for scheduled reports:
   ```sql
   CREATE TABLE IF NOT EXISTS scheduled_reports (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     report_id UUID REFERENCES custom_reports(id) NOT NULL,
     schedule_name TEXT NOT NULL,
     cron_expression TEXT NOT NULL,
     parameters JSONB,
     format TEXT NOT NULL,
     recipients JSONB NOT NULL,
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     last_run_at TIMESTAMPTZ,
     next_run_at TIMESTAMPTZ,
     created_by UUID REFERENCES auth.users(id) NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ,
     time_zone TEXT NOT NULL DEFAULT 'UTC'
   );
   ```

2. Create a scheduled reporting service in `src/services/scheduledReportService.ts`:
   ```typescript
   export interface ReportRecipient {
     type: 'email' | 'slack' | 'teams';
     address: string;
   }
   
   export async function scheduleReport(params: {
     reportId: string;
     name: string;
     cronExpression: string;
     parameters?: Record<string, any>;
     format: ExportFormat;
     recipients: ReportRecipient[];
     timeZone?: string;
   }): Promise<string>;
   
   export async function updateScheduledReport(
     id: string,
     updates: Partial<{
       name: string;
       cronExpression: string;
       parameters: Record<string, any>;
       format: ExportFormat;
       recipients: ReportRecipient[];
       isActive: boolean;
       timeZone: string;
     }>
   ): Promise<void>;
   
   export async function getScheduledReports(): Promise<ScheduledReport[]>;
   
   export async function deleteScheduledReport(id: string): Promise<void>;
   ```

3. Create a scheduled report runner that:
   - Checks for due scheduled reports
   - Generates reports in the specified format
   - Delivers reports to recipients
   - Updates last_run_at and next_run_at values

4. Create React components for scheduled reports:
   - `ScheduledReportsList.tsx`: For viewing all scheduled reports
   - `ScheduleReportForm.tsx`: For creating and editing scheduled reports
   - `ReportDeliveryHistory.tsx`: For viewing delivery history and status

5. Implement delivery methods:
   - Email with attachments
   - Slack/Teams integration
   - Shared URL to report

The scheduled reporting system should be reliable and flexible, with appropriate error handling and delivery confirmation.

## Story 8.8: Performance Optimization & Testing

### Prompt 8.8.1: Implement Performance Optimization (Lovable AI) 🔴 Not Started

**Context**: We need to optimize the admin dashboard for performance, especially when handling large datasets and complex visualizations.

**Prompt**:
Optimize the admin dashboard for performance. Implement:

1. Profile the current admin dashboard to identify performance bottlenecks:
   - Slow-rendering components
   - Inefficient data fetching
   - Render blocking operations
   - Memory leaks

2. Implement React optimizations:
   - Use memo and useCallback for expensive operations
   - Implement virtualization for large lists/tables
   - Use React.lazy and Suspense for code splitting
   - Optimize context providers to prevent unnecessary re-renders

3. Optimize data handling:
   - Implement efficient pagination and infinite scrolling
   - Use data caching strategically
   - Implement request debouncing and throttling
   - Add skeleton loaders for better perceived performance

4. Create a performance monitoring utility in `src/utils/performanceMonitor.ts`:
   ```typescript
   export function measureComponentRender(
     componentName: string
   ): () => void;
   
   export function measureQueryPerformance<T>(
     queryName: string,
     queryFn: () => Promise<T>
   ): Promise<T>;
   
   export function getPerformanceMetrics(): Record<string, {
     count: number;
     totalTime: number;
     averageTime: number;
     minTime: number;
     maxTime: number;
   }>;
   ```

5. Implement database query optimization:
   - Review and optimize common queries
   - Add appropriate indices
   - Use materialized views for complex analytics

The optimizations should be measurable, with clear performance improvements for key operations.

### Prompt 8.8.2: Create Comprehensive Testing Suite (Lovable AI) 🔴 Not Started

**Context**: We need a comprehensive testing suite for the admin dashboard to ensure reliability, catch regressions, and facilitate future development.

**Prompt**:
Create a testing suite for the admin dashboard. Implement:

1. Set up testing infrastructure:
   - Configure test runners and libraries
   - Set up mock services for API dependencies
   - Create test helpers and utilities

2. Implement unit tests for core utilities and services:
   - Test all utility functions
   - Mock and test service interactions
   - Test validation and business logic

3. Implement component tests:
   - Test UI rendering and interactions
   - Verify component props and state handling
   - Test error and loading states

4. Implement integration tests for key workflows:
   - Pipeline control and monitoring
   - Configuration and scheduling
   - User and permission management

5. Create performance benchmark tests:
   - Measure render times for complex components
   - Test data fetching and processing performance
   - Establish performance baselines for future comparison

6. Implement accessibility testing:
   - Verify ARIA attributes and roles
   - Test keyboard navigation
   - Check color contrast and text readability

The testing suite should be comprehensive but maintainable, with appropriate test coverage for critical functionality.

### Prompt 8.8.3: Optimize for Various Device Types (Lovable AI) 🔴 Not Started

**Context**: We need to optimize the admin dashboard for various device types, ensuring a good user experience across desktop, tablet, and mobile devices.

**Prompt**:
Optimize the admin dashboard for different device types and screen sizes. Implement:

1. Enhance responsive design implementation:
   - Review all components for responsive behavior
   - Implement mobile-first approach
   - Use appropriate breakpoints for layout changes
   - Test on various screen sizes

2. Create adaptive layouts:
   - Implement collapsible sidebars for small screens
   - Create simplified views for complex data on mobile
   - Optimize table displays for different screen widths
   - Ensure modals and dialogs work well on all devices

3. Implement touch-friendly controls:
   - Increase touch target sizes on mobile
   - Replace hover interactions with tap interactions
   - Add swipe gestures where appropriate
   - Ensure adequate spacing between interactive elements

4. Optimize asset loading:
   - Implement responsive images
   - Use appropriate media queries for assets
   - Optimize bundle sizes for mobile networks

5. Test and fix specific device issues:
   - Address iOS-specific Safari issues
   - Handle Android Chrome quirks
   - Test on real devices when possible

The optimizations should ensure a consistent, high-quality experience across all devices while maintaining full functionality.

### Prompt 8.8.4: Conduct User Experience Testing (Lovable AI) 🔴 Not Started

**Context**: We need to conduct user experience testing to identify usability issues and optimize the admin dashboard for administrator workflows.

**Prompt**:
Implement user experience testing for the admin dashboard. This task involves:

1. Create usability testing scenarios:
   - Common administrative tasks
   - Error recovery workflows
   - Configuration and customization tasks
   - Data exploration and analysis workflows

2. Implement a feedback collection mechanism:
   ```typescript
   // src/components/admin/FeedbackCollector.tsx
   export const FeedbackCollector: React.FC<{
     taskId: string;
     taskName: string;
     onSubmit: (feedback: FeedbackData) => void;
   }>;
   
   // src/services/feedbackService.ts
   export async function submitFeedback(feedback: FeedbackData): Promise<void>;
   export async function getFeedbackAnalytics(): Promise<FeedbackAnalytics>;
   ```

3. Analyze common usage patterns:
   - Implement usage analytics tracking
   - Create heatmaps for UI interaction frequency
   - Identify common friction points
   - Measure task completion rates and times

4. Make UX improvements based on findings:
   - Simplify complex workflows
   - Add helpful tooltips and guidance
   - Improve error messages and recovery
   - Optimize information architecture

5. Conduct A/B testing for significant changes

The UX testing and improvements should focus on making the admin dashboard intuitive, efficient, and pleasant to use.

## Dependency Information

This epic builds upon:
- Epic 1: Foundation & Infrastructure - Required for basic application functionality
- Epic 7: Performance & Refinement - Complements the optimization efforts in this epic

## Implementation Sequence Recommendation

For most efficient implementation, follow this sequence:
1. Start with Story 8.1 (Pipeline History) as it builds important foundations
2. Follow with Story 8.2 (Monitoring Dashboard) which extends those foundations
3. Implement Stories 8.3 and 8.5 (Error Handling and Pipeline Configuration) as they improve core functionality
4. Continue with Stories 8.4, 8.6, and 8.7 (User Management, Data Management, Analytics) to add administrative capabilities
5. Finish with Story 8.8 (Performance Optimization) to enhance the overall experience

Each story can be implemented independently, but the earlier stories provide foundations for later ones.
