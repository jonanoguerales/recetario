/**
 * Direct database access for the e2e tests only (never imported by the app).
 *
 * Test users are created and deleted with SQL over DATABASE_URL instead of the Supabase signup API:
 * - deleting a user needs either the service role key (forbidden, D-11) or SQL, so SQL is needed anyway;
 * - SQL creates confirmed users instantly and does not consume the Auth rate limit, which the real
 *   sign-in / sign-up tests already use;
 * - the recipe the read-only tests need (AC-10 and the 375 px pages) is inserted in the same transaction.
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: ".env.local", quiet: true });

/** Every e2e user matches this pattern; the run id narrows it to the users of one run. */
export const E2E_EMAIL_DOMAIN = "example.net";

/** Users left by a run that was killed before its teardown are removed after this time. */
const STALE_AFTER = "2 hours";

export type Sql = postgres.Sql;

/** One connection, no prepared statements, no pipelining: the Supabase transaction pooler needs it. */
export function connect(): Sql {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("Falta DATABASE_URL en .env.local: los tests e2e la usan para crear y borrar sus usuarios.");
  }
  return postgres(databaseUrl, { prepare: false, max: 1, max_pipeline: 1, onnotice: () => {} });
}

export async function withDb<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = connect();
  try {
    return await work(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/**
 * Creates a confirmed email/password user, like Supabase Auth does: a row in auth.users (bcrypt
 * password via pgcrypto) and its `email` identity in auth.identities. Returns the user id.
 */
export async function createConfirmedUser(sql: Sql, email: string, password: string): Promise<string> {
  return sql.begin(async (tx) => {
    const [user] = await tx<{ id: string }[]>`
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        ${email}, extensions.crypt(${password}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
        '', '', '', ''
      )
      returning id
    `;
    await tx`
      insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (
        ${user.id}, ${user.id},
        jsonb_build_object('sub', ${user.id}::text, 'email', ${email}::text, 'email_verified', true),
        'email', now(), now(), now()
      )
    `;
    return user.id;
  });
}

/** Inserts a recipe owned by `userId` (bypasses RLS: this connection is the database owner). */
export async function insertRecipe(sql: Sql, userId: string, title: string): Promise<string> {
  const [recipe] = await sql<{ id: string }[]>`
    insert into public.recipes (user_id, title, description, category, prep_minutes, servings, ingredients, steps)
    values (
      ${userId}, ${title}, 'Receta creada por los tests e2e.', 'principal', 20, 2,
      ${["2 huevos", "1 patata"]}::text[], ${["Pelar la patata.", "Cuajar con los huevos."]}::text[]
    )
    returning id
  `;
  return recipe.id;
}

/** A recipe of the list tests (AC-8, AC-9), created `minutesAgo` minutes ago so the order is known. */
export interface SeedRecipe {
  title: string;
  category: string;
  ingredients: string[];
  isFavorite: boolean;
  minutesAgo: number;
}

/** Inserts the recipes of `userId` with a fixed creation time each (bypasses RLS, like insertRecipe). */
export async function insertRecipes(sql: Sql, userId: string, recipes: SeedRecipe[]): Promise<void> {
  await sql.begin(async (tx) => {
    for (const recipe of recipes) {
      await tx`
        insert into public.recipes (
          user_id, title, category, prep_minutes, servings, ingredients, steps, is_favorite, created_at
        ) values (
          ${userId}, ${recipe.title}, ${recipe.category}, 30, 4, ${recipe.ingredients}::text[],
          ${["Preparar la receta."]}::text[], ${recipe.isFavorite},
          now() - ${recipe.minutesAgo} * interval '1 minute'
        )
      `;
    }
  });
}

/**
 * Deletes the users of one run (their recipes go with them: `on delete cascade`), plus e2e users
 * older than STALE_AFTER that a killed run could not delete. Returns how many were deleted.
 */
export async function deleteE2eUsers(sql: Sql, runId: string): Promise<number> {
  const rows = await sql`
    delete from auth.users
    where email like ${`e2e-${runId}-%@${E2E_EMAIL_DOMAIN}`}
       or (email like ${`e2e-%@${E2E_EMAIL_DOMAIN}`} and created_at < now() - ${STALE_AFTER}::interval)
    returning id
  `;
  return rows.count;
}

/** Deletes one user by email (used right after a sign-up test). */
export async function deleteUserByEmail(email: string): Promise<void> {
  await withDb((sql) => sql`delete from auth.users where email = ${email}`);
}
