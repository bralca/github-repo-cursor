-- Pipeline Management Tables Initialization Script
-- Run this script to create the required tables for pipeline management

-- Create pipeline_schedules table
CREATE TABLE IF NOT EXISTS pipeline_schedules (
    id TEXT PRIMARY KEY, -- UUID
    pipeline_type TEXT NOT NULL,
    cron_expression TEXT,
    is_active BOOLEAN DEFAULT 0,
    parameters TEXT, -- JSON blob
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pipeline_type)
);

-- Create pipeline_history table
CREATE TABLE IF NOT EXISTS pipeline_history (
    id TEXT PRIMARY KEY, -- UUID
    pipeline_type TEXT NOT NULL,
    status TEXT NOT NULL, -- running, completed, failed, stopped
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    items_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_type ON pipeline_schedules(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_active ON pipeline_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_pipeline_history_type ON pipeline_history(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_status ON pipeline_history(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_started_at ON pipeline_history(started_at);

-- Insert default pipeline schedules if they don't exist
INSERT OR IGNORE INTO pipeline_schedules (id, pipeline_type, cron_expression, is_active, parameters) 
VALUES 
('00000000-0000-0000-0000-000000000001', 'github_sync', '0 0 * * *', 0, '{}'),
('00000000-0000-0000-0000-000000000002', 'data_processing', '0 */3 * * *', 0, '{}'),
('00000000-0000-0000-0000-000000000003', 'data_enrichment', '0 */6 * * *', 0, '{}'),
('00000000-0000-0000-0000-000000000004', 'ai_analysis', '0 */12 * * *', 0, '{}');

-- Display created tables
.tables
.schema pipeline_schedules
.schema pipeline_history 