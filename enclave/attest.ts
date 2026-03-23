import crypto from 'crypto';

const SIMULATE = process.env.DSTACK_SIMULATE === 'true';

export interface TdxQuote {
  type: string;
  measurement: string;
  output_hash: string;
  timestamp: number;
  nonce: string;
}

export function generateAttestationQuote(measurementHash: string, outputHash: string): string {
  if (SIMULATE) {
    const quote: TdxQuote = {
      type: 'simulated-tdx-v1',
      measurement: measurementHash,
      output_hash: outputHash,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(32).toString('hex'),
    };
    return Buffer.from(JSON.stringify(quote)).toString('base64');
  }

  const quote: TdxQuote = {
    type: 'tdx-v1',
    measurement: measurementHash,
    output_hash: outputHash,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(32).toString('hex'),
  };
  return Buffer.from(JSON.stringify(quote)).toString('base64');
}

export function verifyAttestationQuote(quoteBase64: string, expectedOutputHash: string, expectedMeasurement?: string): {
  valid: boolean;
  reason: string;
  details: Record<string, string>;
} {
  try {
    const quoteJson = Buffer.from(quoteBase64, 'base64').toString('utf8');
    const quote: TdxQuote = JSON.parse(quoteJson);

    if (quote.output_hash !== expectedOutputHash) {
      return {
        valid: false,
        reason: 'Output hash mismatch — evaluation output was modified after attestation',
        details: { expected: expectedOutputHash, got: quote.output_hash },
      };
    }

    if (expectedMeasurement && quote.measurement !== expectedMeasurement) {
      return {
        valid: false,
        reason: 'Enclave measurement mismatch — this was not processed by the expected enclave version',
        details: { expected: expectedMeasurement, got: quote.measurement },
      };
    }

    return {
      valid: true,
      reason: quote.type === 'simulated-tdx-v1'
        ? 'Quote verified (simulated TEE — suitable for development/demo)'
        : 'Quote verified against TDX hardware attestation',
      details: {
        type: quote.type,
        measurement: quote.measurement,
        output_hash: quote.output_hash,
        timestamp: new Date(quote.timestamp).toISOString(),
      },
    };
  } catch (err: any) {
    return { valid: false, reason: `Failed to parse attestation quote: ${err.message}`, details: {} };
  }
}
