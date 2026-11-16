"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/components/AuthProvider";
import { AlertIcon, MailIcon } from "@/components/Icons";

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
    title: "Connexion",
    subtitle: "Retrouve tes listes et ta progression.",
    submit: "Se connecter",
    submitting: "Connexion…",
    switchText: "Pas encore de compte ?",
    switchLabel: "Créer un compte",
    switchHref: "/signup",
  },
  signup: {
    title: "Créer un compte",
    subtitle: "Gratuit. Il suffit d'un email.",
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
    <main className="relative flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 -z-10 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(41_151_255/0.18),transparent)] blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="card w-full max-w-[400px] rounded-[28px] p-8 sm:p-10"
      >
        {confirmationSent ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MailIcon size={26} />
            </span>
            <h1 className="section-title mt-5 text-[26px]">Vérifie ta boîte mail</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Un email de confirmation a été envoyé à{" "}
              <span className="font-medium text-ink">{email}</span>. Clique sur le
              lien qu&apos;il contient pour activer ton compte.
            </p>
            <Link href="/login" className="btn btn-primary mt-7">
              Aller à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <Image
                src="/logo.png"
                alt=""
                width={56}
                height={56}
                className="mx-auto rounded-[14px] shadow-[0_4px_14px_rgb(0_0_0/0.18)]"
              />
              <h1 className="section-title mt-5 text-[28px]">{copy.title}</h1>
              <p className="mt-1.5 text-[15px] text-muted">{copy.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
              <div className="float-field">
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                  required
                />
                <label htmlFor="auth-email">Adresse email</label>
              </div>
              <div className="float-field">
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  required
                  minLength={6}
                />
                <label htmlFor="auth-password">
                  Mot de passe{mode === "signup" && " (6 caractères min.)"}
                </label>
              </div>

              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-2 px-1 text-[14px] text-danger"
                >
                  <AlertIcon size={16} className="mt-0.5 shrink-0" />
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg mt-3 w-full"
              >
                {submitting ? copy.submitting : copy.submit}
              </button>
            </form>

            <p className="mt-7 text-center text-[14px] text-muted">
              {copy.switchText}{" "}
              <Link href={copy.switchHref} className="link font-medium">
                {copy.switchLabel}
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
