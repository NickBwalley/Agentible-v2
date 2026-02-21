import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fillTemplate, getFirstNameFromFullName } from "@/lib/outreach";
import { decryptCiphertext } from "@/lib/credentials";

type Body = {
  template: string;
  subject?: string;
  yourName: string;
};

const SEND_MAIL_WEBHOOK_URL =
  process.env.SEND_MAIL_WEBHOOK_URL ||
  "https://n8n.srv1036993.hstgr.cloud/webhook-test/agentible-send-mail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    // Use getSession() so we read the session from cookies without a network call to Supabase Auth.
    // getUser() can time out (Connect Timeout) when the server cannot reach Supabase Auth.
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

    const { data: emailConfig, error: configError } = await supabase
      .from("user_email_config")
      .select(
        "smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password_encrypted, from_email"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (configError || !emailConfig) {
      return NextResponse.json(
        { error: "Please set up your sending email in Dashboard → Mail Config Settings." },
        { status: 400 }
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
        email: lead.email ?? "",
        subject: fillTemplate(subjectBase, { firstName, org_name, yourName }),
        body: fillTemplate(template, { firstName, org_name, yourName }),
      };
    });

    let smtpPassword: string;
    try {
      smtpPassword = decryptCiphertext(emailConfig.smtp_password_encrypted);
    } catch {
      return NextResponse.json(
        { error: "Email config could not be decrypted. Re-save your Mail Config Settings." },
        { status: 500 }
      );
    }

    const webhookBody = {
      smtp: {
        host: emailConfig.smtp_host,
        port: emailConfig.smtp_port ?? 587,
        secure: emailConfig.smtp_secure ?? true,
        user: emailConfig.smtp_user,
        password: smtpPassword,
        fromEmail: emailConfig.from_email,
      },
      prospects,
    };

    const webhookRes = await fetch(SEND_MAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookBody),
    });

    if (!webhookRes.ok) {
      const errText = await webhookRes.text();
      console.error("n8n webhook error:", webhookRes.status, errText);
      return NextResponse.json(
        {
          error:
            "Sending service failed. Check your Mail Config and try again, or contact support.",
        },
        { status: 502 }
      );
    }

    await supabase.from("audit_events").insert({
      user_id: user.id,
      campaign_id: campaignId,
      action: "campaign_send_requested",
      details: {
        leadCount: prospects.length,
        yourName,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Campaign send requested for ${prospects.length} lead(s).`,
      leadCount: prospects.length,
    });
  } catch (e) {
    console.error("campaigns send error:", e);
    const isNetworkError =
      e instanceof Error &&
      ("cause" in e &&
        e.cause instanceof Error &&
        (e.cause.message?.includes("timeout") ||
          (e.cause as { code?: string }).code === "UND_ERR_CONNECT_TIMEOUT"));
    const message = isNetworkError
      ? "Could not reach the server. Check your network and try again."
      : e instanceof Error
        ? e.message
        : "Send failed";
    return NextResponse.json(
      { error: message },
      { status: isNetworkError ? 503 : 500 }
    );
  }
}
