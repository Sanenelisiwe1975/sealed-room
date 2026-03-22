const ENCLAVE_URL = process.env.DSTACK_ENDPOINT || 'http://localhost:3001';
const SIMULATE = process.env.DSTACK_SIMULATE === 'true';

export interface EnclaveEvaluationRequest {
  submission_id: string;
  encrypted_payload: string;
  project_name: string;
  one_liner: string;
}

export interface EnclaveEvaluationResponse {
  submission_id: string;
  summary: string;
  scores: {
    originality: number;
    feasibility: number;
    research_fit: number;
    demo_potential: number;
    team_fit: number;
  };
  suggested_questions: string[];
  flags: string[];
  output_hash: string;
  processed_at: string;
}

export interface EnclaveAttestationResponse {
  submission_id: string;
  enclave_measurement: string;
  quote: string;
  receipt: AttestationReceipt;
}

export interface AttestationReceipt {
  version: string;
  submission_id: string;
  timestamp: string;
  enclave: {
    measurement: string;
    provider: string;
    quote: string;
  };
  evaluation: {
    output_hash: string;
    criteria_count: number;
    processed_at: string;
  };
  proof: string;
}

export async function submitToEnclave(req: EnclaveEvaluationRequest): Promise<EnclaveEvaluationResponse> {
  const res = await fetch(`${ENCLAVE_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Enclave error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function askFollowup(submissionId: string, question: string): Promise<{ answer: string }> {
  const res = await fetch(`${ENCLAVE_URL}/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId, question }),
  });
  if (!res.ok) throw new Error(`Enclave error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getEnclaveAttestation(submissionId: string): Promise<EnclaveAttestationResponse> {
  const res = await fetch(`${ENCLAVE_URL}/attestation/${submissionId}`);
  if (!res.ok) throw new Error(`Enclave error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function checkEnclaveHealth(): Promise<{ status: string; measurement: string; simulate: boolean }> {
  const res = await fetch(`${ENCLAVE_URL}/health`);
  if (!res.ok) throw new Error('Enclave unreachable');
  return res.json();
}

export function isSimulateMode(): boolean {
  return SIMULATE;
}
