'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from '../login/LoginPage.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHint(null);
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? '';
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }
      setHint(
        'Compte créé. Si la confirmation par e-mail est activée sur votre projet Supabase, ouvrez le lien reçu pour activer le compte.'
      );
    } catch {
      setError('Inscription impossible. Vérifiez la configuration Supabase (.env.local).');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.head}>
          <div className={styles.brand}>
            <ShieldCheck size={22} strokeWidth={2.2} />
            BUDGETFACILE
          </div>
          <h1 className={styles.title}>Créer un compte</h1>
          <p className={styles.sub}>Vos données seront synchronisées sur tous vos appareils.</p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          {error ? <p className={styles.error}>{error}</p> : null}
          {hint ? <p className={styles.hint}>{hint}</p> : null}

          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.fieldLabel}>
              E-mail
            </label>
            <div className={styles.inputWrap}>
              <Mail size={18} aria-hidden />
              <input
                id="signup-email"
                className={styles.input}
                type="email"
                placeholder="nom@exemple.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-password" className={styles.fieldLabel}>
              Mot de passe
            </label>
            <div className={styles.inputWrap}>
              <Lock size={18} aria-hidden />
              <input
                id="signup-password"
                className={styles.input}
                type="password"
                placeholder="Au moins 6 caractères"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-confirm" className={styles.fieldLabel}>
              Confirmer le mot de passe
            </label>
            <div className={styles.inputWrap}>
              <Lock size={18} aria-hidden />
              <input
                id="signup-confirm"
                className={styles.input}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'} <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footer}>
          Déjà un compte ? <Link href="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
