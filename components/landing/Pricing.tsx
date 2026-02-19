"use client";

import { useState } from "react";

type BillingPeriod = "monthly" | "annually";

const PLANS = [
  {
    name: "Starter",
    monthlyPrice: 99,
    annualPerMo: 79,
    annualTotal: 948,
    features: ["Up to 1,000 leads", "Basic enrichment", "Email support"],
  },
  {
    name: "Professional",
    monthlyPrice: 999,
    annualPerMo: 599,
    annualTotal: 7188,
    features: ["Unlimited leads", "Full enrichment", "Priority support"],
  },
  {
    name: "Enterprise",
    custom: true,
    features: ["Custom integrations", "Dedicated CSM", "SLA"],
  },
];

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="pricing" className="px-6 py-24 max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
        Simple, transparent pricing
      </h2>
      <p className="mt-4 text-center text-white/80 max-w-2xl mx-auto">
        Start with Starter or scale with Professional. No hidden fees.
      </p>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-white/20 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === "monthly" ? "bg-[#2563EB] text-white" : "text-white/80 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("annually")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === "annually" ? "bg-[#2563EB] text-white" : "text-white/80 hover:text-white"
            }`}
          >
            Annually <span className="ml-1 text-[#2563EB]">(-20%)</span>
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCustom = "custom" in plan && plan.custom;
          const priceDisplay = isCustom
            ? "Custom"
            : billingPeriod === "monthly"
              ? `$${plan.monthlyPrice}/mo`
              : `$${plan.annualPerMo}/mo`;
          const billingNote = isCustom
            ? "For scale"
            : billingPeriod === "annually"
              ? `$${plan.annualTotal} billed annually`
              : "Billed monthly";

          return (
            <div
              key={plan.name}
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-white"
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold text-[#2563EB]">{priceDisplay}</p>
              <p className="text-sm text-white/70">{billingNote}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-[#2563EB]">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-white/60">Trusted by teams worldwide</p>
    </section>
  );
}
