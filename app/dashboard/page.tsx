"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TopMetricsBar } from "@/components/dashboard/TopMetricsBar";
import { CampaignsTable, type Campaign } from "@/components/dashboard/CampaignsTable";

// Mock data - replace with actual API calls
const mockMetrics = {
  emailsSent: 1250,
  inboxRate: 87.5,
  qualifiedReplies: 45,
  meetingsBooked: 12,
  costPerMeeting: 125,
};

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Q1 Enterprise Outreach",
    status: "active",
    sent: 500,
    qualifiedReplies: 18,
    meetings: 5,
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "SaaS Founders Campaign",
    status: "active",
    sent: 350,
    qualifiedReplies: 12,
    meetings: 4,
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    name: "Agency Partnership",
    status: "paused",
    sent: 200,
    qualifiedReplies: 8,
    meetings: 2,
    lastActivity: "3 days ago",
  },
];

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);

  return (
    <div className="min-h-screen bg-[#0f1419] pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Top Metrics Bar */}
        <TopMetricsBar {...mockMetrics} />

        {/* Campaigns Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Campaigns</h2>
          <CampaignsTable campaigns={campaigns} />
        </div>
      </div>
    </div>
  );
}
