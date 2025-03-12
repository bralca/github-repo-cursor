-- Create pipeline_schedules table for storing scheduled pipeline jobs

CREATE TABLE IF NOT EXISTS pipeline_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_type TEXT NOT NULL,
  schedule_name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  configuration_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_result JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  time_zone TEXT NOT NULL DEFAULT 'UTC'
);

CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_pipeline_type ON pipeline_schedules(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_is_active ON pipeline_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_next_run_at ON pipeline_schedules(next_run_at);

COMMENT ON TABLE pipeline_schedules IS 'Stores scheduled pipeline jobs with cron expressions';
COMMENT ON COLUMN pipeline_schedules.id IS 'Unique identifier for the schedule';
COMMENT ON COLUMN pipeline_schedules.pipeline_type IS 'Type of pipeline to execute';
COMMENT ON COLUMN pipeline_schedules.schedule_name IS 'Descriptive name for the schedule';
COMMENT ON COLUMN pipeline_schedules.cron_expression IS 'Cron expression for scheduling';
COMMENT ON COLUMN pipeline_schedules.configuration_id IS 'Optional reference to pipeline_configurations table';
COMMENT ON COLUMN pipeline_schedules.is_active IS 'Whether the schedule is active';
COMMENT ON COLUMN pipeline_schedules.last_run_at IS 'When the pipeline was last executed';
COMMENT ON COLUMN pipeline_schedules.next_run_at IS 'When the pipeline will next execute';
COMMENT ON COLUMN pipeline_schedules.last_result IS 'Result of the last execution as JSON';
COMMENT ON COLUMN pipeline_schedules.created_by IS 'User who created the schedule';
COMMENT ON COLUMN pipeline_schedules.created_at IS 'When the schedule was created';
COMMENT ON COLUMN pipeline_schedules.updated_at IS 'When the schedule was last updated';
COMMENT ON COLUMN pipeline_schedules.time_zone IS 'Timezone for the schedule'; 