"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import { AlertIcon } from "@/components/Icons";

/** Messages d'erreur Supabase (en anglais) → français. */
function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Ton email n'est pas encore confirmé. Clique sur le lien reçu par mail.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet email.";
  if (m.includes("password should be")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Patiente quelques minutes.";
  if (m.includes("valid email") || m.includes("invalid format"))
    return "Cette adresse email n'est pas valide.";
  if (m.includes("fetch")) return "Connexion au serveur impossible. Vérifie ta connexion.";
  return "Une erreur est survenue. Réessaie.";
}

const COPY = {
  login: {
    eyebrow: "Bon retour",
    title: "Se connecter",
    submit: "Se connecter",
    submitting: "Connexion…",
    switchText: "Pas encore de compte ?",
    switchLabel: "S'inscrire",
    switchHref: "/signup",
  },
  signup: {
    eyebrow: "Bienvenue",
    title: "Créer un compte",
    submit: "Créer mon compte",
    submitting: "Création…",
    switchText: "Déjà un compte ?",
    switchLabel: "Se connecter",
    switchHref: "/login",
  },
};

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const copy = COPY[mode];
  const router = useRouter();
  const { supabase, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Déjà connecté : rien à faire ici.
  useEffect(() => {
    if (!authLoading && user) router.replace("/mes-listes");
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.refresh();
        // La redirection est faite par l'effet ci-dessus dès que la session arrive.
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Sans session, Supabase attend la confirmation de l'email.
        if (!data.session) setConfirmationSent(true);
      }
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="halftone flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -3, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="panel panel-lg w-full max-w-sm bg-paper p-6 sm:p-8"
      >
        {confirmationSent ? (
          <div className="text-center">
            <p aria-hidden="true" className="font-display text-4xl text-accent">
              メール
            </p>
            <h1 className="mt-3 font-display text-2xl">Vérifie ta boîte mail</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Un email de confirmation a été envoyé à <strong>{email}</strong>.
              Clique sur le lien qu&apos;il contient pour activer ton compte.
            </p>
            <Link href="/login" className="btn btn-ink mt-6">
              Aller à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="eyebrow mb-1">{copy.eyebrow}</p>
            <h1 className="mb-6 font-display text-3xl">{copy.title}</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">
                  Mot de passe{mode === "signup" && " (6 caractères min.)"}
                </span>
                <input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  required
                  minLength={6}
                />
              </label>

              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-2 rounded-[4px] border-2 border-accent bg-accent/10 px-3 py-2 text-sm text-accent-deep"
                >
                  <AlertIcon size={16} className="mt-0.5 shrink-0" />
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-lg btn-primary mt-1"
              >
                {submitting ? copy.submitting : copy.submit}
              </button>
            </form>

            <p className="mt-6 text-sm text-ink-soft">
              {copy.switchText}{" "}
              <Link href={copy.switchHref} className="link font-bold text-ink">
                {copy.switchLabel}
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
