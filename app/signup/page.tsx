"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <main className="max-w-sm mx-auto p-8 text-center">
        <h1 className="text-xl font-bold mb-4">Vérifie ta boîte mail 📧</h1>
        <p className="text-gray-600">
          Un email de confirmation t&apos;a été envoyé. Clique sur le lien
          pour activer ton compte.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Créer un compte</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded-lg px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe (6 caractères min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded-lg px-4 py-2"
          required
          minLength={6}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Création..." : "S'inscrire"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Déjà un compte ?{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-blue-600 underline"
        >
          Se connecter
        </button>
      </p>
    </main>
  );
}