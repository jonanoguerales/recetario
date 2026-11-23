import { Suspense } from "react";
import { ROUTES } from "@/core/auth";
import { AuthPanelComponent } from "./components/auth-panel.component";
import { GuestOnlyRedirect } from "./guards.container";
import { LoginContainer } from "./login.container";
import { RegisterContainer } from "./register.container";

/** /login: sign-in form (static, works without JS) + server redirect when there is a session. */
export function LoginScene() {
  return (
    <AuthPanelComponent
      title="Entrar"
      intro="Accede a tus recetas con tu email y tu contraseña."
      switchText="¿No tienes cuenta?"
      switchLinkText="Regístrate"
      switchHref={ROUTES.register}
    >
      <LoginContainer />
      <Suspense fallback={null}>
        <GuestOnlyRedirect />
      </Suspense>
    </AuthPanelComponent>
  );
}

/** /registro: sign-up form (static, works without JS) + server redirect when there is a session. */
export function RegisterScene() {
  return (
    <AuthPanelComponent
      title="Crear cuenta"
      intro="Guarda tus recetas y encuéntralas en cualquier momento."
      switchText="¿Ya tienes cuenta?"
      switchLinkText="Inicia sesión"
      switchHref={ROUTES.login}
    >
      <RegisterContainer />
      <Suspense fallback={null}>
        <GuestOnlyRedirect />
      </Suspense>
    </AuthPanelComponent>
  );
}
