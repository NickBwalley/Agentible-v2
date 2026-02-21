import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fillTemplate, getFirstNameFromFullName } from "@/lib/outreach";

type Body = {
  template: string;
  subject?: string;
  yourName: string;
};

/**
 * Webhook must return array of { accepted: string[], rejected: string[] } per message/batch.
 * In n8n, set the "Respond to Webhook" node's Response Body to the actual email result.
 * Recommended: use {{ $json }} so the whole object (with accepted/rejected arrays) is returned.
 * If you build the body manually, ensure accepted/rejected are arrays, not stringified arrays.
 */
type WebhookResultItem = {
  accepted?: string[] | string;
  rejected?: string[] | string;
};

/** Normalize n8n output: accepted/rejected can be arrays or JSON-stringified arrays. */
function toEmailArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((e): e is string => typeof e === "string");
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed.filter((e): e is string => typeof e === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

const SEND_MAIL_WEBHOOK_URL =
  process.env.SEND_MAIL_WEBHOOK_URL ||
  "https://n8n.srv1036993.hstgr.cloud/webhook-test/agentible-send-mail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const { id: campaignId } = await params;
    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign id" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Body;
    const { template = "", subject: subjectTemplate = "", yourName = "" } = body;

    if (!template.trim() || !yourName.trim()) {
      return NextResponse.json(
        { error: "template and yourName are required" },
        { status: 400 }
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, user_id")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have access to this campaign" },
        { status: 403 }
      );
    }

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, email, full_name, org_name")
      .eq("campaign_id", campaignId);

    if (leadsError) {
      return NextResponse.json(
        { error: "Failed to load leads" },
        { status: 500 }
      );
    }

    const leadList = (leads ?? []).filter((l) => (l.email ?? "").trim());
    if (leadList.length === 0) {
      return NextResponse.json(
        { error: "No leads with email addresses in this campaign." },
        { status: 400 }
      );
    }

    const subjectBase = subjectTemplate.trim() || "Quick question – {{firstName}}";

    const prospects = leadList.map((lead) => {
      const firstName = getFirstNameFromFullName(lead.full_name);
      const org_name = lead.org_name ?? "";
      return {
        leadId: lead.id,
        email: (lead.email ?? "").trim(),
        subject: fillTemplate(subjectBase, { firstName, org_name, yourName }),
        body: fillTemplate(template, { firstName, org_name, yourName }),
      };
    });

    const webhookBody = {
      prospects,
      fromEmail: process.env.FROM_EMAIL ?? "nick@agentible.dev",
    };

    const webhookRes = await fetch(SEND_MAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookBody),
    });

    const responseText = (await webhookRes.text()).trim();
    if (!webhookRes.ok) {
      console.error("n8n webhook error:", webhookRes.status, responseText.slice(0, 500));
      return NextResponse.json(
        {
          error:
            "Sending failed. Please try again later and if it persists contact support.",
        },
        { status: 502 }
      );
    }

    let items: WebhookResultItem[];
    if (!responseText) {
      items = [];
    } else {
      try {
        const parsed = JSON.parse(responseText) as WebhookResultItem | WebhookResultItem[];
        items = Array.isArray(parsed) ? parsed : [parsed];
      } catch (parseErr) {
        console.error("webhook response not JSON:", responseText.slice(0, 500), parseErr);
        return NextResponse.json(
          {
            error:
              "Sending failed. Please try again later and if it persists contact support.",
          },
          { status: 502 }
        );
      }
    }

    const acceptedSet = new Set(
      items.flatMap((i) => toEmailArray(i.accepted).map((e) => e.toLowerCase()))
    );
    const rejectedSet = new Set(
      items.flatMap((i) => toEmailArray(i.rejected).map((e) => e.toLowerCase()))
    );

    // Detect when n8n didn't return real result data (e.g. Respond to Webhook uses static body)
    const hasResultData =
      items.some(
        (i) =>
          toEmailArray(i.accepted).length > 0 || toEmailArray(i.rejected).length > 0
      ) || acceptedSet.size > 0 || rejectedSet.size > 0;

    const rows = prospects.map((p) => {
      const emailLower = p.email.toLowerCase();
      const status = acceptedSet.has(emailLower) ? "sent" : "not-sent";
      return {
        campaign_id: campaignId,
        lead_id: p.leadId,
        status,
      };
    });

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("campaign_send_results")
        .insert(rows);

      if (insertError) {
        console.error("campaign_send_results insert error:", insertError);
      }
    }

    const sentCount = rows.filter((r) => r.status === "sent").length;
    const notSentCount = rows.length - sentCount;

    await supabase.from("audit_events").insert({
      user_id: user.id,
      campaign_id: campaignId,
      action: "campaign_send_requested",
      details: {
        leadCount: prospects.length,
        sent: sentCount,
        notSent: notSentCount,
        yourName,
      },
    });

    const message = hasResultData
      ? `Successfully sent cold outreach emails. ${sentCount} sent${notSentCount > 0 ? `, ${notSentCount} not sent` : ""}. Check your dashboard for real metrics on deliverability.`
      : `Successfully sent cold outreach emails. Emails have been queued for sending. Check your dashboard for delivery status.`;

    return NextResponse.json({
      ok: true,
      sent: sentCount,
      notSent: notSentCount,
      leadCount: prospects.length,
      message,
    });
  } catch (e) {
    console.error("campaigns send error:", e);
    const isNetworkError =
      e instanceof Error &&
      "cause" in e &&
      e.cause instanceof Error &&
      ((e.cause.message?.includes("timeout") ?? false) ||
        (e.cause as { code?: string }).code === "UND_ERR_CONNECT_TIMEOUT");
    return NextResponse.json(
      {
        error:
          "Sending failed. Please try again later and if it persists contact support.",
      },
      { status: isNetworkError ? 503 : 500 }
    );
  }
}
