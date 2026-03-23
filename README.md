# Sealed Room

A confidential pitch and IP protection platform powered by Trusted Execution Environments (TEE).

Teams submit pitches that are encrypted client-side and evaluated by Claude AI inside a TEE enclave. Judges receive only structured evaluations — never the raw pitch. A cryptographic attestation receipt proves the process was tamper-free.

Built for the Shape Rotator Hackathon, based on the NDAI Agreements research (Andrew Miller, Flashbots) and deployed on Dstack.

## Architecture

```
Team Browser  -->  Next.js API  -->  Enclave (Express)  -->  Claude API
                        |                   |
                    SQLite DB          TEE Memory
                                   (pitch never leaves)
```

### Three roles

- **Team**: submits encrypted pitch, receives attestation receipt
- **Judge**: sees AI-generated summary + scores, can ask follow-up questions via enclave
- **Verifier**: pastes receipt JSON or looks up by submission ID to cryptographically verify it was processed in a genuine TEE

## Setup

### 1. Copy environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `JUDGE_ACCESS_TOKEN` | Any secret string — used to log into the judge dashboard |
| `ENCLAVE_SIGNING_KEY` | Random secret string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DSTACK_SIMULATE` | `true` for local dev (simulated TEE), `false` for real TDX hardware |
| `DSTACK_ENDPOINT` | URL of the enclave server (default: `http://localhost:3001`) |

### 2. Install dependencies

```bash
npm install
```

### 3. Run development servers

In two separate terminals:

```bash
# Terminal 1: enclave server (port 3001) — loads .env.local automatically
npm run enclave:dev

# Terminal 2: Next.js app (port 3000)
npm run dev
```

### 4. Open the app

| Page | URL |
|---|---|
| Landing | http://localhost:3000 |
| Submit pitch | http://localhost:3000/submit |
| Submission history | http://localhost:3000/submissions |
| Judge dashboard | http://localhost:3000/judge |
| Verify receipt | http://localhost:3000/verify |

## Pages

- `/submit` — Team submits a pitch. Encoded payload is sent to the enclave for AI evaluation. On completion, an attestation receipt is shown.
- `/submissions` — Lists all past submissions with status. Click Verify on any completed submission to jump straight to verification.
- `/judge` — Password-protected dashboard (use `JUDGE_ACCESS_TOKEN`). Shows AI-generated summaries, scores across 5 criteria, suggested follow-up questions, and a Q&A box answered by the enclave.
- `/verify` — Paste a receipt JSON or enter a submission ID to verify the cryptographic attestation.

## Tech Stack

- **Next.js 14** (App Router) + Tailwind CSS + shadcn/ui
- **Express** enclave server with in-memory pitch storage
- **Anthropic Claude** for AI evaluation inside the enclave
- **SQLite** via better-sqlite3 for submission/attestation persistence
- **Dstack TEE** integration (simulated by default via `DSTACK_SIMULATE=true`)

## How Attestation Works

1. Team submits pitch (base64-encoded for prototype)
2. Enclave decrypts and stores pitch in memory only — never written to disk or logs
3. Claude evaluates the pitch and returns structured JSON
4. Enclave computes SHA-256 hash of evaluation output
5. A TDX quote (simulated in dev mode) is generated binding the enclave measurement to the output hash
6. Receipt is returned to the team and stored in SQLite
7. Anyone can look up the receipt at `/verify` by submission ID or by pasting the receipt JSON

## Vercel Deployment

The Next.js frontend and API routes deploy to Vercel. The enclave server must run separately (Railway, Render, or a VPS) since Vercel does not support persistent Express servers.

Set these environment variables in your Vercel project settings:

```
ANTHROPIC_API_KEY
JUDGE_ACCESS_TOKEN
ENCLAVE_SIGNING_KEY
DSTACK_SIMULATE=true
DSTACK_ENDPOINT=https://your-enclave-server.com
NEXT_PUBLIC_APP_URL=https://sealed-room.vercel.app
```

## Production TDX Deployment

For real hardware attestation, deploy on Dstack infrastructure:

```bash
# Set in environment
DSTACK_SIMULATE=false

# Deploy enclave
dstack deploy --config dstack.toml
```

## Research

Based on the NDAI (Non-Disclosure AI) pattern from IC3 research by Andrew Miller and Flashbots. AI models inside TEEs act as trusted third parties — receiving confidential input, processing it, and returning structured output with a cryptographic proof that the raw input was never exposed.
