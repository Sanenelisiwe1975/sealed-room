'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Submission {
  id: string;
  project_name: string;
  one_liner: string;
  status: string;
  created_at: string;
  has_receipt: boolean;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'complete') return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-yellow-400" />;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/submissions')
      .then((r) => r.json())
      .then((data) => { setSubmissions(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#0C447C] text-sm font-mono">
          <Shield className="w-4 h-4" />
          Submission History
        </div>
        <h1 className="text-3xl font-bold">All Submissions</h1>
        <p className="text-muted-foreground">Click a submission to verify its attestation receipt.</p>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!loading && submissions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No submissions yet.{' '}
          <Link href="/submit" className="text-[#0C447C] underline">Submit your first pitch.</Link>
        </div>
      )}

      <div className="space-y-3">
        {submissions.map((s) => (
          <Card key={s.id} className="border-border/50">
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <StatusIcon status={s.status} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{s.project_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.one_liner}</p>
                  <p className="text-xs font-mono text-muted-foreground/60 mt-1 truncate">{s.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs capitalize">{s.status}</Badge>
                {s.has_receipt && (
                  <Button asChild size="sm" variant="outline" className="text-xs h-7">
                    <Link href={`/verify?id=${s.id}`}>
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Verify
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
