import { ROUTES } from "@/core/auth";
import { AuthPanelComponent } from "./components/auth-panel.component";
import { LoginContainer } from "./login.container";
import { RegisterContainer } from "./register.container";

/**
 * /login: sign-in form (static HTML, works without JS). With a session, proxy.ts sends the person to
 * /recetas before the page is served.
 */
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
    </AuthPanelComponent>
  );
}

/** /registro: sign-up form (static HTML, works without JS); the redirect with a session is in proxy.ts. */
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
    </AuthPanelComponent>
  );
}
