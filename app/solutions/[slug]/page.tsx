import { SectionPage } from "@/components/landing/SectionPage";
import Link from "next/link";

const solutionNames: Record<string, string> = {
  "sales-teams": "For Sales Teams",
  revops: "For RevOps",
  b2b: "For B2B Outreach",
  agencies: "For Agencies",
};

export default function SolutionPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const title = solutionNames[slug] ?? slug.replace(/-/g, " ");
  return (
    <SectionPage
      title={title}
      description="See how Agentible fits your team's workflow."
    >
      <Link href="/" className="mt-8 inline-block text-[#2563EB] hover:underline">
        ← Back to Home
      </Link>
    </SectionPage>
  );
}
