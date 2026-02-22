import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fillTemplate, getFirstNameFromFullName } from "@/lib/outreach";
import { decryptCiphertext } from "@/lib/credentials";
import nodemailer from "nodemailer";

type Body = {
  template: string;
  subject?: string;
  yourName: string;
};

const SEND_DELAY_MS = 200;
const SEND_TIMEOUT_MS = 15000;
const MESSAGE_ID_DOMAIN = "outreach.agentible.dev";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMessageId(campaignId: string, leadId: string): string {
  const part = `${campaignId}-${leadId}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  return `<${part}@${MESSAGE_ID_DOMAIN}>`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: campaignId } = await params;
    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign id" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Body;
    const {
      template = "",
      subject: subjectTemplate = "",
      yourName = "",
    } = body;

    if (!template.trim() || !yourName.trim()) {
      return NextResponse.json(
        { error: "template and yourName are required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have access to this campaign" },
        { status: 403 },
      );
    }

    const { data: emailConfig, error: configError } = await supabase
      .from("user_email_config")
      .select(
        "smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password_encrypted, from_email",
      )
      .eq("user_id", campaign.user_id)
      .maybeSingle();

    if (
      configError ||
      !emailConfig?.smtp_host?.trim() ||
      !emailConfig?.smtp_user?.trim() ||
      !emailConfig?.smtp_password_encrypted?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "SMTP not configured. You need to set up your SMTP to send campaigns.",
          code: "smtp_not_configured",
        },
        { status: 400 },
      );
    }

    let smtpPassword: string;
    try {
      smtpPassword = decryptCiphertext(emailConfig.smtp_password_encrypted);
    } catch {
      return NextResponse.json(
        { error: "Could not read SMTP credentials. Re-save your Mail Config." },
        { status: 500 },
      );
    }

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, email, full_name, org_name")
      .eq("campaign_id", campaignId);

    if (leadsError) {
      return NextResponse.json(
        { error: "Failed to load leads" },
        { status: 500 },
      );
    }

    const leadList = (leads ?? []).filter((l) => (l.email ?? "").trim());
    if (leadList.length === 0) {
      return NextResponse.json(
        { error: "No leads with email addresses in this campaign." },
        { status: 400 },
      );
    }

    const subjectBase =
      subjectTemplate.trim() || "Quick question – {{firstName}}";

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

    const fromAddress =
      yourName.trim() && emailConfig.from_email
        ? `"${yourName.trim()}" <${emailConfig.from_email.trim()}>`
        : (emailConfig.from_email ?? emailConfig.smtp_user).trim();

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host.trim(),
      port: Number(emailConfig.smtp_port) || 587,
      secure: Boolean(emailConfig.smtp_secure),
      auth: {
        user: emailConfig.smtp_user.trim(),
        pass: smtpPassword,
      },
    });

    const accepted: string[] = [];
    const rejected: string[] = [];
    const sentMessageIds = new Map<string, string>();

    for (let i = 0; i < prospects.length; i++) {
      const p = prospects[i];
      const messageId = generateMessageId(campaignId, p.leadId);
      try {
        await Promise.race([
          transporter.sendMail({
            from: fromAddress,
            to: p.email,
            subject: p.subject,
            text: p.body,
            headers: {
              "Message-ID": messageId,
            },
          }),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("Send timeout")), SEND_TIMEOUT_MS),
          ),
        ]);
        accepted.push(p.email.toLowerCase());
        sentMessageIds.set(p.leadId, messageId);
      } catch (err) {
        console.error("Send error for", p.email, err);
        rejected.push(p.email.toLowerCase());
      }
      if (i < prospects.length - 1) {
        await sleep(SEND_DELAY_MS);
      }
    }

    const acceptedSet = new Set(accepted);
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
        console.error("campaign_send_results insert error:", {
          message: insertError.message,
          campaignId,
        });
      }
    }

    const sentCount = rows.filter((r) => r.status === "sent").length;
    const outreachRows = prospects
      .filter((p) => acceptedSet.has(p.email.toLowerCase()))
      .map((p) => ({
        user_id: campaign.user_id,
        campaign_id: campaignId,
        lead_id: p.leadId,
        direction: "outbound" as const,
        subject: p.subject,
        body_plain: p.body,
        message_id: sentMessageIds.get(p.leadId) ?? null,
        sent_at: new Date().toISOString(),
      }));

    if (outreachRows.length > 0) {
      const { error: outreachError } = await supabase
        .from("outreach_messages")
        .insert(outreachRows);

      if (outreachError) {
        console.error("outreach_messages insert error:", {
          message: outreachError.message,
          campaignId,
        });
      }
    }

    await supabase.from("audit_events").insert({
      user_id: user.id,
      campaign_id: campaignId,
      action: "campaign_send_requested",
      details: {
        leadCount: prospects.length,
        sent: sentCount,
        notSent: prospects.length - sentCount,
        yourName,
      },
    });

    const notSentCount = prospects.length - sentCount;
    const message = `Successfully sent cold outreach emails. ${sentCount} sent${notSentCount > 0 ? `, ${notSentCount} not sent` : ""}. Check your dashboard for metrics.`;

    return NextResponse.json({
      ok: true,
      sent: sentCount,
      notSent: notSentCount,
      leadCount: prospects.length,
      message,
    });
  } catch (e) {
    console.error("campaigns send error:", e);
    return NextResponse.json(
      {
        error:
          "Sending failed. Please try again later and if it persists contact support.",
      },
      { status: 500 },
    );
  }
}
