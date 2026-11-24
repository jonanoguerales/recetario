import { describe, expect, it } from "vitest";
import { categoryLabel, formatPrepTime, formatServings } from "./recipe.format";

describe("formateo de los datos de una receta", () => {
  it("AC-8: formatea tiempos y raciones como en las tarjetas y el detalle", () => {
    expect(formatPrepTime(25)).toBe("25 min");
    expect(formatPrepTime(60)).toBe("1 h");
    expect(formatPrepTime(95)).toBe("1 h 35 min");
    expect(formatPrepTime(1440)).toBe("24 h");
    expect(formatServings(1)).toBe("1 ración");
    expect(formatServings(4)).toBe("4 raciones");
  });

  it("AC-8: muestra la categoría con su etiqueta en español", () => {
    expect(categoryLabel("desayuno")).toBe("Desayuno");
    expect(categoryLabel("principal")).toBe("Principal");
  });
});
