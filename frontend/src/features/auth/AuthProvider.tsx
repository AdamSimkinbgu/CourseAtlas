import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../../app/supabaseClient";
import { setAccessToken } from "../../lib/api";
import { api } from "../../lib/api";

type BackendProfile = {
  id: string;
  email: string;
};

type AuthContextValue = {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: BackendProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAccessToken(data.session?.access_token ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAccessToken(nextSession?.access_token ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    let isMounted = true;
    setProfileLoading(true);
    setProfileError(null);

    void api
      .get("api/v1/me")
      .json<BackendProfile>()
      .then((data) => {
        if (isMounted) {
          setProfile(data);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("Failed to fetch backend profile", error);
          setProfileError(error instanceof Error ? error.message : "Unknown error");
          setProfile(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setProfileLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  const signInWithGoogle = useCallback(async (redirectPath = "/") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
      },
    });
    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setAccessToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      session,
      user: session?.user ?? null,
      loading,
      profile,
      profileLoading,
      profileError,
      signInWithGoogle,
      signOut,
    }),
    [loading, profile, profileError, profileLoading, session, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
