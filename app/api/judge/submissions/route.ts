import { NextRequest, NextResponse } from 'next/server';
import { getAllSubmissions, getEvaluation, getJudgeAnswers } from '@/lib/db';

function verifyJudgeToken(req: NextRequest): boolean {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  return token === process.env.JUDGE_ACCESS_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!verifyJudgeToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissions = getAllSubmissions();
  const result = submissions.map((s) => {
    const evaluation = getEvaluation(s.id);
    const answers = getJudgeAnswers(s.id);
    return {
      id: s.id,
      project_name: s.project_name,
      one_liner: s.one_liner,
      status: s.status,
      created_at: s.created_at,
      evaluation: evaluation
        ? {
            summary: evaluation.summary,
            scores: JSON.parse(evaluation.scores),
            suggested_questions: JSON.parse(evaluation.suggested_questions),
            flags: JSON.parse(evaluation.flags),
            output_hash: evaluation.output_hash,
          }
        : null,
      judge_answers: answers,
    };
  });

  return NextResponse.json(result);
}
