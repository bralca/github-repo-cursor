-- Create pipeline_configurations table for storing pipeline configuration settings

CREATE TABLE IF NOT EXISTS pipeline_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  pipeline_type TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_pipeline_type ON pipeline_configurations(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_is_active ON pipeline_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_is_default ON pipeline_configurations(is_default);

COMMENT ON TABLE pipeline_configurations IS 'Stores pipeline configuration settings';
COMMENT ON COLUMN pipeline_configurations.id IS 'Unique identifier for the configuration';
COMMENT ON COLUMN pipeline_configurations.name IS 'Name of the configuration';
COMMENT ON COLUMN pipeline_configurations.pipeline_type IS 'Type of pipeline this configuration applies to';
COMMENT ON COLUMN pipeline_configurations.description IS 'Description of the configuration';
COMMENT ON COLUMN pipeline_configurations.configuration IS 'Configuration settings as JSON';
COMMENT ON COLUMN pipeline_configurations.is_active IS 'Whether the configuration is active';
COMMENT ON COLUMN pipeline_configurations.is_default IS 'Whether this is the default configuration for the pipeline type';
COMMENT ON COLUMN pipeline_configurations.created_by IS 'User who created the configuration';
COMMENT ON COLUMN pipeline_configurations.created_at IS 'When the configuration was created';
COMMENT ON COLUMN pipeline_configurations.updated_at IS 'When the configuration was last updated';
COMMENT ON COLUMN pipeline_configurations.version IS 'Version number for configuration versioning';

-- Ensure only one default configuration per pipeline type
CREATE OR REPLACE FUNCTION check_single_default_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE pipeline_configurations
    SET is_default = FALSE
    WHERE pipeline_type = NEW.pipeline_type
      AND id <> NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_config
BEFORE INSERT OR UPDATE ON pipeline_configurations
FOR EACH ROW
EXECUTE FUNCTION check_single_default_config(); 