import { useLandingMotion } from "@/components/landing/useLandingMotion";
import "./LandingPage.css";
import "./LandingEditorial.css";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { ApproachSection } from "@/components/landing/ApproachSection";
import { GettingStartedSection } from "@/components/landing/GettingStartedSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function LandingPage() {
  const motionRoot = useLandingMotion();
  return (
    <div className="landing-page" ref={motionRoot}>
      <a className="lp-skip-link" href="#main-content">
        Aller au contenu
      </a>
      <LandingHeader />
      <main id="main-content">
        <LandingHero />
        <ModulesSection />
        <ApproachSection />
        <GettingStartedSection />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
