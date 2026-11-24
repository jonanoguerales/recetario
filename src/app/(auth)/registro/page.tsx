import type { Metadata } from "next";
import { RegisterScene } from "@/pods/auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return <RegisterScene />;
}
