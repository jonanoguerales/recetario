/**
 * Creates (or updates) the demo user of R7 with a set of sample recipes, so the app can be tried with data.
 * Usage: npm run db:seed-demo  (needs DATABASE_URL and DEMO_PASSWORD in .env.local)
 *
 * Idempotent: the user is created confirmed if missing (otherwise its password is reset to DEMO_PASSWORD)
 * and its recipes are replaced by the sample ones. It works over SQL like the e2e tests: creating a
 * confirmed user needs either the service role key (forbidden in the repo, D-11) or SQL.
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";
import { DEMO_EMAIL, DEMO_RECIPES } from "./demo-recipes";

async function main(): Promise<void> {
  loadEnv({ path: ".env.local", quiet: true });

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("Falta DATABASE_URL en .env.local.");
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error("Falta DEMO_PASSWORD en .env.local (la contraseña del usuario de prueba).");

  // The Supabase pooler hangs on pipelined queries: one connection, no prepared statements, no pipelining.
  const sql = postgres(databaseUrl, { prepare: false, max: 1, max_pipeline: 1, onnotice: () => {} });

  try {
    await sql.begin(async (tx) => {
      const [existing] = await tx<{ id: string }[]>`select id from auth.users where email = ${DEMO_EMAIL}`;
      let userId: string;

      if (existing) {
        userId = existing.id;
        await tx`
          update auth.users
          set encrypted_password = extensions.crypt(${password}, extensions.gen_salt('bf')),
              email_confirmed_at = coalesce(email_confirmed_at, now()),
              updated_at = now()
          where id = ${userId}
        `;
      } else {
        const [user] = await tx<{ id: string }[]>`
          insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change
          ) values (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
            ${DEMO_EMAIL}, extensions.crypt(${password}, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
            '', '', '', ''
          )
          returning id
        `;
        userId = user.id;
        await tx`
          insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
          values (
            ${userId}, ${userId},
            jsonb_build_object('sub', ${userId}::text, 'email', ${DEMO_EMAIL}::text, 'email_verified', true),
            'email', now(), now(), now()
          )
        `;
      }

      await tx`delete from public.recipes where user_id = ${userId}`;
      // Oldest first, so the list (newest first) starts with the last one.
      for (const [index, recipe] of DEMO_RECIPES.entries()) {
        await tx`
          insert into public.recipes (
            user_id, title, description, category, prep_minutes, servings, ingredients, steps, is_favorite, created_at
          ) values (
            ${userId}, ${recipe.title}, ${recipe.description}, ${recipe.category}, ${recipe.prepMinutes},
            ${recipe.servings}, ${recipe.ingredients}::text[], ${recipe.steps}::text[], ${recipe.isFavorite},
            now() - ${DEMO_RECIPES.length - index} * interval '1 hour'
          )
        `;
      }
    });

    console.info(`Usuario de prueba listo: ${DEMO_EMAIL} con ${DEMO_RECIPES.length} recetas.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
