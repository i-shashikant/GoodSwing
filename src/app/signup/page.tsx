import Link from "next/link";
import { signup } from "@/app/auth/actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
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
              Already a member?
            </span>

            <Link href="/login" className="btn btn-secondary">
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main className="auth-page">
        <div className="auth-card">
          <h1>Join GoodSwing.</h1>

          <p>
            Create your account and start playing with purpose.
          </p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form action={signup}>
            <div className="form-group">
              <label htmlFor="fullName">
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="At least 6 characters"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
            >
              Create account
            </button>
          </form>

          <div className="auth-footer">
            By creating an account, you agree to use GoodSwing
            responsibly.
          </div>
        </div>
      </main>
    </>
  );
}