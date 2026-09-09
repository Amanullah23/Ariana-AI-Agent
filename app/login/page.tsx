import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-4">
      <form
        action={signIn}
        className="w-full max-w-sm rounded-md border border-[#E4D9C8] bg-white p-8"
      >
        <h1 className="font-serif text-2xl text-[#1C1A17]">Ariana Agent AI</h1>
        <p className="mt-1 text-sm text-[#5B554B]">Owner sign in</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-[#1C1A17]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-[#D8CCB8] px-3 py-2 focus:border-[#B5541F] focus:outline-none focus:ring-1 focus:ring-[#B5541F]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-[#1C1A17]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded border border-[#D8CCB8] px-3 py-2 focus:border-[#B5541F] focus:outline-none focus:ring-1 focus:ring-[#B5541F]"
            />
          </div>

          {error && <p className="text-sm text-[#B5541F]">{error}</p>}

          <button
            type="submit"
            className="w-full rounded bg-[#B5541F] px-4 py-2.5 font-medium text-white transition hover:bg-[#984619]"
          >
            Sign in
          </button>
        </div>
      </form>
    </main>
  );
}
