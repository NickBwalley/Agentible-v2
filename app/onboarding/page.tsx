"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [slaTarget, setSlaTarget] = useState(60);
  const [routingEnabled, setRoutingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (userLoading) return;
    if (!user) router.replace("/signin");
  }, [user, userLoading, router]);

  async function handleCRMConnect(provider: string) {
    setLoading(true);
    setSelectedCRM(provider);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("users")
        .update({
          crm_provider: provider,
          crm_connected: true,
        })
        .eq("id", user.id);
    }

    setLoading(false);
    setStep(2);
  }

  async function handleSLASubmit() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("users")
        .update({ sla_target_minutes: slaTarget })
        .eq("id", user.id);
    }

    setLoading(false);
    setStep(3);
  }

  async function handleRoutingSubmit() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("users")
        .update({
          routing_enabled: routingEnabled,
          routing_method: routingEnabled ? "round_robin" : null,
        })
        .eq("id", user.id);
    }

    setLoading(false);
    router.push("/dashboard");
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="text-white/60">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <span className={step >= 1 ? "text-[#2563EB] font-semibold" : ""}>
              Step 1
            </span>
            <span className="text-white/40">→</span>
            <span className={step >= 2 ? "text-[#2563EB] font-semibold" : ""}>
              Step 2
            </span>
            <span className="text-white/40">→</span>
            <span className={step >= 3 ? "text-[#2563EB] font-semibold" : ""}>
              Step 3
            </span>
          </div>
          <CardTitle className="text-2xl text-white">
            {step === 1 && "Connect Your CRM"}
            {step === 2 && "Set Your Response Target"}
            {step === 3 && "Configure Routing (Optional)"}
          </CardTitle>
          <CardDescription className="text-white/60">
            {step === 1 && "Choose your CRM to sync leads automatically"}
            {step === 2 && "Define what counts as a fast response"}
            {step === 3 && "Decide if we should auto-assign incoming leads"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-20 justify-start text-left border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => handleCRMConnect("hubspot")}
                disabled={loading}
              >
                <div>
                  <div className="font-semibold text-lg">HubSpot</div>
                  <div className="text-sm text-white/60">
                    Connect your HubSpot CRM
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full h-20 justify-start text-left border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => handleCRMConnect("salesforce")}
                disabled={loading}
              >
                <div>
                  <div className="font-semibold text-lg">Salesforce</div>
                  <div className="text-sm text-white/60">
                    Connect your Salesforce CRM
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full h-20 justify-start text-left border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => handleCRMConnect("google_drive")}
                disabled={loading}
              >
                <div>
                  <div className="font-semibold text-lg">Google Drive</div>
                  <div className="text-sm text-white/60">
                    Connect your Google Drive
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-white/80 hover:bg-white/10"
                onClick={() => router.push("/dashboard")}
              >
                I&apos;ll do this later
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="sla-target" className="text-white/90">Target Response Time</Label>
                <Select
                  value={slaTarget.toString()}
                  onValueChange={(val) => setSlaTarget(parseInt(val))}
                  dark
                >
                  <SelectTrigger id="sla-target" className="border-white/20 bg-white/5 text-white focus:ring-[#2563EB] focus:ring-offset-[#0f1419]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-white/50">
                  We&apos;ll alert you when leads exceed this response time
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleSLASubmit}
                disabled={loading}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white/90">Do you want automatic lead assignment?</Label>
                <div className="space-y-2">
                  <Button
                    variant={routingEnabled ? "primary" : "outline"}
                    className={`w-full justify-start text-left h-auto py-4 ${!routingEnabled ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : ""}`}
                    onClick={() => setRoutingEnabled(true)}
                  >
                    <div>
                      <div className="font-semibold">Yes, auto-assign leads</div>
                      <div className="text-sm opacity-75">
                        We&apos;ll route leads based on rules you configure
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant={!routingEnabled ? "primary" : "outline"}
                    className={`w-full justify-start text-left h-auto py-4 ${routingEnabled ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : ""}`}
                    onClick={() => setRoutingEnabled(false)}
                  >
                    <div>
                      <div className="font-semibold">No, just monitor</div>
                      <div className="text-sm opacity-75">
                        We&apos;ll alert you but won&apos;t change assignments
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleRoutingSubmit}
                disabled={loading}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
