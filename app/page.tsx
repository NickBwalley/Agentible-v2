import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ResultsSection } from "@/components/landing/ResultsSection";
import { PricingPreviewSection } from "@/components/landing/PricingPreviewSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <ResultsSection />
      <PricingPreviewSection />
      <FinalCTASection />
    </main>
  );
}
