import { signIn } from "./actions";
import { Compass, Lock, Mail } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={signIn}
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-lapis)] text-white">
          <Compass className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h1 className="font-display mt-4 text-2xl text-[var(--color-ink)]">
          Ariana Agent AI
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Owner sign in</p>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                strokeWidth={1.75}
              />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-[var(--color-border)] py-2.5 pl-10 pr-3 text-[var(--color-ink)] transition-colors focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                strokeWidth={1.75}
              />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-lg border border-[var(--color-border)] py-2.5 pl-10 pr-3 text-[var(--color-ink)] transition-colors focus:border-[var(--color-lapis)] focus:outline-none focus:ring-2 focus:ring-[var(--color-lapis)]/20"
              />
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-rust)]">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--color-lapis)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-lapis-deep)]"
          >
            Sign in
          </button>
        </div>
      </form>
    </main>
  );
}
