"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Display status: maps DB status (draft|ready|running|paused|done) to UI */
export type CampaignStatusDisplay =
  | "draft"
  | "ready"
  | "running"
  | "paused"
  | "done";

export type Campaign = {
  id: string;
  name: string;
  status: CampaignStatusDisplay;
  numProspects: number;
  opened: number;
  notOpened: number;
  meetings: number;
  lastActivity: string;
};

interface CampaignsTableProps {
  campaigns: Campaign[];
  /** Called after a campaign is successfully deleted; use to update list (e.g. remove from state). */
  onCampaignDeleted?: (campaignId: string) => void;
}

const statusColors: Record<CampaignStatusDisplay, string> = {
  draft: "bg-white/10 text-white/60",
  ready: "bg-sky-500/20 text-sky-400",
  running: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-amber-500/20 text-amber-400",
  done: "bg-blue-500/20 text-blue-400",
};

function formatLastActivity(isoDate: string | null): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function CampaignsTable({ campaigns, onCampaignDeleted }: CampaignsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `Do you want to delete the campaign "${campaignName}"? This will permanently delete all leads and related data for this campaign.`
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(campaignId);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDeleteError("You must be signed in to delete a campaign.");
        return;
      }

      // Delete in order: leads -> lead_batches -> campaign (FKs and RLS)
      const { error: leadsError } = await supabase
        .from("leads")
        .delete()
        .eq("campaign_id", campaignId);
      if (leadsError) {
        setDeleteError(leadsError.message);
        return;
      }

      const { error: batchesError } = await supabase
        .from("lead_batches")
        .delete()
        .eq("campaign_id", campaignId);
      if (batchesError) {
        setDeleteError(batchesError.message);
        return;
      }

      const { error: campaignError } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId)
        .eq("user_id", user.id);
      if (campaignError) {
        setDeleteError(campaignError.message);
        return;
      }

      onCampaignDeleted?.(campaignId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      {deleteError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-white/10 text-red-400 text-sm" role="alert">
          {deleteError}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead className="text-white/70">Campaign Name</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
            <TableHead className="text-white/70">No of prospects</TableHead>
            <TableHead className="text-white/70">Opened</TableHead>
            <TableHead className="text-white/70">Not opened</TableHead>
            <TableHead className="text-white/70">Meetings</TableHead>
            <TableHead className="text-white/70">Last Activity</TableHead>
            <TableHead className="text-white/70"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-white/60">
                No campaigns yet. Create your first campaign to get started.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="border-white/10">
                <TableCell className="text-white font-medium">
                  {campaign.name || "Unnamed campaign"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusColors[campaign.status]}`}
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-white/90">{campaign.numProspects.toLocaleString()}</TableCell>
                <TableCell className="text-white/90">{campaign.opened.toLocaleString()}</TableCell>
                <TableCell className="text-white/90">{campaign.notOpened.toLocaleString()}</TableCell>
                <TableCell className="text-white/90">{campaign.meetings.toLocaleString()}</TableCell>
                <TableCell className="text-white/60 text-sm">{campaign.lastActivity}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    <Button variant="primary" size="sm">
                      View Campaign
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    disabled={deletingId !== null}
                    onClick={() => handleDeleteCampaign(campaign.id, campaign.name || "Unnamed campaign")}
                  >
                    {deletingId === campaign.id ? "Deleting…" : "Delete Campaign"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { formatLastActivity };
