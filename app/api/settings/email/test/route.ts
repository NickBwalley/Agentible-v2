import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { connect } from "net";

/**
 * Test SMTP reachability by opening a TCP connection to smtp_host:smtp_port.
 * Does not verify login (would require nodemailer). Confirms host/port are reachable.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: config, error } = await supabase
      .from("user_email_config")
      .select("smtp_host, smtp_port, smtp_password_encrypted")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !config) {
      return NextResponse.json(
        { error: "No email config found. Save your settings first." },
        { status: 404 }
      );
    }

    const port = Number(config.smtp_port) || 587;
    const host = config.smtp_host?.trim() || "";

    if (!host) {
      return NextResponse.json({ error: "Invalid SMTP host" }, { status: 400 });
    }

    const ok = await new Promise<boolean>((resolve) => {
      const socket = connect(
        { host, port, timeout: 10000 },
        () => {
          socket.destroy();
          resolve(true);
        }
      );
      socket.on("error", () => resolve(false));
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (!ok) {
      return NextResponse.json({
        ok: false,
        error: `Could not connect to ${host}:${port}. Check host, port, and firewall.`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "SMTP server is reachable. Credentials are not verified (use a test send in campaign to confirm).",
    });
  } catch (e) {
    console.error("POST /api/settings/email/test error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Test failed" },
      { status: 500 }
    );
  }
}
