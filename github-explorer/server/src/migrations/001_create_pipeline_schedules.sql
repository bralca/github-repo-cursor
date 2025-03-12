-- Migration: Create pipeline_schedules table
-- Description: Creates the pipeline_schedules table for storing scheduled jobs

-- Check if table exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pipeline_schedules'
    ) THEN
        -- Create the pipeline_schedules table
        CREATE TABLE pipeline_schedules (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            pipeline_type TEXT NOT NULL,
            cron_expression TEXT NOT NULL,
            timezone TEXT DEFAULT 'UTC',
            parameters JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            last_run_at TIMESTAMP WITH TIME ZONE,
            next_run_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indices for better performance
        CREATE INDEX idx_pipeline_schedules_pipeline_type ON pipeline_schedules(pipeline_type);
        CREATE INDEX idx_pipeline_schedules_is_active ON pipeline_schedules(is_active);
        CREATE INDEX idx_pipeline_schedules_next_run_at ON pipeline_schedules(next_run_at);
        
        RAISE NOTICE 'Created pipeline_schedules table and indices';
    ELSE
        RAISE NOTICE 'pipeline_schedules table already exists, skipping creation';
    END IF;
END
$$; 