import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthProvider";

export function Layout() {
  const { user, loading, signOut, profile, profileLoading, profileError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const isLoadingAccount = loading || profileLoading;
  const accountEmail = profile?.email ?? user?.email ?? "";
  const isGraphEditorRoute = location.pathname.startsWith("/graphs/");
  const contentContainerClass = isGraphEditorRoute
    ? "w-full px-4 sm:px-6"
    : "mx-auto max-w-4xl px-6";
  const mainPaddingClass = isGraphEditorRoute
    ? `${contentContainerClass} pt-0 pb-8 sm:pt-0 sm:pb-10`
    : `${contentContainerClass} py-8 sm:py-10`;

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Unable to sign out", error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 transition-colors dark:from-slate-950 dark:to-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/80">
        <div className={`${contentContainerClass} flex items-center justify-between py-4`}>
          <Link to="/" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Course Atlas
          </Link>
          <nav>
            <ul className="flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              <li>
                <Link to="/">Dashboard</Link>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            {isLoadingAccount ? (
              <span>Loading account...</span>
            ) : user ? (
              <>
                <span className="hidden sm:inline">
                  Signed in as {accountEmail || "unknown user"}
                </span>
                {profileError && (
                  <span className="hidden text-xs text-rose-500 sm:inline">{profileError}</span>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md border border-brand px-3 py-1 text-sm font-medium text-brand transition hover:bg-brand hover:text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className={mainPaddingClass}>
        <Outlet />
      </main>
    </div>
  );
}
