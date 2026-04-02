import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { getCurrentProfile } from "./lib/auth";
import AuthScreen from "./screens/AuthScreen";
import MainApp from "./screens/MainApp";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const profile = getCurrentProfile();
    setIsLoggedIn(!!profile);
  }, []);

  const handleAuth = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  if (isLoggedIn === null) {
    // Loading state
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(var(--surface-0))" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold animate-pulse"
            style={{
              background: "oklch(var(--surface-2))",
              color: "oklch(var(--brand))",
            }}
          >
            R
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(var(--surface-2))",
            border: "1px solid oklch(var(--border))",
            color: "oklch(var(--foreground))",
          },
        }}
      />
      {isLoggedIn ? (
        <MainApp onLogout={handleLogout} />
      ) : (
        <AuthScreen onAuth={handleAuth} />
      )}
    </>
  );
}
