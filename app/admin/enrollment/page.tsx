import { searchEnrollments } from "@/lib/enrollment"
import { CsvImport } from "./csv-import"
import { EnrollmentRowForm } from "./enrollment-row-form"

export default async function AdminEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams
  const rows = await searchEnrollments(q)

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">名冊管理</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        比對不到名冊的人無法進入，所以這裡是現場唯一的救援路徑。
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-medium">批次匯入</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          欄位需包含 姓名、教會、CAMP、CONFERENCE。匯入只會新增與更新，不會刪除任何既有資料。
        </p>
        <CsvImport />
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-medium">新增一筆</h2>
        <p className="mt-2 text-sm text-muted-foreground">現場報名或漏掉的人用這個。</p>
        <EnrollmentRowForm />
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-medium">
          名冊 <span className="text-muted-foreground">（{rows.length}）</span>
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
          <ul className="mt-6 flex flex-col gap-8">
            {rows.map((row) => (
              <li key={row.id}>
                <EnrollmentRowForm row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
