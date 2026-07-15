import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { GROUPS } from "@/lib/constants"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching puzzles from database...")
    const puzzles = await sql`
      SELECT * FROM region_puzzles
      ORDER BY region, piece_number
    `

    console.log("[v0] Raw puzzles from database:", JSON.stringify(puzzles, null, 2))
    console.log("[v0] Number of puzzles found:", puzzles.length)

    // Calculate affected teams for each puzzle
    const puzzlesWithTeams = puzzles.map((puzzle) => {
      const affectedTeams = GROUPS.filter((group) => group.region === puzzle.region)
      return {
        ...puzzle,
        affected_teams: affectedTeams.map((team) => team.name),
        affected_count: affectedTeams.length,
      }
    })

    console.log("[v0] Final puzzles with teams:", JSON.stringify(puzzlesWithTeams, null, 2))
    return NextResponse.json(puzzlesWithTeams)
  } catch (error) {
    console.error("Error fetching puzzles:", error)
    return NextResponse.json({ error: "Failed to fetch puzzles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { region, piece_number, is_unlocked } = await request.json()

    const result = await sql`
      UPDATE region_puzzles 
      SET is_unlocked = ${is_unlocked}, 
          unlocked_at = ${is_unlocked ? "NOW()" : null}
      WHERE region = ${region} AND piece_number = ${piece_number}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating puzzle:", error)
    return NextResponse.json({ error: "Failed to update puzzle" }, { status: 500 })
  }
}
