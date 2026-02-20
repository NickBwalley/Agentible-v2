"use client";

import Link from "next/link";
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

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
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
                <TableCell>
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    <Button variant="ghost" size="sm">
                      View Campaign
                    </Button>
                  </Link>
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
