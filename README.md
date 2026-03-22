# Sealed Room

A confidential pitch and IP protection platform powered by Trusted Execution Environments (TEE).

Teams submit pitches that are encrypted client-side and evaluated by Claude AI inside a TEE enclave. Judges receive only structured evaluations — never the raw pitch. A cryptographic attestation receipt proves the process was tamper-free.

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
- **Verifier**: pastes receipt JSON to cryptographically verify it was processed in genuine TEE

## Setup

### 1. Copy environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `ANTHROPIC_API_KEY` — your Anthropic API key
- `JUDGE_ACCESS_TOKEN` — any secret string for judge login
- `DSTACK_SIMULATE=true` — use simulated TEE (set to false for real TDX hardware)

### 2. Install dependencies

```bash
npm install
```

### 3. Run development servers

In two separate terminals:

```bash
# Terminal 1: enclave server (port 3001)
npm run enclave:dev

# Terminal 2: Next.js app (port 3000)
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

### 4. Open the app

- Landing page: http://localhost:3000
- Submit pitch: http://localhost:3000/submit
- Judge dashboard: http://localhost:3000/judge
- Verify receipt: http://localhost:3000/verify

## Tech Stack

- **Next.js 14** (App Router) + Tailwind CSS + shadcn/ui
- **Express** enclave server with in-memory pitch storage
- **Anthropic Claude** (`claude-sonnet-4-20250514`) for evaluation
- **SQLite** via better-sqlite3 for persistence
- **Dstack TEE** integration (simulated by default)

## How Attestation Works

1. Team submits pitch (base64-encoded for prototype, real RSA encryption in production)
2. Enclave decrypts and stores pitch in memory only — never written to disk or logs
3. Claude evaluates the pitch and returns structured JSON
4. Enclave computes SHA-256 hash of evaluation output
5. A TDX quote (simulated in dev mode) is generated binding the measurement to the output hash
6. Receipt is returned to the team and stored in SQLite
7. Anyone can paste the receipt at `/verify` to confirm the quote is valid

## Production Deployment

For real TDX attestation, deploy on Dstack infrastructure with `DSTACK_SIMULATE=false` and configure hardware attestation in `dstack.toml`.

## Research

Based on the NDAI (Non-Disclosure AI) pattern from IC3 research by Andrew Miller and Flashbots.
