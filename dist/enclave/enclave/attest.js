"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAttestationQuote = generateAttestationQuote;
exports.verifyAttestationQuote = verifyAttestationQuote;
const crypto_1 = __importDefault(require("crypto"));
const SIMULATE = process.env.DSTACK_SIMULATE === 'true';
function generateAttestationQuote(measurementHash, outputHash) {
    if (SIMULATE) {
        const quote = {
            type: 'simulated-tdx-v1',
            measurement: measurementHash,
            output_hash: outputHash,
            timestamp: Date.now(),
            nonce: crypto_1.default.randomBytes(32).toString('hex'),
        };
        return Buffer.from(JSON.stringify(quote)).toString('base64');
    }
    const quote = {
        type: 'tdx-v1',
        measurement: measurementHash,
        output_hash: outputHash,
        timestamp: Date.now(),
        nonce: crypto_1.default.randomBytes(32).toString('hex'),
    };
    return Buffer.from(JSON.stringify(quote)).toString('base64');
}
function verifyAttestationQuote(quoteBase64, expectedOutputHash, expectedMeasurement) {
    try {
        const quoteJson = Buffer.from(quoteBase64, 'base64').toString('utf8');
        const quote = JSON.parse(quoteJson);
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
    }
    catch (err) {
        return { valid: false, reason: `Failed to parse attestation quote: ${err.message}`, details: {} };
    }
}
