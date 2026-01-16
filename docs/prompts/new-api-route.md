# Prompt: Criar Nova Rota de API

## Uso
Cole este prompt no Cursor/Claude quando precisar criar uma nova rota de API.

---

## Prompt

```
Crie uma nova rota de API em `app/api/[nome]/route.ts` com as seguintes características:

1. Autenticação obrigatória com Clerk (`await auth()`)
2. Rate limiting usando `lib/rate-limit.ts`
3. Validação de input com Zod
4. Tratamento de erros com try/catch
5. Retorno de JSON com status codes apropriados

Funcionalidade: [DESCREVA O QUE A ROTA DEVE FAZER]

Siga o padrão existente em `app/api/ai/generate/route.ts`.
```

---

## Template de Resposta Esperada

```typescript
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  // Define your schema
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await rateLimit(userId, 'api');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = requestSchema.parse(body);

    // Your business logic here

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API_NAME]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
