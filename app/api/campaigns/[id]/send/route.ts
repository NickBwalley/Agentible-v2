import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fillTemplate, getFirstNameFromFullName } from "@/lib/outreach";

type Body = {
  template: string;
  yourName: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 400 }
      );
    }

    const body = (await request.json()) as Body;
    const { template = "", yourName = "" } = body;

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
      .select("id, full_name, org_name")
      .eq("campaign_id", campaignId);

    if (leadsError) {
      return NextResponse.json(
        { error: "Failed to load leads" },
        { status: 500 }
      );
    }

    const leadList = leads ?? [];
    const filled = leadList.map((lead) => {
      const firstName = getFirstNameFromFullName(lead.full_name);
      const org_name = lead.org_name ?? "";
      return {
        leadId: lead.id,
        body: fillTemplate(template, { firstName, org_name, yourName }),
      };
    });

    await supabase.from("audit_events").insert({
      user_id: user.id,
      campaign_id: campaignId,
      action: "campaign_send_requested",
      details: {
        leadCount: filled.length,
        yourName,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Campaign send requested for ${filled.length} lead(s). Delivery can be wired to your email provider or n8n here.`,
      leadCount: filled.length,
    });
  } catch (e) {
    console.error("campaigns send error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 }
    );
  }
}
