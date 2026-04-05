'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, Lock, ArrowRight, Globe, GitBranch } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './LoginPage.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const authError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    authError === 'auth' ? 'Lien de confirmation invalide ou expiré.' : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(
          signError.message.includes('Invalid login')
            ? 'E-mail ou mot de passe incorrect.'
            : signError.message
        );
        return;
      }
      router.push(next.startsWith('/') ? next : '/dashboard');
      router.refresh();
    } catch {
      setError('Connexion impossible. Vérifiez la configuration Supabase (.env.local).');
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
          <h1 className={styles.title}>Bon retour</h1>
          <p className={styles.sub}>Connectez-vous pour accéder à votre espace.</p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.fieldLabel}>
              E-mail
            </label>
            <div className={styles.inputWrap}>
              <Mail size={18} aria-hidden />
              <input
                id="email"
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
            <div className={styles.rowLabel}>
              <label htmlFor="password" className={styles.fieldLabel}>
                Mot de passe
              </label>
              <Link href="/support" className={styles.forgot}>
                Aide
              </Link>
            </div>
            <div className={styles.inputWrap}>
              <Lock size={18} aria-hidden />
              <input
                id="password"
                className={styles.input}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'} <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.divider}>
          <span>OU CONTINUER AVEC</span>
        </div>

        <div className={styles.oauth}>
          <button type="button" className={styles.oauthBtn} disabled title="Bientôt disponible">
            <Globe size={18} /> Google
          </button>
          <button type="button" className={styles.oauthBtn} disabled title="Bientôt disponible">
            <GitBranch size={18} /> GitHub
          </button>
        </div>

        <p className={styles.footer}>
          Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <LoginForm />
    </Suspense>
  );
}
