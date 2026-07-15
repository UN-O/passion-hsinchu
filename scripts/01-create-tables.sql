-- 建立 Passion Camp 資料庫表結構
-- 用戶表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  region VARCHAR(10) NOT NULL CHECK (region IN ('R', 'G', 'O')),
  team VARCHAR(50) NOT NULL,
  expectations TEXT,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  total_exp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 經驗值紀錄表
CREATE TABLE IF NOT EXISTS exp_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team VARCHAR(50) NOT NULL,
  region VARCHAR(10) NOT NULL,
  exp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  admin_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用戶成就關聯表
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 拼圖表
CREATE TABLE IF NOT EXISTS puzzles (
  id SERIAL PRIMARY KEY,
  region VARCHAR(10) NOT NULL CHECK (region IN ('R', 'G', 'O')),
  piece_number INTEGER NOT NULL CHECK (piece_number IN (1, 2, 3)),
  name VARCHAR(100) NOT NULL,
  is_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region, piece_number)
);

-- 用戶拼圖關聯表
CREATE TABLE IF NOT EXISTS user_puzzles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id INTEGER REFERENCES puzzles(id) ON DELETE CASCADE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, puzzle_id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);
CREATE INDEX IF NOT EXISTS idx_exp_records_user_id ON exp_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exp_records_team ON exp_records(team);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_puzzles_user_id ON user_puzzles(user_id);
