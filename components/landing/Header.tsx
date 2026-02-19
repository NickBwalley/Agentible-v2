"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { NavDropdown } from "./NavDropdown";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/lib/hooks/use-user";

// Dropdown items aligned with AI SDR / RevOps platform (Agentible)
const productsItems = [
  { label: "AI SDR", href: "/products/ai-sdr" },
  { label: "Lead Generation", href: "/products/lead-generation" },
  { label: "Lead Enrichment", href: "/products/lead-enrichment" },
  { label: "Smart Routing", href: "/products/smart-routing" },
  { label: "Analytics & Reporting", href: "/products/analytics" },
];

const solutionsItems = [
  { label: "For Sales Teams", href: "/solutions/sales-teams" },
  { label: "For RevOps", href: "/solutions/revops" },
  { label: "For B2B Outreach", href: "/solutions/b2b" },
  { label: "For Agencies", href: "/solutions/agencies" },
];

const resourcesItems = [
  { label: "Blog", href: "/blog" },
  { label: "Documentation", href: "/docs" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Help Center", href: "/help" },
];

const toolsItems = [
  { label: "ROI Calculator", href: "/tools/roi-calculator" },
  { label: "Lead Scoring", href: "/tools/lead-scoring" },
  { label: "API", href: "/developers" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-[#0f1419]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-8">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/logo/Agentible-logo.jpeg"
              alt="Agentible"
              fill
              className="object-contain"
              sizes="36px"
              priority
            />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">
            Agentible
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <NavDropdown label="Products" items={productsItems} />
          <NavDropdown label="Solutions" items={solutionsItems} />
          <Link
            href="/pricing"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/integrations"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Integrations
          </Link>
          <NavDropdown label="Resources" items={resourcesItems} />
          <NavDropdown label="Tools" items={toolsItems} />
        </nav>

        {/* Actions: when logged in show UserMenu, else Book a Demo + Log In */}
        <div className="flex items-center gap-4 shrink-0">
          {loading ? (
            <span className="h-9 w-9 rounded-full bg-white/10 animate-pulse" aria-hidden />
          ) : user ? (
            <UserMenu profile={profile} user={user} />
          ) : (
            <>
              <Button variant="primary" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/book-a-demo">Book a Demo</Link>
              </Button>
              <Link
                href="/signin"
                className="hidden sm:inline text-sm font-medium text-white/80 hover:text-white transition-colors border-b border-dashed border-white/40 hover:border-white"
              >
                Log In
              </Link>
              <Button variant="primary" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0f1419] px-6 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {productsItems.map((i) => (
            <Link key={i.href} href={i.href} className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>{i.label}</Link>
          ))}
          {solutionsItems.map((i) => (
            <Link key={i.href} href={i.href} className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>{i.label}</Link>
          ))}
          <Link href="/pricing" className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link href="/integrations" className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>Integrations</Link>
          {resourcesItems.map((i) => (
            <Link key={i.href} href={i.href} className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>{i.label}</Link>
          ))}
          {toolsItems.map((i) => (
            <Link key={i.href} href={i.href} className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>{i.label}</Link>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard/profile" className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>Profile</Link>
                <Link href="/dashboard/payment-history" className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>Payment History</Link>
                <Link href="/auth/signout" className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>Log Out</Link>
              </>
            ) : (
              <>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/book-a-demo" onClick={() => setMobileOpen(false)}>Book a Demo</Link>
                </Button>
                <Link href="/signin" className="block text-white/90 hover:text-white py-1" onClick={() => setMobileOpen(false)}>Log In</Link>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
