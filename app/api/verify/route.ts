import { NextRequest, NextResponse } from 'next/server';
import { verifyAttestationQuote } from '@/enclave/attest';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { receipt } = await req.json();

    if (!receipt || typeof receipt !== 'object') {
      return NextResponse.json({ error: 'Invalid receipt' }, { status: 400 });
    }

    const { enclave, evaluation } = receipt;
    if (!enclave?.quote || !evaluation?.output_hash) {
      return NextResponse.json({ error: 'Malformed receipt: missing quote or output_hash' }, { status: 400 });
    }

    const result = verifyAttestationQuote(enclave.quote, evaluation.output_hash, enclave.measurement);

    return NextResponse.json({
      valid: result.valid,
      reason: result.reason,
      details: result.details,
      receipt_summary: {
        submission_id: receipt.submission_id,
        timestamp: receipt.timestamp,
        enclave_provider: enclave.provider,
        criteria_count: evaluation.criteria_count,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
