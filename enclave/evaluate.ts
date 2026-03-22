import crypto from 'crypto';
import { evaluateSubmission, answerFollowupQuestion, type EvaluationOutput } from '../lib/evaluator';

export { evaluateSubmission, answerFollowupQuestion };

export function hashEvaluationOutput(evaluation: EvaluationOutput): string {
  const canonical = JSON.stringify({
    summary: evaluation.summary,
    scores: evaluation.scores,
    suggested_questions: evaluation.suggested_questions,
    flags: evaluation.flags,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
