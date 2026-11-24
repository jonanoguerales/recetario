import { describe, expect, it } from "vitest";
import { parseFlash, serializeFlash } from "./flash";

describe("aviso de una sola vez (flash)", () => {
  it("AC-7: el aviso de receta borrada se guarda y se lee igual, con tildes y comillas", () => {
    const flash = { type: "recipe-deleted", title: "Piñones «al horno» con café" } as const;
    const value = serializeFlash(flash);
    // ASCII only: it travels in a request header.
    expect(value).toMatch(/^[\x20-\x7e]+$/);
    expect(parseFlash(value)).toEqual(flash);
  });

  it("AC-7: sin aviso, o con un valor manipulado o desconocido, no hay aviso", () => {
    expect(parseFlash(null)).toBeNull();
    expect(parseFlash(undefined)).toBeNull();
    expect(parseFlash("")).toBeNull();
    expect(parseFlash("%E0%A4%A")).toBeNull();
    expect(parseFlash("no-es-json")).toBeNull();
    expect(parseFlash(encodeURIComponent(JSON.stringify({ type: "otro", title: "x" })))).toBeNull();
    expect(parseFlash(encodeURIComponent(JSON.stringify({ type: "recipe-deleted", title: "" })))).toBeNull();
    expect(
      parseFlash(encodeURIComponent(JSON.stringify({ type: "recipe-deleted", title: "a".repeat(121) }))),
    ).toBeNull();
  });
});
