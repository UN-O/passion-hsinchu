-- 清除舊的資料表並重新設計為以小組和區域為單位的結構

-- 清除現有的資料表（保留 users 表但移除經驗值相關欄位）
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_puzzles CASCADE;
DROP TABLE IF EXISTS exp_records CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS puzzles CASCADE;

-- 移除 users 表中的經驗值相關欄位
ALTER TABLE users DROP COLUMN IF EXISTS total_exp;
ALTER TABLE users DROP COLUMN IF EXISTS level;

-- 創建小組經驗值記錄表
CREATE TABLE team_exp_records (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(50) NOT NULL,
    region CHAR(1) NOT NULL,
    exp_amount INTEGER NOT NULL CHECK (exp_amount > 0),
    reason TEXT NOT NULL,
    admin_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建小組總經驗值視圖
CREATE VIEW team_stats AS
SELECT 
    team_name,
    region,
    COALESCE(SUM(exp_amount), 0) as total_exp,
    FLOOR(COALESCE(SUM(exp_amount), 0) / 500) + 1 as level,
    COUNT(*) as record_count
FROM team_exp_records
GROUP BY team_name, region;

-- 創建成就表（重新設計）
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('scheduled', 'assigned')),
    exp_reward INTEGER DEFAULT 0,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建小組成就表
CREATE TABLE team_achievements (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(50) NOT NULL,
    region CHAR(1) NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_name, achievement_id)
);

-- 創建區域拼圖表
CREATE TABLE region_puzzles (
    id SERIAL PRIMARY KEY,
    region CHAR(1) NOT NULL,
    piece_number INTEGER NOT NULL CHECK (piece_number BETWEEN 1 AND 3),
    name VARCHAR(100) NOT NULL,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(region, piece_number)
);

-- 插入預設成就
INSERT INTO achievements (name, description, icon, category, exp_reward) VALUES
('測試', '這是一個測試成就', '🧪', 'assigned', 100),
('第一天任務', '完成第一天的所有任務', '📅', 'scheduled', 200),
('第二天任務', '完成第二天的所有任務', '📅', 'scheduled', 200),
('第三天任務', '完成第三天的所有任務', '📅', 'scheduled', 200),
('完美結局', '完成所有營會活動', '🏆', 'assigned', 500),
('團隊合作', '展現優秀的團隊合作精神', '🤝', 'assigned', 150),
('積極參與', '積極參與所有活動', '⭐', 'assigned', 150),
('服務之心', '主動服務他人', '❤️', 'assigned', 150);

-- 插入預設拼圖
INSERT INTO region_puzzles (region, piece_number, name) VALUES
('R', 1, '愛心拼圖片段一'),
('R', 2, '愛心拼圖片段二'),
('R', 3, '愛心拼圖片段三'),
('G', 1, '盼望拼圖片段一'),
('G', 2, '盼望拼圖片段二'),
('G', 3, '盼望拼圖片段三'),
('O', 1, '信心拼圖片段一'),
('O', 2, '信心拼圖片段二'),
('O', 3, '信心拼圖片段三');

-- 創建索���以提升查詢效能
CREATE INDEX idx_team_exp_records_team ON team_exp_records(team_name);
CREATE INDEX idx_team_exp_records_region ON team_exp_records(region);
CREATE INDEX idx_team_achievements_team ON team_achievements(team_name);
CREATE INDEX idx_region_puzzles_region ON region_puzzles(region);
