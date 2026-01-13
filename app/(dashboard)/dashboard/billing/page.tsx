import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const plans = [
  {
    id: 'starter',
    title: 'Starter',
    price: '$19/mês',
    description: 'Para validar sua ideia.',
    features: ['Até 1k usuários', 'Suporte por email', '1 projeto'],
  },
  {
    id: 'pro',
    title: 'Pro',
    price: '$49/mês',
    description: 'Para crescer com segurança.',
    features: ['Até 10k usuários', 'Webhooks Stripe', 'Suporte priorizado'],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    price: 'Fale com vendas',
    description: 'Escala e compliance.',
    features: ['SLA dedicado', 'SSO', 'Equipe dedicada'],
  },
];

export default function BillingPage() {
  return (
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
                  <Check className="h-4 w-4" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.id === 'pro' ? 'default' : 'outline'}>
              Escolher plano
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
