import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptPlaintext } from "@/lib/credentials";

type PostBody =
  | { terms_accepted: boolean }
  | {
      smtp_host: string;
      smtp_port: number;
      smtp_secure: boolean;
      smtp_user: string;
      smtp_password: string;
      from_email: string;
    }
  | {
      imap_host: string;
      imap_port: number;
      imap_secure: boolean;
      imap_user: string;
      imap_password: string;
    };

function isSmtpBody(body: PostBody): body is {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
} {
  return (
    typeof (body as { smtp_host?: string }).smtp_host === "string" &&
    typeof (body as { from_email?: string }).from_email === "string"
  );
}

function isImapBody(body: PostBody): body is {
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_user: string;
  imap_password: string;
} {
  const b = body as { imap_host?: string; imap_user?: string };
  return typeof b.imap_host === "string" && typeof b.imap_user === "string";
}

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
        "from_email, terms_accepted_at, updated_at, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("GET /api/settings/email user_email_config error:", error.message, error.details);
      return NextResponse.json(
        { error: "Failed to load config" },
        { status: 500 }
      );
    }

    const has_smtp =
      !!(data?.smtp_host?.trim() && data?.smtp_user?.trim());
    const has_imap =
      !!(data?.imap_host?.trim() && data?.imap_user?.trim());

    if (!data?.from_email?.trim() && !has_smtp && !has_imap) {
      return NextResponse.json({ configured: false, has_smtp: false, has_imap: false, config: null });
    }

    return NextResponse.json({
      configured: true,
      has_smtp,
      has_imap,
      config: {
        from_email: (data?.from_email ?? "").trim() || null,
        terms_accepted_at: data?.terms_accepted_at ?? null,
        updated_at: data?.updated_at ?? null,
        smtp_host: data?.smtp_host?.trim() ?? null,
        smtp_port: data?.smtp_port ?? null,
        smtp_secure: data?.smtp_secure ?? null,
        smtp_user: data?.smtp_user?.trim() ?? null,
        imap_host: data?.imap_host?.trim() ?? null,
        imap_port: data?.imap_port ?? null,
        imap_secure: data?.imap_secure ?? null,
        imap_user: data?.imap_user?.trim() ?? null,
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

    if (isSmtpBody(body)) {
      const {
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        smtp_password,
        from_email,
      } = body;

      if (!smtp_host?.trim() || !smtp_user?.trim() || !from_email?.trim()) {
        return NextResponse.json(
          { error: "SMTP host, user, and from email are required." },
          { status: 400 }
        );
      }

      const port = Number(smtp_port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return NextResponse.json(
          { error: "SMTP port must be a number between 1 and 65535." },
          { status: 400 }
        );
      }

      const passwordProvided =
        typeof smtp_password === "string" && smtp_password.length > 0;

      let smtp_password_encrypted: string | null = null;
      if (passwordProvided) {
        try {
          smtp_password_encrypted = encryptPlaintext(smtp_password!);
        } catch (encErr) {
          console.error("Encryption error:", encErr);
          return NextResponse.json(
            { error: "Server encryption not configured. Contact support." },
            { status: 500 }
          );
        }
      } else {
        const { data: existing } = await supabase
          .from("user_email_config")
          .select("smtp_password_encrypted")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing?.smtp_password_encrypted) {
          smtp_password_encrypted = existing.smtp_password_encrypted;
        } else {
          return NextResponse.json(
            { error: "SMTP password is required for new setup." },
            { status: 400 }
          );
        }
      }

      const { data: existingRow } = await supabase
        .from("user_email_config")
        .select("imap_host, imap_port, imap_secure, imap_user, imap_password_encrypted")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error: upsertError } = await supabase
        .from("user_email_config")
        .upsert(
          {
            user_id: user.id,
            from_email: from_email.trim(),
            smtp_host: smtp_host.trim(),
            smtp_port: port,
            smtp_secure: !!smtp_secure,
            smtp_user: smtp_user.trim(),
            smtp_password_encrypted: smtp_password_encrypted!,
            terms_accepted_at: new Date().toISOString(),
            imap_host: existingRow?.imap_host ?? null,
            imap_port: existingRow?.imap_port ?? null,
            imap_secure: existingRow?.imap_secure ?? null,
            imap_user: existingRow?.imap_user ?? null,
            imap_password_encrypted: existingRow?.imap_password_encrypted ?? null,
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

      return NextResponse.json({
        ok: true,
        message:
          "SMTP settings saved. You can send campaign emails from your own server.",
      });
    }

    if (isImapBody(body)) {
      const { imap_host, imap_port, imap_secure, imap_user, imap_password } = body;

      if (!imap_host?.trim() || !imap_user?.trim()) {
        return NextResponse.json(
          { error: "IMAP host and user are required." },
          { status: 400 }
        );
      }

      const port = Number(imap_port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return NextResponse.json(
          { error: "IMAP port must be between 1 and 65535." },
          { status: 400 }
        );
      }

      const passwordProvided =
        typeof imap_password === "string" && imap_password.length > 0;

      let imap_password_encrypted: string | null = null;
      if (passwordProvided) {
        try {
          imap_password_encrypted = encryptPlaintext(imap_password);
        } catch (encErr) {
          console.error("IMAP encryption error:", encErr);
          return NextResponse.json(
            { error: "Server encryption not configured. Contact support." },
            { status: 500 }
          );
        }
      } else {
        const { data: existing } = await supabase
          .from("user_email_config")
          .select("imap_password_encrypted")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing?.imap_password_encrypted) {
          imap_password_encrypted = existing.imap_password_encrypted;
        } else {
          return NextResponse.json(
            { error: "IMAP password is required for new setup." },
            { status: 400 }
          );
        }
      }

      const { data: existingRow } = await supabase
        .from("user_email_config")
        .select(
          "from_email, terms_accepted_at, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password_encrypted"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const { error: upsertError } = await supabase
        .from("user_email_config")
        .upsert(
          {
            user_id: user.id,
            from_email: existingRow?.from_email ?? user.email ?? "",
            terms_accepted_at: existingRow?.terms_accepted_at ?? new Date().toISOString(),
            smtp_host: existingRow?.smtp_host ?? null,
            smtp_port: existingRow?.smtp_port ?? null,
            smtp_secure: existingRow?.smtp_secure ?? null,
            smtp_user: existingRow?.smtp_user ?? null,
            smtp_password_encrypted: existingRow?.smtp_password_encrypted ?? null,
            imap_host: imap_host.trim(),
            imap_port: port,
            imap_secure: !!imap_secure,
            imap_user: imap_user.trim(),
            imap_password_encrypted,
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

      return NextResponse.json({
        ok: true,
        message:
          "IMAP settings saved. Reply sync will pick up replies to your campaign emails.",
      });
    }

    const { terms_accepted } = body as { terms_accepted?: boolean };
    const email = (user.email ?? "").trim();
    if (!email) {
      return NextResponse.json(
        {
          error:
            "No email on your account. Use an account with an email to save sender settings.",
        },
        { status: 400 }
      );
    }

    if (terms_accepted !== true) {
      return NextResponse.json(
        { error: "You must agree to the terms before saving" },
        { status: 400 }
      );
    }

    const { data: existingRow } = await supabase
      .from("user_email_config")
      .select(
        "smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password_encrypted, imap_host, imap_port, imap_secure, imap_user, imap_password_encrypted"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const { error: upsertError } = await supabase
      .from("user_email_config")
      .upsert(
        {
          user_id: user.id,
          from_email: email,
          terms_accepted_at: new Date().toISOString(),
          smtp_host: existingRow?.smtp_host ?? null,
          smtp_port: existingRow?.smtp_port ?? null,
          smtp_secure: existingRow?.smtp_secure ?? null,
          smtp_user: existingRow?.smtp_user ?? null,
          smtp_password_encrypted: existingRow?.smtp_password_encrypted ?? null,
          imap_host: existingRow?.imap_host ?? null,
          imap_port: existingRow?.imap_port ?? null,
          imap_secure: existingRow?.imap_secure ?? null,
          imap_user: existingRow?.imap_user ?? null,
          imap_password_encrypted: existingRow?.imap_password_encrypted ?? null,
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

    return NextResponse.json({
      ok: true,
      message:
        "Sender email saved. Add SMTP details in this page to send from your own server.",
    });
  } catch (e) {
    console.error("POST /api/settings/email error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
