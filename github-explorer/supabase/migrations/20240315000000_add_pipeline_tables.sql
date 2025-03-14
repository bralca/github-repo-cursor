-- Create pipeline_schedules table
CREATE TABLE IF NOT EXISTS pipeline_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add a unique constraint to ensure only one schedule per pipeline type
  CONSTRAINT unique_pipeline_type UNIQUE (pipeline_type)
);

-- Create pipeline_history table
CREATE TABLE IF NOT EXISTS pipeline_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add a check constraint to validate status values
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_type ON pipeline_schedules (pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_type ON pipeline_history (pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_status ON pipeline_history (status);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_started_at ON pipeline_history (started_at DESC);

-- Add RLS policies
ALTER TABLE pipeline_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read access for authenticated users" 
  ON pipeline_schedules FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" 
  ON pipeline_history FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policies for service role (for server operations)
CREATE POLICY "Allow all access for service role" 
  ON pipeline_schedules FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow all access for service role" 
  ON pipeline_history FOR ALL 
  USING (auth.role() = 'service_role'); 