import { Button } from "@/components/ui/Button";
import { Database } from "lucide-react";
import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center rounded-xl">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2563EB]/20 mb-6">
          <Database className="h-10 w-10 text-[#2563EB]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Connect Your CRM to Get Started
        </h2>
        <p className="text-white/70 mb-8">
          We&apos;ll sync your leads and start monitoring response times
          automatically. You&apos;ll see real-time metrics and alerts right here.
        </p>
        <Link href="/onboarding">
          <Button variant="primary" size="lg">
            Connect CRM
          </Button>
        </Link>
      </div>
    </div>
  );
}
