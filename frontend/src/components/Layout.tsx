import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/AuthProvider";

export function Layout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-semibold text-slate-900">
            Course Atlas
          </Link>
          <nav>
            <ul className="flex gap-4 text-sm font-medium text-slate-600">
              <li>
                <Link to="/">Dashboard</Link>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            {loading ? (
              <span>Loading account...</span>
            ) : user ? (
              <>
                <span className="hidden sm:inline">{user.email}</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
