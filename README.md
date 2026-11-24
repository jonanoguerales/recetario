This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tests

```bash
npm test            # Vitest: lógica pura (validaciones Zod, mappers, utilidades) en src/ y scripts/
npm run test:e2e    # Playwright: flujos completos en el navegador (carpeta e2e/)
```

- La primera vez instala el navegador: `npx playwright install chromium`.
- `npm run test:e2e` hace `next build` y arranca `next start` en el puerto 3310 (si ya hay un servidor ahí y no
  es CI, lo reutiliza). Necesita `.env.local` con las claves de Supabase y `DATABASE_URL`.
- Proyectos: `desktop` (Chromium con JavaScript), `no-js` (sin JavaScript, para los formularios) y `mobile-375`
  (375 × 812, para el diseño). Cada test elige los suyos con etiquetas (`@desktop`, `@no-js`, `@mobile`) y
  nombra el criterio `AC-n` que cubre. Uno solo: `npx playwright test --project=no-js`.
- Usuarios de prueba: `e2e/global-setup.ts` crea por SQL (vía `DATABASE_URL`) dos usuarios confirmados
  `e2e-<id>-a@example.net` y `e2e-<id>-b@example.net`; `e2e/global-teardown.ts` los borra al terminar (también
  si fallan tests), con sus recetas en cascada, y limpia restos de más de 2 horas de ejecuciones interrumpidas.
- Si algo falla, la traza y la captura quedan en `test-results/` (`npx playwright show-trace <ruta>/trace.zip`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
