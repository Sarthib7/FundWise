import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ModesSection } from "@/components/modes-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FeaturesSection } from "@/components/features-section"
import { TechStrip } from "@/components/tech-strip"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ModesSection />
        <div className="mx-4 h-px bg-brand-border-c sm:mx-6 lg:mx-[max(24px,calc(50%-660px))]" />
        <HowItWorksSection />
        <div className="mx-4 h-px bg-brand-border-c sm:mx-6 lg:mx-[max(24px,calc(50%-660px))]" />
        <FeaturesSection />
        <TechStrip />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
