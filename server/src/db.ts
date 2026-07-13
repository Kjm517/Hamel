import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { env } from './env';

type Sql = NeonQueryFunction<false, false>;

let sql: Sql | null = null;

export function getSql(): Sql {
  if (!sql) {
    sql = neon(env.databaseUrl());
  }
  return sql;
}

/** Run a query and return rows as T[]. */
export async function queryRows<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await (getSql() as unknown as (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T[]>)(strings, ...values);
  return result ?? [];
}
