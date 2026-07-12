# Despliegue a Cloudflare (Fase 6)

El proyecto está preparado para desplegarse en **Cloudflare Workers** usando el
adaptador oficial `@opennextjs/cloudflare`. La app compila correctamente para
Cloudflare (`npm run cf:build` genera el worker en `.open-next/`).

> Nota: el **preview local** (`npm run cf:preview`) es poco confiable en Windows
> — es una limitación conocida de OpenNext, no del proyecto. El despliegue real
> lo compila Cloudflare en Linux, donde no ocurre ese problema.

## Método recomendado: conectar el repo de GitHub (build automático)

Con esto, cada vez que se haga `git push`, Cloudflare vuelve a compilar y
publicar solo. Todo se hace desde el navegador.

1. Entra a **https://dash.cloudflare.com** → **Workers & Pages** → **Create** →
   pestaña **Workers** → **Import a repository** (conecta tu cuenta de GitHub y
   elige `bakerynails1/bakerynails`).
2. Configura el build:
   - **Build command:** `npm run cf:build`
   - **Deploy command:** `npx wrangler deploy --keep-vars`
   - (El nombre del worker sale de `wrangler.jsonc`: `bakerynails`.)
   - ⚠️ **El `--keep-vars` es obligatorio.** Sin esa bandera, `wrangler deploy`
     **borra todas las variables de entorno en cada publicación** (es el
     comportamiento por defecto de Wrangler cuando las variables se
     configuraron desde el dashboard en vez del archivo de configuración).
     Causó horas de "supabaseKey is required" en producción — ver
     [Wrangler CHANGELOG / `--keep-vars`](https://developers.cloudflare.com/workers/wrangler/commands/#deploy).
3. Agrega las **variables de entorno** (ver la sección de abajo). Marca como
   *Secret* las que dicen "secreta".
4. Guarda y lanza el primer deploy. Al terminar te da una URL tipo
   `https://bakerynails.<tu-cuenta>.workers.dev`.

### Alternativa por línea de comandos (deploy manual)

Desde tu compu, una sola vez:

```bash
npx wrangler login          # abre el navegador para autorizar
npm run cf:deploy           # compila y publica
```

Las variables de entorno hay que cargarlas igual en el dashboard de Cloudflare
(o con `npx wrangler secret put NOMBRE`).

## Variables de entorno (obligatorias)

| Variable | Tipo | Dónde se usa |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | normal | build + runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | normal | build + runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreta** | runtime |
| `GOOGLE_CLIENT_ID` | normal | runtime |
| `GOOGLE_CLIENT_SECRET` | **secreta** | runtime |
| `GOOGLE_REDIRECT_URI` | normal | runtime |

Los valores son los mismos que tienes en `.env.local`, **excepto**
`GOOGLE_REDIRECT_URI`, que en producción debe apuntar al dominio real:

```
GOOGLE_REDIRECT_URI=https://TU-DOMINIO/api/google-calendar/callback
```

## Después del primer deploy: ajustar Google Calendar

1. En **Google Cloud Console → Credenciales → tu cliente OAuth**, agrega en
   **URIs de redirección autorizados** la URL de producción:
   `https://TU-DOMINIO/api/google-calendar/callback`
   (deja también la de `localhost` para pruebas locales).
2. En Cloudflare, pon esa misma URL en la variable `GOOGLE_REDIRECT_URI` y
   vuelve a desplegar.
3. Entra al panel publicado (`/admin/configuracion`) y **vuelve a conectar
   Google Calendar** para que el token quede ligado al dominio de producción.

## Si algún día vuelve a fallar "supabaseKey is required" en producción

Ese error significa que las variables de entorno no le están llegando al
Worker (aunque se vean bien en el dashboard). Revisa primero que el
**Deploy command** siga siendo `npx wrangler deploy --keep-vars` — sin esa
bandera, Wrangler borra todas las variables en cada publicación.

## Dominio propio (opcional)

En el worker, pestaña **Settings → Domains & Routes**, puedes conectar un
dominio propio (ej. `citas.bakerynails.com`). Si lo haces, actualiza también
`GOOGLE_REDIRECT_URI` y el URI de redirección en Google con ese dominio.

## Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm run cf:build` | Compila la app para Cloudflare (genera `.open-next/`) |
| `npm run cf:deploy` | Compila y publica (requiere `wrangler login`) |
| `npm run cf:preview` | Corre el worker localmente (inestable en Windows) |
