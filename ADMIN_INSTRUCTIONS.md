# Admin Instructions for SwapNest

## How Admin Gets Notified About Payment Requests

### Option 1: Admin Dashboard (Current Implementation)
1. **Admin can access payment verification page at: `/admin/payments`**
2. All pending subscription payments appear on this page
3. Admin can view payment screenshots and verify/reject payments
4. Once verified, users receive email confirmation

### Option 2: Email Notifications (To Be Set Up)

To receive email notifications when new payments are submitted:

1. **Set up Supabase Database Webhooks:**
   - Go to Supabase Dashboard → Database → Webhooks
   - Create a webhook on `subscription_payments` table INSERT event
   - Configure to send email to `swapnest@99gmail.com`

2. **Or use Edge Functions:**
   - Create a Supabase Edge Function that triggers on payment insert
   - Send email using email service (Resend, SendGrid, etc.)

3. **Or use Supabase Database Triggers:**
   - Create a trigger function that sends email notification
   - Use Supabase's built-in email service or external API

### Current Setup

- **Admin Payment Page:** `/admin/payments`
- **Admin can verify payments** by clicking "Approve & Verify"
- **Users see pending status** on `/subscription` page
- **Email confirmations** are logged in console (needs email service integration)

### To Set Up Email Notifications:

1. Sign up for email service (e.g., Resend.com, SendGrid)
2. Add email API key to Supabase environment variables
3. Create Edge Function or webhook to send emails
4. Configure to send to `swapnest@99gmail.com` for admin notifications



