import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const groups = await sql`
      SELECT 
        team,
        region,
        COUNT(*) as member_count,
        AVG(total_exp)::integer as avg_exp,
        MAX(total_exp) as max_exp,
        MIN(total_exp) as min_exp,
        SUM(total_exp) as total_team_exp
      FROM users 
      WHERE role = 'student'
      GROUP BY team, region
      ORDER BY total_team_exp DESC
    `

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching group stats:", error)
    return NextResponse.json({ error: "Failed to fetch group stats" }, { status: 500 })
  }
}
