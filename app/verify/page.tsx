'use client';

import { useState } from 'react';
import { Shield, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AttestationBadge from '@/components/AttestationBadge';

export default function VerifyPage() {
  const [receiptText, setReceiptText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const receipt = JSON.parse(receiptText);
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt }),
      });
      const data = await res.json();
      setResult({ receipt, verification: data });
    } catch (err: any) {
      setError(err.message.includes('JSON') ? 'Invalid JSON — paste the full receipt object' : err.message);
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
          Paste an attestation receipt JSON to verify that a submission was processed inside a genuine TEE enclave.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Paste Receipt</CardTitle>
          <CardDescription>The full JSON receipt returned after submission processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            placeholder={'{\n  "version": "1.0",\n  "submission_id": "...",\n  ...\n}'}
            rows={10}
            className="font-mono text-xs resize-none bg-background/50"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={verify} disabled={loading || !receiptText.trim()} className="w-full bg-[#0C447C] hover:bg-[#0C447C]/80">
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
