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
} from "@/components/ui/alert-dialog"
import { logout } from "@/app/signin/actions"

type LogoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* 跟其他彈窗（camp-sidebar.tsx／camp-countdown-card.tsx 等）同一個
          安全邊界寫法：AlertDialogContent 本身的 data-[size=default]:max-w-xs
          在手機窄螢幕上沒有可靠地把寬度收住（實機截圖回報右邊被切掉），
          直接補 max-w-[calc(100%-2rem)] 保證不會超出螢幕。 */}
      <AlertDialogContent className="max-w-[calc(100%-2rem)]">
        <AlertDialogHeader>
          <AlertDialogTitle>你確定要登出嗎？</AlertDialogTitle>
          <AlertDialogDescription>
            登出後需要重新填寫教會、場次與姓名才能再次進入。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => logout()}>登出</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
