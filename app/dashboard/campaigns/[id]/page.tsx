"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

// Metrics initialized to 0 until wired to real data
const campaignMetrics = {
  delivered: 0,
  inboxRate: 0,
  replies: 0,
  qualified: 0,
  meetings: 0,
};

const mockReplies: Array<{
  id: string;
  leadName: string;
  company: string;
  replyType: "positive" | "neutral" | "negative";
  qualified: boolean;
}> = [];

const replyTypeColors = {
  positive: "bg-emerald-500/20 text-emerald-400",
  neutral: "bg-amber-500/20 text-amber-400",
  negative: "bg-red-500/20 text-red-400",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [replies, setReplies] = useState(mockReplies);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("name")
        .eq("id", campaignId)
        .maybeSingle();
      setCampaignName(data?.name ?? null);
    }
    load();
  }, [campaignId]);

  const toggleQualified = (replyId: string) => {
    setReplies((prev) =>
      prev.map((reply) =>
        reply.id === replyId ? { ...reply, qualified: !reply.qualified } : reply
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#0f1419] pt-8 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            {campaignName ?? "Campaign Details"}
          </h1>
          <p className="text-white/60 text-sm">Campaign ID: {campaignId}</p>
        </div>

        {/* Section 1 - Metrics */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Delivered</div>
              <div className="text-2xl font-bold text-white">
                {campaignMetrics.delivered.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Inbox %</div>
              <div className="text-2xl font-bold text-white">
                {campaignMetrics.inboxRate.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Replies</div>
              <div className="text-2xl font-bold text-white">
                {campaignMetrics.replies.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Qualified</div>
              <div className="text-2xl font-bold text-white">
                {campaignMetrics.qualified.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Meetings</div>
              <div className="text-2xl font-bold text-white">
                {campaignMetrics.meetings.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 - Replies List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Replies List</h2>
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/70">Lead Name</TableHead>
                  <TableHead className="text-white/70">Company</TableHead>
                  <TableHead className="text-white/70">Reply Type</TableHead>
                  <TableHead className="text-white/70">Qualified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-white/60">
                      No replies yet.
                    </TableCell>
                  </TableRow>
                ) : (
                replies.map((reply) => (
                  <TableRow key={reply.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{reply.leadName}</TableCell>
                    <TableCell className="text-white/90">{reply.company}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${replyTypeColors[reply.replyType]}`}
                      >
                        {reply.replyType.charAt(0).toUpperCase() + reply.replyType.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleQualified(reply.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          reply.qualified ? "bg-[#2563EB]" : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            reply.qualified ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
