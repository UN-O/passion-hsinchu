"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin/enrollment", label: "名冊管理" },
  { href: "/admin/points", label: "CAMP 加分" },
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
        <Link
          href="/"
          className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          回首頁
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
      </SidebarContent>

      <SidebarFooter>
        <p className="px-3 py-2 text-sm text-muted-foreground">
          {userName}（{userRole}）
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
