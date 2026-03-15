import { Globe } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-secondary px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Globe className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-text">
          Prospect<span className="text-primary">Web</span>
        </span>
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
