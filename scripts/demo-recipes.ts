/** Sample data of the demo user (R7), used by scripts/seed-demo.ts. */
import type { RecipeCategory } from "../src/core/recipes/recipe.model";

export const DEMO_EMAIL = "admin@recetario.app";

export interface DemoRecipe {
  title: string;
  description: string;
  category: RecipeCategory;
  prepMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  isFavorite: boolean;
}

export const DEMO_RECIPES: DemoRecipe[] = [
  {
    title: "Tostadas con tomate y aceite",
    description: "El desayuno de siempre, con pan del día y buen aceite de oliva.",
    category: "desayuno",
    prepMinutes: 10,
    servings: 2,
    ingredients: ["4 rebanadas de pan de pueblo", "2 tomates maduros", "Aceite de oliva virgen extra", "Sal en escamas"],
    steps: ["Tuesta el pan.", "Ralla los tomates y escurre un poco el jugo.", "Unta el tomate, riega con aceite y añade sal."],
    isFavorite: false,
  },
  {
    title: "Gazpacho andaluz",
    description: "Fresquito para el verano; mejor de un día para otro.",
    category: "entrante",
    prepMinutes: 20,
    servings: 4,
    ingredients: [
      "1 kg de tomates maduros",
      "1 pimiento verde",
      "1 pepino",
      "1 diente de ajo",
      "50 g de pan del día anterior",
      "Aceite de oliva, vinagre de Jerez y sal",
    ],
    steps: [
      "Trocea las verduras y remoja el pan.",
      "Tritura todo con el aceite, el vinagre y la sal.",
      "Cuela y enfría al menos dos horas en la nevera.",
    ],
    isFavorite: true,
  },
  {
    title: "Ensalada de espinacas con piñones",
    description: "Ensalada templada con pasas, piñones y queso de cabra.",
    category: "entrante",
    prepMinutes: 15,
    servings: 2,
    ingredients: ["150 g de espinacas baby", "30 g de piñones", "30 g de pasas", "100 g de queso de cabra", "Vinagreta de miel"],
    steps: ["Tuesta los piñones en una sartén sin aceite.", "Mezcla las espinacas con las pasas y el queso.", "Añade los piñones y aliña al servir."],
    isFavorite: false,
  },
  {
    title: "Tortilla de patatas",
    description: "Jugosa por dentro, con cebolla pochada a fuego lento.",
    category: "principal",
    prepMinutes: 45,
    servings: 4,
    ingredients: ["6 huevos", "700 g de patatas", "1 cebolla", "Aceite de oliva", "Sal"],
    steps: [
      "Corta las patatas y la cebolla en láminas finas.",
      "Fríelas a fuego suave hasta que estén tiernas y escúrrelas.",
      "Mézclalas con los huevos batidos y la sal.",
      "Cuaja la tortilla por los dos lados.",
    ],
    isFavorite: true,
  },
  {
    title: "Lentejas estofadas",
    description: "Plato de cuchara de toda la vida, con chorizo y verduras.",
    category: "principal",
    prepMinutes: 60,
    servings: 6,
    ingredients: ["400 g de lentejas pardinas", "1 chorizo", "1 zanahoria", "1 cebolla", "1 pimiento rojo", "1 cucharadita de pimentón"],
    steps: [
      "Sofríe la cebolla, el pimiento y la zanahoria picados.",
      "Añade el pimentón, el chorizo y las lentejas.",
      "Cubre con agua y cuece a fuego medio unos 40 minutos.",
    ],
    isFavorite: false,
  },
  {
    title: "Salmón al horno con limón",
    description: "Cena rápida y ligera.",
    category: "principal",
    prepMinutes: 25,
    servings: 2,
    ingredients: ["2 lomos de salmón", "1 limón", "Eneldo", "Aceite de oliva", "Sal y pimienta"],
    steps: ["Precalienta el horno a 200 °C.", "Coloca el salmón con rodajas de limón, eneldo y aceite.", "Hornea 12–15 minutos."],
    isFavorite: false,
  },
  {
    title: "Arroz con leche",
    description: "Cremoso, con canela y piel de limón.",
    category: "postre",
    prepMinutes: 50,
    servings: 6,
    ingredients: ["1 l de leche entera", "100 g de arroz redondo", "120 g de azúcar", "1 rama de canela", "Piel de un limón", "Canela en polvo"],
    steps: [
      "Calienta la leche con la canela y la piel de limón.",
      "Añade el arroz y cuece a fuego lento removiendo a menudo.",
      "Incorpora el azúcar al final y espolvorea canela al servir.",
    ],
    isFavorite: true,
  },
  {
    title: "Limonada con hierbabuena",
    description: "Refrescante y poco dulce.",
    category: "bebida",
    prepMinutes: 10,
    servings: 4,
    ingredients: ["4 limones", "1 l de agua fría", "60 g de azúcar", "Unas hojas de hierbabuena", "Hielo"],
    steps: ["Exprime los limones y disuelve el azúcar en el zumo.", "Añade el agua, la hierbabuena y el hielo."],
    isFavorite: false,
  },
];
