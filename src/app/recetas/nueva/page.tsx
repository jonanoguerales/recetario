import type { Metadata } from "next";
import { PageLayout } from "@/layouts";
import { NewRecipeScene } from "@/pods/recipe-form";

export const metadata: Metadata = { title: "Nueva receta" };

export default function NewRecipePage() {
  return (
    <PageLayout title="Nueva receta">
      <NewRecipeScene />
    </PageLayout>
  );
}
