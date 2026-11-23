/**
 * Verifies RLS on public.recipes at database level (AC-10), simulating two users and anon the
 * same way PostgREST does: `set local role` + `request.jwt.claims`. Everything runs inside ONE
 * transaction that is always rolled back, so no data (test users or recipes) is left behind.
 * Usage: npm run db:check-rls   (needs DATABASE_URL in .env.local; never the service role key)
 */
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";
import { buildJwtClaims, expectCheck, summarizeChecks, type CheckResult, type DbRole } from "./rls-check";

class Rollback extends Error {}

async function main(): Promise<void> {
  loadEnv({ path: ".env.local", quiet: true });
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("Falta DATABASE_URL en .env.local.");

  const sql = postgres(databaseUrl, { prepare: false, max: 1, max_pipeline: 1, onnotice: () => {} });
  const results: CheckResult[] = [];
  const userA = randomUUID();
  const userB = randomUUID();

  try {
    await sql
      .begin(async (tx) => {
        // Test users, created as the connection role (postgres) inside the transaction.
        await tx`
          insert into auth.users (id, email, aud, role)
          values (${userA}, ${`rls-a-${userA}@example.test`}, 'authenticated', 'authenticated'),
                 (${userB}, ${`rls-b-${userB}@example.test`}, 'authenticated', 'authenticated')
        `;

        const actAs = async (role: DbRole, sub?: string) => {
          await tx`reset role`;
          await tx`select set_config('request.jwt.claims', ${buildJwtClaims(role, sub)}, true)`;
          await tx.unsafe(`set local role ${role}`);
        };

        /** Runs a statement that must fail inside a savepoint; returns the SQLSTATE or "sin error". */
        const errorCode = async (run: (sp: postgres.TransactionSql) => Promise<unknown>) => {
          try {
            await tx.savepoint(async (sp) => {
              await run(sp);
            });
            return "sin error";
          } catch (error) {
            return (error as { code?: string }).code ?? "desconocido";
          }
        };

        // A creates a recipe (user_id comes from the default auth.uid()).
        await actAs("authenticated", userA);
        const [created] = await tx<{ id: string; user_id: string }[]>`
          insert into public.recipes (title, category, prep_minutes, servings, ingredients, steps)
          values ('Café con leche', 'bebida', 5, 1, array['Café molido', 'Leche'], array['Mezclar'])
          returning id, user_id
        `;
        const recipeId = created.id;
        results.push(expectCheck("A crea receta y user_id = auth.uid() de A", created.user_id, userA));
        results.push(
          expectCheck(
            "A ve su receta",
            (await tx`select id from public.recipes where id = ${recipeId}`).length,
            1,
          ),
        );
        results.push(
          expectCheck(
            "Búsqueda sin mayúsculas ni tildes (search_text ilike '%cafe%')",
            (await tx`select id from public.recipes where search_text ilike '%cafe%' and id = ${recipeId}`).length,
            1,
          ),
        );
        results.push(
          expectCheck(
            "check de R2 rechaza título de 2 caracteres (23514)",
            await errorCode((sp) => sp`
              insert into public.recipes (title, category, prep_minutes, servings, ingredients, steps)
              values ('ab', 'otro', 5, 1, array['x'], array['y'])
            `),
            "23514",
          ),
        );

        // B cannot see, update, delete or impersonate A.
        await actAs("authenticated", userB);
        results.push(
          expectCheck("B no ve la receta de A", (await tx`select id from public.recipes where id = ${recipeId}`).length, 0),
        );
        results.push(
          expectCheck(
            "B no actualiza la receta de A (0 filas)",
            (await tx`update public.recipes set title = 'Hackeada' where id = ${recipeId}`).count,
            0,
          ),
        );
        results.push(
          expectCheck(
            "B no borra la receta de A (0 filas)",
            (await tx`delete from public.recipes where id = ${recipeId}`).count,
            0,
          ),
        );
        results.push(
          expectCheck(
            "B no inserta recetas a nombre de A (42501)",
            await errorCode((sp) => sp`
              insert into public.recipes (user_id, title, category, prep_minutes, servings, ingredients, steps)
              values (${userA}, 'Falsa', 'otro', 5, 1, array['x'], array['y'])
            `),
            "42501",
          ),
        );

        // anon has no access at all.
        await actAs("anon");
        results.push(
          expectCheck(
            "anon no puede leer recetas (42501)",
            await errorCode((sp) => sp`select id from public.recipes`),
            "42501",
          ),
        );

        // A can still update and delete its own recipe.
        await actAs("authenticated", userA);
        const [updated] = await tx<{ title: string }[]>`
          update public.recipes set title = 'Café solo' where id = ${recipeId} returning title
        `;
        results.push(expectCheck("A actualiza su receta", updated?.title, "Café solo"));
        results.push(
          expectCheck(
            "A borra su receta (1 fila)",
            (await tx`delete from public.recipes where id = ${recipeId}`).count,
            1,
          ),
        );

        throw new Rollback();
      })
      .catch((error: unknown) => {
        if (!(error instanceof Rollback)) throw error;
      });

    // Nothing persisted after the rollback.
    const [left] = await sql<{ n: number }[]>`
      select count(*)::int as n from auth.users where id in (${userA}, ${userB})
    `;
    results.push(expectCheck("Rollback: no quedan usuarios de prueba", left.n, 0));
  } finally {
    await sql.end({ timeout: 5 });
  }

  const { ok, report } = summarizeChecks(results);
  console.info(report);
  if (!ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al verificar RLS: ${message}`);
  process.exitCode = 1;
});
