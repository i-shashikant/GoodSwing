import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-bold">
            GoodSwing
          </Link>

          <h1 className="mt-8 text-3xl font-semibold">
            Create your account
          </h1>

          <p className="mt-2 text-muted-foreground">
            Play your game. Make an impact.
          </p>
        </div>

        <form action={signup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full name
            </label>
            <input
              name="fullName"
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="Your name"
            />
          </div>

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
              minLength={6}
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}