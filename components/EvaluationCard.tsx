'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import QuestionBox from './QuestionBox';

interface Scores {
  originality: number;
  feasibility: number;
  research_fit: number;
  demo_potential: number;
  team_fit: number;
}

interface EvaluationCardProps {
  submissionId: string;
  projectName: string;
  oneLiner: string;
  evaluation: {
    summary: string;
    scores: Scores;
    suggested_questions: string[];
    flags: string[];
    output_hash: string;
  };
  judgeToken: string;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label.replace(/_/g, ' ')}</span>
        <span className="font-mono font-semibold text-[#0C447C]">{value}/10</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0C447C] rounded-full transition-all"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function EvaluationCard({ submissionId, projectName, oneLiner, evaluation, judgeToken }: EvaluationCardProps) {
  const avgScore =
    Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.values(evaluation.scores).length;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{projectName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{oneLiner}</p>
          </div>
          <Badge variant="outline" className="font-mono text-[#0C447C] border-[#0C447C]/30">
            {avgScore.toFixed(1)} avg
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">AI Summary</h4>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{evaluation.summary}</p>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Scores</h4>
          <div className="space-y-3">
            {Object.entries(evaluation.scores).map(([key, val]) => (
              <ScoreBar key={key} label={key} value={val} />
            ))}
          </div>
        </div>

        {evaluation.suggested_questions.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Suggested Questions
              </h4>
              <ul className="space-y-1">
                {evaluation.suggested_questions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-[#0C447C] font-mono text-xs mt-0.5">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator />

        <QuestionBox submissionId={submissionId} judgeToken={judgeToken} />

        <div className="text-xs text-muted-foreground/50 font-mono">
          eval hash: {evaluation.output_hash}
        </div>
      </CardContent>
    </Card>
  );
}
