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

type LeadRow = {
  id: string;
  full_name: string | null;
  email: string;
  email_status: string;
  linkedin_url: string | null;
  position: string | null;
  country: string | null;
  org_name: string | null;
  org_description: string | null;
  org_website: string | null;
  created_at: string;
};

const DEFAULT_EMAIL_TEMPLATE = `Hi {{firstName}},

I noticed {{org_name}} is doing great work in the space. I'd love to share a quick idea that could help with [specific value].

Would you be open to a 15-minute call this week?

Best,
{{yourName}}`;

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    emailsDelivered: 0,
    inboxPct: 0,
    replies: 0,
    followUps: 0,
    qualifiedLeads: 0,
  });
  const [leadsPreviewOpen, setLeadsPreviewOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [startCampaignLoading, setStartCampaignLoading] = useState(false);

  useEffect(() => {
    async function loadCampaign() {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("name")
        .eq("id", campaignId)
        .maybeSingle();
      setCampaignName(data?.name ?? null);
    }
    loadCampaign();
  }, [campaignId]);

  useEffect(() => {
    async function loadLeads() {
      setLeadsLoading(true);
      const supabase = createClient();
      const { data: leadsData } = await supabase
        .from("leads")
        .select(
          "id, full_name, email, email_status, linkedin_url, position, country, org_name, org_description, org_website, created_at"
        )
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      const rows: LeadRow[] = (leadsData ?? []).map((l) => ({
        id: l.id,
        full_name: l.full_name ?? null,
        email: l.email ?? "",
        email_status: l.email_status ?? "unknown",
        linkedin_url: l.linkedin_url ?? null,
        position: l.position ?? null,
        country: l.country ?? null,
        org_name: l.org_name ?? null,
        org_description: l.org_description ?? null,
        org_website: l.org_website ?? null,
        created_at: l.created_at ?? "",
      }));

      setLeads(rows);
      const delivered = rows.filter((r) => r.email_status === "valid").length;
      setMetrics((m) => ({
        ...m,
        totalLeads: rows.length,
        emailsDelivered: delivered,
        inboxPct: rows.length > 0 ? (delivered / rows.length) * 100 : 0,
      }));
      setLeadsLoading(false);
    }
    loadLeads();
  }, [campaignId]);

  const downloadCsv = () => {
    if (leads.length === 0) return;
    const headers = [
      "full_name",
      "email",
      "email_status",
      "linkedin_url",
      "position",
      "country",
      "org_name",
      "org_description",
      "org_website",
      "created_at",
    ];
    const escape = (v: string | null) =>
      v == null
        ? ""
        : /[,"\n]/.test(v)
          ? `"${String(v).replace(/"/g, '""')}"`
          : v;
    const csvRows = leads.map((l) =>
      [
        escape(l.full_name),
        escape(l.email),
        escape(l.email_status),
        escape(l.linkedin_url),
        escape(l.position),
        escape(l.country),
        escape(l.org_name),
        escape(l.org_description),
        escape(l.org_website),
        escape(l.created_at),
      ].join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaignId}-leads.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartCampaign = async () => {
    setStartCampaignLoading(true);
    // Placeholder: in a full implementation this would call an API to start the campaign with the template
    await new Promise((r) => setTimeout(r, 800));
    setStartCampaignLoading(false);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Total Leads</div>
              <div className="text-2xl font-bold text-white">
                {metrics.totalLeads.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Emails Delivered</div>
              <div className="text-2xl font-bold text-white">
                {metrics.emailsDelivered.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Inbox %</div>
              <div className="text-2xl font-bold text-white">
                {metrics.inboxPct.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Replies</div>
              <div className="text-2xl font-bold text-white">
                {metrics.replies.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Follow-ups</div>
              <div className="text-2xl font-bold text-white">
                {metrics.followUps.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-1">Qualified Leads</div>
              <div className="text-2xl font-bold text-white">
                {metrics.qualifiedLeads.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 - Leads preview + Download / Preview */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Leads</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              variant="primary"
              size="sm"
              onClick={downloadCsv}
              disabled={leads.length === 0}
            >
              Download CSV
            </Button>
            <button
              type="button"
              onClick={() => setLeadsPreviewOpen((o) => !o)}
              className="inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg px-4 py-2 text-sm bg-[#7c3aed] text-white hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 focus:ring-offset-[#0f1419] disabled:opacity-50"
            >
              {leadsPreviewOpen ? "Hide preview" : "Preview"}
            </button>
          </div>
          {leadsPreviewOpen && (
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-x-auto">
              {leadsLoading ? (
                <div className="p-8 text-center text-white/60">Loading leads…</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-white/60">No leads yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Full Name</TableHead>
                      <TableHead className="text-white/70">Email</TableHead>
                      <TableHead className="text-white/70">Email Status</TableHead>
                      <TableHead className="text-white/70">LinkedIn</TableHead>
                      <TableHead className="text-white/70">Position</TableHead>
                      <TableHead className="text-white/70">Country</TableHead>
                      <TableHead className="text-white/70">Org Name</TableHead>
                      <TableHead className="text-white/70">Org Description</TableHead>
                      <TableHead className="text-white/70">Org Website</TableHead>
                      <TableHead className="text-white/70">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id} className="border-white/10">
                        <TableCell className="text-white font-medium">
                          {lead.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/90">{lead.email}</TableCell>
                        <TableCell
                          className={`text-sm ${
                            lead.email_status === "valid"
                              ? "text-emerald-400 font-medium"
                              : "text-white/80"
                          }`}
                        >
                          {lead.email_status}
                        </TableCell>
                        <TableCell className="text-white/80 text-sm max-w-[120px] truncate">
                          {lead.linkedin_url ? (
                            <a
                              href={lead.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2563EB] hover:underline"
                            >
                              Link
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-white/80 text-sm">
                          {lead.position ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/80 text-sm">
                          {lead.country ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/80 text-sm">
                          {lead.org_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/70 text-sm max-w-[200px] truncate">
                          {lead.org_description ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/80 text-sm max-w-[140px] truncate">
                          {lead.org_website ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {lead.created_at
                            ? new Date(lead.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>

        {/* Section 3 - Email template + Start campaign */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Email template
          </h2>
          <p className="text-white/60 text-sm mb-2">
            Customize your outreach. Use placeholders:{" "}
            <span className="text-[#93c5fd] font-mono">{`{{firstName}}`}</span>,{" "}
            <span className="text-[#93c5fd] font-mono">{`{{yourName}}`}</span>,{" "}
            <span className="text-[#93c5fd] font-mono">{`{{org_name}}`}</span>.
          </p>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              AI Generated Email Template
            </label>
            <textarea
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-white/10 bg-[#0f1419] px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y min-h-[200px]"
              placeholder="Hi {{firstName}}, ..."
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleStartCampaign}
            disabled={startCampaignLoading || leads.length === 0}
          >
            {startCampaignLoading ? "Starting…" : "Start campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
}
