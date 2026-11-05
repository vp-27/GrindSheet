import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  Play,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const {
    signIn,
    signUp,
    user,
    loading,
    resetPasswordForEmail,
    updatePassword,
    startDemo,
    signOut,
    isDemo,
  } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const recovery = pathname === "/reset-password";
  const [mode, setMode] = useState<Mode>(() =>
    new URLSearchParams(search).get("view") === "forgot" ? "forgot" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (user && !recovery) navigate("/", { replace: true });
  }, [user, recovery, navigate]);
  useEffect(() => {
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }, [mode, recovery]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (recovery) {
        if (password !== confirmPassword) {
          setError("Your passwords do not match.");
          return;
        }
        const result = await updatePassword(password);
        if (result.error) setError(result.error.message);
        else navigate("/", { replace: true });
      } else if (mode === "forgot") {
        const result = await resetPasswordForEmail(email.trim());
        if (result.error) setError(result.error.message);
        else
          setNotice(
            "If an account exists for this email, a reset link is on its way. Check your inbox.",
          );
      } else if (mode === "signup") {
        const result = await signUp(email.trim(), password, {
          name: name.trim(),
          username: username.trim(),
        });
        if (result.error) setError(result.error.message);
        else if (result.needsConfirmation)
          setNotice(
            "Check your email to confirm your account, then come back to sign in.",
          );
        else navigate("/", { replace: true });
      } else {
        const result = await signIn(email.trim(), password);
        if (result.error) setError(result.error.message);
        else navigate("/", { replace: true });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const tryDemo = () => {
    try {
      startDemo();
    } catch {
      setError("Allow browser storage to try the demo on this device.");
    }
  };
  const title = recovery
    ? "Choose a new password"
    : mode === "signup"
      ? "Start your next chapter"
      : mode === "forgot"
        ? "Back in your corner"
        : "Welcome back";
  const subtitle = recovery
    ? "Make it one you haven’t used before."
    : mode === "signup"
      ? "A little stronger, one workout at a time."
      : mode === "forgot"
        ? "We’ll email you a link to reset your password."
        : "Your next personal best starts here.";
  const passwordField = (confirmation = false) => (
    <div className="auth-field">
      <label htmlFor={confirmation ? "confirm-password" : "password"}>
        {confirmation
          ? "Confirm password"
          : recovery
            ? "New password"
            : "Password"}
      </label>
      <div className="auth-password-wrap">
        <input
          id={confirmation ? "confirm-password" : "password"}
          name={confirmation ? "confirm-password" : "password"}
          type={showPassword ? "text" : "password"}
          autoComplete={
            mode === "signup" || recovery ? "new-password" : "current-password"
          }
          value={confirmation ? confirmPassword : password}
          onChange={(e) =>
            confirmation
              ? setConfirmPassword(e.target.value)
              : setPassword(e.target.value)
          }
          minLength={mode === "signup" || recovery ? 8 : undefined}
          placeholder={
            mode === "signup" || recovery
              ? "At least 8 characters"
              : "Enter your password"
          }
          required
        />
        {!confirmation && (
          <button
            type="button"
            className="auth-reveal"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link to="/auth" className="auth-brand" aria-label="GrindSheet home">
          <span className="auth-brand-mark">
            <Dumbbell size={23} />
          </span>
          GrindSheet
        </Link>
        <section className="auth-panel" aria-labelledby="auth-title">
          <header className="auth-heading">
            <p className="auth-eyebrow">LOG. PROGRESS. REPEAT.</p>
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </header>
          {!recovery && mode !== "forgot" && (
            <div className="auth-switch" aria-label="Account access">
              <button
                type="button"
                aria-pressed={mode === "login"}
                disabled={busy}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={mode === "signup"}
                disabled={busy}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>
          )}
          {recovery && !loading && (!user || isDemo) ? (
            <div className="auth-message" role="status">
              Open the password reset link from your email to continue. If it
              has expired,{" "}
              <Link to="/auth?view=forgot">request a new link</Link>.
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              <fieldset disabled={busy || loading}>
                {mode === "signup" && !recovery && (
                  <div className="auth-profile-fields">
                    <div className="auth-field">
                      <label htmlFor="name">Name</label>
                      <input
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        maxLength={60}
                        pattern={".*\\S.*"}
                        required
                      />
                    </div>
                    <div className="auth-field">
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        name="username"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="How friends find you"
                        pattern="[a-zA-Z0-9_]{3,24}"
                        title="3–24 letters, numbers, or underscores"
                        required
                      />
                    </div>
                  </div>
                )}
                {!recovery && (
                  <div className="auth-field">
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                )}
                {(recovery || mode !== "forgot") && passwordField()}
                {recovery && passwordField(true)}
                {mode === "login" && !recovery && (
                  <button
                    type="button"
                    className="auth-text-button auth-forgot"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </button>
                )}
                {error && (
                  <p className="auth-message auth-error" role="alert">
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="auth-message" role="status">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {notice}
                  </p>
                )}
                <button
                  type="submit"
                  className="auth-primary"
                  disabled={busy || loading || !!notice}
                >
                  {busy ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Please wait…
                    </>
                  ) : (
                    <>
                      {recovery
                        ? "Save new password"
                        : mode === "forgot"
                          ? "Send reset link"
                          : mode === "signup"
                            ? "Create account"
                            : "Sign in"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </fieldset>
            </form>
          )}
          {!recovery && mode !== "forgot" && (
            <>
              <div className="auth-divider">
                <span>or take a look around</span>
              </div>
              <button
                type="button"
                className="auth-demo"
                onClick={tryDemo}
                disabled={busy || loading}
              >
                <Play size={17} />
                Try demo<span>No account needed</span>
              </button>
              <p className="auth-demo-note">
                Explore sample workouts, track progress, and try a friendly
                competition.
              </p>
            </>
          )}
          {(mode === "forgot" || recovery) && (
            <Link
              className="auth-back"
              to="/auth"
              onClick={async (event) => {
                if (recovery && user) {
                  event.preventDefault();
                  const result = await signOut();
                  if (result.error) setError(result.error.message);
                  else navigate("/auth", { replace: true });
                } else setMode("login");
              }}
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          )}
        </section>
        <p className="auth-footer">Small steps. Stronger you.</p>
      </div>
    </main>
  );
}
