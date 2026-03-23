import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE_URL = "https://vetusrex.online";
const FROM_EMAIL = "Vetus Rex <noreply@vetusrex.online>";
const SUPPORT_EMAIL = "support@vetusrex.online";

const TAG_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature_request: "Feature Request",
  account_issue: "Account Issue",
  gameplay: "Gameplay",
  other: "Other",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(text: string, maxLength = 300): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function buildEmailHtml(ticket: {
  id: string;
  subject: string;
  tag: string;
  priority: string;
  username: string;
  content: string;
}): string {
  const tagLabel = TAG_LABELS[ticket.tag] || ticket.tag;
  const priorityLabel = PRIORITY_LABELS[ticket.priority] || ticket.priority;
  const ticketUrl = `${SITE_URL}/en/admin/support/${ticket.id}`;
  const excerpt = truncateText(stripHtml(ticket.content));
  const fontStack = "'Candara', 'Optima', 'Gill Sans', 'Segoe UI', system-ui, sans-serif";

  const priorityColor =
    ticket.priority === "critical" ? "#ef4444" :
    ticket.priority === "high" ? "#f59e0b" :
    ticket.priority === "normal" ? "#3b82f6" : "#6b7280";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Support Ticket</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: ${fontStack};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #141414; border-radius: 8px; border: 1px solid #222;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <h1 style="margin: 0; font-size: 20px; color: #e2e4eb;">🎫 New Support Ticket</h1>
            </td>
          </tr>

          <!-- Ticket info -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #8b8fa3; font-size: 13px;">Subject</td>
                  <td style="padding: 8px 0; color: #e2e4eb; font-size: 14px; font-weight: 600;">${ticket.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #8b8fa3; font-size: 13px;">From</td>
                  <td style="padding: 8px 0; color: #e2e4eb; font-size: 14px;">${ticket.username}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #8b8fa3; font-size: 13px;">Category</td>
                  <td style="padding: 8px 0; color: #e2e4eb; font-size: 14px;">${tagLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #8b8fa3; font-size: 13px;">Priority</td>
                  <td style="padding: 8px 0; font-size: 14px;">
                    <span style="color: ${priorityColor}; font-weight: 600;">${priorityLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content preview -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 16px; color: #c0c0c0; font-size: 14px; line-height: 1.6;">
                ${excerpt}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 32px 32px;">
              <a href="${ticketUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View Ticket in Admin Panel
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify webhook authorization
  const authHeader = req.headers.get("Authorization");
  const expectedToken = Deno.env.get("WEBHOOK_SECRET");
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    console.error("Unauthorized webhook call");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();

    // Database webhook payload: { type, table, record, schema, old_record }
    const record = payload.record;
    if (!record || !record.id || !record.subject) {
      console.error("Invalid payload:", JSON.stringify(payload).substring(0, 500));
      return new Response("Invalid payload", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch author username from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", record.user_id)
      .single();

    const username = profile?.username || "Unknown";

    // Try to fetch the first message (may not exist yet due to race condition)
    let content = "";
    const { data: messages } = await supabase
      .from("ticket_messages")
      .select("content")
      .eq("ticket_id", record.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (messages && messages.length > 0) {
      content = messages[0].content;
    }

    const html = buildEmailHtml({
      id: record.id,
      subject: record.subject,
      tag: record.tag || "other",
      priority: record.priority || "normal",
      username,
      content,
    });

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_EMAIL],
        subject: `[Ticket] ${record.subject} — ${username}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend API error:", errBody);
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendData = await emailRes.json();
    console.log(`Ticket notification sent for: ${record.subject} (${record.id})`, resendData);

    return new Response(JSON.stringify({ success: true, resend: resendData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-ticket-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
