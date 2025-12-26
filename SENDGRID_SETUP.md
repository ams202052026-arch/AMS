# SendGrid Setup Guide for Render Deployment

## Why SendGrid?
Render's free tier blocks Gmail SMTP connections (ports 587/465) for security reasons. SendGrid is a free alternative that works perfectly with Render.

## Step 1: Create SendGrid Account (FREE)

1. Go to: https://signup.sendgrid.com/
2. Sign up with your email (use: ams202052026@gmail.com)
3. Fill in the form:
   - First Name: Your name
   - Last Name: Your last name
   - Company: AMS (or your company name)
   - Website: https://ams1-a4h7.onrender.com
4. Verify your email address
5. Complete the onboarding questions:
   - Role: Developer
   - Sending volume: Less than 100 emails/day
   - Use case: Transactional emails

## Step 2: Create API Key

1. After login, go to: https://app.sendgrid.com/settings/api_keys
2. Click **"Create API Key"** button
3. Choose **"Restricted Access"**
4. Name: `AMS Render Production`
5. Permissions:
   - Mail Send: **FULL ACCESS** ✓
   - All others: No Access
6. Click **"Create & View"**
7. **COPY THE API KEY** (you won't see it again!)
   - Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Verify Sender Identity

SendGrid requires sender verification for free accounts:

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **"Create New Sender"**
3. Fill in the form:
   - From Name: `AMS Notifications`
   - From Email: `ams202052026@gmail.com`
   - Reply To: `ams202052026@gmail.com`
   - Company Address: Your address
   - City, State, Zip, Country: Your location
4. Click **"Create"**
5. **Check your email** (ams202052026@gmail.com)
6. Click the verification link in the email
7. Wait for "Verified" status

## Step 4: Add to Render Environment Variables

1. Go to Render dashboard: https://dashboard.render.com/
2. Click your AMS service
3. Click **"Environment"** tab
4. Add new environment variable:
   - Key: `SENDGRID_API_KEY`
   - Value: `SG.xxxxxxxx...` (paste your API key)
5. Make sure these are also set:
   - `SMTP_EMAIL=ams202052026@gmail.com`
   - `NODE_ENV=production`
6. Click **"Save Changes"**

## Step 5: Deploy Changes

1. Commit and push the code changes:
   ```bash
   git add .
   git commit -m "Add SendGrid email support for production"
   git push origin main
   ```

2. Render will automatically redeploy

3. Monitor the logs for:
   - ✅ No more "Connection timeout" errors
   - ✅ "OTP SENT TO: email@example.com"

## Step 6: Test Signup

1. Go to: https://ams1-a4h7.onrender.com/signUp
2. Fill in the form
3. Click "Create Account"
4. You should receive OTP email within seconds!

## Troubleshooting

### If emails still not sending:

1. **Check SendGrid Dashboard**:
   - Go to: https://app.sendgrid.com/email_activity
   - Look for your sent emails
   - Check for any errors

2. **Check Render Logs**:
   - Look for error messages
   - Should see: "OTP SENT TO: email@example.com"

3. **Verify Sender**:
   - Make sure sender email is verified in SendGrid
   - Status should be "Verified" (not "Pending")

4. **Check API Key**:
   - Make sure it has "Mail Send: Full Access"
   - Try creating a new API key if needed

## SendGrid Free Tier Limits

- ✅ 100 emails per day (FREE forever)
- ✅ Perfect for testing and small apps
- ✅ No credit card required
- ✅ Works with Render free tier

## Local Development

The code automatically uses Gmail SMTP for local development (NODE_ENV=development) and SendGrid for production (NODE_ENV=production).

No changes needed for local testing!

## Important Notes

- **Never commit API keys to Git!** (They're in environment variables)
- SendGrid API keys start with `SG.`
- Free tier is 100 emails/day (enough for most apps)
- Emails are sent instantly (no delays)
- More reliable than Gmail SMTP

## Support

If you have issues:
- SendGrid Support: https://support.sendgrid.com/
- SendGrid Docs: https://docs.sendgrid.com/
