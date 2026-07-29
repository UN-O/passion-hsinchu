import { siteConfig } from "@/lib/site-config"

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">
      <p>{siteConfig.orgName}</p>
      <p className="mt-1">
        {siteConfig.contactAddress}｜{siteConfig.contactPhone}
      </p>
      <p className="mt-4">
        © {siteConfig.year} {siteConfig.edition}. All rights reserved.
      </p>
    </footer>
  )
}
