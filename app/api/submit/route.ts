import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { insertSubmission, updateSubmissionStatus, insertEvaluation, insertAttestation } from '@/lib/db';
import { submitToEnclave, getEnclaveAttestation } from '@/lib/enclave';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_name, one_liner, encrypted_payload } = body;

    if (!project_name || !one_liner || !encrypted_payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const submissionId = uuidv4();

    insertSubmission({
      id: submissionId,
      project_name,
      one_liner,
      encrypted_payload,
      status: 'pending',
    });

    processInBackground(submissionId, project_name, one_liner, encrypted_payload);

    return NextResponse.json({ submission_id: submissionId, status: 'pending' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function processInBackground(
  submissionId: string,
  projectName: string,
  oneLiner: string,
  encryptedPayload: string
) {
  try {
    updateSubmissionStatus(submissionId, 'processing');

    const evaluation = await submitToEnclave({
      submission_id: submissionId,
      encrypted_payload: encryptedPayload,
      project_name: projectName,
      one_liner: oneLiner,
    });

    insertEvaluation({
      id: uuidv4(),
      submission_id: submissionId,
      summary: evaluation.summary,
      scores: JSON.stringify(evaluation.scores),
      suggested_questions: JSON.stringify(evaluation.suggested_questions),
      flags: JSON.stringify(evaluation.flags),
      output_hash: evaluation.output_hash,
    });

    const attestation = await getEnclaveAttestation(submissionId);
    insertAttestation({
      id: uuidv4(),
      submission_id: submissionId,
      enclave_measurement: attestation.enclave_measurement,
      quote: attestation.quote,
      receipt: JSON.stringify(attestation.receipt),
    });

    updateSubmissionStatus(submissionId, 'complete', evaluation.processed_at);
  } catch (err: any) {
    console.error('[submit] background processing error:', err.message);
    updateSubmissionStatus(submissionId, 'failed');
  }
}
