"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteEnrollmentAction } from "./actions"

// 有人臨時說不能來了：這是唯一的整筆刪除入口，AlertDialog 二次確認、講清楚
// 會連帶刪掉什麼（分隊、工作坊選擇會一起沒了，工作坊名額因此釋出；CAMP
// 加分是隊的總分不受影響）。跟 post-row.tsx／logout-dialog.tsx 同一個做法：
// 確認鍵按下去就送出、對話框自己關掉，不在對話框裡自己攔著等非同步結果。
export function DeleteEnrollmentButton({ name, church, id }: { name: string; church: string; id: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="text-sm text-destructive underline underline-offset-4 hover:text-destructive/80"
        >
          刪除
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            刪除 {name}／{church}？
          </AlertDialogTitle>
          <AlertDialogDescription>
            會連同這個人的分隊資料、工作坊選擇一起刪除（工作坊名額會釋出給其他人選）。CAMP
            加分是隊的總分，不會受影響。這個動作無法復原。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => deleteEnrollmentAction(id)}>
            確定刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
