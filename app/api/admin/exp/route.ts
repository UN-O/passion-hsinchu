import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const records = await sql`
      SELECT er.*, u.nickname as user_nickname 
      FROM exp_records er
      LEFT JOIN users u ON er.user_id = u.id
      ORDER BY er.created_at DESC
    `
    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching exp records:", error)
    return NextResponse.json({ error: "Failed to fetch exp records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { team, exp_amount, reason, admin_name } = await request.json()

    // Get region from team
    const teamData = await sql`SELECT region FROM users WHERE team = ${team} LIMIT 1`
    const region = teamData[0]?.region || "R"

    // Add exp record
    const record = await sql`
      INSERT INTO exp_records (team, region, exp_amount, reason, admin_name, created_at)
      VALUES (${team}, ${region}, ${exp_amount}, ${reason}, ${admin_name}, NOW())
      RETURNING *
    `

    // Update all users in the team
    await sql`
      UPDATE users 
      SET total_exp = total_exp + ${exp_amount},
          level = FLOOR((total_exp + ${exp_amount}) / 500) + 1,
          updated_at = NOW()
      WHERE team = ${team}
    `

    return NextResponse.json(record[0])
  } catch (error) {
    console.error("Error adding exp:", error)
    return NextResponse.json({ error: "Failed to add exp" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Record ID required" }, { status: 400 })
    }

    // Get the record to reverse the exp
    const record = await sql`SELECT * FROM exp_records WHERE id = ${id}`
    if (record.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const { team, exp_amount } = record[0]

    // Reverse the exp from all users in the team
    await sql`
      UPDATE users 
      SET total_exp = GREATEST(0, total_exp - ${exp_amount}),
          level = GREATEST(1, FLOOR(GREATEST(0, total_exp - ${exp_amount}) / 500) + 1),
          updated_at = NOW()
      WHERE team = ${team}
    `

    // Delete the record
    await sql`DELETE FROM exp_records WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting exp record:", error)
    return NextResponse.json({ error: "Failed to delete exp record" }, { status: 500 })
  }
}
