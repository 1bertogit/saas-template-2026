import { task, schedules } from '@trigger.dev/sdk/v3';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send welcome email after user signs up
export const sendWelcomeEmail = task({
  id: 'send-welcome-email',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { email: string; name: string }) => {
    const { email, name } = payload;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: `Bem-vindo ao ${process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Template'}!`,
      html: `
        <h1>Olá ${name}!</h1>
        <p>Obrigado por se cadastrar. Estamos felizes em ter você conosco.</p>
        <p>Comece explorando nossos recursos:</p>
        <ul>
          <li>Dashboard personalizado</li>
          <li>Integração com IA</li>
          <li>Relatórios avançados</li>
        </ul>
        <p>Se precisar de ajuda, responda este email.</p>
      `,
    });

    return { emailId: result.data?.id, success: true };
  },
});

// Send subscription confirmation email
export const sendSubscriptionEmail = task({
  id: 'send-subscription-email',
  maxDuration: 60,
  run: async (payload: { email: string; plan: string; amount: number }) => {
    const { email, plan, amount } = payload;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: 'Assinatura confirmada!',
      html: `
        <h1>Sua assinatura foi confirmada!</h1>
        <p>Plano: <strong>${plan}</strong></p>
        <p>Valor: <strong>R$ ${(amount / 100).toFixed(2)}</strong></p>
        <p>Obrigado por confiar em nós!</p>
      `,
    });

    return { success: true };
  },
});

// Daily digest email (scheduled job)
export const dailyDigestEmail = schedules.task({
  id: 'daily-digest-email',
  cron: '0 9 * * *', // Every day at 9 AM
  maxDuration: 300,
  run: async () => {
    // This would fetch users who opted in for daily digest
    // and send them a summary of their activity
    console.log('Running daily digest job...');

    // Example: fetch users and send personalized digests
    // const users = await db.query.users.findMany({ where: ... });
    // for (const user of users) {
    //   await sendDigestToUser(user);
    // }

    return { processed: 0, success: true };
  },
});
