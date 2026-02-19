import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
      {/* Main headline */}
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
        Predictable qualified meetings from cold email.
      </h1>
      <p className="mt-4 max-w-3xl text-xl text-white/70 sm:text-2xl">
        Not vanity metrics. Real pipeline.
      </p>

      {/* Sub-headline */}
      <p className="mt-6 max-w-2xl text-lg text-white/80 sm:text-xl leading-relaxed">
        We run targeted outbound campaigns that generate interested replies and booked calls without damaging your domain or brand.
      </p>

      {/* CTA */}
      <div className="mt-10">
        <Button variant="primary" size="lg" showArrow asChild>
          <Link href="/book-a-demo">Book a Demo</Link>
        </Button>
      </div>

      {/* Trust Line */}
      <p className="mt-6 text-sm text-white/60">
        Built for founders, agencies, and B2B teams that need pipeline now.
      </p>
    </section>
  );
}
