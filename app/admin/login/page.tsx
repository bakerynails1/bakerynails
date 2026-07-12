"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { BrandLogo } from "@/components/brand-logo";
import { btnPrimary } from "@/components/ui";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <BrandLogo size="md" />
        </div>
        <form action={formAction} className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm shadow-brand-100">
          <div className="text-center">
            <h1 className="font-serif text-xl font-semibold text-ink">Panel de administración</h1>
            <p className="mt-1 text-sm text-ink-soft">Inicia sesión para administrar el negocio.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-line bg-brand-50/40 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-line bg-brand-50/40 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>

          {state.error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>}

          <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
