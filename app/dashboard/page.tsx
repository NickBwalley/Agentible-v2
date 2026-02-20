"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TopMetricsBar } from "@/components/dashboard/TopMetricsBar";
import {
  CampaignsTable,
  formatLastActivity,
  type Campaign,
} from "@/components/dashboard/CampaignsTable";

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    emailsSent: 0,
    inboxRate: 0,
    openedEmails: 0,
    responded: 0,
    meetingsBooked: 0,
    qualifiedProspects: 0,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: campaignRows, error: campError } = await supabase
        .from("campaigns")
        .select("id, name, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (campError) {
        setLoading(false);
        return;
      }

      const campaignIds = (campaignRows ?? []).map((c) => c.id);
      let leadCounts: Record<string, number> = {};
      if (campaignIds.length > 0) {
        const { data: leadAgg } = await supabase
          .from("leads")
          .select("campaign_id")
          .in("campaign_id", campaignIds);
        const list = leadAgg ?? [];
        list.forEach((row) => {
          const cid = row.campaign_id as string;
          if (cid) leadCounts[cid] = (leadCounts[cid] ?? 0) + 1;
        });
      }

      const list: Campaign[] = (campaignRows ?? []).map((c) => ({
        id: c.id,
        name: c.name ?? "Unnamed campaign",
        status: (c.status as Campaign["status"]) ?? "draft",
        numProspects: leadCounts[c.id] ?? 0,
        opened: 0,
        notOpened: 0,
        meetings: 0,
        lastActivity: formatLastActivity(c.created_at ?? null),
      }));

      setCampaigns(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1419] pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/60">Monitor your outbound campaigns and pipeline</p>
          </div>
          <Link href="/dashboard/campaigns/create">
            <Button variant="primary" size="md">
              Create Campaign
            </Button>
          </Link>
        </div>

        <TopMetricsBar
          emailsSent={metrics.emailsSent}
          inboxRate={metrics.inboxRate}
          openedEmails={metrics.openedEmails}
          responded={metrics.responded}
          meetingsBooked={metrics.meetingsBooked}
          qualifiedProspects={metrics.qualifiedProspects}
        />

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Campaigns</h2>
          {loading ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center text-white/60">
              Loading campaigns…
            </div>
          ) : (
            <CampaignsTable
              campaigns={campaigns}
              onCampaignDeleted={(id) => setCampaigns((prev) => prev.filter((c) => c.id !== id))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
