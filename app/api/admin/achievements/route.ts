import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { GROUPS } from "@/lib/constants"

const sql = neon(process.env.DATABASE_URL!)

function getRegionFromTeam(teamName: string): string {
  const team = GROUPS.find((g) => g.name === teamName)
  return team?.region || "R" // Default to 'R' if not found
}

async function checkAndAssignScheduledAchievements() {
  try {
    // 獲取所有排程成就
    const scheduledAchievements = await sql`
      SELECT * FROM achievements 
      WHERE category = 'scheduled' 
      AND scheduled_time IS NOT NULL 
      AND scheduled_time <= NOW()
      AND is_active = true
    `

    for (const achievement of scheduledAchievements) {
      // 檢查是否已經指派給所有隊伍
      const existingAssignments = await sql`
        SELECT DISTINCT team_name FROM team_achievements 
        WHERE achievement_id = ${achievement.id}
      `

      const assignedTeams = existingAssignments.map((row) => row.team_name)
      const allTeams = GROUPS.map((g) => g.name)
      const unassignedTeams = allTeams.filter((team) => !assignedTeams.includes(team))

      // 為未指派的隊伍指派成就
      for (const teamName of unassignedTeams) {
        const region = getRegionFromTeam(teamName)
        await sql`
          INSERT INTO team_achievements (team_name, achievement_id, region, unlocked_at)
          VALUES (${teamName}, ${achievement.id}, ${region}, NOW())
          ON CONFLICT (team_name, achievement_id) DO NOTHING
        `
      }
    }
  } catch (error) {
    console.error("Error checking scheduled achievements:", error)
  }
}

export async function GET() {
  try {
    await checkAndAssignScheduledAchievements()

    const achievements = await sql`
      SELECT a.*, 
             COUNT(ta.id) as unlocked_count,
             ARRAY_AGG(DISTINCT ta.team_name) FILTER (WHERE ta.team_name IS NOT NULL) as unlocked_teams
      FROM achievements a
      LEFT JOIN team_achievements ta ON a.id = ta.achievement_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `
    return NextResponse.json(achievements)
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, icon, category, scheduled_time, teams } = await request.json()

    const achievement = await sql`
      INSERT INTO achievements (name, description, icon, category, scheduled_time, is_active, created_at)
      VALUES (${name}, ${description}, ${icon}, ${category}, ${scheduled_time}, true, NOW())
      RETURNING *
    `

    if (teams && teams.length > 0 && category === "assigned") {
      for (const team_name of teams) {
        const region = getRegionFromTeam(team_name)
        await sql`
          INSERT INTO team_achievements (team_name, achievement_id, region, unlocked_at)
          VALUES (${team_name}, ${achievement[0].id}, ${region}, NOW())
          ON CONFLICT (team_name, achievement_id) DO NOTHING
        `
      }
    }

    return NextResponse.json(achievement[0])
  } catch (error) {
    console.error("Error creating achievement:", error)
    return NextResponse.json({ error: "Failed to create achievement" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, icon, category, scheduled_time, teams } = await request.json()

    const achievement = await sql`
      UPDATE achievements 
      SET name = ${name}, description = ${description}, icon = ${icon}, 
          category = ${category}, scheduled_time = ${scheduled_time}
      WHERE id = ${id}
      RETURNING *
    `

    if (category === "assigned") {
      await sql`DELETE FROM team_achievements WHERE achievement_id = ${id}`

      if (teams && teams.length > 0) {
        for (const team_name of teams) {
          const region = getRegionFromTeam(team_name)
          await sql`
            INSERT INTO team_achievements (team_name, achievement_id, region, unlocked_at)
            VALUES (${team_name}, ${id}, ${region}, NOW())
          `
        }
      }
    }

    return NextResponse.json(achievement[0])
  } catch (error) {
    console.error("Error updating achievement:", error)
    return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 })
    }

    // First delete all related team_achievements records
    await sql`DELETE FROM team_achievements WHERE achievement_id = ${id}`

    // Then delete the achievement itself
    const deletedAchievement = await sql`
      DELETE FROM achievements 
      WHERE id = ${id}
      RETURNING *
    `

    if (deletedAchievement.length === 0) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Achievement and related data deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting achievement:", error)
    return NextResponse.json({ error: "Failed to delete achievement" }, { status: 500 })
  }
}
