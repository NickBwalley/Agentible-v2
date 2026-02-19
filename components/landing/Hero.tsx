import Link from "next/link";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section
      id="trial"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center"
    >
      {/* Pill tag */}
      <div className="mb-6">
        <Pill>Automated AI SDR Systems</Pill>
      </div>

      {/* Main headline - Smartlead-style structure */}
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
        Convert leads into consistent{" "}
        <span className="text-[#2563EB] drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">
          revenue.
        </span>
      </h1>

      {/* First paragraph */}
      <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-xl leading-relaxed">
        Scale your outreach confidently with AI SDRs that work 24/7—lead
        generation, qualification, enrichment, and smart routing to turn
        prospects into closed deals.
      </p>

      {/* Second paragraph */}
      <p className="mt-3 max-w-2xl text-base text-white/75 sm:text-lg">
        Unlimited outreach, premium deliverability, and a unified system to
        handle your entire revenue cycle in one place.
      </p>

      {/* CTA - Primary: Start Your 30-Day Free Trial */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-5">
        <Button variant="primary" size="lg" showArrow asChild>
          <Link href="#trial">Start Your 30-Day Free Trial</Link>
        </Button>
        <Button variant="secondary" size="lg" showArrow asChild>
          <Link href="/pricing">View Pricing</Link>
        </Button>
      </div>

      {/* Social proof placeholder - G2 / Capterra style */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white/90">4.9</span>
          <span>out of 5 stars</span>
          <span className="flex">★★★★★</span>
        </div>
        <div className="h-4 w-px bg-white/30" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white/90">Trusted</span>
          <span>by sales teams</span>
        </div>
      </div>
    </section>
  );
}
