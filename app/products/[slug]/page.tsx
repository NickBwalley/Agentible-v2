import { SectionPage } from "@/components/landing/SectionPage";
import Link from "next/link";

const productNames: Record<string, string> = {
  "ai-sdr": "AI SDR",
  "lead-generation": "Lead Generation",
  "lead-enrichment": "Lead Enrichment",
  "smart-routing": "Smart Routing",
  analytics: "Analytics & Reporting",
};

export default function ProductPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const title = productNames[slug] ?? slug.replace(/-/g, " ");
  return (
    <SectionPage
      title={title}
      description="Discover how Agentible helps you scale outreach and close more deals."
    >
      <Link href="/" className="mt-8 inline-block text-[#2563EB] hover:underline">
        ← Back to Home
      </Link>
    </SectionPage>
  );
}
