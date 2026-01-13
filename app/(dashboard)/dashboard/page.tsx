import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo</CardTitle>
          <CardDescription>Seus dados básicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Nome:</span> {user?.fullName ?? 'Usuário'}
          </div>
          <div>
            <span className="font-medium text-foreground">Email:</span> {user?.primaryEmailAddress?.emailAddress ?? '—'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status da assinatura</CardTitle>
          <CardDescription>Integre seu backend do Stripe para valores reais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">trialing</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
