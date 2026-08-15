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
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: siteConfig.venue,
    address: siteConfig.venueAddress,
  },
  organizer: {
    "@type": "Organization",
    name: siteConfig.orgName,
    url: siteConfig.url,
  },
  url: program.formUrl,
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
