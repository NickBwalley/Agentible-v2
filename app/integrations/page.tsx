import { SectionPage } from "@/components/landing/SectionPage";
import Link from "next/link";

export default function IntegrationsPage() {
  return (
    <SectionPage
      title="Integrations"
      description="Connect Agentible with your favorite CRMs, email providers, and sales tools."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Salesforce", "HubSpot", "Outreach", "Gmail", "Microsoft 365", "Slack"].map(
          (name) => (
            <div
              key={name}
              className="rounded-lg border border-white/10 bg-white/5 p-6 text-white"
            >
              <h3 className="font-semibold">{name}</h3>
              <p className="mt-2 text-sm text-white/70">
                Seamless integration for your workflow.
              </p>
            </div>
          )
        )}
      </div>
      <Link
        href="/"
        className="mt-10 inline-block text-[#2563EB] hover:underline"
      >
        ← Back to Home
      </Link>
    </SectionPage>
  );
}
