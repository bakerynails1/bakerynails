"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Panel de Bakery Nails</h1>
          <p className="text-sm text-neutral-500">Inicia sesión para administrar el negocio.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
