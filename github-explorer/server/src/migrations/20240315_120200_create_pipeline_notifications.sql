-- Create pipeline_notifications table for storing pipeline notification events

CREATE TABLE IF NOT EXISTS pipeline_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  level TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_notifications_type ON pipeline_notifications(type);
CREATE INDEX IF NOT EXISTS idx_pipeline_notifications_level ON pipeline_notifications(level);
CREATE INDEX IF NOT EXISTS idx_pipeline_notifications_is_read ON pipeline_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_pipeline_notifications_created_at ON pipeline_notifications(created_at DESC);

COMMENT ON TABLE pipeline_notifications IS 'Stores pipeline notification events';
COMMENT ON COLUMN pipeline_notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN pipeline_notifications.type IS 'Type of notification (e.g., schedule.created, pipeline.failed)';
COMMENT ON COLUMN pipeline_notifications.title IS 'Title of the notification';
COMMENT ON COLUMN pipeline_notifications.message IS 'Message content of the notification';
COMMENT ON COLUMN pipeline_notifications.details IS 'Additional details as JSON';
COMMENT ON COLUMN pipeline_notifications.level IS 'Notification level (info, success, warning, error)';
COMMENT ON COLUMN pipeline_notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN pipeline_notifications.created_at IS 'When the notification was created';

-- Create notification_settings table for storing notification preferences

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_recipients TEXT,
  webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_settings_level ON notification_settings(level);

COMMENT ON TABLE notification_settings IS 'Stores notification preferences for different levels';
COMMENT ON COLUMN notification_settings.id IS 'Unique identifier for the setting';
COMMENT ON COLUMN notification_settings.level IS 'Notification level (info, success, warning, error)';
COMMENT ON COLUMN notification_settings.email_enabled IS 'Whether email notifications are enabled';
COMMENT ON COLUMN notification_settings.email_recipients IS 'Comma-separated list of email recipients';
COMMENT ON COLUMN notification_settings.webhook_enabled IS 'Whether webhook notifications are enabled';
COMMENT ON COLUMN notification_settings.webhook_url IS 'URL for webhook notifications';
COMMENT ON COLUMN notification_settings.is_active IS 'Whether the setting is active';
COMMENT ON COLUMN notification_settings.created_at IS 'When the setting was created';
COMMENT ON COLUMN notification_settings.updated_at IS 'When the setting was last updated'; 