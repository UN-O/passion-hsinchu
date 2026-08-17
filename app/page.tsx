import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { ProgramSection } from "@/components/program-section"
import { VideoSection } from "@/components/video-section"
import { GallerySection } from "@/components/gallery-section"
import { ChurchMarquee } from "@/components/church-marquee"
import { RelatedLinksSection } from "@/components/related-links-section"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { camp, conference, siteConfig } from "@/lib/site-config"
import { getAppSession } from "@/lib/session"

const eventsJsonLd = [camp, conference].map((program) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  name: program.name,
  description: `${program.audience}｜${program.timeEntries.join("、")}`,
  // Google 的結構化資料驗證把 startDate 列為必填，之前沒填會讓 Event
  // 完全不具備 rich result 資格。
  startDate: program.startDateISO,
  endDate: program.endDateISO,
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: siteConfig.venue,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.venueAddress,
      addressLocality: "新竹市",
      addressCountry: "TW",
    },
  },
  image: [`${siteConfig.url}/og-image.jpg`],
  organizer: {
    "@type": "Organization",
    name: siteConfig.orgName,
    url: siteConfig.url,
  },
  // 報名已結束，指向活動頁而不是已關閉的報名表單
  url: siteConfig.url,
}))

export default async function Home() {
  const session = await getAppSession()

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": eventsJsonLd }} />
      <SiteHeader session={session ? { name: session.user.name } : null} />
      <main>
        <HeroSection session={session} />
        <AboutSection />
        <ProgramSection />
        <VideoSection />
        <GallerySection />
        <ChurchMarquee />
        <RelatedLinksSection />
      </main>
      <SiteFooter />
    </>
  )
}
