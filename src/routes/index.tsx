import { createFileRoute } from "@tanstack/react-router";
import {
  AIFeatureDemo,
  CircuitFlowLines,
  FeaturesSection,
  FinalCTASection,
  Footer,
  HeroSection,
  LogoBar,
  NavHeader,
  PricingSection,
  WhyChooseSection,
} from "@/components/Landing";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="public-page-bg min-h-screen w-full overflow-x-hidden text-ui-text transition-colors duration-medium">
      {/* Circuit Flow Lines - spans full page */}
      <CircuitFlowLines />

      {/* Content */}
      <div className="relative z-10">
        <NavHeader />
        <HeroSection />
        <LogoBar />
        <FeaturesSection />
        <AIFeatureDemo />
        <WhyChooseSection />
        <PricingSection />
        <FinalCTASection />
        <Footer />
      </div>
    </div>
  );
}
