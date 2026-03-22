'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AttestationBadge from './AttestationBadge';

interface SubmissionStatus {
  submission_id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  receipt?: any;
}

export default function SubmitForm() {
  const [projectName, setProjectName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [pitch, setPitch] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Client-side: encode pitch as base64 (simulates encryption)
      const encryptedPayload = Buffer.from(
        JSON.stringify({ project_name: projectName, one_liner: oneLiner, pitch })
      ).toString('base64');

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_name: projectName, one_liner: oneLiner, encrypted_payload: encryptedPayload }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus({ submission_id: data.submission_id, status: 'pending' });

      // Poll for completion
      pollStatus(data.submission_id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/submission/${id}/status`);
        const data = await res.json();
        setStatus(data);

        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);
  };

  if (status?.status === 'complete' && status.receipt) {
    return (
      <div className="space-y-6">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-green-400">Submission Complete</CardTitle>
            <CardDescription>Your pitch has been evaluated inside the TEE enclave.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Submission ID: <code className="font-mono text-xs">{status.submission_id}</code>
            </p>
            <AttestationBadge receipt={status.receipt} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Name</label>
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Sealed Room"
          required
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">One-line Description</label>
        <Input
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="What does your project do in one sentence?"
          required
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Full Pitch</label>
        <Textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Describe your project in detail — problem, solution, tech stack, demo plan, team..."
          required
          rows={10}
          className="bg-background/50 font-mono text-sm resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {status && (
        <div className="text-sm text-muted-foreground">
          Status:{' '}
          <span className={status.status === 'failed' ? 'text-red-400' : 'text-blue-400'}>
            {status.status === 'pending' ? 'Queued...' : status.status === 'processing' ? 'Processing in enclave...' : status.status}
          </span>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-[#0C447C] hover:bg-[#0C447C]/80">
        {loading ? 'Processing in TEE...' : 'Submit Pitch to Enclave'}
      </Button>
    </form>
  );
}
