import { NextResponse } from 'next/server';
import { getAllSubmissions, getAttestation } from '@/lib/db';

export async function GET() {
  const submissions = getAllSubmissions();
  const result = submissions.map((s) => {
    const attestation = getAttestation(s.id);
    return {
      id: s.id,
      project_name: s.project_name,
      one_liner: s.one_liner,
      status: s.status,
      created_at: s.created_at,
      has_receipt: !!attestation,
    };
  });
  return NextResponse.json(result);
}
