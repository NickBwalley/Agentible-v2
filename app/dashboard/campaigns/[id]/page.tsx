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
import { OutreachBriefForm } from "@/components/dashboard/outreach/OutreachBriefForm";
import { TemplateEditor } from "@/components/dashboard/outreach/TemplateEditor";
import { TemplatePreview } from "@/components/dashboard/outreach/TemplatePreview";
import { ConfirmAndStartBlock } from "@/components/dashboard/outreach/ConfirmAndStartBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "@/components/icons/Sparkles";

type LeadRow = {
  id: string;
  lead_batch_id: string | null;
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

type OutreachMessageRow = {
  id: string;
  lead_id: string;
  direction: "outbound" | "inbound";
  subject: string;
  body_plain: string;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
};

const DEFAULT_SUBJECT = "Quick question – {{firstName}}";

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
  const [icpDescription, setIcpDescription] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [yourName, setYourName] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState(DEFAULT_SUBJECT);
  const [generateTemplateLoading, setGenerateTemplateLoading] = useState(false);
  const [generateTemplateError, setGenerateTemplateError] = useState<
    string | null
  >(null);
  const [sendPhase, setSendPhase] = useState<
    "idle" | "sending" | "success" | "error" | "timeout"
  >("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendErrorCode, setSendErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [campaignAlreadySent, setCampaignAlreadySent] = useState(false);
  const [templateGeneratedOnce, setTemplateGeneratedOnce] = useState(false);
  const [saveBriefLoading, setSaveBriefLoading] = useState(false);
  const [saveTemplateLoading, setSaveTemplateLoading] = useState(false);
  const [saveBriefMessage, setSaveBriefMessage] = useState<string | null>(null);
  const [saveTemplateMessage, setSaveTemplateMessage] = useState<string | null>(
    null,
  );
  const [outreachLoadDone, setOutreachLoadDone] = useState(false);
  const [outreachMessages, setOutreachMessages] = useState<OutreachMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{
    msg: OutreachMessageRow;
    leadName: string;
    leadEmail: string;
  } | null>(null);

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
          "id, lead_batch_id, full_name, email, email_status, linkedin_url, position, country, org_name, org_description, org_website, created_at",
        )
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      const rows: LeadRow[] = (leadsData ?? []).map((l) => ({
        id: l.id,
        lead_batch_id: l.lead_batch_id ?? null,
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
      const totalLeads = rows.length;

      const { data: sendResults } = await supabase
        .from("campaign_send_results")
        .select("status")
        .eq("campaign_id", campaignId);

      const emailsDelivered = (sendResults ?? []).filter(
        (r) => r.status === "sent",
      ).length;
      const inboxPct =
        totalLeads > 0 && emailsDelivered > 0
          ? (emailsDelivered / totalLeads) * 100
          : 0;

      setCampaignAlreadySent((sendResults ?? []).length > 0);

      const { data: messagesData } = await supabase
        .from("outreach_messages")
        .select("id, lead_id, direction, subject, body_plain, sent_at, received_at, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });

      const messages: OutreachMessageRow[] = (messagesData ?? []).map((row) => ({
        id: row.id,
        lead_id: row.lead_id,
        direction: row.direction as "outbound" | "inbound",
        subject: row.subject ?? "",
        body_plain: row.body_plain ?? "",
        sent_at: row.sent_at ?? null,
        received_at: row.received_at ?? null,
        created_at: row.created_at ?? "",
      }));
      setOutreachMessages(messages);
      const repliesCount = messages.filter((m) => m.direction === "inbound").length;

      setMetrics((m) => ({
        ...m,
        totalLeads,
        emailsDelivered,
        inboxPct,
        replies: repliesCount,
      }));
      setLeadsLoading(false);
    }
    loadLeads();
  }, [campaignId]);

  const refreshSendMetrics = async () => {
    const supabase = createClient();
    const { data: sendResults } = await supabase
      .from("campaign_send_results")
      .select("status")
      .eq("campaign_id", campaignId);
    const emailsDelivered = (sendResults ?? []).filter(
      (r) => r.status === "sent",
    ).length;
    const totalLeads = leads.length;
    const inboxPct =
      totalLeads > 0 && emailsDelivered > 0
        ? (emailsDelivered / totalLeads) * 100
        : 0;

    const { data: messagesData } = await supabase
      .from("outreach_messages")
      .select("id, lead_id, direction, subject, body_plain, sent_at, received_at, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    const messages: OutreachMessageRow[] = (messagesData ?? []).map((row) => ({
      id: row.id,
      lead_id: row.lead_id,
      direction: row.direction as "outbound" | "inbound",
      subject: row.subject ?? "",
      body_plain: row.body_plain ?? "",
      sent_at: row.sent_at ?? null,
      received_at: row.received_at ?? null,
      created_at: row.created_at ?? "",
    }));
    setOutreachMessages(messages);
    const repliesCount = messages.filter((m) => m.direction === "inbound").length;

    setMetrics((m) => ({
      ...m,
      emailsDelivered,
      inboxPct,
      replies: repliesCount,
    }));
  };

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
      ].join(","),
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

  const handleGenerateTemplate = async () => {
    setGenerateTemplateError(null);
    setGenerateTemplateLoading(true);
    try {
      const sampleLeads = leads.slice(0, 5).map((l) => ({
        full_name: l.full_name,
        position: l.position,
        org_name: l.org_name,
        org_description: l.org_description,
      }));
      const res = await fetch("/api/generate-outreach-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icpDescription,
          offerDescription,
          sampleLeads,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateTemplateError(data.error ?? "Failed to generate template");
        return;
      }
      if (data.subject != null && String(data.subject).trim())
        setSubjectTemplate(String(data.subject).trim());
      if (data.template) setEmailTemplate(data.template);
      setTemplateGeneratedOnce(true);
    } catch (e) {
      setGenerateTemplateError(
        e instanceof Error ? e.message : "Request failed",
      );
    } finally {
      setGenerateTemplateLoading(false);
    }
  };

  useEffect(() => {
    if (!campaignId || outreachLoadDone) return;
    async function loadSavedOutreach() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("campaign_outreach_saves")
        .select(
          "icp_description, offer_description, subject_template, body_template",
        )
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        if (data.icp_description != null)
          setIcpDescription(data.icp_description);
        if (data.offer_description != null)
          setOfferDescription(data.offer_description);
        if (data.subject_template != null && data.subject_template.trim())
          setSubjectTemplate(data.subject_template.trim());
        if (data.body_template != null) setEmailTemplate(data.body_template);
      }
      setOutreachLoadDone(true);
    }
    loadSavedOutreach();
  }, [campaignId, outreachLoadDone]);

  const handleSaveBrief = async () => {
    setSaveBriefMessage(null);
    setSaveBriefLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveBriefMessage("You must be signed in to save.");
        return;
      }
      const leadBatchId = leads[0]?.lead_batch_id ?? null;
      const { error } = await supabase.from("campaign_outreach_saves").upsert(
        {
          user_id: user.id,
          campaign_id: campaignId,
          lead_batch_id: leadBatchId,
          icp_description: icpDescription,
          offer_description: offerDescription,
          subject_template: subjectTemplate,
          body_template: emailTemplate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,campaign_id" },
      );
      if (error) throw error;
      setSaveBriefMessage("Brief saved.");
    } catch (e) {
      setSaveBriefMessage(
        e instanceof Error ? e.message : "Failed to save brief.",
      );
    } finally {
      setSaveBriefLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaveTemplateMessage(null);
    setSaveTemplateLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveTemplateMessage("You must be signed in to save.");
        return;
      }
      const leadBatchId = leads[0]?.lead_batch_id ?? null;
      const { error } = await supabase.from("campaign_outreach_saves").upsert(
        {
          user_id: user.id,
          campaign_id: campaignId,
          lead_batch_id: leadBatchId,
          icp_description: icpDescription,
          offer_description: offerDescription,
          subject_template: subjectTemplate,
          body_template: emailTemplate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,campaign_id" },
      );
      if (error) throw error;
      setSaveTemplateMessage("Template saved.");
    } catch (e) {
      setSaveTemplateMessage(
        e instanceof Error ? e.message : "Failed to save template.",
      );
    } finally {
      setSaveTemplateLoading(false);
    }
  };

  const SEND_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  const handleConfirmAndStart = async () => {
    if (!emailTemplate.trim() || !yourName.trim() || leads.length === 0) return;
    setSendError(null);
    setSendErrorCode(null);
    setSuccessMessage(null);
    setSendPhase("sending");
    setStartCampaignLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: emailTemplate,
          subject: subjectTemplate.trim() || DEFAULT_SUBJECT,
          yourName: yourName.trim(),
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      clearTimeout(timeoutId);
      if (!res.ok) {
        setSendPhase("error");
        setSendError(
          data.error ??
            "Sending failed. Please try again later and if it persists contact support.",
        );
        setSendErrorCode(data.code ?? null);
        return;
      }
      setSendPhase("success");
      setSuccessMessage(
        data.message ??
          "Successfully sent cold outreach emails. Check your dashboard for real metrics on deliverability.",
      );
      void refreshSendMetrics();
    } catch (e) {
      clearTimeout(timeoutId);
      const isAbort = e instanceof Error && e.name === "AbortError";
      if (isAbort) {
        setSendPhase("timeout");
        setSendError(null);
      } else {
        setSendPhase("error");
        setSendError(
          "Sending failed. Please try again later and if it persists contact support.",
        );
        setSendErrorCode(null);
      }
    } finally {
      setStartCampaignLoading(false);
    }
  };

  const handleResendCampaign = () => {
    const confirmed = window.confirm(
      "This will resend this email once again to all leads. Recipients may receive duplicate emails. Are you sure you want to continue?",
    );
    if (confirmed) handleConfirmAndStart();
  };

  const showAlreadySentUI = campaignAlreadySent || sendPhase === "success";
  const displaySuccessMessage =
    successMessage ||
    (campaignAlreadySent
      ? "Campaign was sent successfully. Emails have been delivered to your leads. Check your dashboard for real metrics on deliverability."
      : null);

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

        {/* Section 2 - Emails Delivered & Replies (from database) */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Emails & replies
          </h2>
          <p className="text-white/60 text-sm mb-4">
            Click a row to open the full message. Data is loaded from the
            database (outbound = sent by you; inbound = reply from lead).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emails Delivered (outbound) */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-medium text-white mb-3">
                Emails delivered ({outreachMessages.filter((m) => m.direction === "outbound").length})
              </h3>
              {leadsLoading ? (
                <p className="text-white/50 text-sm">Loading…</p>
              ) : outreachMessages.filter((m) => m.direction === "outbound").length === 0 ? (
                <p className="text-white/50 text-sm">
                  No sent emails yet. Send the campaign to see them here.
                </p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {outreachMessages
                    .filter((m) => m.direction === "outbound")
                    .map((msg) => {
                      const lead = leads.find((l) => l.id === msg.lead_id);
                      return (
                        <li key={msg.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMessage({
                                msg,
                                leadName: lead?.full_name ?? "—",
                                leadEmail: lead?.email ?? "—",
                              })
                            }
                            className="w-full text-left rounded-md border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors"
                          >
                            <div className="font-medium text-white truncate">
                              {lead?.full_name ?? lead?.email ?? msg.lead_id}
                            </div>
                            <div className="text-sm text-white/70 truncate">
                              {msg.subject || "(No subject)"}
                            </div>
                            <div className="text-xs text-white/50 mt-0.5">
                              {msg.sent_at
                                ? new Date(msg.sent_at).toLocaleString()
                                : new Date(msg.created_at).toLocaleString()}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>

            {/* Replies (inbound) */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-medium text-white mb-3">
                Replies ({outreachMessages.filter((m) => m.direction === "inbound").length})
              </h3>
              {leadsLoading ? (
                <p className="text-white/50 text-sm">Loading…</p>
              ) : outreachMessages.filter((m) => m.direction === "inbound").length === 0 ? (
                <p className="text-white/50 text-sm">
                  No replies yet. Configure IMAP in Mail Config to sync replies.
                </p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {outreachMessages
                    .filter((m) => m.direction === "inbound")
                    .map((msg) => {
                      const lead = leads.find((l) => l.id === msg.lead_id);
                      return (
                        <li key={msg.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMessage({
                                msg,
                                leadName: lead?.full_name ?? "—",
                                leadEmail: lead?.email ?? "—",
                              })
                            }
                            className="w-full text-left rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 hover:bg-emerald-500/10 transition-colors"
                          >
                            <div className="font-medium text-white truncate">
                              {lead?.full_name ?? lead?.email ?? msg.lead_id}
                            </div>
                            <div className="text-sm text-white/70 truncate">
                              {msg.subject || "(No subject)"}
                            </div>
                            <div className="text-xs text-white/50 mt-0.5">
                              {msg.received_at
                                ? new Date(msg.received_at).toLocaleString()
                                : new Date(msg.created_at).toLocaleString()}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Message detail modal */}
        {selectedMessage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setSelectedMessage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Message content"
          >
            <div
              className="rounded-xl border border-white/20 bg-[#0f1419] shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    selectedMessage.msg.direction === "outbound"
                      ? "bg-blue-500/20 text-blue-200"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  {selectedMessage.msg.direction === "outbound"
                    ? "Sent"
                    : "Reply"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="text-white/70 hover:text-white p-1"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <div>
                  <span className="text-white/50 text-xs">To / From</span>
                  <p className="text-white font-medium">
                    {selectedMessage.leadName} ({selectedMessage.leadEmail})
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs">Subject</span>
                  <p className="text-white">
                    {selectedMessage.msg.subject || "(No subject)"}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs">Date</span>
                  <p className="text-white/80 text-sm">
                    {selectedMessage.msg.direction === "outbound"
                      ? selectedMessage.msg.sent_at
                        ? new Date(selectedMessage.msg.sent_at).toLocaleString()
                        : new Date(selectedMessage.msg.created_at).toLocaleString()
                      : selectedMessage.msg.received_at
                        ? new Date(selectedMessage.msg.received_at).toLocaleString()
                        : new Date(selectedMessage.msg.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs">Message</span>
                  <pre className="mt-1 p-3 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm whitespace-pre-wrap font-sans overflow-x-auto">
                    {selectedMessage.msg.body_plain || "(No body)"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3 - Leads preview + Download / Preview */}
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
                <div className="p-8 text-center text-white/60">
                  Loading leads…
                </div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-white/60">
                  No leads yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Full Name</TableHead>
                      <TableHead className="text-white/70">Email</TableHead>
                      <TableHead className="text-white/70">
                        Email Status
                      </TableHead>
                      <TableHead className="text-white/70">LinkedIn</TableHead>
                      <TableHead className="text-white/70">Position</TableHead>
                      <TableHead className="text-white/70">Country</TableHead>
                      <TableHead className="text-white/70">Org Name</TableHead>
                      <TableHead className="text-white/70">
                        Org Description
                      </TableHead>
                      <TableHead className="text-white/70">
                        Org Website
                      </TableHead>
                      <TableHead className="text-white/70">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id} className="border-white/10">
                        <TableCell className="text-white font-medium">
                          {lead.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/90">
                          {lead.email}
                        </TableCell>
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

        {/* Section 3 - Cold outreach: ICP & offer → Generate → Edit → Preview → Confirm */}
        <div className="space-y-10">
          <h2 className="text-xl font-semibold text-white">Cold outreach</h2>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              1. Describe problems & your solution
            </h3>
            <OutreachBriefForm
              icpDescription={icpDescription}
              offerDescription={offerDescription}
              onIcpChange={setIcpDescription}
              onOfferChange={setOfferDescription}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateTemplate}
                disabled={generateTemplateLoading || leads.length === 0}
                className={
                  templateGeneratedOnce
                    ? "!bg-[#7c3aed] hover:!bg-[#6d28d9] !shadow-[0_0_15px_rgba(124,58,237,0.35)] hover:!shadow-[0_0_20px_rgba(124,58,237,0.45)]"
                    : ""
                }
              >
                {generateTemplateLoading ? (
                  "Generating…"
                ) : templateGeneratedOnce ? (
                  "Regenerate using AI"
                ) : (
                  <>
                    <Sparkles
                      className="w-7 h-7 inline-block fill-current"
                      aria-hidden
                    />
                    Generate template using AI
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleSaveBrief}
                disabled={saveBriefLoading}
              >
                {saveBriefLoading ? "Saving…" : "Save brief"}
              </Button>
              {saveBriefMessage && (
                <span className="text-sm text-white/70">
                  {saveBriefMessage}
                </span>
              )}
              {generateTemplateError && (
                <p className="mt-2 w-full text-sm text-red-400" role="alert">
                  {generateTemplateError}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              2. Edit template & preview
            </h3>
            <div className="mb-4">
              <Label className="text-white/90 mb-1.5 block">
                Email subject
              </Label>
              <Input
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="e.g. Quick idea for {{org_name}}"
                className="mb-4"
              />
              <Label className="text-white/90 mb-1.5 block">
                Email body (template)
              </Label>
              <TemplateEditor
                value={emailTemplate}
                onChange={setEmailTemplate}
              />
            </div>
            <div className="mt-4">
              <TemplatePreview
                template={emailTemplate}
                sampleLead={leads[0] ?? null}
                yourName={yourName}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleSaveTemplate}
                disabled={saveTemplateLoading}
              >
                {saveTemplateLoading ? "Saving…" : "Save template"}
              </Button>
              {saveTemplateMessage && (
                <span className="text-sm text-white/70">
                  {saveTemplateMessage}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              3. Confirm and start
            </h3>
            {sendPhase === "sending" && (
              <>
                <p className="text-white/90 text-sm mb-2">
                  Sending outreach messages......
                </p>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
                  <p className="text-amber-200 text-sm">
                    Please hold on as we send your cold outreach emails to the
                    recipients (approx 2–3 min). We&apos;ll give you a response
                    as soon as it&apos;s complete.
                  </p>
                </div>
              </>
            )}
            {showAlreadySentUI && displaySuccessMessage && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 mb-4">
                <p className="text-emerald-200 text-sm">
                  {displaySuccessMessage}
                </p>
              </div>
            )}
            {sendPhase === "error" && sendError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-4">
                <p className="text-red-200 text-sm" role="alert">
                  {sendErrorCode === "smtp_not_configured" ? (
                    <>
                      {sendError}{" "}
                      <Link
                        href="/dashboard/mail-config-settings"
                        className="underline font-medium text-red-100 hover:text-white"
                      >
                        Go to Mail Config Settings
                      </Link>
                    </>
                  ) : (
                    sendError
                  )}
                </p>
              </div>
            )}
            {sendPhase === "timeout" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
                <p className="text-amber-200 text-sm">
                  This is taking longer than usual. Check your dashboard in a
                  few minutes.
                </p>
              </div>
            )}
            {showAlreadySentUI ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
                <div>
                  <Label
                    htmlFor="resend-yourName"
                    className="block text-white/90 mb-2"
                  >
                    Your name (required to resend)
                  </Label>
                  <Input
                    id="resend-yourName"
                    type="text"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    disabled={startCampaignLoading}
                    placeholder="e.g. Jane Smith"
                    className="w-full max-w-xs mb-4"
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResendCampaign}
                  disabled={
                    startCampaignLoading ||
                    leads.length === 0 ||
                    !yourName.trim()
                  }
                  className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !shadow-[0_0_15px_rgba(124,58,237,0.35)] hover:!shadow-[0_0_20px_rgba(124,58,237,0.45)]"
                >
                  {startCampaignLoading ? "Sending…" : "Resend Campaign"}
                </Button>
                <p className="text-white/60 text-sm">
                  Resend will send this email again to all {leads.length} lead
                  {leads.length !== 1 ? "s" : ""}. Use only if you need to
                  resend (e.g. template fix).
                </p>
              </div>
            ) : (
              <ConfirmAndStartBlock
                yourName={yourName}
                onYourNameChange={setYourName}
                leadCount={leads.length}
                onConfirmAndStart={handleConfirmAndStart}
                loading={startCampaignLoading}
                disabled={leads.length === 0}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
