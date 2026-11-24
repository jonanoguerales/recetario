import Link from "next/link";
import { ROUTES } from "@/core/auth";
import styles from "./home.module.css";

const FEATURES = [
  {
    title: "Guarda",
    text: "Apunta tus recetas con sus ingredientes, pasos, tiempo y raciones, y márcalas como favoritas.",
  },
  {
    title: "Busca",
    text: "Encuentra una receta por su nombre o por un ingrediente, aunque no escribas las tildes.",
  },
  {
    title: "Organiza",
    text: "Ordénalas por categoría: desayunos, entrantes, principales, postres, bebidas…",
  },
] as const;

/** Public home page (R8): static, the same for everybody. */
export function HomeComponent() {
  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 id="home-title" className={styles.title}>
          Tus recetas, siempre a mano
        </h1>
        <p className={styles.lead}>
          El Recetario es tu cuaderno de cocina personal: guarda, busca y organiza tus recetas. Son
          privadas: solo tú puedes verlas y editarlas.
        </p>
        <ul className={styles.actions}>
          <li>
            <Link href={ROUTES.register} className={styles.primary}>
              Crear cuenta
            </Link>
          </li>
          <li>
            <Link href={ROUTES.login} className={styles.secondary}>
              Entrar
            </Link>
          </li>
        </ul>
        <p className={styles.note}>
          ¿Ya has iniciado sesión? Ve a <Link href={ROUTES.recipes}>Mis recetas</Link>.
        </p>
      </section>

      <section aria-labelledby="home-features-title">
        <h2 id="home-features-title" className="visually-hidden">
          Qué puedes hacer
        </h2>
        <ul className={styles.features}>
          {FEATURES.map((feature) => (
            <li key={feature.title} className={styles.feature}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p>{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
