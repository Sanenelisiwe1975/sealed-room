import { NextRequest, NextResponse } from 'next/server';
import { getSubmission, getEvaluation, getAttestation } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const submission = getSubmission(params.id);
  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response: any = {
    submission_id: submission.id,
    project_name: submission.project_name,
    status: submission.status,
    created_at: submission.created_at,
    processed_at: submission.processed_at,
  };

  if (submission.status === 'complete') {
    const attestation = getAttestation(submission.id);
    if (attestation) {
      response.receipt = JSON.parse(attestation.receipt);
    }
  }

  return NextResponse.json(response);
}
