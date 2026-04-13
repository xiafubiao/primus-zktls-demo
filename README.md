# Primus zkTLS DApp Demo

A simple frontend demo using `@primuslabs/zktls-js-sdk` in test mode.

## ⚠️ Important

This is **Test Mode** - the `appSecret` is visible in frontend code.
**Never deploy this to production!**

For production, use a backend to sign requests and keep `appSecret` server-side only.

## Prerequisites

1. **Node.js 18+** - `node -v`
2. **Primus Browser Extension** - Install from https://primuslabs.xyz
3. **Template ID** - Get from https://dev.primuslabs.xyz

## Setup

```bash
cd primus-zktls-demo
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. Connect wallet or enter address manually
2. Enter your template ID (UUID from dev.primuslabs.xyz)
3. Click "Start Attestation"
4. The Primus extension popup will open - complete the login flow
5. View the verified attestation result

## Flow

```
init(appId, appSecret)
  → generateRequestParams(templateId, userAddress)
  → request.setAttMode({ algorithmType: 'proxytls' })
  → request.toJsonString()
  → sign(requestStr)
  → startAttestation(signedRequestStr)
  → verifyAttestation(attestation)
```

## Error Handling

| Code | Cause |
|------|-------|
| `00004` | User cancelled popup |
| `30004` | Not logged in to target service |
| `10xxx` | Network issue, try mpctls |

## Production Mode

To switch to production:
1. Remove `appSecret` from frontend
2. Create a backend server with `/primus/sign` endpoint
3. Call backend for signing, frontend only runs `startAttestation`

See Primus docs: https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/production