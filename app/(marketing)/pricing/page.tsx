import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
  {
    id: 'starter',
    title: 'Starter',
    price: '$19/mês',
    description: 'Para validar sua ideia.',
    features: ['Até 1k usuários', 'Checkout Stripe pronto', 'Uploads R2'],
  },
  {
    id: 'pro',
    title: 'Pro',
    price: '$49/mês',
    description: 'Para crescer com segurança.',
    features: ['Até 10k usuários', 'Webhooks configurados', 'Prioridade no suporte'],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    price: 'Custom',
    description: 'Escala, SSO e compliance.',
    features: ['SLA dedicado', 'SSO / SCIM', 'Equipe técnica dedicada'],
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">Planos</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Escolha seu plano</h1>
        <p className="mt-3 text-lg text-muted-foreground">Pronto para SaaS com auth, billing, storage e IA.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-semibold">{plan.price}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full">
                <Link href="/sign-up">Assinar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
