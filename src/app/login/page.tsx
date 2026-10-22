import Link from "next/link";
import { login } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <>
      <nav className="site-nav">
        <div
          className="container"
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" className="logo">
            <span className="logo-mark">G</span>
            GoodSwing
          </Link>

          <div className="nav-actions">
            <span style={{ fontSize: "13px", color: "#686868" }}>
              New to GoodSwing?
            </span>

            <Link href="/signup" className="btn btn-primary">
              Create account
            </Link>
          </div>
        </div>
      </nav>

      <main className="auth-page">
        <div className="auth-card">
          <h1>Welcome back.</h1>

          <p>
            Log in to access your GoodSwing dashboard.
          </p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form action={login}>
            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
            >
              Log in
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link href="/signup">
              Create one
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}