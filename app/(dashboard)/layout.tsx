import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Separator } from '@/components/ui/separator';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold">
            Dashboard
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <Link href="/dashboard/billing" className="text-sm text-muted-foreground hover:text-foreground">
            Billing
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
