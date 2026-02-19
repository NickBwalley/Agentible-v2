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

export type Campaign = {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "draft";
  sent: number;
  qualifiedReplies: number;
  meetings: number;
  lastActivity: string;
};

interface CampaignsTableProps {
  campaigns: Campaign[];
}

const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-amber-500/20 text-amber-400",
  completed: "bg-blue-500/20 text-blue-400",
  draft: "bg-white/10 text-white/60",
};

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead className="text-white/70">Campaign Name</TableHead>
            <TableHead className="text-white/70">Status</TableHead>
            <TableHead className="text-white/70">Sent</TableHead>
            <TableHead className="text-white/70">Qualified Replies</TableHead>
            <TableHead className="text-white/70">Meetings</TableHead>
            <TableHead className="text-white/70">Last Activity</TableHead>
            <TableHead className="text-white/70"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-white/60">
                No campaigns yet. Create your first campaign to get started.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="border-white/10">
                <TableCell className="text-white font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusColors[campaign.status]}`}
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-white/90">{campaign.sent.toLocaleString()}</TableCell>
                <TableCell className="text-white/90">{campaign.qualifiedReplies.toLocaleString()}</TableCell>
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
