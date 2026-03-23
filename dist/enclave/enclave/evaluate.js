"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.answerFollowupQuestion = exports.evaluateSubmission = void 0;
exports.hashEvaluationOutput = hashEvaluationOutput;
const crypto_1 = __importDefault(require("crypto"));
const evaluator_1 = require("../lib/evaluator");
Object.defineProperty(exports, "evaluateSubmission", { enumerable: true, get: function () { return evaluator_1.evaluateSubmission; } });
Object.defineProperty(exports, "answerFollowupQuestion", { enumerable: true, get: function () { return evaluator_1.answerFollowupQuestion; } });
function hashEvaluationOutput(evaluation) {
    const canonical = JSON.stringify({
        summary: evaluation.summary,
        scores: evaluation.scores,
        suggested_questions: evaluation.suggested_questions,
        flags: evaluation.flags,
    });
    return crypto_1.default.createHash('sha256').update(canonical).digest('hex');
}
