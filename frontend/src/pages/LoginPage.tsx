import { useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../features/auth/AuthProvider";

type LocationState = {
  from?: {
    pathname: string;
  };
};

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const location = useLocation();
  const fromPath = (location.state as LocationState | undefined)?.from?.pathname ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setSubmitting(true);
      await signInWithGoogle(fromPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Google sign-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to Course Atlas</h1>
        <p className="mt-2 text-sm text-slate-600">
          We use Supabase Auth. You will be redirected to Google to complete sign-in.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{submitting ? "Redirecting..." : "Continue with Google"}</span>
        </button>
      </div>
    </div>
  );
}
