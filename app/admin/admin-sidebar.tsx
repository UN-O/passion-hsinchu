"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin/enrollment", label: "名冊管理" },
  { href: "/admin/points", label: "CAMP 加分" },
  { href: "/admin/conference-workshop", label: "工作坊報名" },
  { href: "/admin/ig-stories", label: "IG 限動上傳" },
] as const

// 使用者完成開場後，/camp、/conference 會直接換成任務主頁，
// 拿不到原本的「再看一次開場」入口，工作人員要改東西時留這個後門進去。
const OPENING_PREVIEW_ITEMS = [
  { href: "/opening/camp/welcome", label: "查看 CAMP 開場" },
  { href: "/opening/conference/welcome", label: "查看 CONF 開場" },
] as const

export function AdminSidebar({
  userName,
  userRole,
}: {
  userName: string
  userRole: string
}) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        {/* 後台是深色底（沒有套 camp/conference 的主題 class，吃全站預設的
            深色 --background），logo 要用白色版本，跟 site-header.tsx 同一
            個做法。連去 "/"（app 自己的首頁，會依身份導到 camp/conference
            任務主頁），不是外部行銷網站——後台是工作用的頁面，回去的地方
            應該是系統本身，不是行銷網站。 */}
        <Link href="/" className="flex items-center gap-2 px-3 py-2">
          <Image
            src="/images/passion-logo.webp"
            alt="PASSION®"
            width={979}
            height={178}
            className="h-5 w-auto brightness-0 invert"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      // style.md：選中狀態用 brand-yellow 文字＋字重表達，不用底色塊。
                      className={cn(
                        "data-active:bg-transparent data-active:text-primary",
                        active && "font-semibold"
                      )}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>開場預覽</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {OPENING_PREVIEW_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-3 py-2 text-sm text-muted-foreground">
          {userName}（{userRole}）
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
