"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSubmission = evaluateSubmission;
exports.answerFollowupQuestion = answerFollowupQuestion;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM_PROMPT = `You are a confidential hackathon evaluator running inside a Trusted Execution Environment.
You will receive a team's project submission. Your job is to produce a structured evaluation.

CRITICAL RULES:
- Never reproduce verbatim text from the submission in your output
- Never include specific technical details that would allow reconstruction of the original idea
- Evaluate on merit only — summarize themes, not specifics
- Your output will be seen by judges; the raw submission will not

Output valid JSON only, with this exact schema:
{
  "summary": "3 paragraph thematic summary — no verbatim reproduction",
  "scores": {
    "originality": <1-10>,
    "feasibility": <1-10>,
    "research_fit": <1-10>,
    "demo_potential": <1-10>,
    "team_fit": <1-10>
  },
  "suggested_questions": ["question 1", "question 2", "question 3"],
  "flags": []
}`;
async function evaluateSubmission(pitchContent) {
    const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Please evaluate this hackathon submission:\n\n${pitchContent}` }],
    });
    const content = message.content[0];
    if (content.type !== 'text')
        throw new Error('Unexpected response type');
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('No JSON found in evaluation response');
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
}
async function answerFollowupQuestion(pitchContent, question, previousEvaluation) {
    const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + '\n\nYou are answering a judge follow-up question. Be helpful but do not reproduce verbatim submission text.',
        messages: [
            {
                role: 'user',
                content: `Submission content:\n${pitchContent}\n\nPrevious evaluation summary:\n${previousEvaluation.summary}\n\nJudge question: ${question}\n\nPlease answer the judge's question based on the submission. Output only the answer text, no JSON.`,
            },
        ],
    });
    const content = message.content[0];
    if (content.type !== 'text')
        throw new Error('Unexpected response type');
    return content.text;
}
