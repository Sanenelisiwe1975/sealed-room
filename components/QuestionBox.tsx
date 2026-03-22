'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Answer {
  question: string;
  answer: string;
}

export default function QuestionBox({ submissionId, judgeToken }: { submissionId: string; judgeToken: string }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/judge/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
        body: JSON.stringify({ submission_id: submissionId, question }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnswers((prev) => [...prev, { question, answer: data.answer }]);
      setQuestion('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ask a Follow-up</h4>

      {answers.map((a, i) => (
        <div key={i} className="space-y-1 pl-3 border-l border-[#0C447C]/30">
          <p className="text-xs text-muted-foreground font-medium">Q: {a.question}</p>
          <p className="text-sm">{a.answer}</p>
        </div>
      ))}

      <div className="flex gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the enclave a question about this submission..."
          rows={2}
          className="text-sm resize-none"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
        />
        <Button onClick={ask} disabled={loading || !question.trim()} size="sm" className="bg-[#0C447C] hover:bg-[#0C447C]/80 self-end">
          {loading ? '...' : 'Ask'}
        </Button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
