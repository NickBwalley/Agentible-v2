"use client";

import { useState, useEffect, useCallback } from "react";
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
    totalLeads: 0,
    emailsSent: 0,
    notSent: 0,
    inboxRate: 0,
    openedEmails: 0,
    responded: 0,
    meetingsBooked: 0,
    followUps: 0,
  });

  const loadDashboard = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
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
      console.error("Dashboard campaigns load error:", campError);
      setLoading(false);
      return;
    }

    const campaignIds = (campaignRows ?? []).map((c) => c.id);
    let leadCounts: Record<string, number> = {};
    let sentByCampaign: Record<string, number> = {};
    let notSentByCampaign: Record<string, number> = {};

    if (campaignIds.length > 0) {
      const { data: leadAgg, error: leadsError } = await supabase
        .from("leads")
        .select("campaign_id")
        .in("campaign_id", campaignIds);
      if (leadsError) console.error("Dashboard leads load error:", leadsError);
      const leadList = leadAgg ?? [];
      leadList.forEach((row) => {
        const cid = row.campaign_id as string;
        if (cid) leadCounts[cid] = (leadCounts[cid] ?? 0) + 1;
      });

      const { data: sendResults, error: sendError } = await supabase
        .from("campaign_send_results")
        .select("campaign_id, status")
        .in("campaign_id", campaignIds);
      if (sendError) console.error("Dashboard campaign_send_results load error:", sendError);
      (sendResults ?? []).forEach((row) => {
        const cid = row.campaign_id as string;
        if (row.status === "sent") sentByCampaign[cid] = (sentByCampaign[cid] ?? 0) + 1;
        if (row.status === "not-sent") notSentByCampaign[cid] = (notSentByCampaign[cid] ?? 0) + 1;
      });
    }

    const list: Campaign[] = (campaignRows ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? "Unnamed campaign",
      status: (c.status as Campaign["status"]) ?? "draft",
      totalLeads: leadCounts[c.id] ?? 0,
      sent: sentByCampaign[c.id] ?? 0,
      notSent: notSentByCampaign[c.id] ?? 0,
      notOpened: 0,
      lastActivity: formatLastActivity(c.created_at ?? null),
    }));

    const totalLeads = Object.values(leadCounts).reduce((a, b) => a + b, 0);
    const totalSent = Object.values(sentByCampaign).reduce((a, b) => a + b, 0);
    const totalNotSent = Object.values(notSentByCampaign).reduce((a, b) => a + b, 0);
    setMetrics({
      totalLeads,
      emailsSent: totalSent,
      notSent: totalNotSent,
      inboxRate: totalLeads > 0 ? (totalSent / totalLeads) * 100 : 0,
      openedEmails: 0,
      responded: 0,
      meetingsBooked: 0,
      followUps: 0,
    });

    setCampaigns(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const onFocus = () => loadDashboard();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadDashboard]);

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
          totalLeads={metrics.totalLeads}
          emailsSent={metrics.emailsSent}
          notSent={metrics.notSent}
          inboxRate={metrics.inboxRate}
          openedEmails={metrics.openedEmails}
          responded={metrics.responded}
          meetingsBooked={metrics.meetingsBooked}
          followUps={metrics.followUps}
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
