-- D1 Database Schema for Team MIMH Feedback
-- Run this with: wrangler d1 execute team-mimh-feedback --file=./schema.sql

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_type TEXT NOT NULL CHECK (project_type IN ('tourist-utility-service-system', 'stroke-hand-recovery-system')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  innovation TEXT CHECK (innovation IN ('low', 'medium', 'high', 'breakthrough') OR innovation IS NULL),
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_type ON feedback(project_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON feedback(created_at);
