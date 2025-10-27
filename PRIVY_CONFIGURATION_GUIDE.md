# Privy Configuration Guide

## Issue: Origin Mismatch Error

If you see this error:
```
origins don't match "https://auth.privy.io" "http://localhost:3000"
```

This means Privy doesn't recognize your localhost as an allowed origin.

---

## Solution: Configure Privy Dashboard

### Step 1: Go to Privy Dashboard
Visit: https://dashboard.privy.io

### Step 2: Login and Select Your App
- Login with your Privy account
- Select your app: **FundFlow** (or your app name)

### Step 3: Navigate to Settings
- Click on **Settings** in the left sidebar
- Find **Allowed Origins** or **CORS Settings**

### Step 4: Add Localhost
Add the following origin:
```
http://localhost:3000
```

**Important:**
- Don't include trailing slash
- Use `http://` not `https://` for localhost
- Port number (3000) must match your dev server port

### Step 5: Save Changes
- Click **Save** or **Update**
- Wait a few seconds for changes to propagate

### Step 6: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
# Start again:
npm run dev
```

### Step 7: Clear Browser Cache
- Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or open in Incognito/Private window

---

## Verify Configuration

After configuration, you should see in console:
```
[FundFlow] Providers component mounted
[FundFlow] Privy App ID: Set
[FundFlow] Initializing PrivyProvider with App ID
```

**No errors should appear!**

---

## Alternative: Use Different Port

If you can't configure Privy dashboard, try using a different port:

### Option 1: Use Port 3001
```bash
PORT=3001 npm run dev
```
Then configure `http://localhost:3001` in Privy dashboard

### Option 2: Use Vercel/Netlify
Deploy to a staging environment and configure that URL

---

## Common Issues

### Issue: Still getting origin error after configuration
**Solution:**
1. Double-check the URL in Privy dashboard (no typos)
2. Clear browser cache completely
3. Restart dev server
4. Try different browser
5. Wait 5-10 minutes (DNS propagation)

### Issue: Can't find "Allowed Origins" in dashboard
**Solution:**
- Look for: "CORS Settings", "Domain Settings", or "Security"
- Contact Privy support if unavailable
- Check Privy documentation: https://docs.privy.io

### Issue: Multiple apps in dashboard
**Solution:**
- Make sure you're editing the correct app
- Check App ID matches your `.env.local`:
  ```
  NEXT_PUBLIC_PRIVY_APP_ID=cmh1uc6au00mdl10dvjv6pcr6
  ```

---

## Environment Variables Check

Verify your `.env.local` file:

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=cmh1uc6au00mdl10dvjv6pcr6

# Solana Configuration (DEVNET)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fundflow-fe422
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://fundflow-fe422-default-rtdb.europe-west1.firebasedatabase.app
# ... other Firebase vars
```

All variables should be present and correct.

---

## Testing Privy Connection

1. **Start Dev Server:**
```bash
npm run dev
```

2. **Open Browser:**
```
http://localhost:3000
```

3. **Click "Connect Wallet"**

4. **Expected Behavior:**
- Privy modal opens
- Shows wallet options (Phantom, Solflare, etc.)
- Can connect without errors

5. **If Error Appears:**
- Check browser console (F12)
- Look for specific error message
- Follow troubleshooting steps above

---

## Quick Fix Commands

```bash
# 1. Stop server
Ctrl+C

# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev

# 4. Open in incognito
# Use browser's incognito/private mode
```

---

## Success Indicators

✅ **Working Correctly:**
```
[FundFlow] Providers component mounted
[FundFlow] Privy App ID: Set
[FundFlow] Initializing PrivyProvider with App ID
```

❌ **Still Broken:**
```
Error: origins don't match
Failed to fetch
CORS error
```

---

## Support

If you still have issues:

1. **Check Privy Status:**
   - https://status.privy.io
   - Ensure service is operational

2. **Review Privy Docs:**
   - https://docs.privy.io
   - Search for "allowed origins" or "CORS"

3. **Contact Privy Support:**
   - https://privy.io/contact
   - Mention: "Cannot add localhost to allowed origins"

4. **Alternative: Skip Privy (Testing Only):**
   - Use direct wallet adapter
   - Not recommended for production

---

**Once configured, Privy should work seamlessly with no origin errors!**
