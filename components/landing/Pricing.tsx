import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="px-6 py-24 max-w-5xl mx-auto"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
        Simple, transparent pricing
      </h2>
      <p className="mt-4 text-center text-white/80 max-w-2xl mx-auto">
        Start free. Scale as you grow. No hidden fees.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Starter", price: "Free", desc: "14-day trial", features: ["Up to 1,000 leads", "Basic enrichment", "Email support"] },
          { name: "Professional", price: "Custom", desc: "For teams", features: ["Unlimited leads", "Full enrichment", "Priority support"] },
          { name: "Enterprise", price: "Custom", desc: "For scale", features: ["Custom integrations", "Dedicated CSM", "SLA"] },
        ].map((plan) => (
          <div
            key={plan.name}
            className="rounded-xl border border-white/10 bg-white/5 p-6 text-white"
          >
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1 text-2xl font-bold text-[#2563EB]">{plan.price}</p>
            <p className="text-sm text-white/70">{plan.desc}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="text-[#2563EB]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button variant="primary" size="md" className="mt-6 w-full" asChild>
              <Link href="/#trial">Start 30-Day Free Trial</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
