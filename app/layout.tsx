import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Shield } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sealed Room',
  description: 'Confidential pitch and IP protection platform powered by TEE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Shield className="w-5 h-5 text-[#0C447C]" />
              Sealed Room
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">Submit</Link>
              <Link href="/judge" className="text-muted-foreground hover:text-foreground transition-colors">Judge</Link>
              <Link href="/verify" className="text-muted-foreground hover:text-foreground transition-colors">Verify</Link>
              <div className="flex items-center gap-1.5 text-xs text-[#0C447C] font-mono border border-[#0C447C]/30 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#0C447C] rounded-full animate-pulse" />
                TEE Active
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
