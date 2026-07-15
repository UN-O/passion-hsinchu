-- 修正表格結構和資料格式，移除不存在的欄位
-- 更新為符合原始需求的完整資料
-- 初始化基礎資料

-- 插入管理者帳號
INSERT INTO users (name, nickname, region, team, password, role, total_exp, level, expectations) VALUES
('admin', 'Admin', 'R', 'R1', 'admin123', 'admin', 0, 1, '系統管理者')
ON CONFLICT DO NOTHING;

-- 插入預設成就 (根據原始需求)
INSERT INTO achievements (name, description, icon, category) VALUES
('測試者讚', '歡迎加入測試', 'badge-check', 'scheduled'),
('新手報到', 'S1聚會後獲得', 'badge-check', 'scheduled'),
('整潔溜溜', '第一天晚餐完成垃圾回收後獲得', 'trash', 'assign'),
('信心副本', 'S2聚會後獲得', 'badge-check', 'scheduled'),
('鬥陣信望愛', '二早完成大地競賽後獲得', 'users', 'assign'),
('盼望副本', 'S3聚會後獲得', 'badge-check', 'scheduled'),
('最後一夜', 'S4聚會後獲得', 'badge-check', 'scheduled'),
('愛心副本', 'S5聚會後獲得', 'badge-check', 'scheduled'),
('城市代禱者', 'S5聚會後獲得', 'heart', 'assign'),
('剪輯大師', '中午交出影片檔案後獲得', 'video', 'assign'),
('拼圖收藏家', '收集完3片拼圖後獲得', 'puzzle', 'assign'),
('完美結局', '所有區完成拼圖收集，順利開啟完美結局後獲得', 'trophy', 'assign')
ON CONFLICT DO NOTHING;

-- 插入拼圖資料 (根據原始需求的三區拼圖)
INSERT INTO puzzles (region, piece_number, name, is_unlocked) VALUES
-- R區拼圖
('R', 1, '夥伴拼圖', false),
('R', 2, '火熱拼圖', false),
('R', 3, '信心拼圖', false),
-- G區拼圖
('G', 1, '創造拼圖', false),
('G', 2, '綿羊拼圖', false),
('G', 3, '盼望拼圖', false),
-- O區拼圖
('O', 1, '地球拼圖', false),
('O', 2, '排球拼圖', false),
('O', 3, '愛心拼圖', false)
ON CONFLICT (region, piece_number) DO NOTHING;
