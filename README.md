# 🚀 SaaS Template 2026

> Template completo para construir SaaS rapidamente com Next.js, TypeScript e as melhores ferramentas do mercado.

## ⚡ Stack Completa

### 🤖 IA & Desenvolvimento
- **[Claude Code](https://claude.ai/)** - Desenvolvimento principal (99%)
- **[Cursor](https://cursor.com/)** - Iterações rápidas e fixes
- **[OpenRouter](https://openrouter.ai/)** - IA integrada nos apps

### 💻 Core
- **[Next.js 15](https://nextjs.org/)** - Framework React (App Router)
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes UI

### 🔐 Backend & Serviços
- **[Neon](https://neon.tech/)** - PostgreSQL Serverless
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[Clerk](https://clerk.com/)** - Autenticação (10k usuários grátis)
- **[Stripe](https://stripe.com/)** - Pagamentos e assinaturas
- **[Cloudflare R2](https://cloudflare.com/r2/)** - Storage (zero egress)
- **[Resend](https://resend.com/)** - Emails (3k/mês grátis)
- **[PostHog](https://posthog.com/)** - Analytics completo

### 🌐 Deploy
- **[Vercel](https://vercel.com/)** - Hospedagem Next.js
- **[Cloudflare](https://cloudflare.com/)** - DNS & CDN

## 🎯 Features Incluídas

✅ Autenticação completa (login, cadastro, perfil)
✅ Pagamentos com Stripe (checkout + webhooks)
✅ Banco de dados configurado (migrations)
✅ Upload de arquivos (R2)
✅ Sistema de emails (templates React)
✅ Analytics e session replays (PostHog)
✅ Integração IA (OpenRouter)
✅ Landing page responsiva
✅ Dashboard protegido
✅ Pricing page
✅ Dark mode
✅ SEO otimizado
✅ Deploy automático

## 🚀 Quick Start

### 1. Clone o repositório
```bash
git clone https://github.com/1bertogit/saas-template-2026.git
cd saas-template-2026
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Preencha todas as chaves de API (veja [API_KEYS.md](./docs/API_KEYS.md))

### 4. Configure o banco de dados
```bash
npm run db:push
```

### 5. Rode o projeto
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Estrutura do Projeto

```
saas-template-2026/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Área protegida
│   ├── (marketing)/       # Landing page
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── auth/             # Componentes de auth
│   ├── dashboard/        # Componentes do dashboard
│   ├── marketing/        # Componentes da landing
│   ├── payment/          # Componentes de pagamento
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilitários e configs
│   ├── db/               # Database (Neon + Drizzle)
│   ├── stripe.ts         # Stripe config
│   ├── storage.ts        # R2 config
│   ├── email.ts          # Resend config
│   ├── ai.ts             # OpenRouter config
│   └── analytics.ts      # PostHog config
├── emails/                # Templates de email
└── docs/                  # Documentação
```

## 🔑 Variáveis de Ambiente

```env
# Database (Neon)
DATABASE_URL=

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Payments (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Email (Resend)
RESEND_API_KEY=

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# AI (OpenRouter)
OPENROUTER_API_KEY=
```

## 📚 Documentação

- **[Setup Guide](./docs/SETUP.md)** - Guia completo de configuração
- **[API Keys](./docs/API_KEYS.md)** - Como conseguir todas as chaves
- **[Deployment](./docs/DEPLOYMENT.md)** - Deploy para produção
- **[Architecture](./docs/ARCHITECTURE.md)** - Decisões de arquitetura

## 🎨 Customização

### Trocar cores
Edite `app/globals.css` com suas cores brand:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}
```

### Adicionar componentes UI
```bash
npx shadcn-ui@latest add [component-name]
```

### Adicionar features com IA
Use Claude Code ou Cursor e referencie a estrutura do projeto.

## 💰 Custos (Planos Gratuitos)

| Serviço | Limite Grátis | Custo após limite |
|---------|---------------|-------------------|
| **Clerk** | 10k usuários/mês | $25/mês |
| **Stripe** | Ilimitado | 2.9% + $0.30/transação |
| **Neon** | 100h compute | $0.102/h |
| **R2** | 10GB storage | $0.015/GB |
| **Resend** | 3k emails/mês | $20/mês (50k) |
| **PostHog** | 1M eventos/mês | $0.00031/evento |
| **Vercel** | Hobby grátis | $20/mês (Pro) |

**Estimativa:** Até ~500 usuários pagantes = 100% grátis ✨

## 🛠️ Scripts Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Roda build
npm run lint         # ESLint
npm run db:push      # Push schema para DB
npm run db:studio    # Drizzle Studio (GUI)
npm run db:generate  # Gerar migrations
```

## 🤝 Contribuindo

Este é seu template pessoal, mas se quiser melhorias:
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT - Faça o que quiser! 🚀

## 💡 Dicas Finais

### Para cada novo SaaS:
1. Clone este template
2. Configure `.env.local` com novas chaves
3. Customize cores e branding
4. Use Claude Code para adicionar features específicas
5. Deploy na Vercel
6. 🎉 Profit!

### Workflow recomendado:
- **99% do código**: Claude Code (Opus 4.5)
- **Fixes rápidos**: Cursor Composer
- **Iterações de UI**: Cursor + v0.dev
- **Scripts**: Python quando necessário

---

**Feito com ❤️ para construir rápido em 2026**

🔗 [Documentação Completa](./docs/SETUP.md) | 🐛 [Report Bug](https://github.com/1bertogit/saas-template-2026/issues) | ✨ [Request Feature](https://github.com/1bertogit/saas-template-2026/issues)