"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

type BillingPeriod = "monthly" | "annually";

const STARTER_MONTHLY = 99;
const STARTER_ANNUAL_PER_MO = 79;
const STARTER_ANNUAL_TOTAL = 948;
const PRO_MONTHLY = 999;
const PRO_ANNUAL_PER_MO = 599;
const PRO_ANNUAL_TOTAL = 7188;

const PLANS_BASE = [
  {
    key: "starter",
    name: "Starter",
    tagline: "Test and learn",
    hasPrice: true,
    specs: ["Up to 1,000 leads", "Basic enrichment", "Core AI outreach"],
    features: ["Email support", "Standard onboarding", "Documentation access"],
    popular: false,
  },
  {
    key: "professional",
    name: "Professional",
    tagline: "Most popular",
    hasPrice: true,
    specs: ["Unlimited leads", "Full enrichment", "Advanced AI sequences"],
    features: ["Everything in Starter", "Priority support", "Dedicated onboarding", "CRM integrations"],
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    tagline: "Higher volume, more results",
    hasPrice: false,
    specs: ["Custom volume", "Dedicated infrastructure", "Advanced compliance"],
    features: ["Everything in Professional", "Dedicated CSM", "SLA & custom contracts", "White-glove setup"],
    popular: false,
    cta: "Contact Sales",
    ctaHref: "/book-a-demo",
  },
];

const ALL_PLANS_INCLUDE = [
  { category: "Outreach", items: ["AI-researched emails", "Multi-channel sequences", "Campaign scheduling"] },
  { category: "Prospecting", items: ["Lead enrichment", "Basic lead scoring", "Integration with your CRM"] },
  { category: "Support", items: ["Documentation", "Email support", "Onboarding"] },
];

const WHICH_PLAN = [
  { title: "I'm testing AI outreach", desc: "See if AI can win conversations before scaling", plan: "Starter", href: "/book-a-demo" },
  { title: "My outreach works, I want consistency", desc: "Book predictable meetings you can report on", plan: "Professional", href: "/book-a-demo" },
  { title: "Outreach is core to our growth", desc: "Run multi-sequence campaigns at scale", plan: "Enterprise", href: "/book-a-demo" },
];

function getPlanPrice(planKey: string, period: BillingPeriod) {
  if (planKey === "starter") {
    return period === "monthly"
      ? { primary: "$99", sub: "/mo", billing: "Billed monthly" }
      : { primary: "$79", sub: "/mo", billing: `$${STARTER_ANNUAL_TOTAL} billed annually` };
  }
  if (planKey === "professional") {
    return period === "monthly"
      ? { primary: "$999", sub: "/mo", billing: "Billed monthly" }
      : { primary: "$599", sub: "/mo", billing: `$${PRO_ANNUAL_TOTAL} billed annually` };
  }
  return { primary: "Custom", sub: "", billing: "Based on your goals" };
}

export function PricingPageContent() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div className="pt-24 pb-20">
      {/* Hero — no buttons, trust line only */}
      <section className="px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          Pricing that respects your pipeline goals and your budget
        </h1>
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Transparent pricing with no surprises. Scale confidently with predictable costs and flexible terms.
        </p>
        <p className="mt-8 text-sm text-white/60">Trusted by teams worldwide</p>
      </section>

      {/* Billing toggle */}
      <section className="mt-10 px-6 max-w-6xl mx-auto flex justify-center">
        <div className="inline-flex rounded-lg border border-white/20 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === "monthly"
                ? "bg-[#2563EB] text-white"
                : "text-white/80 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("annually")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === "annually"
                ? "bg-[#2563EB] text-white"
                : "text-white/80 hover:text-white"
            }`}
          >
            Annually
            <span className="ml-1.5 text-[#2563EB]">(-20%)</span>
          </button>
        </div>
      </section>

      {/* Pricing cards */}
      <section id="pricing-compare" className="mt-10 px-6 max-w-6xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS_BASE.map((plan) => {
            const price = getPlanPrice(plan.key, billingPeriod);
            const cta = "cta" in plan ? plan.cta : "Choose Plan";
            const ctaHref = "ctaHref" in plan ? plan.ctaHref : "/book-a-demo";
            return (
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
                <p className="text-sm font-medium text-[#2563EB]">{plan.tagline}</p>
                <h2 className="mt-1 text-xl font-bold">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-1 flex-wrap">
                  <span className="text-3xl font-bold text-[#2563EB]">{price.primary}</span>
                  {price.sub && <span className="text-sm text-white/70">{price.sub}</span>}
                </div>
                <p className="mt-1 text-sm text-white/60">{price.billing}</p>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Specs</p>
                  <ul className="mt-2 space-y-2">
                    {plan.specs.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm">
                        <span className="text-[#2563EB]">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Features</p>
                  <ul className="mt-2 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="text-[#2563EB]">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex-1 flex flex-col justify-end">
                  <Button variant={plan.popular ? "primary" : "secondary"} size="md" className="w-full" asChild>
                    <Link href={ctaHref}>{cta}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-white/60">Cancel anytime. No long-term lock-in.</p>
      </section>

      {/* All plans include */}
      <section className="mt-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center">All plans include</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {ALL_PLANS_INCLUDE.map((group) => (
            <div key={group.category} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">{group.category}</h3>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                    <span className="text-[#2563EB]">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Which plan */}
      <section className="mt-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center">Which plan should I choose?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {WHICH_PLAN.map((item) => (
            <Link
              key={item.plan}
              href={item.href}
              className="block rounded-xl border border-white/10 bg-white/5 p-6 text-white hover:border-[#2563EB]/50 hover:bg-white/10 transition-colors"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-white/70">{item.desc}</p>
              <p className="mt-4 text-sm font-medium text-[#2563EB]">{item.plan} →</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
