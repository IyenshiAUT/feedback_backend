// Feedback model - SQLite schema reference
// This file is kept for documentation purposes
// Actual queries are handled directly in the controller using sqlite3

/*
SQLite Table Schema:

Fields collected from frontend:
- project_type: Which project is being reviewed
- rating: Star rating (1-5)
- innovation: Innovation level (low/medium/high/breakthrough)
- comments: Text feedback

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_type TEXT NOT NULL CHECK (project_type IN ('tourist-utility-service-system', 'stroke-hand-recovery-system')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  innovation TEXT CHECK (innovation IN ('low', 'medium', 'high', 'breakthrough') OR innovation IS NULL),
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

*/

module.exports = {
  tableName: 'feedback',
  projectTypes: ['tourist-utility-service-system', 'stroke-hand-recovery-system'],
  innovationLevels: ['low', 'medium', 'high', 'breakthrough']
};

