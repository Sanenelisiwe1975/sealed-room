import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubmitForm from '@/components/SubmitForm';

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#0C447C] text-sm font-mono">
          <Shield className="w-4 h-4" />
          TEE-Protected Submission
        </div>
        <h1 className="text-3xl font-bold">Submit Your Pitch</h1>
        <p className="text-muted-foreground">
          Your submission is encrypted client-side and processed inside a hardware Trusted Execution Environment. Judges will never see your raw idea.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Pitch Details</CardTitle>
          <CardDescription>All fields are required. Your pitch will be evaluated by Claude inside the enclave.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubmitForm />
        </CardContent>
      </Card>
    </div>
  );
}
