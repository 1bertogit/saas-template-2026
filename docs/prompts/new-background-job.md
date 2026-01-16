# Prompt: Criar Novo Background Job

## Uso
Cole este prompt no Cursor/Claude quando precisar criar um novo job com Trigger.dev.

---

## Prompt

```
Crie um novo background job em `trigger/[categoria]-jobs.ts` com as seguintes características:

1. Use Trigger.dev v3 SDK (`@trigger.dev/sdk/v3`)
2. Configure retry com exponential backoff e jitter
3. Adicione logging adequado
4. Trate erros gracefully
5. Defina tipos TypeScript para o payload

Job: [NOME DO JOB]
Categoria: [email | subscription | data | notification]
Funcionalidade: [DESCREVA O QUE O JOB DEVE FAZER]

Siga o padrão existente em `trigger/email-jobs.ts`.
```

---

## Template de Resposta Esperada

```typescript
import { task } from '@trigger.dev/sdk/v3';

export const myNewJob = task({
  id: 'my-new-job',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 60000,
    factor: 2,
    randomize: true, // Jitter para evitar thundering herd
  },
  run: async (payload: {
    userId: string;
    // outros campos tipados
  }) => {
    console.log(`[my-new-job] Starting for user ${payload.userId}`);

    try {
      // Sua lógica aqui

      console.log(`[my-new-job] Completed for user ${payload.userId}`);
      return { success: true };
    } catch (error) {
      console.error(`[my-new-job] Failed:`, error);
      throw error; // Re-throw para trigger retry
    }
  },
});
```

---

## Como Disparar o Job

```typescript
import { myNewJob } from '@/trigger/[categoria]-jobs';

// Em um webhook ou API route
await myNewJob.trigger({
  userId: 'user_123',
  // outros dados
});
```
