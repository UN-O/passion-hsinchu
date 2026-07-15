"use client"

import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { LayoutDashboard } from "lucide-react"

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
  className?: string
}

export function Header({ showBackButton = false, backHref = "/", className = "" }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className={`w-full py-4 px-6 relative flex items-center ${className} bg-black h-12`}>
      {showBackButton && (
        <Link href={backHref} className="absolute left-6 text-white/70 hover:text-white transition-colors z-10">
          ← 返回
        </Link>
      )}

      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Link href="/" className="block">
          <Image
            src="/images/passion-logo.png"
            alt="PASSION®"
            width={200}
            height={40}
            className="h-8 w-auto brightness-0 invert hover:opacity-80 transition-opacity cursor-pointer"
            priority
          />
        </Link>
      </div>

      {user && (
        <Link
          href="/dashboard"
          className="absolute right-6 text-white/70 hover:text-white transition-colors z-10"
          title="前往儀表板"
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
      )}
    </header>
  )
}
