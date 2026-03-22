'use client';

import { useState, useEffect } from 'react';
import { Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EvaluationCard from '@/components/EvaluationCard';

interface SubmissionWithEval {
  id: string;
  project_name: string;
  one_liner: string;
  status: string;
  evaluation: any | null;
}

export default function JudgePage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionWithEval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/judge/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setError('Invalid judge token'); return; }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSubmissions(data);
      setAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const res = await fetch('/api/judge/submissions', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSubmissions(await res.json());
  };

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(refresh, 5000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-[#0C447C]">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-mono">Judge Access</span>
            </div>
            <CardTitle>Judge Dashboard</CardTitle>
            <CardDescription>Enter your judge access token to view evaluations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Judge access token"
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={login} disabled={loading} className="w-full bg-[#0C447C] hover:bg-[#0C447C]/80">
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completed = submissions.filter((s) => s.status === 'complete' && s.evaluation);
  const pending = submissions.filter((s) => s.status !== 'complete' || !s.evaluation);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Judge Dashboard</h1>
          <p className="text-muted-foreground text-sm">{submissions.length} submissions · {completed.length} evaluated</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#0C447C] font-mono border border-[#0C447C]/30 px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-[#0C447C] rounded-full animate-pulse" />
          Sealed
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Processing</h2>
          {pending.map((s) => (
            <Card key={s.id} className="border-border/30 bg-card/30">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.project_name}</p>
                  <p className="text-xs text-muted-foreground">{s.one_liner}</p>
                </div>
                <span className="text-xs text-yellow-400 font-mono">{s.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Evaluations</h2>
          {completed.map((s) => (
            <EvaluationCard
              key={s.id}
              submissionId={s.id}
              projectName={s.project_name}
              oneLiner={s.one_liner}
              evaluation={s.evaluation}
              judgeToken={token}
            />
          ))}
        </div>
      )}

      {submissions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No submissions yet.</div>
      )}
    </div>
  );
}
