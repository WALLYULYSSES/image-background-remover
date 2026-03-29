-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 3,
  created_at INTEGER DEFAULT (unixepoch()),
  last_login_at INTEGER DEFAULT (unixepoch())
);

-- 使用记录表
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  status TEXT DEFAULT 'success',
  FOREIGN KEY (user_id) REFERENCES users(id)
);
