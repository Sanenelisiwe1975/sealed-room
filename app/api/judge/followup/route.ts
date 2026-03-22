import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { insertJudgeAnswer } from '@/lib/db';
import { askFollowup } from '@/lib/enclave';

function verifyJudgeToken(req: NextRequest): boolean {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  return token === process.env.JUDGE_ACCESS_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!verifyJudgeToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { submission_id, question } = await req.json();
    if (!submission_id || !question) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await askFollowup(submission_id, question);
    insertJudgeAnswer(uuidv4(), submission_id, question, result.answer);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
