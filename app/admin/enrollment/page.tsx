import Link from "next/link"

import { countEnrollments, searchEnrollments } from "@/lib/enrollment"
import { requireStaff } from "@/lib/session"
import { CsvImport } from "./csv-import"
import { DeleteEnrollmentButton } from "./delete-enrollment-button"
import { EnrollmentRowForm } from "./enrollment-row-form"

const DEFAULT_LIMIT = 50
// 「顯示全部」仍然設上限：每一列都是一個 client component 表單，
// 名冊將來變大時不要一次塞爆整頁。
const MAX_LIMIT = 1000

export default async function AdminEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; all?: string }>
}) {
  // layout 也擋了一層，但這頁會吐出整份未成年人名冊，權限檢查就放在讀資料的地方，
  // 不要只靠上層 layout。
  await requireStaff()

  const { q = "", all } = await searchParams
  const showAll = all === "1"

  const [rows, total] = await Promise.all([
    searchEnrollments(q, showAll ? MAX_LIMIT : DEFAULT_LIMIT),
    countEnrollments(q),
  ])
  const truncated = rows.length < total

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">名冊管理</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        比對不到名冊的人無法進入，所以這裡是現場唯一的救援路徑。
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-bold">批次匯入</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          欄位需包含 姓名、教會、CAMP、CONFERENCE。匯入只會新增與更新，不會刪除任何既有資料。
        </p>
        <CsvImport />
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">新增一筆</h2>
        <p className="mt-2 text-sm text-muted-foreground">現場報名或漏掉的人用這個。</p>
        <EnrollmentRowForm />
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">
          名冊{" "}
          <span className="text-muted-foreground">
            （{truncated ? `顯示 ${rows.length} / 共 ${total}` : total}）
          </span>
        </h2>

        <form method="get" className="mt-4 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="搜尋姓名或教會"
            className="h-9 flex-1 rounded-4xl border border-border bg-transparent px-4 text-sm outline-none focus-visible:border-ring"
          />
          <button
            type="submit"
            className="h-9 rounded-4xl border border-border px-4 text-sm font-medium transition-colors hover:border-foreground/40"
          >
            搜尋
          </button>
        </form>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            {q ? "找不到符合的資料。" : "名冊是空的，請先匯入。"}
          </p>
        ) : (
          <>
            {truncated && (
              <p className="mt-6 text-sm text-muted-foreground">
                只顯示前 {rows.length} 筆。用上面的搜尋找人，或{" "}
                <Link
                  href={{ pathname: "/admin/enrollment", query: { ...(q ? { q } : {}), all: "1" } }}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  顯示全部 {total} 筆
                </Link>
                。
              </p>
            )}

            <ul className="mt-6 flex flex-col gap-8">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-col gap-2">
                  <EnrollmentRowForm row={row} />
                  <div className="flex justify-end">
                    <DeleteEnrollmentButton id={row.id} name={row.name} church={row.church} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
