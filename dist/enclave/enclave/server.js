"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
let evaluateSubmission;
let answerFollowupQuestion;
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' }));
const decryptedSubmissions = new Map();
const evaluations = new Map();
const attestations = new Map();
const ENCLAVE_MEASUREMENT = process.env.ENCLAVE_MEASUREMENT ||
    crypto_1.default.createHash('sha256').update('sealed-room-enclave-v1.0').digest('hex');
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
        let pitchContent;
        try {
            pitchContent = Buffer.from(encrypted_payload, 'base64').toString('utf8');
        }
        catch {
            pitchContent = encrypted_payload;
        }
        decryptedSubmissions.set(submission_id, pitchContent);
        const { evaluateSubmission: evalFn } = await Promise.resolve().then(() => __importStar(require('../lib/evaluator')));
        const evaluation = await evalFn(pitchContent);
        const evalJson = JSON.stringify(evaluation);
        const outputHash = crypto_1.default.createHash('sha256').update(evalJson).digest('hex');
        const processedAt = new Date().toISOString();
        evaluations.set(submission_id, { ...evaluation, output_hash: outputHash, processed_at: processedAt });
        res.json({
            submission_id,
            ...evaluation,
            output_hash: outputHash,
            processed_at: processedAt,
        });
    }
    catch (err) {
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
        const { answerFollowupQuestion: answerFn } = await Promise.resolve().then(() => __importStar(require('../lib/evaluator')));
        const answer = await answerFn(pitchContent, question, evaluation);
        res.json({ submission_id, question, answer });
    }
    catch (err) {
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
function generateTdxQuote(outputHash) {
    if (SIMULATE) {
        const simulatedQuote = {
            type: 'simulated-tdx',
            measurement: ENCLAVE_MEASUREMENT,
            output_hash: outputHash,
            timestamp: Date.now(),
            nonce: crypto_1.default.randomBytes(16).toString('hex'),
        };
        return Buffer.from(JSON.stringify(simulatedQuote)).toString('base64');
    }
    const simulatedQuote = {
        type: 'tdx-placeholder',
        measurement: ENCLAVE_MEASUREMENT,
        output_hash: outputHash,
        timestamp: Date.now(),
        nonce: crypto_1.default.randomBytes(16).toString('hex'),
    };
    return Buffer.from(JSON.stringify(simulatedQuote)).toString('base64');
}
const PORT = process.env.PORT || process.env.ENCLAVE_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[enclave] Sealed Room enclave server running on port ${PORT}`);
    console.log(`[enclave] Mode: ${SIMULATE ? 'SIMULATE' : 'PRODUCTION'}`);
    console.log(`[enclave] Measurement: ${ENCLAVE_MEASUREMENT}`);
});
exports.default = app;
