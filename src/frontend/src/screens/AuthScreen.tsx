import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, LogIn, User, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  createProfile,
  getAllProfiles,
  login,
  switchProfile,
} from "../lib/auth";

interface AuthScreenProps {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);

  const profiles = getAllProfiles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await createProfile(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      onAuth();
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = (profileId: string) => {
    switchProfile(profileId);
    onAuth();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "oklch(var(--surface-0))" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: "oklch(var(--surface-2))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <span
              className="text-2xl font-display font-bold"
              style={{ color: "oklch(var(--brand))" }}
            >
              R
            </span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Rivelo Client
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Your OpenRouter AI interface
          </p>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "oklch(var(--surface-1))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          {/* Mode toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "oklch(var(--surface-2))" }}
          >
            <button
              type="button"
              data-ocid="auth.login.tab"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "login"
                  ? "text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              style={
                mode === "login"
                  ? { background: "oklch(var(--surface-3))" }
                  : {}
              }
            >
              Sign In
            </button>
            <button
              type="button"
              data-ocid="auth.signup.tab"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "signup"
                  ? "text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              style={
                mode === "signup"
                  ? { background: "oklch(var(--surface-3))" }
                  : {}
              }
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-xs font-medium"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Username
              </Label>
              <Input
                id="username"
                data-ocid="auth.username.input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="h-10 text-sm"
                style={{
                  background: "oklch(var(--surface-2))",
                  border: "1px solid oklch(var(--border))",
                }}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-medium"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Password
              </Label>
              <Input
                id="password"
                data-ocid="auth.password.input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-10 text-sm"
                style={{
                  background: "oklch(var(--surface-2))",
                  border: "1px solid oklch(var(--border))",
                }}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </div>

            {error && (
              <p
                data-ocid="auth.error_state"
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  background: "oklch(var(--destructive) / 0.15)",
                  color: "oklch(var(--destructive))",
                }}
              >
                {error}
              </p>
            )}

            <Button
              data-ocid="auth.submit_button"
              type="submit"
              disabled={loading}
              className="w-full h-10 font-medium text-sm"
              style={{
                background: "oklch(var(--brand))",
                color: "oklch(var(--surface-0))",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {mode === "signup" ? "Creating..." : "Signing in..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "signup" ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {mode === "signup" ? "Create Account" : "Sign In"}
                </span>
              )}
            </Button>
          </form>

          {/* Existing profiles */}
          {profiles.length > 0 && mode === "login" && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid oklch(var(--border))" }}
            >
              <button
                type="button"
                data-ocid="auth.profiles.toggle"
                onClick={() => setShowProfiles(!showProfiles)}
                className="flex items-center gap-2 text-xs w-full"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                <User className="w-3.5 h-3.5" />
                <span>Quick switch profile ({profiles.length})</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 ml-auto transition-transform ${showProfiles ? "rotate-180" : ""}`}
                />
              </button>
              {showProfiles && (
                <div className="mt-2 space-y-1">
                  {profiles.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      data-ocid="auth.profile.button"
                      onClick={() => handleSwitchProfile(p.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-2 flex items-center gap-2"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          background: "oklch(var(--brand) / 0.2)",
                          color: "oklch(var(--brand))",
                        }}
                      >
                        {p.username[0]?.toUpperCase()}
                      </div>
                      {p.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
