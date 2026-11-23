import { describe, expect, it } from "vitest";
import { isGuestOnlyPath, isPrivatePath } from "./routes";

describe("isPrivatePath", () => {
  it("AC-1: /recetas y cualquier ruta bajo ella son privadas", () => {
    expect(isPrivatePath("/recetas")).toBe(true);
    expect(isPrivatePath("/recetas/")).toBe(true);
    expect(isPrivatePath("/recetas/nueva")).toBe(true);
    expect(isPrivatePath("/recetas/123/editar")).toBe(true);
  });

  it("AC-1: la portada, el login y el registro son públicos", () => {
    expect(isPrivatePath("/")).toBe(false);
    expect(isPrivatePath("/login")).toBe(false);
    expect(isPrivatePath("/registro")).toBe(false);
  });

  it("AC-1: no confunde rutas que solo empiezan igual", () => {
    expect(isPrivatePath("/recetasx")).toBe(false);
    expect(isPrivatePath("/otras/recetas")).toBe(false);
  });
});

describe("isGuestOnlyPath", () => {
  it("navegación: /login y /registro son solo para personas sin sesión (con sesión → /recetas)", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("/registro")).toBe(true);
    expect(isGuestOnlyPath("/registro/")).toBe(true);
  });

  it("navegación: el resto de rutas no lo son", () => {
    expect(isGuestOnlyPath("/")).toBe(false);
    expect(isGuestOnlyPath("/recetas")).toBe(false);
    expect(isGuestOnlyPath("/login/otra")).toBe(false);
  });
});
