import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  name: string
  nickname: string
  region: "R" | "G" | "O"
  team: string
  expectations?: string
  password: string
  role: "student" | "admin"
  total_exp: number
  level: number
  created_at: string
  updated_at: string
}

export interface ExpRecord {
  id: number
  user_id: number
  team: string
  region: string
  exp_amount: number
  reason: string
  admin_name: string
  created_at: string
}

export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: string
  is_active: boolean
  created_at: string
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  unlocked_at: string
  achievement?: Achievement
}

export interface Puzzle {
  id: number
  region: "R" | "G" | "O"
  piece_number: 1 | 2 | 3
  name: string
  is_unlocked: boolean
  created_at: string
  unlocked_at: string | null
}

// 用戶相關查詢
export async function createUser(userData: Omit<User, "id" | "created_at" | "updated_at" | "total_exp" | "level">) {
  const result = await sql`
    INSERT INTO users (name, nickname, region, team, expectations, password, role)
    VALUES (${userData.name}, ${userData.nickname}, ${userData.region}, ${userData.team}, ${userData.expectations}, ${userData.password}, ${userData.role})
    RETURNING *
  `
  return result[0] as User
}

export async function getUserByNameAndPassword(name: string, password: string) {
  const result = await sql`
    SELECT * FROM users 
    WHERE name = ${name} AND password = ${password}
    LIMIT 1
  `
  return result[0] as User | undefined
}

export async function getUserById(id: number) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `
  return result[0] as User | undefined
}

export async function updateUserExp(userId: number, expAmount: number) {
  const newLevel = Math.floor(expAmount / 500) + 1
  const result = await sql`
    UPDATE users 
    SET total_exp = ${expAmount}, level = ${newLevel}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING *
  `
  return result[0] as User
}

// 經驗值紀錄相關查詢
export async function addExpRecord(record: Omit<ExpRecord, "id" | "created_at">) {
  const result = await sql`
    INSERT INTO exp_records (user_id, team, region, exp_amount, reason, admin_name)
    VALUES (${record.user_id}, ${record.team}, ${record.region}, ${record.exp_amount}, ${record.reason}, ${record.admin_name})
    RETURNING *
  `
  return result[0] as ExpRecord
}

export async function getExpRecords() {
  const result = await sql`
    SELECT er.*, u.name as user_name, u.nickname as user_nickname
    FROM exp_records er
    JOIN users u ON er.user_id = u.id
    ORDER BY er.created_at DESC
  `
  return result as (ExpRecord & { user_name: string; user_nickname: string })[]
}

export async function deleteExpRecord(id: number) {
  await sql`DELETE FROM exp_records WHERE id = ${id}`
}

// 成就相關查詢
export async function getAchievements() {
  const result = await sql`
    SELECT * FROM achievements WHERE is_active = true ORDER BY created_at ASC
  `
  return result as Achievement[]
}

export interface TeamAchievement {
  id: number
  team_name: string
  achievement_id: number
  region: string
  unlocked_at: string
  achievement?: Achievement
}

export async function getUserAchievements(userId: number) {
  // First get the user's team
  const user = await getUserById(userId)
  if (!user) return []

  // Get achievements for the user's team
  const result = await sql`
    SELECT ta.*, a.name, a.description, a.icon, a.category
    FROM team_achievements ta
    JOIN achievements a ON ta.achievement_id = a.id
    WHERE ta.team_name = ${user.team}
    ORDER BY ta.unlocked_at DESC
  `
  return result as (TeamAchievement & Achievement)[]
}

export async function unlockAchievement(userId: number, achievementId: number) {
  // Get user's team first
  const user = await getUserById(userId)
  if (!user) return undefined

  const result = await sql`
    INSERT INTO team_achievements (team_name, achievement_id, region)
    VALUES (${user.team}, ${achievementId}, ${user.region})
    ON CONFLICT (team_name, achievement_id) DO NOTHING
    RETURNING *
  `
  return result[0] as TeamAchievement | undefined
}

// 拼圖相關查詢
export async function getPuzzles() {
  const result = await sql`
    SELECT * FROM region_puzzles ORDER BY region, piece_number
  `
  return result as Puzzle[]
}

export async function getUserPuzzles(userId: number) {
  // Get user's region first
  const user = await getUserById(userId)
  if (!user) return []

  // Return puzzles for user's region with unlock status
  const result = await sql`
    SELECT 
      rp.id,
      rp.region,
      rp.piece_number,
      rp.name,
      rp.is_unlocked,
      rp.unlocked_at,
      rp.created_at
    FROM region_puzzles rp
    WHERE rp.region = ${user.region}
    ORDER BY rp.piece_number
  `
  return result as (Puzzle & { unlocked_at: string | null })[]
}

export async function unlockPuzzle(region: string, pieceNumber: number) {
  const result = await sql`
    UPDATE region_puzzles 
    SET is_unlocked = true, unlocked_at = NOW()
    WHERE region = ${region} AND piece_number = ${pieceNumber}
    RETURNING *
  `
  return result[0] as Puzzle
}

// 統計相關查詢
export async function getTeamStats() {
  const result = await sql`
    SELECT 
      team,
      region,
      COUNT(*) as user_count,
      SUM(total_exp) as total_exp,
      AVG(total_exp) as avg_exp,
      MAX(level) as max_level
    FROM users 
    WHERE role = 'student'
    GROUP BY team, region
    ORDER BY total_exp DESC
  `
  return result as {
    team: string
    region: string
    user_count: number
    total_exp: number
    avg_exp: number
    max_level: number
  }[]
}

export async function getUserStats() {
  const result = await sql`
    SELECT 
      region,
      COUNT(*) as user_count,
      array_agg(expectations) FILTER (WHERE expectations IS NOT NULL) as expectations_sample
    FROM users 
    WHERE role = 'student'
    GROUP BY region
  `
  return result as {
    region: string
    user_count: number
    expectations_sample: string[]
  }[]
}

export async function getTeamByName(teamName: string) {
  const result = await sql`
    SELECT 
      ts.team_name as team,
      ts.region,
      ts.total_exp,
      ts.level,
      ts.record_count,
      COUNT(u.id) as user_count
    FROM team_stats ts
    LEFT JOIN users u ON ts.team_name = u.team AND u.role = 'student'
    WHERE ts.team_name = ${teamName}
    GROUP BY ts.team_name, ts.region, ts.total_exp, ts.level, ts.record_count
  `
  return result[0] as
    | {
        team: string
        region: string
        user_count: number
        total_exp: number
        level: number
        record_count: number
      }
    | undefined
}
