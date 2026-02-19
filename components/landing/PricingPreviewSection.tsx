import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function PricingPreviewSection() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Simple pricing. Real outcomes.
      </h2>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-lg text-white/80">
        <span>Basic</span>
        <span className="text-white/40">—</span>
        <span>Starter</span>
        <span className="text-white/40">—</span>
        <span>Pro</span>
      </div>
      <p className="mt-4 text-white/70">
        Built to scale with your pipeline.
      </p>
      <div className="mt-8">
        <Button variant="primary" size="lg" asChild>
          <Link href="/pricing">See Pricing</Link>
        </Button>
      </div>
    </section>
  );
}
