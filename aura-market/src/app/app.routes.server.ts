import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas públicas con Prerender (SEO máximo, HTML estático en build-time)
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'woman', renderMode: RenderMode.Prerender },
  { path: 'men', renderMode: RenderMode.Prerender },
  { path: 'catalogo', renderMode: RenderMode.Prerender },

  // Rutas dinámicas: Client-Side (usan window, localStorage, SDKs de pago)
  // No pueden correr en Node.js SSR — Angular las hidrata solo en el browser.
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'auth', renderMode: RenderMode.Client },
  { path: 'my-account', renderMode: RenderMode.Client },
  { path: 'my-account/**', renderMode: RenderMode.Client },

  // Wildcard: cualquier ruta no listada se sirve desde el servidor (SSR on-demand)
  { path: '**', renderMode: RenderMode.Server },
];
