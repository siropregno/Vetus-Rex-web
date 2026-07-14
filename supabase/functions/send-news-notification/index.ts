import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE_URL = "https://vetusrex.online";
const LOGO_URL = `${SITE_URL}/logo.png`;
const FROM_EMAIL = "Vetus Rex <noreply@vetusrex.online>";
const BATCH_SIZE = 50;

const TAG_COLORS: Record<string, string> = {
  update: "#ff7221",
  patch: "#3b82f6",
  event: "#a855f7",
  announcement: "#ef4444",
  community: "#22c55e",
};

const TAG_LABELS: Record<string, string> = {
  update: "Update",
  patch: "Patch",
  event: "Event",
  announcement: "Announcement",
  community: "Community",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

const NEWS_LANGS = ["en", "es", "de"] as const;
type NewsLang = (typeof NEWS_LANGS)[number];

type I18nMap = Partial<Record<string, string>> | null | undefined;

// Resolve a { en, es, de } map to a single string: requested lang → English →
// first non-empty language → flat fallback → "". Mirrors getLocalizedNews on
// the web side so emails match what the site renders.
function pickLang(map: I18nMap, lang: string, flat: string): string {
  if (map && typeof map === "object") {
    if (map[lang]?.trim()) return map[lang] as string;
    if (map.en?.trim()) return map.en as string;
    for (const code of NEWS_LANGS) {
      if (map[code]?.trim()) return map[code] as string;
    }
  }
  return flat || "";
}

function normalizeLang(value: string | null | undefined): NewsLang {
  const code = (value || "en").slice(0, 2).toLowerCase();
  return (NEWS_LANGS as readonly string[]).includes(code) ? (code as NewsLang) : "en";
}

function buildEmailHtml(article: {
  id: string;
  title: string;
  tag: string;
  content: string;
  cover_image_url: string | null;
}, lang: NewsLang): string {
  const tagColor = TAG_COLORS[article.tag] || "#ff7221";
  const tagLabel = TAG_LABELS[article.tag] || article.tag;
  const articleUrl = `${SITE_URL}/${lang}/news/${encodeURIComponent(article.id)}`;
  const optionsUrl = `${SITE_URL}/${lang}/profile`;
  const safeTitle = escapeHtml(article.title);
  const excerpt = escapeHtml(truncateText(stripHtml(article.content)));
  const safeCoverUrl = article.cover_image_url ? escapeHtml(article.cover_image_url) : null;

  const fontStack = "'Candara', 'Optima', 'Gill Sans', 'Segoe UI', system-ui, sans-serif";
  const fontHeading = "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif";

  const coverSection = safeCoverUrl
    ? `<!-- Cover image -->
                <tr>
                  <td style="padding: 0 32px;">
                    <img src="${safeCoverUrl}" alt="" width="536" style="width: 100%; max-width: 536px; height: auto; display: block; border-radius: 8px; border: 1px solid #2a2a2a;" />
                  </td>
                </tr>
                <tr><td style="height: 24px;"></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030303; font-family: ${fontStack};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #030303;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Accent top line -->
          <tr>
            <td style="height: 1px; background-color: rgba(255, 114, 33, 0.25); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #0d0d0d; padding: 28px 32px;">
              <a href="${SITE_URL}" target="_blank" style="text-decoration: none;">
                <img src="${LOGO_URL}" alt="Vetus Rex" width="220" style="width: 220px; max-width: 100%; height: auto; display: block;" />
              </a>
              <p style="margin: 6px 0 0; font-size: 12px; color: #666; letter-spacing: 3px; text-transform: uppercase; font-family: ${fontStack};">New Article Published</p>
            </td>
          </tr>

          <!-- Card body -->
          <tr>
            <td style="background-color: #1a1a1a; border-left: 1px solid #2a2a2a; border-right: 1px solid #2a2a2a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <tr><td style="height: 32px;"></td></tr>

                <!-- Tag badge -->
                <tr>
                  <td style="padding: 0 32px 16px;">
                    <span style="display: inline-block; background-color: ${tagColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; font-family: ${fontStack};">${tagLabel}</span>
                  </td>
                </tr>

                ${coverSection}

                <!-- Title -->
                <tr>
                  <td style="padding: 0 32px 12px;">
                    <h1 style="margin: 0; font-family: ${fontHeading}; font-size: 26px; font-weight: 700; color: #e3e3e3; line-height: 1.35;">${safeTitle}</h1>
                  </td>
                </tr>

                <!-- Excerpt -->
                <tr>
                  <td style="padding: 0 32px 28px;">
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; color: #8b949e; line-height: 1.6;">${excerpt}</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 32px;">
                    <div style="height: 1px; background-color: #2a2a2a;"></div>
                  </td>
                </tr>

                <tr><td style="height: 28px;"></td></tr>

                <!-- CTA button -->
                <tr>
                  <td align="center" style="padding: 0 32px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius: 50px; background-color: #ff7221;">
                          <a href="${articleUrl}" target="_blank" style="display: inline-block; font-family: ${fontStack}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 10px 28px; letter-spacing: 0.3px;">Read Article &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Bottom accent line -->
          <tr>
            <td style="height: 1px; background-color: rgba(255, 114, 33, 0.25); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 16px 0;">
              <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6; font-family: ${fontStack};">
                You received this because you're subscribed to
                <span style="color: #ff7221;">Vetus Rex</span> news.
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; font-family: ${fontStack};">
                <a href="${optionsUrl}" target="_blank" style="color: #888; text-decoration: underline;">Manage preferences</a>
              </p>
              <p style="margin: 20px 0 0; font-size: 11px; color: #333; font-family: ${fontStack};">
                &copy; 2026 TikiTiki Studios
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendBatch(emails: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      emails.map((to) => ({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }))
    ),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  // Webhook sends POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify request is from Supabase webhook
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();

    // Database webhook payload structure
    const record = payload.record;
    const hasTitle = record?.title || record?.title_i18n?.en || record?.title_i18n?.es || record?.title_i18n?.de;
    if (!record || !record.id || !hasTitle) {
      return new Response("Invalid payload", { status: 400 });
    }

    const titleI18n: I18nMap = record.title_i18n || null;
    const contentI18n: I18nMap = record.content_i18n || null;

    // Base article fields shared across languages; title/content are resolved
    // per subscriber language below.
    const base = {
      id: record.id as string,
      tag: (record.tag || "update") as string,
      cover_image_url: (record.cover_image_url || null) as string | null,
    };

    // Create admin client to query all profiles
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users with email notifications enabled, plus their language.
    const { data: subscribers, error: dbError } = await supabase
      .from("profiles")
      .select("email, preferred_language")
      .eq("email_notifications", true)
      .not("email", "is", null);

    if (dbError) {
      console.error("Error fetching subscribers:", dbError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
      });
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found");
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    // Group subscriber emails by their resolved language so each group gets
    // one localized email body / subject.
    const byLang = new Map<NewsLang, string[]>();
    for (const s of subscribers as { email: string; preferred_language?: string | null }[]) {
      const lang = normalizeLang(s.preferred_language);
      const list = byLang.get(lang) || [];
      list.push(s.email);
      byLang.set(lang, list);
    }

    // Send in batches, per language.
    let totalSent = 0;
    for (const [lang, emails] of byLang) {
      const article = {
        ...base,
        title: pickLang(titleI18n, lang, record.title),
        content: pickLang(contentI18n, lang, record.content || ""),
      };
      const subject = `Vetus Rex — ${article.title}`;
      const html = buildEmailHtml(article, lang);

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        await sendBatch(batch, subject, html);
        totalSent += batch.length;
      }
    }

    console.log(`Sent ${totalSent} notification emails for article: ${pickLang(titleI18n, "en", record.title)}`);

    return new Response(JSON.stringify({ sent: totalSent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-news-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
