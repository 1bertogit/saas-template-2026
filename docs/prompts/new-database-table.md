# Prompt: Criar Nova Tabela no Banco

## Uso
Cole este prompt no Cursor/Claude quando precisar criar uma nova tabela com Drizzle ORM.

---

## Prompt

```
Adicione uma nova tabela ao schema em `lib/db/schema.ts` com as seguintes características:

1. Use Drizzle ORM com PostgreSQL (Neon)
2. Adicione campos de auditoria (createdAt, updatedAt)
3. Defina relacionamentos se necessário
4. Exporte os tipos inferidos
5. Crie índices para campos frequentemente consultados

Tabela: [NOME]
Campos: [LISTE OS CAMPOS E TIPOS]
Relacionamentos: [OPCIONAL - com quais tabelas]

Siga o padrão existente em `lib/db/schema.ts`.
```

---

## Template de Resposta Esperada

```typescript
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const myNewTable = pgTable(
  'my_new_table',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Seus campos aqui
    name: text('name').notNull(),
    status: text('status').notNull().default('active'),
    count: integer('count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    // Campos de auditoria
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Índices para queries frequentes
    userIdIdx: index('my_new_table_user_id_idx').on(table.userId),
    statusIdx: index('my_new_table_status_idx').on(table.status),
  })
);

// Relacionamentos
export const myNewTableRelations = relations(myNewTable, ({ one }) => ({
  user: one(users, {
    fields: [myNewTable.userId],
    references: [users.id],
  }),
}));

// Tipos inferidos
export type MyNewTable = typeof myNewTable.$inferSelect;
export type NewMyNewTable = typeof myNewTable.$inferInsert;
```

---

## Após Criar a Tabela

```bash
# Gerar migration
npx drizzle-kit generate

# Aplicar migration
npx drizzle-kit push
```
