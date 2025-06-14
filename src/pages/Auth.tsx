
import React, { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loading, signUp, signIn } = useSupabaseAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      // Already logged in
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Login error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Logged in", description: "Welcome back!" });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({ title: "Signup error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Sign up successful", description: "Check your email for confirmation." });
          setMode("login");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-2 py-16 bg-background">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">{mode === "login" ? "Sign in" : "Sign up"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            required
            autoFocus
            placeholder="email@example.com"
            autoComplete="email"
            value={email}
            disabled={busy}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            type="password"
            required
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            disabled={busy}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? "Sign in" : "Sign up"}
          </Button>
          <div className="flex items-center justify-between text-sm mt-2">
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              disabled={busy}
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
        <p className="text-xs mt-8 text-muted-foreground text-center">
          By continuing, you agree to our terms of service.
        </p>
      </Card>
    </div>
  );
}
