-- 更新資料庫結構以支援新的 admin 系統設計

-- 更新成就表結構，添加 scheduled 和 type 欄位
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'assign';
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;

-- 創建組別成就表（以小組為單位管理成就）
CREATE TABLE IF NOT EXISTS team_achievements (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR(10) REFERENCES teams(id),
  achievement_id VARCHAR(50) REFERENCES achievements(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by VARCHAR(100),
  UNIQUE(team_id, achievement_id)
);

-- 創建組別經驗值記錄表（以小組為單位管理經驗值）
CREATE TABLE IF NOT EXISTS team_exp_records (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR(10) REFERENCES teams(id),
  exp_amount INTEGER NOT NULL CHECK (exp_amount > 0),
  reason VARCHAR(200) NOT NULL,
  assigned_by VARCHAR(100) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建區域拼圖表（以區為單位管理拼圖）
CREATE TABLE IF NOT EXISTS region_puzzles (
  id SERIAL PRIMARY KEY,
  region VARCHAR(1) NOT NULL CHECK (region IN ('R', 'G', 'O')),
  puzzle_name VARCHAR(50) NOT NULL,
  is_collected BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMP,
  collected_by VARCHAR(100),
  UNIQUE(region, puzzle_name)
);

-- 插入預設成就資料
INSERT INTO achievements (id, name, description, icon, type, exp, scheduled_time) VALUES
('test', '測試者讚', '歡迎加入測試', 'badge-check', 'scheduled', 1000, '2025-08-17 06:00:00'),
('s1_done', '新手報到', 'S1聚會後獲得', 'badge-check', 'scheduled', 100, '2025-08-21 15:00:00'),
('day_1_clean', '整潔溜溜', '第一天晚餐完成垃圾回收後獲得', 'trash', 'assign', 200, NULL),
('s2_done', '信心副本', 'S2聚會後獲得', 'badge-check', 'scheduled', 100, '2025-08-21 20:00:00'),
('day_2_game', '鬥陣信望愛', '二早完成大地競賽後獲得', 'gamepad-2', 'assign', 150, NULL),
('s3_done', '盼望副本', 'S3聚會後獲得', 'badge-check', 'scheduled', 100, '2025-08-22 17:30:00'),
('s4_done', '最後一夜', 'S4聚會後獲得', 'badge-check', 'scheduled', 100, '2025-08-22 21:20:00'),
('s5_done', '愛心副本', 'S5聚會後獲得', 'badge-check', 'scheduled', 100, '2025-08-23 16:20:00'),
('city_prayer', '城市代禱者', 'S5聚會後獲得', 'map-pin', 'assign', 150, NULL),
('video_master', '剪輯大師', '中午交出影片檔案後獲得', 'video', 'assign', 200, NULL),
('puzzle_collector', '拼圖收藏家', '收集完3片拼圖後獲得', 'puzzle', 'assign', 500, NULL),
('perfect_ending', '完美結局', '所有區完成拼圖收集後獲得', 'crown', 'assign', 1000, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  type = EXCLUDED.type,
  exp = EXCLUDED.exp,
  scheduled_time = EXCLUDED.scheduled_time;

-- 插入區域拼圖資料
INSERT INTO region_puzzles (region, puzzle_name) VALUES
('R', '夥伴拼圖'),
('R', '火熱拼圖'),
('R', '信心拼圖'),
('G', '創造拼圖'),
('G', '綿羊拼圖'),
('G', '盼望拼圖'),
('O', '地球拼圖'),
('O', '排球拼圖'),
('O', '愛心拼圖')
ON CONFLICT (region, puzzle_name) DO NOTHING;
