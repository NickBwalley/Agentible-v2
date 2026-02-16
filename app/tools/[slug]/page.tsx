import { SectionPage } from "@/components/landing/SectionPage";
import Link from "next/link";

const toolNames: Record<string, string> = {
  "roi-calculator": "ROI Calculator",
  "lead-scoring": "Lead Scoring",
};

export default function ToolPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const title = toolNames[slug] ?? slug.replace(/-/g, " ");
  return (
    <SectionPage
      title={title}
      description="Free tools to optimize your sales process."
    >
      <Link href="/" className="mt-8 inline-block text-[#2563EB] hover:underline">
        ← Back to Home
      </Link>
    </SectionPage>
  );
}
