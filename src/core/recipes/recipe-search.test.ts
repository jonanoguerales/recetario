import { describe, expect, it } from "vitest";
import { normalizeSearchTerm } from "./recipe-search";

describe("T-02 · AC-9 · normalizeSearchTerm (búsqueda sin mayúsculas ni tildes)", () => {
  it("pasa a minúsculas y quita las tildes como la función de la base de datos", () => {
    expect(normalizeSearchTerm("Café con LECHE")).toBe("cafe con leche");
    expect(normalizeSearchTerm("Piñón, crème brûlée")).toBe("pinon, creme brulee");
  });

  it("recorta y colapsa los espacios", () => {
    expect(normalizeSearchTerm("  arroz    al   horno ")).toBe("arroz al horno");
  });

  it("escapa los comodines de ILIKE para buscarlos literalmente", () => {
    expect(normalizeSearchTerm("100%_puro\\")).toBe("100\\%\\_puro\\\\");
  });

  it("AC-9 · convierte «*» (comodín de PostgREST, no escapable) en «_»: una sola letra, nunca «cualquier texto»", () => {
    expect(normalizeSearchTerm("2*3")).toBe("2_3");
    expect(normalizeSearchTerm("**")).toBe("__");
    // A literal «_» typed by the person stays escaped; only the «*» becomes the one-character wildcard.
    expect(normalizeSearchTerm("a_*")).toBe("a\\__");
    expect(normalizeSearchTerm("pi*on")).not.toContain("*");
  });

  it("devuelve cadena vacía si solo hay espacios", () => {
    expect(normalizeSearchTerm("   ")).toBe("");
  });
});
