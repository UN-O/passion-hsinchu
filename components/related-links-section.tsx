import Link from "next/link"
import { Instagram, Link2, Youtube } from "lucide-react"
import { socialLinks } from "@/lib/site-config"

const links = [
  { href: socialLinks.instagram, label: "Instagram", icon: Instagram },
  { href: socialLinks.youtube, label: "YouTube", icon: Youtube },
  { href: socialLinks.linktree, label: "Linktree", icon: Link2 },
]

export function RelatedLinksSection() {
  return (
    <section id="links" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-primary">相關連結</h2>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-4 py-8 transition-colors hover:border-primary"
            >
              <Icon className="size-6" aria-hidden="true" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
