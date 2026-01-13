import * as React from 'react';
import { Html } from '@react-email/html';

interface SubscriptionEmailProps {
  plan: string;
}

export default function SubscriptionConfirmed({ plan }: SubscriptionEmailProps) {
  return (
    <Html>
      <h1>Assinatura confirmada</h1>
      <p>Plano: {plan}</p>
    </Html>
  );
}
