-- Remove duplicate entries in team_achievements table
-- Keep only the earliest entry for each team + achievement combination
DELETE FROM team_achievements 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM team_achievements 
    GROUP BY team_name, achievement_id
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE team_achievements 
ADD CONSTRAINT unique_team_achievement 
UNIQUE (team_name, achievement_id);

-- Verify the cleanup
SELECT 
    team_name, 
    COUNT(*) as achievement_count,
    COUNT(DISTINCT achievement_id) as distinct_achievements
FROM team_achievements 
GROUP BY team_name
ORDER BY team_name;
