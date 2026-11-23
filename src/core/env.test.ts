import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MissingEnvError,
  getSupabaseEnv,
  getSupabaseEnvOrNull,
  parseSupabaseEnv,
} from "./env";

const VALID = {
  url: "https://example.supabase.co",
  publishableKey: "sb_publishable_test",
};

describe("T-01 · parseSupabaseEnv (lectura de variables de Supabase)", () => {
  it("devuelve la configuración cuando ambas variables están definidas", () => {
    expect(parseSupabaseEnv(VALID)).toEqual(VALID);
  });

  it("recorta espacios alrededor de los valores", () => {
    expect(
      parseSupabaseEnv({ url: `  ${VALID.url} `, publishableKey: ` ${VALID.publishableKey}\n` }),
    ).toEqual(VALID);
  });

  it("lanza un error en español que nombra la variable que falta", () => {
    expect(() => parseSupabaseEnv({ ...VALID, url: undefined })).toThrow(MissingEnvError);
    expect(() => parseSupabaseEnv({ ...VALID, url: undefined })).toThrow(
      /Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL\./,
    );
  });

  it("lista todas las variables que faltan o están vacías", () => {
    try {
      parseSupabaseEnv({ url: "", publishableKey: "   " });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(MissingEnvError);
      expect((error as MissingEnvError).missing).toEqual([
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ]);
      expect((error as Error).message).toContain(".env.local");
    }
  });

  it("rechaza una URL mal formada con un mensaje claro", () => {
    expect(() => parseSupabaseEnv({ ...VALID, url: "no-es-una-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL no es una URL válida/,
    );
  });
});

describe("T-01 · getSupabaseEnv / getSupabaseEnvOrNull (process.env)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lee las variables de process.env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID.url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", VALID.publishableKey);
    expect(getSupabaseEnv()).toEqual(VALID);
    expect(getSupabaseEnvOrNull()).toEqual(VALID);
  });

  it("getSupabaseEnvOrNull devuelve null si faltan, sin lanzar", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(getSupabaseEnvOrNull()).toBeNull();
    expect(() => getSupabaseEnv()).toThrow(MissingEnvError);
  });
});
