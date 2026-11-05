import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { saveRow, type Row } from "@/lib/app-data";
import {
  DEMO_DATA_EVENT,
  DEMO_USER_ID,
  isDemoActive,
  readDemoData,
  setDemoActive,
} from "@/lib/demo-store";
import type { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

type AuthError = { message: string } | null;
type ProfileInput = Pick<Row<"profiles">, "name" | "username" | "avatar_url">;
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Row<"profiles"> | null;
  loading: boolean;
  isDemo: boolean;
  isPasswordRecovery: boolean;
  startDemo: () => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError }>;
  signUp: (
    email: string,
    password: string,
    data: { name: string; username: string },
  ) => Promise<{ error: AuthError; needsConfirmation: boolean }>;
  signOut: () => Promise<{ error: AuthError }>;
  updateProfile: (
    profile: ProfileInput,
  ) => Promise<{ error: AuthError; data: Row<"profiles"> | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError }>;
  updatePassword: (password: string) => Promise<{ error: AuthError }>;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const asError = (error: unknown) => ({
  message:
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.",
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Row<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(isDemoActive);
  const [demoProfile, setDemoProfile] = useState<Row<"profiles"> | null>(() =>
    isDemoActive() ? readDemoData().profiles[0] : null,
  );
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const activeUserId = useRef<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (isDemoActive()) setDemoProfile(readDemoData().profiles[0]);
    };
    window.addEventListener(DEMO_DATA_EVENT, refresh);
    return () => window.removeEventListener(DEMO_DATA_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    let active = true;
    let authEventSeen = false;
    const applySession = (next: Session | null) => {
      if (!active) return;
      activeUserId.current = next?.user.id ?? null;
      setSession(next);
      setProfile((previous) =>
        previous && previous.id === next?.user.id
          ? previous
          : next?.user
            ? {
                id: next.user.id,
                name: next.user.user_metadata.name || "Your profile",
                username: next.user.user_metadata.username || "",
                avatar_url: null,
                created_at: next.user.created_at,
              }
            : null,
      );
      setLoading(false);
      if (next?.user) {
        // Defer the profile query outside the auth event callback.
        setTimeout(async () => {
          if (!active) return;
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", next.user.id)
            .maybeSingle();
          if (active && activeUserId.current === next.user.id && !error && data)
            setProfile(data);
        }, 0);
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      authEventSeen = true;
      applySession(next);
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        navigate("/reset-password", { replace: true });
      }
      if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!authEventSeen) applySession(data.session);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isDemo, navigate]);

  const startDemo = () => {
    const data = readDemoData();
    queryClient.clear();
    setDemoActive(true);
    setDemoProfile(data.profiles[0]);
    setIsDemo(true);
    navigate("/", { replace: true });
  };
  const signIn: AuthContextType["signIn"] = async (email, password) => {
    if (isDemo) return { error: { message: "Exit demo to sign in." } };
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) setIsPasswordRecovery(false);
      return { error };
    } catch (error) {
      return { error: asError(error) };
    }
  };
  const signUp: AuthContextType["signUp"] = async (email, password, data) => {
    if (isDemo)
      return {
        error: { message: "Exit demo to create an account." },
        needsConfirmation: false,
      };
    try {
      const { data: result, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data, emailRedirectTo: window.location.origin },
      });
      return { error, needsConfirmation: !error && !result.session };
    } catch (error) {
      return { error: asError(error), needsConfirmation: false };
    }
  };
  const signOut = async () => {
    if (isDemo) {
      queryClient.clear();
      setDemoActive(false);
      setIsDemo(false);
      navigate("/auth", { replace: true });
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        queryClient.clear();
        setIsPasswordRecovery(false);
      }
      return { error };
    } catch (error) {
      return { error: asError(error) };
    }
  };
  const updateProfile: AuthContextType["updateProfile"] = async (values) => {
    const id = isDemo ? DEMO_USER_ID : session?.user.id;
    if (!id) return { data: null, error: { message: "Please sign in again." } };
    const result = await saveRow("profiles", { ...values, id }, id);
    const next = result.data?.[0] ?? null;
    if (next && !isDemo) setProfile(next);
    return {
      data: next,
      error:
        result.error ||
        (!next
          ? { message: "Could not update your profile. Please try again." }
          : null),
    };
  };
  const resetPasswordForEmail: AuthContextType["resetPasswordForEmail"] =
    async (email) => {
      if (isDemo)
        return {
          error: { message: "Exit demo to reset an account password." },
        };
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
      } catch (error) {
        return { error: asError(error) };
      }
    };
  const updatePassword: AuthContextType["updatePassword"] = async (
    password,
  ) => {
    if (isDemo || !session)
      return {
        error: {
          message: "Open a password reset link from your email to continue.",
        },
      };
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (!error) setIsPasswordRecovery(false);
      return { error };
    } catch (error) {
      return { error: asError(error) };
    }
  };
  const demoUser: User | null = demoProfile
    ? {
        id: DEMO_USER_ID,
        aud: "demo",
        app_metadata: {},
        user_metadata: { name: demoProfile.name },
        created_at: demoProfile.created_at,
      }
    : null;
  return (
    <AuthContext.Provider
      value={{
        session,
        user: isDemo ? demoUser : (session?.user ?? null),
        profile: isDemo ? demoProfile : profile,
        loading,
        isDemo,
        isPasswordRecovery,
        startDemo,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPasswordForEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
