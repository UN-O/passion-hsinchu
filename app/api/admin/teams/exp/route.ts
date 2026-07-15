import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const records = await sql`
      SELECT 
        id,
        team_name,
        region,
        exp_amount,
        reason,
        admin_name,
        created_at
      FROM team_exp_records
      ORDER BY created_at DESC
    `

    return NextResponse.json(records)
  } catch (error) {
    console.error("獲取經驗值記錄失敗:", error)
    return NextResponse.json({ error: "獲取經驗值記錄失敗" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { team_name, region, exp_amount, reason, admin_name } = await request.json()

    // 驗證輸入
    if (!team_name || !region || !exp_amount || !reason || !admin_name) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 })
    }

    if (exp_amount <= 0) {
      return NextResponse.json({ error: "經驗值必須為正數" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO team_exp_records (team_name, region, exp_amount, reason, admin_name)
      VALUES (${team_name}, ${region}, ${exp_amount}, ${reason}, ${admin_name})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("新增經驗值記錄失敗:", error)
    return NextResponse.json({ error: "新增經驗值記錄失敗" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("id")

    if (!recordId) {
      return NextResponse.json({ error: "缺少記錄 ID" }, { status: 400 })
    }

    await sql`DELETE FROM team_exp_records WHERE id = ${recordId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("刪除經驗值記錄失敗:", error)
    return NextResponse.json({ error: "刪除經驗值記錄失敗" }, { status: 500 })
  }
}
