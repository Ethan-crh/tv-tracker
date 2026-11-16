"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthState = {
  supabase: SupabaseClient;
  user: User | null;
  /** Vrai tant que la session n'a pas encore été lue. */
  loading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Une seule lecture de session pour toute l'application : la barre de
 * navigation et les pages partagent le même utilisateur.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") return;
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, user, loading }),
    [supabase, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
