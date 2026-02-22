import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PostBody = {
  terms_accepted: boolean;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_email_config")
      .select("from_email, terms_accepted_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
    }

    if (!data?.from_email?.trim()) {
      return NextResponse.json({ configured: false, config: null });
    }

    return NextResponse.json({
      configured: true,
      config: {
        from_email: data.from_email.trim(),
        terms_accepted_at: data.terms_accepted_at ?? null,
        updated_at: data.updated_at ?? null,
      },
    });
  } catch (e) {
    console.error("GET /api/settings/email error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as PostBody;
    const { terms_accepted } = body;

    const email = (user.email ?? "").trim();
    if (!email) {
      return NextResponse.json(
        { error: "No email on your account. Use an account with an email to save sender settings." },
        { status: 400 }
      );
    }

    if (terms_accepted !== true) {
      return NextResponse.json(
        { error: "You must agree to the terms before saving" },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase.from("user_email_config").upsert(
      {
        user_id: user.id,
        from_email: email,
        terms_accepted_at: new Date().toISOString(),
        smtp_host: null,
        smtp_port: null,
        smtp_secure: null,
        smtp_user: null,
        smtp_password_encrypted: null,
        imap_host: null,
        imap_port: null,
        imap_user: null,
        imap_password_encrypted: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message || "Failed to save config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: "Sender email saved. You can use it for future campaign sends." });
  } catch (e) {
    console.error("POST /api/settings/email error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
