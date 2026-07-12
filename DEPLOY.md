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
   - **Version command:** `npx wrangler versions upload --keep-vars`
   - (El nombre del worker sale de `wrangler.jsonc`: `bakerynails`.)
   - ⚠️ El `--keep-vars` va en AMBOS comandos, como salvaguarda para que
     futuros `git push` no borren las variables de la siguiente sección.
3. **Las variables de entorno reales van en OTRO lugar** (ver ⚠️ abajo), no
   en el panel de este paso 2 — ese panel solo alimenta el *build*, no el
   Worker en producción.
4. Guarda y lanza el primer deploy. Al terminar te da una URL tipo
   `https://bakerynails.<tu-cuenta>.workers.dev`.

> ⚠️ **Trampa importante de Cloudflare — nos costó varias horas depurar esto:**
> Hay **dos secciones distintas** que se llaman parecido y es fácil confundirlas:
>
> 1. **"Variables and Secrets" dentro del asistente de importación / Settings → Build** —
>    dice "Customize the environment variables **sent to your build**". Esto
>    **solo** las pasa al comando `npm run cf:build`, nunca llegan al Worker
>    cuando ya está sirviendo tráfico real.
> 2. **Settings → (pestaña del Worker, no la de Build) → "Variables and Secrets"** —
>    dice "Define the environment variables and secrets for your Worker
>    **used at runtime**". **Esta es la correcta.** Ahí van las 6 variables
>    para que el sitio funcione de verdad.
>
> Si el sitio publicado da error "supabaseKey is required" o páginas en
> blanco/500 en cualquier ruta que toque la base de datos, casi seguro las
> variables están en la sección 1 en vez de la 2.

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
Worker. Revisa, en este orden:

1. **Settings → (Worker) → Variables and Secrets** (la de runtime, no la de
   Build) — confirma que las 6 sigan ahí.
2. Si ahí siguen y el error volvió después de un `git push`, revisa que
   **Deploy command** y **Version command** sigan teniendo `--keep-vars` —
   sin esa bandera, Wrangler las borra en cada publicación.

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
