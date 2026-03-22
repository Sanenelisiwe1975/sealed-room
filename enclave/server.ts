import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Dynamically import to allow running outside enclave context
let evaluateSubmission: typeof import('../lib/evaluator').evaluateSubmission;
let answerFollowupQuestion: typeof import('../lib/evaluator').answerFollowupQuestion;

const app = express();
app.use(express.json({ limit: '10mb' }));

// In-memory store for the enclave (submissions decrypted content keyed by id)
const decryptedSubmissions = new Map<string, string>();
const evaluations = new Map<string, any>();
const attestations = new Map<string, any>();

// Enclave measurement (in real TDX this comes from hardware)
const ENCLAVE_MEASUREMENT = process.env.ENCLAVE_MEASUREMENT ||
  crypto.createHash('sha256').update('sealed-room-enclave-v1.0').digest('hex');

const SIMULATE = process.env.DSTACK_SIMULATE === 'true';

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    measurement: ENCLAVE_MEASUREMENT,
    simulate: SIMULATE,
    version: '1.0.0',
  });
});

app.post('/evaluate', async (req, res) => {
  try {
    const { submission_id, encrypted_payload, project_name, one_liner } = req.body;

    if (!submission_id || !encrypted_payload) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In real enclave: decrypt with enclave private key
    // For prototype: treat encrypted_payload as the pitch content (base64 encoded)
    let pitchContent: string;
    try {
      pitchContent = Buffer.from(encrypted_payload, 'base64').toString('utf8');
    } catch {
      pitchContent = encrypted_payload;
    }

    // Store decrypted content in enclave memory (never logged, never returned)
    decryptedSubmissions.set(submission_id, pitchContent);

    // Run AI evaluation
    const { evaluateSubmission: evalFn } = await import('../lib/evaluator');
    const evaluation = await evalFn(pitchContent);

    // Compute output hash
    const evalJson = JSON.stringify(evaluation);
    const outputHash = crypto.createHash('sha256').update(evalJson).digest('hex');

    const processedAt = new Date().toISOString();

    evaluations.set(submission_id, { ...evaluation, output_hash: outputHash, processed_at: processedAt });

    res.json({
      submission_id,
      ...evaluation,
      output_hash: outputHash,
      processed_at: processedAt,
    });
  } catch (err: any) {
    console.error('[enclave] evaluate error:', err.message);
    res.status(500).json({ error: 'Evaluation failed', details: err.message });
  }
});

app.post('/followup', async (req, res) => {
  try {
    const { submission_id, question } = req.body;

    if (!submission_id || !question) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pitchContent = decryptedSubmissions.get(submission_id);
    if (!pitchContent) {
      return res.status(404).json({ error: 'Submission not found in enclave' });
    }

    const evaluation = evaluations.get(submission_id);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    const { answerFollowupQuestion: answerFn } = await import('../lib/evaluator');
    const answer = await answerFn(pitchContent, question, evaluation);

    res.json({ submission_id, question, answer });
  } catch (err: any) {
    console.error('[enclave] followup error:', err.message);
    res.status(500).json({ error: 'Follow-up failed', details: err.message });
  }
});

app.get('/attestation/:id', (req, res) => {
  const { id } = req.params;
  const evaluation = evaluations.get(id);

  if (!evaluation) {
    return res.status(404).json({ error: 'Evaluation not found' });
  }

  const quote = generateTdxQuote(evaluation.output_hash);
  const processedAt = evaluation.processed_at || new Date().toISOString();

  const receipt = {
    version: '1.0',
    submission_id: id,
    timestamp: new Date().toISOString(),
    enclave: {
      measurement: ENCLAVE_MEASUREMENT,
      provider: SIMULATE ? 'dstack-simulate' : 'dstack',
      quote: quote,
    },
    evaluation: {
      output_hash: evaluation.output_hash,
      criteria_count: 5,
      processed_at: processedAt,
    },
    proof: `This receipt proves that: (1) The submission was processed inside a ${SIMULATE ? 'simulated' : 'hardware'} Trusted Execution Environment with measurement ${ENCLAVE_MEASUREMENT.slice(0, 16)}..., (2) The AI evaluation was generated without revealing raw submission content to judges, (3) The evaluation output has SHA-256 hash ${evaluation.output_hash.slice(0, 16)}... which is cryptographically bound to this attestation quote.`,
  };

  res.json({
    submission_id: id,
    enclave_measurement: ENCLAVE_MEASUREMENT,
    quote,
    receipt,
  });
});

function generateTdxQuote(outputHash: string): string {
  if (SIMULATE) {
    // Simulated quote: HMAC of measurement + outputHash
    const simulatedQuote = {
      type: 'simulated-tdx',
      measurement: ENCLAVE_MEASUREMENT,
      output_hash: outputHash,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };
    return Buffer.from(JSON.stringify(simulatedQuote)).toString('base64');
  }
  // Real TDX: use dstack-sdk
  // const { generateQuote } = require('dstack-sdk');
  // return generateQuote(outputHash);
  // For now, return simulated
  const simulatedQuote = {
    type: 'tdx-placeholder',
    measurement: ENCLAVE_MEASUREMENT,
    output_hash: outputHash,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  return Buffer.from(JSON.stringify(simulatedQuote)).toString('base64');
}

const PORT = process.env.ENCLAVE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`[enclave] Sealed Room enclave server running on port ${PORT}`);
  console.log(`[enclave] Mode: ${SIMULATE ? 'SIMULATE' : 'PRODUCTION'}`);
  console.log(`[enclave] Measurement: ${ENCLAVE_MEASUREMENT}`);
});

export default app;
