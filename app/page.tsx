import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex max-w-3xl flex-col items-center text-center gap-4">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          SaaS Template 2026
        </span>
        <h1 className="text-4xl font-semibold sm:text-5xl">Construa SaaS mais rápido em 2026</h1>
        <p className="text-lg text-muted-foreground">
          Next.js 15, Stripe, Clerk, Neon, R2, Resend, PostHog e OpenRouter prontos em um único template.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/sign-up">Começar agora</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">Ver preços</Link>
          </Button>
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: 'Pagamentos', text: 'Stripe + webhooks prontos para assinaturas.' },
          { title: 'Auth', text: 'Clerk com middlewares e páginas de login.' },
          { title: 'Infra', text: 'Neon, R2, Resend e PostHog configurados.' },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
