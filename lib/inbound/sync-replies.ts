import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCiphertext } from "@/lib/credentials";

const SYNC_DAYS = 14;
const BATCH_SIZE = 50;

type UserImapConfig = {
  user_id: string;
  imap_host: string;
  imap_port: number | null;
  imap_secure: boolean | null;
  imap_user: string;
  imap_password_encrypted: string;
};

function normalizeMessageId(id: string | undefined): string | null {
  if (!id || typeof id !== "string") return null;
  const t = id.trim();
  return t.startsWith("<") ? t : `<${t}>`;
}

function extractReplyToIds(inReplyTo: string | undefined, references: string | string[] | undefined): string[] {
  const ids: string[] = [];
  const add = (v: string | undefined) => {
    const n = normalizeMessageId(v);
    if (n && !ids.includes(n)) ids.push(n);
  };
  add(inReplyTo);
  if (references) {
    if (Array.isArray(references)) {
      references.forEach((r) => add(r));
    } else {
      String(references)
        .split(/\s+/)
        .forEach((r) => add(r));
  }
  return ids;
}

export async function syncRepliesForAllUsers(): Promise<{
  usersProcessed: number;
  repliesSaved: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let repliesSaved = 0;
  const supabase = createAdminClient();

  const { data: configs, error: fetchError } = await supabase
    .from("user_email_config")
    .select("user_id, imap_host, imap_port, imap_secure, imap_user, imap_password_encrypted")
    .not("imap_host", "is", null)
    .not("imap_user", "is", null)
    .not("imap_password_encrypted", "is", null);

  if (fetchError) {
    errors.push(`Failed to fetch IMAP configs: ${fetchError.message}`);
    return { usersProcessed: 0, repliesSaved: 0, errors };
  }

  const list = (configs ?? []) as UserImapConfig[];
  if (list.length === 0) {
    return { usersProcessed: 0, repliesSaved: 0, errors: [] };
  }

  const since = new Date(Date.now() - SYNC_DAYS * 24 * 60 * 60 * 1000);

  for (const config of list) {
    let client: ImapFlow | null = null;
    try {
      const password = decryptCiphertext(config.imap_password_encrypted);
      const port = Number(config.imap_port) || 993;
      const secure = port === 993 || Boolean(config.imap_secure);

      client = new ImapFlow({
        host: config.imap_host.trim(),
        port,
        secure,
        auth: {
          user: config.imap_user.trim(),
          pass: password,
        },
        logger: false,
      });

      await client.connect();

      const lock = await client.getMailboxLock("INBOX");
      try {
        const uids = await client.search({ since }, { uid: true });
        if (uids.length === 0) continue;

        const toFetch = uids.slice(-BATCH_SIZE);
        const messageStream = client.fetch(toFetch, { source: true }, { uid: true });

        for await (const msg of messageStream) {
          try {
            if (!msg.source) continue;
            const parsed = await simpleParser(msg.source);
            const replyMessageId = normalizeMessageId(parsed.messageId);
            const replyToIds = extractReplyToIds(parsed.inReplyTo, parsed.references);
            if (replyToIds.length === 0 && !replyMessageId) continue;

            const { data: outbound } = await supabase
              .from("outreach_messages")
              .select("id, user_id, campaign_id, lead_id")
              .eq("direction", "outbound")
              .in("message_id", replyToIds)
              .limit(1)
              .maybeSingle();

            if (!outbound) continue;

            if (replyMessageId) {
              const { data: existing } = await supabase
                .from("outreach_messages")
                .select("id")
                .eq("message_id", replyMessageId)
                .eq("direction", "inbound")
                .limit(1)
                .maybeSingle();
              if (existing) continue;
            }

            const receivedAt = parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString();
            const { error: insertErr } = await supabase.from("outreach_messages").insert({
              user_id: outbound.user_id,
              campaign_id: outbound.campaign_id,
              lead_id: outbound.lead_id,
              direction: "inbound",
              subject: parsed.subject ?? "",
              body_plain: parsed.text ?? "",
              message_id: replyMessageId,
              received_at: receivedAt,
            });

            if (!insertErr) repliesSaved++;
            else errors.push(`Insert reply: ${insertErr.message}`);
          } catch (parseErr) {
            errors.push(`Parse: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      errors.push(
        `IMAP ${config.user_id}: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch {
          client.destroy();
        }
      }
    }
  }

  return {
    usersProcessed: list.length,
    repliesSaved,
    errors,
  };
}
