import * as React from 'react';
import { Html } from '@react-email/html';

interface WelcomeEmailProps {
  name?: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <h1>Bem-vindo{ name ? `, ${name}` : ''}!</h1>
      <p>Seu template SaaS 2026 está pronto para uso.</p>
    </Html>
  );
}
