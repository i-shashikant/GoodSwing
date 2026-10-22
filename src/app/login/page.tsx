import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-bold">
            GoodSwing
          </Link>

          <h1 className="mt-8 text-3xl font-semibold">
            Welcome back
          </h1>

          <p className="mt-2 text-muted-foreground">
            Log in to your GoodSwing account.
          </p>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-foreground">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}