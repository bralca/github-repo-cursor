-- Delete all content from core entity tables
DELETE FROM repositories;
DELETE FROM contributors;
DELETE FROM merge_requests;
DELETE FROM commits;
DELETE FROM contributor_repository;
DELETE FROM files_commits;

-- Delete all content from pipeline management tables
DELETE FROM pipeline_schedules;
DELETE FROM pipeline_history;
DELETE FROM pipeline_status;

-- Reset all closed_merge_requests_raw items to unprocessed
UPDATE closed_merge_requests_raw SET is_processed = 0; 