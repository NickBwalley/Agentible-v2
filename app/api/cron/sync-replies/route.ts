import { NextResponse } from "next/server";
import { syncRepliesForAllUsers } from "@/lib/inbound/sync-replies";

/**
 * Cron endpoint to sync inbound replies from users' IMAP mailboxes into outreach_messages.
 * Call with: Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const secret = process.env.CRON_SECRET;

  if (secret && secret.length > 0) {
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cronSecret;
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncRepliesForAllUsers();
    return NextResponse.json({
      ok: true,
      usersProcessed: result.usersProcessed,
      repliesSaved: result.repliesSaved,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (e) {
    console.error("sync-replies error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
