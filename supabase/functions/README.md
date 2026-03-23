# Supabase Edge Functions

## send-news-notification

Triggered by a Database Webhook on `INSERT` into the `news` table.

Sends a styled email notification to all users who have `email_notifications = true` in their profile.

### Setup

1. **Run the migration** in Supabase SQL Editor:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
   ```

2. **Set the Resend API key** as a secret:
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxxxx
   ```

3. **Deploy the function**:
   ```bash
   npx supabase functions deploy send-news-notification
   ```

4. **Create a Database Webhook** in Supabase Dashboard:
   - Go to **Database → Webhooks**
   - Create new webhook
   - Table: `news`, Event: `INSERT`
   - Type: **Supabase Edge Function**
   - Function: `send-news-notification`

### Environment

- `RESEND_API_KEY` — Resend API key (set via `supabase secrets set`)
- `SUPABASE_URL` — Auto-injected by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Auto-injected by Supabase

---

## send-ticket-notification

Sends an email to `support@vetusrex.online` when a new support ticket is created.

Triggered in two ways:
- **Direct invocation** from the frontend via `supabase.functions.invoke()` (already wired in `createTicket()`)
- **Optional Database Webhook** on `INSERT` into `support_tickets` (backup)

### Setup

1. **Deploy the function**:
   ```bash
   npx supabase functions deploy send-ticket-notification
   ```

2. **(Optional) Create a Database Webhook** in Supabase Dashboard:
   - Go to **Database → Webhooks**
   - Create new webhook
   - Table: `support_tickets`, Event: `INSERT`
   - Type: **Supabase Edge Function**
   - Function: `send-ticket-notification`

### Environment

- `RESEND_API_KEY` — Same key as news notifications (already set)
- `SUPABASE_URL` — Auto-injected by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Auto-injected by Supabase
