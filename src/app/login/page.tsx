import type { Metadata } from "next";
import { LoginScene } from "@/pods/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return <LoginScene />;
}
