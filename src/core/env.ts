export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

export interface SupabaseEnvInput {
  url: string | undefined;
  publishableKey: string | undefined;
}

const VARIABLE_NAMES: Record<keyof SupabaseEnv, string> = {
  url: "NEXT_PUBLIC_SUPABASE_URL",
  publishableKey: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
};

export class MissingEnvError extends Error {
  constructor(public readonly missing: string[]) {
    super(
      `Faltan variables de entorno de Supabase: ${missing.join(", ")}. ` +
        "Cópialas de .env.example a .env.local y rellénalas con los valores de tu proyecto " +
        "(Supabase → Project Settings → API).",
    );
    this.name = "MissingEnvError";
  }
}

/**
 * Pure validation of the Supabase public configuration.
 * Throws a MissingEnvError (Spanish message) listing every missing variable.
 */
export function parseSupabaseEnv(input: SupabaseEnvInput): SupabaseEnv {
  const url = input.url?.trim() ?? "";
  const publishableKey = input.publishableKey?.trim() ?? "";

  const missing: string[] = [];
  if (!url) missing.push(VARIABLE_NAMES.url);
  if (!publishableKey) missing.push(VARIABLE_NAMES.publishableKey);
  if (missing.length > 0) throw new MissingEnvError(missing);

  if (!URL.canParse(url)) {
    throw new Error(
      `${VARIABLE_NAMES.url} no es una URL válida: «${url}». Debe ser algo como https://xxxx.supabase.co`,
    );
  }

  return { url, publishableKey };
}

/**
 * NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline
 * them in the browser bundle; that is why they are read here and not dynamically.
 */
function readSupabaseEnvInput(): SupabaseEnvInput {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** Reads and validates the Supabase configuration (throws if it is missing). */
export function getSupabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv(readSupabaseEnvInput());
}

/** Returns the Supabase configuration, or null when it is missing or invalid. */
export function getSupabaseEnvOrNull(): SupabaseEnv | null {
  try {
    return getSupabaseEnv();
  } catch {
    return null;
  }
}
