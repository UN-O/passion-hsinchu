-- 清除現有成就並新增營會成就列表
-- 成就是全組共用的，不分區域

-- 清除現有成就資料
DELETE FROM team_achievements;
DELETE FROM achievements;

-- 重置成就 ID 序列
ALTER SEQUENCE achievements_id_seq RESTART WITH 1;

-- 新增營會成就列表
INSERT INTO achievements (name, description, icon, category, exp_reward, scheduled_time, is_active) VALUES
-- 排程成就 (自動解鎖)
('新手報到', 'S1聚會後獲得', '🎯', 'scheduled', 500, '2024-08-21 17:20:00+08', true),
('信心副本：暗區突圍', 'S2聚會後獲得', '⚔️', 'scheduled', 500, '2024-08-21 21:00:00+08', true),
('鬥陣信望愛', '二早完成大地競賽後獲得', '🏆', 'scheduled', 500, '2024-08-22 11:20:00+08', true),
('盼望副本', 'S3聚會後獲得', '🌟', 'scheduled', 500, '2024-08-22 16:00:00+08', true),
('最後一夜', 'S4聚會後獲得', '🌙', 'scheduled', 500, '2024-08-22 21:00:00+08', true),
('愛心副本', 'S5聚會後獲得', '❤️', 'scheduled', 500, '2024-08-23 10:20:00+08', true),
('城市代禱者', 'S5聚會後獲得', '🙏', 'scheduled', 500, '2024-08-23 11:50:00+08', true),

-- 手動指派成就
('整潔溜溜', '第一天晚餐完成垃圾回收後獲得', '🧹', 'assigned', 200, null, true),
('剪輯大師', '中午交出影片檔案後獲得', '🎬', 'assigned', 500, null, true),
('拼圖收藏家', '收集完3片拼圖後獲得', '🧩', 'assigned', 1000, null, true),
('完美結局', '所有區完成拼圖收集，順利開啟完美結局後獲得', '🏅', 'assigned', 1000, null, true);
