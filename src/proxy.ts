import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GoodSwing authentication proxy
 *
 * This proxy runs before requests to protected/auth routes.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session when necessary.
 * 2. Prevent logged-out users from opening protected pages.
 * 3. Redirect already-authenticated users away from login/signup.
 *
 * IMPORTANT:
 * We intentionally DO NOT query the profiles table here to determine
 * whether a user is an admin.
 *
 * Admin authorization is handled by `requireAdmin()` in the admin layout.
 *
 * Why?
 * -------
 * Previously, an admin navigation could cause:
 *
 *   proxy
 *      ↓
 *   auth.getUser()
 *      ↓
 *   profiles query
 *      ↓
 *   admin layout
 *      ↓
 *   requireAdmin()
 *      ↓
 *   auth.getUser()
 *      ↓
 *   profiles query AGAIN
 *
 * That creates unnecessary Supabase work during navigation.
 *
 * Keeping the proxy focused on session/authentication makes navigation
 * lighter while the actual admin authorization remains protected server-side.
 */
export async function proxy(request: NextRequest) {
  /**
   * Start with a normal Next.js response.
   *
   * Supabase may replace this response when it refreshes the session
   * cookies, so we keep the response variable mutable.
   */
  let response = NextResponse.next({
    request,
  });

  /**
   * Create the Supabase server client using the request cookies.
   *
   * The proxy needs access to the user's Supabase session so that
   * protected routes can be handled correctly.
   */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        /**
         * Read all cookies from the incoming request.
         */
        getAll() {
          return request.cookies.getAll();
        },

        /**
         * Supabase can refresh the session and return updated cookies.
         *
         * We copy those cookies onto both:
         * - the request
         * - the response
         *
         * This is important for Supabase SSR authentication.
         */
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          /**
           * Re-create the response after modifying the request cookies.
           */
          response = NextResponse.next({
            request,
          });

          /**
           * Send the refreshed cookies back to the browser.
           */
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  /**
   * Get the currently authenticated user.
   *
   * We still need this call in the proxy because the proxy is responsible
   * for deciding whether protected routes can be accessed.
   *
   * We are NOT doing an additional profile/role query here.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /**
   * Routes that require authentication.
   */
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard");

  /**
   * Authentication pages.
   *
   * Logged-in users shouldn't need to see login/signup again.
   */
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup";

  /**
   * Helper for redirects.
   *
   * Supabase may have refreshed authentication cookies while processing
   * this request. We preserve those cookies when redirecting.
   */
  const redirectTo = (path: string) => {
    const redirectResponse =
      NextResponse.redirect(
        new URL(
          path,
          request.url
        )
      );

    /**
     * Preserve any cookies that Supabase refreshed.
     */
    response.cookies
      .getAll()
      .forEach((cookie) => {
        redirectResponse.cookies.set(
          cookie
        );
      });

    return redirectResponse;
  };

  /**
   * ---------------------------------------------------------------
   * 1. Protect authenticated routes
   * ---------------------------------------------------------------
   *
   * If somebody tries to access:
   *
   *   /dashboard
   *   /dashboard/scores
   *   /dashboard/charity
   *   /dashboard/winnings
   *   /admin
   *   /admin/users
   *   etc.
   *
   * without being logged in, send them to login.
   */
  if (!user && isProtected) {
    return redirectTo("/login");
  }

  /**
   * ---------------------------------------------------------------
   * 2. Handle login/signup for authenticated users
   * ---------------------------------------------------------------
   *
   * We intentionally avoid querying `profiles` here.
   *
   * Previously we queried the profiles table just to decide whether
   * an authenticated user should go to `/admin` or `/dashboard`.
   *
   * That adds database latency to the authentication flow.
   *
   * Admin authorization itself is still enforced by `requireAdmin()`.
   *
   * For now, authenticated users go to the dashboard.
   *
   * An admin can still access `/admin` directly, where the admin
   * layout performs the real authorization check.
   */
  if (user && isAuthPage) {
    return redirectTo("/dashboard");
  }

  /**
   * Everything else can continue normally.
   */
  return response;
}

/**
 * Only run the proxy for routes where authentication/session handling
 * is actually relevant.
 *
 * Public pages such as:
 *
 *   /
 *   /charities
 *   /charities/example
 *
 * do NOT pass through this proxy.
 *
 * This is important because public navigation should not pay the cost
 * of an authentication check.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};