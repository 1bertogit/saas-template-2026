import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error('RESEND_API_KEY is not set');
}

const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const resend = new Resend(apiKey);

export async function sendWelcomeEmail({ to, name }: { to: string; name?: string }) {
  return resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Bem-vindo ao SaaS Template 2026',
    html: `<p>Oi${name ? `, ${name}` : ''}! Obrigado por testar o template.</p>` +
      '<p>Seu ambiente está pronto para rodar com Next.js, Stripe, Clerk e mais.</p>',
  });
}

export async function sendSubscriptionEmail({
  to,
  plan,
}: {
  to: string;
  plan: string;
}) {
  return resend.emails.send({
    from: fromAddress,
    to,
    subject: `Assinatura confirmada: ${plan}`,
    html: `<p>Plano ${plan} ativado.</p><p>Obrigado por assinar!</p>`,
  });
}

export async function sendCancellationEmail({ to }: { to: string }) {
  return resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Assinatura cancelada',
    html: '<p>Sua assinatura foi cancelada. Você continua com acesso até o fim do período atual.</p>',
  });
}
