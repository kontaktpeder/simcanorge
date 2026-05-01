import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("Error in checkAdminRole:", err);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer admin check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id).then(setIsAdmin);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session.
    // Wrapped so isLoading is ALWAYS resolved — otherwise pages like /app hang
    // on a blank loader if any step throws (stale session, network error, etc).
    (async () => {
      let adminCheckPending = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          return;
        }

        const { data: { user: serverUser }, error: getUserError } = await supabase.auth.getUser();

        if (getUserError) {
          // Only force sign-out for definitive auth failures (401/403).
          // For transient errors (network, 5xx), keep the local session and
          // let onAuthStateChange / next call recover — otherwise refreshing
          // on a flaky network silently logs users out.
          const status = (getUserError as { status?: number }).status;
          if (status === 401 || status === 403) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          } else {
            console.warn("Auth getUser transient error, keeping session:", getUserError);
            setSession(session);
            setUser(session.user);
          }
          return;
        }

        if (!serverUser) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          return;
        }

        setSession(session);
        setUser(serverUser);
        adminCheckPending = true;
        checkAdminRole(serverUser.id).then((admin) => {
          setIsAdmin(admin);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Auth init failed:", err);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } finally {
        // Only resolve loading here if we're not waiting on the async admin check.
        if (!adminCheckPending) {
          setIsLoading(false);
        }
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
