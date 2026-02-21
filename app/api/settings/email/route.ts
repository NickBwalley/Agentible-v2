import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptPlaintext } from "@/lib/credentials";

type PostBody = {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  imap_host?: string | null;
  imap_port?: number | null;
  imap_user?: string | null;
  imap_password?: string | null;
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
      .select(
        "smtp_host, smtp_port, smtp_secure, smtp_user, from_email, imap_host, imap_port, imap_user, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ configured: false, config: null });
    }

    return NextResponse.json({
      configured: true,
      config: {
        ...data,
        passwordMasked: true,
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
    const {
      smtp_host,
      smtp_port = 587,
      smtp_secure = true,
      smtp_user,
      smtp_password,
      from_email,
      imap_host,
      imap_port,
      imap_user,
      imap_password,
    } = body;

    if (
      !smtp_host?.trim() ||
      !smtp_user?.trim() ||
      !from_email?.trim()
    ) {
      return NextResponse.json(
        { error: "smtp_host, smtp_user, and from_email are required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("user_email_config")
      .select("smtp_password_encrypted, imap_password_encrypted")
      .eq("user_id", user.id)
      .maybeSingle();

    let smtp_password_encrypted: string | undefined;
    let imap_password_encrypted: string | null | undefined;
    if (smtp_password != null && smtp_password !== "") {
      try {
        smtp_password_encrypted = encryptPlaintext(smtp_password);
      } catch (err) {
        return NextResponse.json(
          { error: "Encryption not configured. Set CREDENTIALS_ENCRYPTION_KEY in env." },
          { status: 503 }
        );
      }
    } else if (existing?.smtp_password_encrypted) {
      smtp_password_encrypted = existing.smtp_password_encrypted;
    } else {
      return NextResponse.json(
        { error: "smtp_password is required when creating new config" },
        { status: 400 }
      );
    }

    if (imap_password != null && imap_password !== "") {
      try {
        imap_password_encrypted = encryptPlaintext(imap_password);
      } catch (err) {
        return NextResponse.json(
          { error: "Encryption not configured. Set CREDENTIALS_ENCRYPTION_KEY in env." },
          { status: 503 }
        );
      }
    } else if (existing?.imap_password_encrypted) {
      imap_password_encrypted = existing.imap_password_encrypted;
    } else {
      imap_password_encrypted = null;
    }

    const { error: upsertError } = await supabase.from("user_email_config").upsert(
      {
        user_id: user.id,
        smtp_host: smtp_host.trim(),
        smtp_port: Number(smtp_port) || 587,
        smtp_secure: Boolean(smtp_secure),
        smtp_user: smtp_user.trim(),
        smtp_password_encrypted,
        from_email: from_email.trim(),
        imap_host: imap_host?.trim() || null,
        imap_port: imap_port != null ? Number(imap_port) : null,
        imap_user: imap_user?.trim() || null,
        imap_password_encrypted: imap_password_encrypted ?? null,
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

    return NextResponse.json({ ok: true, message: "Email config saved." });
  } catch (e) {
    console.error("POST /api/settings/email error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
