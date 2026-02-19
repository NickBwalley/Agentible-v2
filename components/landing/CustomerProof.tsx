import Link from "next/link";
import { Button } from "@/components/ui/Button";

const proof = [
  { stat: "2.3x", label: "reply rate lift vs. templates" },
  { stat: "40%", label: "research time saved per SDR" },
  { stat: "58%", label: "of trial users convert to paid" },
];

export function CustomerProof() {
  return (
    <section className="px-6 py-24 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Teams that switched see measurable results
        </h2>
        <p className="mt-3 text-white/70">
          VP Sales and SDR managers. Series A to Enterprise.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-12 md:gap-20">
          {proof.map((p) => (
            <div key={p.label}>
              <div className="text-3xl md:text-4xl font-bold text-[#2563EB]">{p.stat}</div>
              <div className="mt-1 text-sm text-white/70">{p.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <Button variant="primary" size="lg" asChild>
            <Link href="/testimonials">Join These Companies</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
