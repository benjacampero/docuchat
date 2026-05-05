"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLogo, EnvelopeSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"options" | "email">("options");
  const router = useRouter();

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleEmailLogin() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign in fails, try sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/chat");
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="font-serif text-3xl font-semibold tracking-tight mb-3">
            DocuChat
          </h1>
          <p className="text-foreground-secondary text-sm">
            Consulta tus documentos con inteligencia artificial
          </p>
        </div>

        {mode === "options" ? (
          <div className="space-y-3 animate-fade-in-up stagger-1">
            <Button
              onClick={handleGoogleLogin}
              variant="secondary"
              size="lg"
              className="w-full gap-3"
            >
              <GoogleLogo size={20} weight="bold" />
              Continuar con Google
            </Button>

            <Button
              onClick={() => setMode("email")}
              variant="secondary"
              size="lg"
              className="w-full gap-3"
            >
              <EnvelopeSimple size={20} weight="bold" />
              Continuar con email
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up">
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
            <Input
              id="password"
              type="password"
              label="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contrasena"
            />

            {error && (
              <p className="text-xs text-accent-red-text">{error}</p>
            )}

            <Button
              onClick={handleEmailLogin}
              disabled={loading || !email || !password}
              size="lg"
              className="w-full"
            >
              {loading ? "Iniciando sesion..." : "Iniciar sesion"}
            </Button>

            <button
              onClick={() => setMode("options")}
              className="w-full text-center text-xs text-foreground-secondary hover:text-foreground transition-colors"
            >
              Volver a las opciones
            </button>
          </div>
        )}

        <p className="text-center text-xs text-foreground-secondary mt-8 animate-fade-in-up stagger-2">
          Al continuar, aceptas los terminos de uso del servicio.
        </p>
      </div>
    </div>
  );
}
