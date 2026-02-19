"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const PLANS = [
  {
    name: "Basic",
    price: "$297",
    period: "/ month",
    tagline: "For solo founders testing outbound.",
    features: [
      "1 sending account",
      "Up to 1,000 emails / month",
      "3-email sequence",
      "Basic personalization",
      "Campaign dashboard",
      "Email support",
    ],
    cta: "Start Basic",
    ctaHref: "/signup",
  },
  {
    name: "Starter",
    price: "$697",
    period: "/ month",
    tagline: "For small teams needing consistent pipeline.",
    features: [
      "Up to 3 sending accounts",
      "Up to 5,000 emails / month",
      "4-email sequence",
      "Improved personalization",
      "Reply classification",
      "Basic onboarding guidance",
    ],
    cta: "Start Starter",
    ctaHref: "/signup",
    popular: true,
  },
  {
    name: "Pro",
    price: "$1,500",
    period: "/ month",
    tagline: "For teams scaling outbound seriously.",
    features: [
      "Up to 10 sending accounts",
      "Up to 20,000 emails / month",
      "Advanced deliverability setup",
      "A/B testing support",
      "Priority support",
    ],
    cta: "Start Pro",
    ctaHref: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For high-volume or regulated environments.",
    features: [
      "Dedicated infrastructure",
      "Compliance controls",
      "Multi-channel expansion",
      "Account management",
      "SLA support",
    ],
    cta: "Contact Sales",
    ctaHref: "/signup",
  },
];

export function PricingPageContent() {
  return (
    <div className="pt-24 pb-20">
      {/* Header */}
      <section className="px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          Straightforward pricing for measurable pipeline.
        </h1>
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          No hidden usage traps.
          <br />
          Scale only when results justify it.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="mt-16 px-6 max-w-6xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 text-white flex flex-col ${
                plan.popular
                  ? "border-[#2563EB] bg-[#2563EB]/10 shadow-[0_0_30px_rgba(37,99,235,0.15)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB] text-white">
                  Most popular
                </span>
              )}
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1 flex-wrap">
                <span className="text-4xl font-bold text-[#2563EB]">{plan.price}</span>
                {plan.period && <span className="text-sm text-white/70">{plan.period}</span>}
              </div>
              <p className="mt-3 text-sm text-white/70 mb-6">{plan.tagline}</p>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">Includes:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <span className="text-[#2563EB] mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  variant={plan.popular ? "primary" : "secondary"}
                  size="md"
                  className="w-full"
                  asChild
                >
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
