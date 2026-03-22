'use client';

import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AttestationBadgeProps {
  receipt: {
    version: string;
    submission_id: string;
    timestamp: string;
    enclave: { measurement: string; provider: string; quote: string };
    evaluation: { output_hash: string; criteria_count: number; processed_at: string };
    proof: string;
  };
  verificationResult?: { valid: boolean; reason: string } | null;
}

export default function AttestationBadge({ receipt, verificationResult }: AttestationBadgeProps) {
  const isVerified = verificationResult?.valid;
  const isPending = verificationResult === undefined;

  return (
    <Card className={`border-2 ${isPending ? 'border-[#0C447C]/40' : isVerified ? 'border-green-500/40' : 'border-red-500/40'}`}>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isPending ? 'bg-[#0C447C]/10' : isVerified ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <Shield className={`w-5 h-5 ${isPending ? 'text-[#0C447C]' : isVerified ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Attestation Receipt</span>
              <Badge variant="outline" className="text-xs font-mono">v{receipt.version}</Badge>
              {verificationResult && (
                <Badge className={`text-xs ${isVerified ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {isVerified ? 'Verified' : 'Invalid'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{receipt.enclave.provider} · {new Date(receipt.timestamp).toLocaleString()}</p>
          </div>
        </div>

        {verificationResult && (
          <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${isVerified ? 'bg-green-500/5 text-green-300' : 'bg-red-500/5 text-red-300'}`}>
            {isVerified ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {verificationResult.reason}
          </div>
        )}

        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
            <span className="text-muted-foreground">Submission</span>
            <code className="font-mono text-[10px] text-foreground/70 break-all">{receipt.submission_id}</code>
            <span className="text-muted-foreground">Measurement</span>
            <code className="font-mono text-[10px] text-foreground/70 break-all">{receipt.enclave.measurement}</code>
            <span className="text-muted-foreground">Eval Hash</span>
            <code className="font-mono text-[10px] text-foreground/70 break-all">{receipt.evaluation.output_hash}</code>
          </div>
        </div>

        <div className="text-xs text-muted-foreground/60 italic border-t border-border/30 pt-3">
          {receipt.proof}
        </div>
      </CardContent>
    </Card>
  );
}
