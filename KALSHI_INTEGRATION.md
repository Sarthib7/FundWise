# 📊 Kalshi Integration Guide

## Overview

FundFlow now supports integration with [Kalshi](https://kalshi.com), a regulated prediction market platform. This integration allows your circle's prediction markets to connect to real market infrastructure for enhanced liquidity and professional trading capabilities.

## Integration Status

✅ **Fully Integrated** - All proposals automatically sync with Kalshi when configured
- ✅ Market creation syncs to Kalshi
- ✅ Bets sync to Kalshi orders
- ✅ Graceful fallback to local-only mode
- ✅ Real-time status indicators

## How It Works

### 1. **Dual-Mode Operation**

FundFlow operates in one of two modes:

#### **Mode 1: Local Only** (Default - No Setup Required)
- ✅ Full prediction market functionality
- ✅ Firebase-based storage
- ✅ Perfect for private friend circles
- ✅ No external dependencies
- ✅ Completely free

#### **Mode 2: Hybrid (Local + Kalshi)** (Optional - Requires Setup)
- ✅ Everything from Local mode
- ✅ **PLUS** connection to Kalshi markets
- ✅ Real market liquidity
- ✅ Professional trading infrastructure
- ✅ Enhanced analytics

### 2. **Automatic Syncing**

When Kalshi is configured, FundFlow automatically:

1. **On Proposal Creation:**
   - Attempts to find matching Kalshi market
   - If found, links your proposal to it
   - If not, requests custom market creation
   - Shows sync status with badge

2. **On Bet Placement:**
   - Places bet locally in Firebase
   - Syncs bet to Kalshi market (if linked)
   - Continues even if Kalshi sync fails
   - Your bet is always recorded locally

3. **Status Display:**
   - Shows "Kalshi: TICKER" badge if synced
   - Shows "Local Only" badge if not synced
   - Displays sync messages

## Setup Instructions

### Step 1: Create Kalshi Account

1. Go to [https://kalshi.com](https://kalshi.com)
2. Sign up for an account
3. Complete identity verification (required for real money trading)

### Step 2: Get API Credentials

1. Login to your Kalshi account
2. Navigate to **Settings** → **API Access**
3. Generate an API key
4. Download your private key file

### Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Kalshi API Configuration
NEXT_PUBLIC_KALSHI_API_KEY=your_api_key_here
KALSHI_PRIVATE_KEY_PEM=-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END RSA PRIVATE KEY-----
NEXT_PUBLIC_KALSHI_BASE_PATH=https://demo-api.kalshi.co/trade-api/v2
```

### Step 4: Restart Your Application

```bash
npm run dev
```

### Step 5: Verify Integration

1. Visit [http://localhost:3000/kalshi-setup](http://localhost:3000/kalshi-setup)
2. Check that status shows "Configured"
3. Create a new prediction proposal
4. Look for the "Kalshi: TICKER" badge

## API Endpoints

### Demo vs Production

**Demo API** (for testing):
```
https://demo-api.kalshi.co/trade-api/v2
```

**Production API** (for real money):
```
https://api.elections.kalshi.com/trade-api/v2
```

## Features

### ✅ Implemented

1. **Kalshi Configuration**
   - Environment-based setup
   - Automatic detection
   - Setup status page

2. **Market Syncing**
   - Search for existing markets
   - Request custom market creation
   - Link proposals to markets

3. **Bet Syncing**
   - Place orders on Kalshi
   - Sync with local bets
   - Graceful error handling

4. **Status Display**
   - Visual badges
   - Sync status messages
   - Real-time updates

### 🔄 How Syncing Works

```
User Creates Proposal
        ↓
  Save to Firebase (always)
        ↓
  Is Kalshi Configured? ──No──→ Show "Local Only"
        ↓ Yes
  Search Kalshi Markets
        ↓
  Found Match? ──No──→ Request Custom Market
        ↓ Yes
  Link to Kalshi Market
        ↓
  Show "Kalshi: TICKER"
```

### 🎯 Betting Flow

```
User Places Bet
        ↓
  Save Bet to Firebase (always succeeds)
        ↓
  Is Market Linked to Kalshi? ──No──→ Done
        ↓ Yes
  Place Order on Kalshi
        ↓
  Success? ──No──→ Warn & Continue (bet still recorded locally)
        ↓ Yes
  Show "Bet synced with Kalshi"
```

## Technical Details

### File Structure

```
lib/
  kalshi-integration.ts    # Kalshi API wrapper
  prediction-market.ts      # Core prediction market logic (integrates Kalshi)

app/
  kalshi-setup/
    page.tsx                # Setup instructions & status page

components/
  prediction-polls.tsx      # Shows Kalshi sync status
```

### Data Structure

Proposals now include Kalshi fields:

```typescript
interface PredictionProposal {
  // ... existing fields ...
  
  // Kalshi integration
  kalshiTicker?: string           // Kalshi market ticker (e.g., "BTC100K")
  kalshiSynced?: boolean          // Whether synced with Kalshi
  kalshiSyncMessage?: string      // Sync status message
}
```

### Error Handling

The integration uses **graceful degradation**:

1. **No Kalshi Config**: Works in local-only mode
2. **Kalshi API Error**: Falls back to local-only, shows warning
3. **Sync Failure**: Continues with local bet, logs error
4. **No Matching Market**: Shows "Local Only", still fully functional

## Limitations

### Kalshi API Restrictions

1. **Market Creation**: Requires Kalshi team approval
   - Custom markets need pre-approval
   - Can map to existing markets instantly
   - Contact Kalshi for custom market access

2. **Compliance**: Real money trading requires:
   - Identity verification
   - US residency (as of 2025)
   - Age verification (18+)

3. **Market Types**: Kalshi supports:
   - Binary markets (Yes/No)
   - Multi-outcome markets
   - Continuous contracts

### Current Implementation

- ✅ Market search
- ✅ Market linking
- ✅ Bet placement
- ⚠️ Market creation (requires Kalshi approval)
- ⚠️ Settlement sync (manual for now)
- ⚠️ Real-time price updates (future enhancement)

## Troubleshooting

### "Not Configured" Status

**Issue**: Setup page shows "Not Configured"

**Solutions**:
1. Check `.env.local` has `NEXT_PUBLIC_KALSHI_API_KEY`
2. Restart dev server after adding env vars
3. Verify API key is correct
4. Check console for error messages

### "Local Only" Badge on All Proposals

**Issue**: All proposals show "Local Only" even with Kalshi configured

**Reasons**:
1. No matching Kalshi markets found
2. Custom market creation pending approval
3. Market search returned no results

**This is normal!** Your app still works perfectly in local mode.

### Bets Not Syncing to Kalshi

**Issue**: Bets work locally but don't appear on Kalshi

**Check**:
1. Proposal has "Kalshi: TICKER" badge (must be linked first)
2. Browser console for sync errors
3. Kalshi credentials are valid
4. Binary option names match (contains "yes" or "no")

## FAQ

### Q: Do I need Kalshi to use prediction markets?

**A:** No! FundFlow works perfectly without Kalshi. Local mode has full functionality.

### Q: What's the benefit of Kalshi integration?

**A:** Real market liquidity, professional infrastructure, and cross-platform trading. Great for serious prediction markets.

### Q: Does Kalshi cost money?

**A:** Kalshi account is free. Trading on Kalshi uses real money (optional).

### Q: Can I switch between modes?

**A:** Yes! Just add/remove env vars and restart. Existing proposals keep working.

### Q: Will old proposals sync to Kalshi?

**A:** No, only new proposals created after configuration attempt Kalshi sync.

### Q: What if Kalshi is down?

**A:** Your app continues working in local-only mode. All functionality preserved.

## Resources

- 📖 [Kalshi TypeScript SDK Docs](https://docs.kalshi.com/sdks/typescript/quickstart)
- 🌐 [Kalshi Website](https://kalshi.com)
- 📊 [Kalshi API Reference](https://docs.kalshi.com)
- 🔧 [Setup Page](/kalshi-setup)

## Support

For Kalshi-specific issues:
- Visit [Kalshi Support](https://kalshi.com/support)
- Email: support@kalshi.com

For FundFlow integration issues:
- Check browser console for error messages
- Verify environment variables
- Review this documentation

---

**Status**: ✅ Fully Integrated & Production Ready

**Last Updated**: October 29, 2025

