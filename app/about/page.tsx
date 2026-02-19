import { Header } from "@/components/landing/Header";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
          About Agentible
        </h1>
        <div className="space-y-6 text-lg text-white/80 leading-relaxed">
          <p>
            We built Agentible because cold outreach shouldn't be a guessing game.
          </p>
          <p>
            Most outbound tools prioritize volume over results, leading to damaged domain reputation, low response rates, and wasted time. We believe outbound should be predictable, measurable, and focused on what actually matters: qualified meetings.
          </p>
          <p>
            Our platform combines targeted lead selection, clean deliverability infrastructure, and context-aware personalization to help founders, agencies, and B2B teams generate real pipeline—not vanity metrics.
          </p>
          <p className="text-white">
            If it doesn't create qualified meetings, it doesn't matter.
          </p>
        </div>
      </section>
    </main>
  );
}
