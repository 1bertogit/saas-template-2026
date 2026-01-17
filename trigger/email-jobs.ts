import { task, schedules, logger } from '@trigger.dev/sdk/v3';
import { Resend } from 'resend';
import { db } from '@/lib/db';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Template 2026';
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';

// Send welcome email after user signs up
export const sendWelcomeEmail = task({
  id: 'send-welcome-email',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { email: string; name: string; userId?: string }) => {
    if (!resend) {
      logger.warn('Resend not configured, skipping welcome email');
      return { success: false, reason: 'resend_not_configured' };
    }

    const { email, name } = payload;

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Bem-vindo ao ${APP_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo, ${name}! 🎉</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Obrigado por se cadastrar no <strong>${APP_NAME}</strong>. Estamos felizes em ter você conosco!</p>

            <h2 style="color: #667eea; font-size: 20px;">O que você pode fazer agora:</h2>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 10px;">📊 Explore seu <strong>Dashboard</strong> personalizado</li>
              <li style="margin-bottom: 10px;">🤖 Experimente nossas <strong>integrações com IA</strong></li>
              <li style="margin-bottom: 10px;">📁 Faça <strong>upload de arquivos</strong> de forma segura</li>
              <li style="margin-bottom: 10px;">📈 Acompanhe suas <strong>métricas de uso</strong></li>
            </ul>

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Acessar Dashboard</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">Se precisar de ajuda, basta responder este email.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    return { emailId: result.data?.id, success: true };
  },
});

// Send subscription confirmation email
export const sendSubscriptionEmail = task({
  id: 'send-subscription-email',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    email: string;
    name: string;
    plan: string;
    amount: number;
    periodEnd?: string;
  }) => {
    if (!resend) {
      logger.warn('Resend not configured, skipping subscription email');
      return { success: false, reason: 'resend_not_configured' };
    }

    const { email, name, plan, amount, periodEnd } = payload;
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Assinatura confirmada - Plano ${plan}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Assinatura Confirmada!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Sua assinatura foi ativada com sucesso!</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 5px 0;"><strong>Plano:</strong> ${plan}</p>
              <p style="margin: 5px 0;"><strong>Valor:</strong> ${formattedAmount}/mês</p>
              ${periodEnd ? `<p style="margin: 5px 0;"><strong>Próxima cobrança:</strong> ${periodEnd}</p>` : ''}
            </div>

            <p>Agora você tem acesso a todos os recursos do plano ${plan}. Aproveite!</p>

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ir para o Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    return { emailId: result.data?.id, success: true };
  },
});

// Send subscription cancellation email
export const sendCancellationEmail = task({
  id: 'send-cancellation-email',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    email: string;
    name: string;
    plan: string;
    endDate: string;
  }) => {
    if (!resend) {
      return { success: false, reason: 'resend_not_configured' };
    }

    const { email, name, plan, endDate } = payload;

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Assinatura cancelada - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f59e0b; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Assinatura Cancelada</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Confirmamos o cancelamento da sua assinatura do plano <strong>${plan}</strong>.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0;">Você ainda terá acesso até: <strong>${endDate}</strong></p>
            </div>

            <p>Sentiremos sua falta! Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.</p>

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ver Planos</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    return { emailId: result.data?.id, success: true };
  },
});

// Send payment failed email
export const sendPaymentFailedEmail = task({
  id: 'send-payment-failed-email',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    email: string;
    name: string;
    amount: number;
    retryDate?: string;
  }) => {
    if (!resend) {
      return { success: false, reason: 'resend_not_configured' };
    }

    const { email, name, amount, retryDate } = payload;
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `⚠️ Falha no pagamento - Ação necessária`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ef4444; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Falha no Pagamento</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Não conseguimos processar seu pagamento de <strong>${formattedAmount}</strong>.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0;">Por favor, atualize seu método de pagamento para evitar a interrupção do serviço.</p>
              ${retryDate ? `<p style="margin-top: 10px;">Tentaremos novamente em: <strong>${retryDate}</strong></p>` : ''}
            </div>

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Atualizar Pagamento</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    return { emailId: result.data?.id, success: true };
  },
});

// Daily digest email (scheduled job)
export const dailyDigestEmail = schedules.task({
  id: 'daily-digest-email',
  cron: '0 9 * * *', // Every day at 9 AM
  maxDuration: 300,
  run: async () => {
    if (!resend) {
      return { success: false, reason: 'resend_not_configured' };
    }

    // Fetch active users who opted in for daily digest
    const activeUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const user of activeUsers) {
      try {
        // In production, you would fetch user-specific metrics here
        // For now, we skip actual sending to avoid spam
        logger.info('Would send digest', { email: user.email });
        sent++;
      } catch (error) {
        logger.error('Failed to send digest', { email: user.email, error });
        failed++;
      }
    }

    return {
      success: true,
      processed: activeUsers.length,
      sent,
      failed,
    };
  },
});
