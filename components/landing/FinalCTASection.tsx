import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTASection() {
  return (
    <section className="px-6 py-24 max-w-4xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        If outbound worked predictably, what would that be worth?
      </h2>
      <div className="mt-8 space-y-3 text-lg text-white/80">
        <p>Start a simple campaign.</p>
        <p>Measure qualified meetings.</p>
        <p>Scale only when the numbers prove it.</p>
      </div>
      <div className="mt-10">
        <Button variant="primary" size="lg" showArrow asChild>
          <Link href="/signup">Start Your First Campaign</Link>
        </Button>
      </div>
    </section>
  );
}
