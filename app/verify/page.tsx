'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AttestationBadge from '@/components/AttestationBadge';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [receiptText, setReceiptText] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSubmissionId(id);
      lookupById(id);
    }
  }, []);

  const verify = async (receipt: any) => {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt }),
    });
    const data = await res.json();
    setResult({ receipt, verification: data });
  };

  const verifyFromText = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const receipt = JSON.parse(receiptText);
      await verify(receipt);
    } catch (err: any) {
      setError(err.message.includes('JSON') ? 'Invalid JSON — paste the full receipt object' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const lookupById = async (id?: string) => {
    const target = id || submissionId.trim();
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/submission/${target}/status`);
      if (!res.ok) { setError('Submission not found'); return; }
      const data = await res.json();
      if (!data.receipt) { setError('No receipt yet — submission may still be processing or failed'); return; }
      setReceiptText(JSON.stringify(data.receipt, null, 2));
      await verify(data.receipt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#0C447C] text-sm font-mono">
          <Shield className="w-4 h-4" />
          Cryptographic Verification
        </div>
        <h1 className="text-3xl font-bold">Verify Attestation Receipt</h1>
        <p className="text-muted-foreground">
          Verify that a submission was processed inside a genuine TEE enclave — by submission ID or by pasting the receipt JSON.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Lookup by Submission ID</CardTitle>
          <CardDescription>Enter the submission ID shown after you submitted your pitch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="e.g. 3f7a1c2e-..."
              className="font-mono text-sm bg-background/50"
              onKeyDown={(e) => e.key === 'Enter' && lookupById()}
            />
            <Button onClick={() => lookupById()} disabled={loading || !submissionId.trim()} className="bg-[#0C447C] hover:bg-[#0C447C]/80 shrink-0">
              <Search className="w-4 h-4 mr-2" />
              Lookup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Paste Receipt JSON</CardTitle>
          <CardDescription>Paste the full receipt JSON returned after submission processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            placeholder={'{\n  "version": "1.0",\n  "submission_id": "...",\n  ...\n}'}
            rows={8}
            className="font-mono text-xs resize-none bg-background/50"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={verifyFromText} disabled={loading || !receiptText.trim()} className="w-full bg-[#0C447C] hover:bg-[#0C447C]/80">
            <Upload className="w-4 h-4 mr-2" />
            {loading ? 'Verifying...' : 'Verify Receipt'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <AttestationBadge
          receipt={result.receipt}
          verificationResult={result.verification}
        />
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
