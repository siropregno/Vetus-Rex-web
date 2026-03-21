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
