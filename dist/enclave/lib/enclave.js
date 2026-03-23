"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitToEnclave = submitToEnclave;
exports.askFollowup = askFollowup;
exports.getEnclaveAttestation = getEnclaveAttestation;
exports.checkEnclaveHealth = checkEnclaveHealth;
exports.isSimulateMode = isSimulateMode;
const ENCLAVE_URL = process.env.DSTACK_ENDPOINT || 'http://localhost:3001';
const SIMULATE = process.env.DSTACK_SIMULATE === 'true';
async function submitToEnclave(req) {
    const res = await fetch(`${ENCLAVE_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok)
        throw new Error(`Enclave error: ${res.status} ${await res.text()}`);
    return res.json();
}
async function askFollowup(submissionId, question) {
    const res = await fetch(`${ENCLAVE_URL}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, question }),
    });
    if (!res.ok)
        throw new Error(`Enclave error: ${res.status} ${await res.text()}`);
    return res.json();
}
async function getEnclaveAttestation(submissionId) {
    const res = await fetch(`${ENCLAVE_URL}/attestation/${submissionId}`);
    if (!res.ok)
        throw new Error(`Enclave error: ${res.status} ${await res.text()}`);
    return res.json();
}
async function checkEnclaveHealth() {
    const res = await fetch(`${ENCLAVE_URL}/health`);
    if (!res.ok)
        throw new Error('Enclave unreachable');
    return res.json();
}
function isSimulateMode() {
    return SIMULATE;
}
