import { SectionPage } from "@/components/landing/SectionPage";
import Link from "next/link";

export default function ToolsPage() {
  return (
    <SectionPage
      title="Free tools"
      description="Tools to optimize your sales process."
    >
      <div className="mt-8 space-y-4">
        <Link
          href="/tools/roi-calculator"
          className="block rounded-lg border border-white/10 p-4 text-white/90 hover:text-white hover:border-white/20 transition-colors"
        >
          ROI Calculator
        </Link>
        <Link
          href="/tools/lead-scoring"
          className="block rounded-lg border border-white/10 p-4 text-white/90 hover:text-white hover:border-white/20 transition-colors"
        >
          Lead Scoring
        </Link>
      </div>
    </SectionPage>
  );
}
