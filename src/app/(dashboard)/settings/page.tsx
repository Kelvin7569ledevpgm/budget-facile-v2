'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  User,
  Monitor,
  Coins,
  Tags,
  Wallet,
  FileUp,
  Shield,
  Camera,
  Loader2,
  Save,
  Trash2,
  Mail,
  Calendar,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader, Card, Button, Input, Select, TextArea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import { mergePreferences, type UserPreferences } from '@/lib/user-preferences';
import { uploadProfileAvatar } from '@/lib/avatar-upload';
import { downloadTransactionsCsv, type CsvTransaction } from '@/lib/export-transactions-csv';
import styles from './SettingsPage.module.css';

type SectionId = 'profile' | 'display' | 'currency' | 'categories' | 'accounts' | 'data' | 'security';

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'display', label: 'Affichage', icon: Monitor },
  { id: 'currency', label: 'Devise & langue', icon: Coins },
  { id: 'categories', label: 'Catégories', icon: Tags },
  { id: 'accounts', label: 'Comptes', icon: Wallet },
  { id: 'data', label: 'Export / import', icon: FileUp },
  { id: 'security', label: 'Sécurité', icon: Shield },
];

function Toggle({
  on,
  onToggle,
  id,
}: {
  on: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={on}
      className={`${styles.switch} ${on ? styles.switchOn : ''}`}
      onClick={onToggle}
    >
      <span className={styles.knob} />
    </button>
  );
}

function Feedback({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <p
      role="status"
      style={{
        color: type === 'ok' ? 'var(--color-success)' : 'var(--color-danger)',
        marginBottom: 'var(--spacing-md)',
        fontSize: '0.875rem',
        lineHeight: 1.45,
      }}
    >
      {text}
    </p>
  );
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function SettingsPage() {
  const { refresh: refreshPrefsContext } = useUserPreferences();
  const pathname = usePathname();
  const isDemo = pathname.startsWith('/demo');
  const fileRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<SectionId>('profile');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [prefsRaw, setPrefsRaw] = useState<Record<string, unknown>>({});
  const [bio, setBio] = useState('');
  const [memberSince, setMemberSince] = useState<string | null>(null);

  const [compact, setCompact] = useState(false);
  const [showCents, setShowCents] = useState(true);
  const [currency, setCurrency] = useState('EUR');
  const [locale, setLocale] = useState('fr-FR');
  const [cats, setCats] = useState(['Logement', 'Alimentation', 'Transport', 'Loisirs']);
  const [bankAccounts, setBankAccounts] = useState([
    'Compte principal',
    'Livret A',
    'Carte Visa',
    'Pro',
  ]);

  const [newEmail, setNewEmail] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** Suppression du compte */
  const [deletingAccount, setDeletingAccount] = useState(false);
  /** Message après enregistrement global des préférences (bouton en-tête). */
  const [prefsBanner, setPrefsBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const prefsReady = Boolean(userId) && !loadingProfile;

  useEffect(() => {
    setFeedback(null);
    setPrefsBanner(null);
  }, [section]);

  useEffect(() => {
    if (isDemo) {
      setLoadingProfile(false);
      setName('Invité démo');
      setEmail('aperçu@demo.budgetfacile');
      setAvatarUrl(null);
      setUserId(null);
      setBio('');
      setMemberSince(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingProfile(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        setUserId(user.id);
        if (user.email) setEmail(user.email);
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, preferences, created_at')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profile?.display_name) setName(profile.display_name);
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile?.created_at) setMemberSince(String(profile.created_at));
        else setMemberSince(null);
        const merged = mergePreferences(profile?.preferences);
        setBio(merged.bio);
        setPrefsRaw((profile?.preferences as Record<string, unknown>) || {});
        setCompact(merged.compact);
        setShowCents(merged.showCents);
        setCurrency(merged.currency);
        setLocale(merged.locale);
        setCats(merged.categories);
        setBankAccounts(merged.accounts);
      } catch {
        /* */
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  async function saveProfile() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    setSavingProfile(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const nextPrefs = { ...prefsRaw, bio: bio.trim().slice(0, 500) };
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name.trim() || null,
          preferences: nextPrefs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) throw error;
      setPrefsRaw(nextPrefs as Record<string, unknown>);
      await refreshPrefsContext();
      setFeedback({ type: 'ok', text: 'Profil enregistré.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Enregistrement impossible.',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isDemo || !userId) return;
    setUploadingAvatar(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const url = await uploadProfileAvatar(supabase, userId, file);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setAvatarUrl(url);
      setFeedback({ type: 'ok', text: 'Photo de profil mise à jour.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Envoi de l’image impossible.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveAllPreferences() {
    if (isDemo) {
      setPrefsBanner({ type: 'err', text: 'En mode démo, les préférences ne sont pas enregistrées.' });
      return;
    }
    if (!userId) {
      setPrefsBanner({
        type: 'err',
        text: 'Compte non chargé. Patientez quelques secondes ou reconnectez-vous.',
      });
      return;
    }
    const accClean = bankAccounts.map((a) => a.trim()).filter(Boolean);
    if (accClean.length === 0) {
      setPrefsBanner({ type: 'err', text: 'Ajoutez au moins un libellé de compte.' });
      return;
    }
    setSavingPrefs(true);
    setPrefsBanner(null);
    try {
      const supabase = createClient();
      const next: UserPreferences = {
        ...mergePreferences(prefsRaw),
        compact,
        showCents,
        currency,
        locale,
        categories: cats.map((c) => c.trim()).filter(Boolean),
        accounts: accClean,
        bio: bio.trim().slice(0, 500),
      };
      const merged = { ...prefsRaw, ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setPrefsRaw(merged as Record<string, unknown>);
      await refreshPrefsContext();
      setPrefsBanner({
        type: 'ok',
        text: 'Paramètres enregistrés et appliqués (affichage, devise, langue, catégories, comptes).',
      });
    } catch (e) {
      setPrefsBanner({
        type: 'err',
        text: e instanceof Error ? e.message : 'Enregistrement impossible.',
      });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function savePreferencesDisplay() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    setSavingPrefs(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const next: UserPreferences = {
        ...mergePreferences(prefsRaw),
        compact,
        showCents,
      };
      const merged = { ...prefsRaw, ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setPrefsRaw(merged as Record<string, unknown>);
      await refreshPrefsContext();
      setFeedback({ type: 'ok', text: 'Préférences d’affichage enregistrées.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Erreur à l’enregistrement.',
      });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function savePreferencesCurrency() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    setSavingPrefs(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const next: UserPreferences = {
        ...mergePreferences(prefsRaw),
        currency,
        locale,
      };
      const merged = { ...prefsRaw, ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setPrefsRaw(merged as Record<string, unknown>);
      await refreshPrefsContext();
      setFeedback({ type: 'ok', text: 'Devise et langue enregistrées.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Erreur à l’enregistrement.',
      });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveCategories() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    setSavingPrefs(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const next: UserPreferences = {
        ...mergePreferences(prefsRaw),
        categories: cats.map((c) => c.trim()).filter(Boolean),
      };
      const merged = { ...prefsRaw, ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setPrefsRaw(merged as Record<string, unknown>);
      await refreshPrefsContext();
      setFeedback({ type: 'ok', text: 'Catégories enregistrées.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Erreur à l’enregistrement.',
      });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveAccounts() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    const cleaned = bankAccounts.map((a) => a.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setFeedback({ type: 'err', text: 'Gardez au moins un compte.' });
      return;
    }
    setSavingPrefs(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const next: UserPreferences = {
        ...mergePreferences(prefsRaw),
        accounts: cleaned,
      };
      const merged = { ...prefsRaw, ...next };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setPrefsRaw(merged as Record<string, unknown>);
      setBankAccounts(cleaned);
      await refreshPrefsContext();
      setFeedback({ type: 'ok', text: 'Comptes enregistrés.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Erreur à l’enregistrement.',
      });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function requestEmailChange() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    const next = newEmail.trim().toLowerCase();
    if (!next || next === email.toLowerCase()) {
      setFeedback({ type: 'err', text: 'Indiquez une nouvelle adresse différente de l’actuelle.' });
      return;
    }
    setSavingEmail(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) throw error;
      setFeedback({
        type: 'ok',
        text: 'Si cette adresse est valide, un e-mail de confirmation vous a été envoyé (vérifiez la boîte de réception et les spams).',
      });
      setNewEmail('');
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Changement d’e-mail impossible.',
      });
    } finally {
      setSavingEmail(false);
    }
  }

  async function updatePassword() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    if (newPw.length < 6) {
      setFeedback({ type: 'err', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (newPw !== confirmPw) {
      setFeedback({ type: 'err', text: 'La confirmation ne correspond pas au nouveau mot de passe.' });
      return;
    }
    setSavingPw(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPw,
      });
      if (signErr) {
        setFeedback({ type: 'err', text: 'Mot de passe actuel incorrect.' });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setFeedback({ type: 'ok', text: 'Mot de passe mis à jour.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Mise à jour impossible.',
      });
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé.' });
      return;
    }

    const confirmed = window.confirm(
      'ATTENTION : Cette action est irréversible. Toutes vos transactions, budgets et préférences seront définitivement supprimés.\n\nVoulez-vous vraiment supprimer votre compte ?'
    );

    if (!confirmed) return;

    setDeletingAccount(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_user');

      if (error) throw error;

      // Déconnexion locale et redirection
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Erreur lors de la suppression du compte.',
      });
      setDeletingAccount(false);
    }
  }

  async function exportCsv() {
    if (isDemo) return;
    if (!userId) {
      setFeedback({ type: 'err', text: 'Compte non chargé. Patientez ou reconnectez-vous.' });
      return;
    }
    setExporting(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transactions')
        .select('label, category, date, amount, type, account, status')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      if (!data?.length) {
        setFeedback({ type: 'err', text: 'Aucune transaction à exporter.' });
        return;
      }
      downloadTransactionsCsv(data as CsvTransaction[]);
      setFeedback({ type: 'ok', text: 'Téléchargement lancé.' });
    } catch (e) {
      setFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'Export impossible.',
      });
    } finally {
      setExporting(false);
    }
  }

  const initials = (name || email || '?')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const nav = (
    <nav className={`${styles.nav} ${styles.desktopNav}`} aria-label="Sections paramètres">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`${styles.navBtn} ${section === s.id ? styles.navBtnActive : ''}`}
          onClick={() => setSection(s.id)}
        >
          <s.icon size={18} strokeWidth={2} />
          {s.label}
        </button>
      ))}
    </nav>
  );

  const demoBanner = isDemo ? (
    <p className="text-caption" style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-warning)' }}>
      Mode démo : les modifications ne sont pas enregistrées.
    </p>
  ) : null;

  function SectionFeedback({ sid }: { sid: SectionId }) {
    if (!feedback || section !== sid) return null;
    return <Feedback type={feedback.type} text={feedback.text} />;
  }

  return (
    <div className={styles.pageRoot}>
      <PageHeader
        title="Paramètres"
        description="Compte, préférences et contrôle de vos données — tout au même endroit."
      />

      {prefsBanner ? (
        <p
          role="status"
          className={styles.prefsBanner}
          style={{
            color: prefsBanner.type === 'ok' ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          {prefsBanner.text}
        </p>
      ) : null}

      {demoBanner}

      <div className={styles.layout}>
        <div>
          <div className={styles.mobileSelect}>
            <Select
              id="section-mobile"
              label="Section"
              value={section}
              onChange={(e) => setSection(e.target.value as SectionId)}
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          {nav}
        </div>

        <div className={styles.sectionStack}>
          {section === 'profile' && (
            <Card>
              <h2 className={styles.sectionTitle}>Profil</h2>
              <p className={styles.profileLead}>
                Photo, nom et présentation : tout ce qui vous représente dans l’app. L’e-mail et la sécurité sont
                gérés à part.
              </p>
              <SectionFeedback sid="profile" />
              {loadingProfile && !isDemo ? (
                <p className="text-caption">Chargement…</p>
              ) : (
                <>
                  <div className={styles.profileTop}>
                    <div className={styles.avatarBlock}>
                      <div className={`${styles.avatarCircle} ${styles.avatarCircleLg}`} aria-hidden>
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className={styles.avatarImg} />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className={styles.avatarActions}>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className={styles.hiddenFile}
                          onChange={onAvatarPick}
                        />
                        <button
                          type="button"
                          className="btn btn--secondary"
                          disabled={isDemo || uploadingAvatar}
                          onClick={() => fileRef.current?.click()}
                        >
                          {uploadingAvatar ? (
                            <Loader2 size={18} className={styles.spin} />
                          ) : (
                            <Camera size={18} strokeWidth={2} />
                          )}
                          Changer la photo
                        </button>
                        <p className="text-caption" style={{ margin: 0 }}>
                          JPEG, PNG, WebP ou GIF — max. 2 Mo.
                        </p>
                      </div>
                    </div>
                    <div className={styles.profilePreview}>
                      <span className={styles.profileKicker}>
                        <Sparkles size={14} strokeWidth={2} aria-hidden />
                        Aperçu
                      </span>
                      <p className={styles.profilePreviewName}>{name.trim() || 'Votre nom'}</p>
                      <p className={styles.profilePreviewEmail}>{email || '—'}</p>
                      {bio.trim() ? (
                        <p className={styles.profilePreviewBio}>{bio.trim()}</p>
                      ) : (
                        <p className={styles.profilePreviewBioMuted}>Ajoutez une courte bio pour personnaliser votre profil.</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.profileStats}>
                    <div className={styles.statChip}>
                      <Tags size={16} strokeWidth={2} aria-hidden />
                      <span>
                        <strong>{cats.filter(Boolean).length}</strong> catégories
                      </span>
                    </div>
                    <div className={styles.statChip}>
                      <Wallet size={16} strokeWidth={2} aria-hidden />
                      <span>
                        <strong>{bankAccounts.filter(Boolean).length}</strong> comptes
                      </span>
                    </div>
                  </div>

                  <div className={styles.profileGrid}>
                    <div className={styles.profileMain}>
                      <div className={styles.row}>
                        <Input
                          id="set-name"
                          label="Nom affiché"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isDemo}
                          placeholder="Votre nom ou pseudo"
                          autoComplete="nickname"
                        />
                      </div>
                      <TextArea
                        id="set-bio"
                        label="Bio (optionnel)"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 500))}
                        disabled={isDemo}
                        placeholder="Quelques mots sur vous, vos objectifs budgétaires…"
                        rows={4}
                      />
                      <p className="text-caption" style={{ marginTop: '0.25rem' }}>
                        {bio.length}/500 caractères
                      </p>
                      <div className={styles.profileSaveRow}>
                        <button
                          type="button"
                          className={`btn btn--primary btn--lg ${styles.profileSaveBtn}`}
                          disabled={isDemo || savingProfile || !prefsReady}
                          onClick={saveProfile}
                        >
                          {savingProfile ? <Loader2 size={18} className={styles.spin} /> : null}
                          Enregistrer le profil
                        </button>
                      </div>
                    </div>

                    <aside className={styles.profileAside} aria-label="Informations du compte">
                      <div className={styles.infoCard}>
                        <div className={styles.infoCardIcon} aria-hidden>
                          <Mail size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <p className={styles.infoCardLabel}>E-mail</p>
                          <p className={styles.infoCardValue}>{email || '—'}</p>
                          <p className={styles.infoCardHint}>Pour le modifier, utilisez l’onglet Sécurité.</p>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.infoCardIcon} aria-hidden>
                          <Calendar size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <p className={styles.infoCardLabel}>Membre depuis</p>
                          <p className={styles.infoCardValue}>
                            {isDemo ? 'Mode démo' : formatMemberSince(memberSince)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.quickNavBtn}
                        onClick={() => setSection('security')}
                      >
                        <span>
                          <Shield size={18} strokeWidth={2} />
                          Sécurité du compte
                        </span>
                        <ChevronRight size={18} strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={styles.quickNavBtn}
                        onClick={() => setSection('display')}
                      >
                        <span>
                          <Monitor size={18} strokeWidth={2} />
                          Affichage & apparence
                        </span>
                        <ChevronRight size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </aside>
                  </div>
                </>
              )}
            </Card>
          )}

          {section === 'display' && (
            <Card>
              <h2 className={styles.sectionTitle}>Préférences d’affichage</h2>
              <SectionFeedback sid="display" />
              <div className={styles.toggleRow}>
                <div className={styles.toggleText}>
                  <strong>Vue compacte</strong>
                  <span>Réduit l’espacement des listes et des tableaux.</span>
                </div>
                <Toggle id="t-compact" on={compact} onToggle={() => setCompact((c) => !c)} />
              </div>
              <div className={styles.toggleRow}>
                <div className={styles.toggleText}>
                  <strong>Afficher les centimes</strong>
                  <span>Montants toujours avec deux décimales.</span>
                </div>
                <Toggle id="t-cents" on={showCents} onToggle={() => setShowCents((c) => !c)} />
              </div>
              <div className={styles.actions}>
                <Button
                  variant="default"
                  type="button"
                  disabled={isDemo || savingPrefs || !prefsReady}
                  onClick={savePreferencesDisplay}
                >
                  {savingPrefs ? <Loader2 size={18} className={styles.spin} /> : null}
                  Enregistrer cette section
                </Button>
              </div>
            </Card>
          )}

          {section === 'currency' && (
            <Card>
              <h2 className={styles.sectionTitle}>Devise et langue</h2>
              <SectionFeedback sid="currency" />
              <div className={`${styles.row} ${styles.row2}`}>
                <Select id="set-currency" label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar (USD)</option>
                  <option value="CHF">Franc suisse (CHF)</option>
                </Select>
                <Select id="set-locale" label="Langue" value={locale} onChange={(e) => setLocale(e.target.value)}>
                  <option value="fr-FR">Français</option>
                  <option value="en-US">English</option>
                </Select>
              </div>
              <div className={styles.actions}>
                <Button
                  variant="default"
                  type="button"
                  disabled={isDemo || savingPrefs || !prefsReady}
                  onClick={savePreferencesCurrency}
                >
                  {savingPrefs ? <Loader2 size={18} className={styles.spin} /> : null}
                  Enregistrer cette section
                </Button>
              </div>
            </Card>
          )}

          {section === 'categories' && (
            <Card>
              <h2 className={styles.sectionTitle}>Catégories budgétaires</h2>
              <SectionFeedback sid="categories" />
              <p className="text-caption" style={{ marginBottom: 'var(--spacing-md)' }}>
                Libellés utilisés dans vos budgets et formulaires de transaction.
              </p>
              <div className={styles.catList}>
                {cats.map((c, i) => (
                  <div key={i} className={styles.catItem}>
                    <input
                      aria-label={`Catégorie ${i + 1}`}
                      value={c}
                      onChange={(e) => {
                        const next = [...cats];
                        next[i] = e.target.value;
                        setCats(next);
                      }}
                      disabled={isDemo}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isDemo}
                  onClick={() => setCats((prev) => [...prev, `Catégorie ${prev.length + 1}`])}
                >
                  Ajouter une catégorie
                </Button>
                <Button
                  variant="default"
                  type="button"
                  disabled={isDemo || savingPrefs || !prefsReady}
                  onClick={saveCategories}
                >
                  {savingPrefs ? <Loader2 size={18} className={styles.spin} /> : null}
                  Enregistrer cette section
                </Button>
              </div>
            </Card>
          )}

          {section === 'accounts' && (
            <Card>
              <h2 className={styles.sectionTitle}>Comptes et budgets</h2>
              <SectionFeedback sid="accounts" />
              <p className="text-caption" style={{ marginBottom: 'var(--spacing-md)' }}>
                Chaque libellé correspond à un compte ou support (compte courant, Livret A, CCP, carte, etc.). Ils
                apparaissent dans les transactions et les filtres.
              </p>
              <div className={styles.catList}>
                {bankAccounts.map((a, i) => (
                  <div key={i} className={styles.catItem}>
                    <input
                      aria-label={`Compte ${i + 1}`}
                      value={a}
                      onChange={(e) => {
                        const next = [...bankAccounts];
                        next[i] = e.target.value;
                        setBankAccounts(next);
                      }}
                      disabled={isDemo}
                      placeholder="Ex. CCP, Livret A…"
                    />
                    <button
                      type="button"
                      className={styles.removeRowBtn}
                      disabled={isDemo || bankAccounts.length <= 1}
                      aria-label={`Retirer le compte ${i + 1}`}
                      onClick={() => setBankAccounts((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isDemo}
                  onClick={() => setBankAccounts((prev) => [...prev, `Compte ${prev.length + 1}`])}
                >
                  Ajouter un compte
                </Button>
                <Button
                  variant="default"
                  type="button"
                  disabled={isDemo || savingPrefs || !prefsReady}
                  onClick={saveAccounts}
                >
                  {savingPrefs ? <Loader2 size={18} className={styles.spin} /> : null}
                  Enregistrer cette section
                </Button>
              </div>
            </Card>
          )}

          {section === 'data' && (
            <Card>
              <h2 className={styles.sectionTitle}>Export et import</h2>
              <SectionFeedback sid="data" />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Exportez toutes vos transactions en CSV pour une analyse externe.
              </p>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isDemo || exporting || !prefsReady}
                  onClick={exportCsv}
                >
                  {exporting ? <Loader2 size={18} className={styles.spin} /> : null}
                  Télécharger CSV
                </Button>
                <Button variant="ghost" type="button" disabled title="Bientôt disponible">
                  Importer un fichier…
                </Button>
              </div>
            </Card>
          )}

          {section === 'security' && (
            <Card>
              <h2 className={styles.sectionTitle}>Sécurité</h2>
              <SectionFeedback sid="security" />

              <h3 className={styles.subTitle}>Adresse e-mail</h3>
              <p className="text-caption" style={{ marginBottom: '0.75rem' }}>
                E-mail actuel : <strong>{email || '—'}</strong>
              </p>
              <div className={`${styles.row} ${styles.row2}`}>
                <Input
                  id="email-new"
                  label="Nouvelle adresse e-mail"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isDemo}
                  placeholder="nouvelle@adresse.com"
                />
              </div>
              <div className={styles.actions}>
                <Button
                  variant="default"
                  type="button"
                  disabled={isDemo || savingEmail}
                  onClick={requestEmailChange}
                >
                  {savingEmail ? <Loader2 size={18} className={styles.spin} /> : null}
                  Demander le changement d’e-mail
                </Button>
              </div>
              <p className="text-caption" style={{ marginTop: '0.75rem' }}>
                Supabase envoie un e-mail de confirmation sur la nouvelle adresse. L’ancienne reste active jusqu’à
                validation.
              </p>

              <h3 className={styles.subTitle} style={{ marginTop: 'var(--spacing-lg)' }}>
                Mot de passe
              </h3>
              <div className={styles.row}>
                <Input
                  id="pw-cur"
                  label="Mot de passe actuel"
                  type="password"
                  autoComplete="current-password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  disabled={isDemo}
                />
              </div>
              <div className={`${styles.row} ${styles.row2}`}>
                <Input
                  id="pw-new"
                  label="Nouveau mot de passe"
                  type="password"
                  autoComplete="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  disabled={isDemo}
                />
                <Input
                  id="pw-confirm"
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  disabled={isDemo}
                />
              </div>
              <div className={styles.actions}>
                <Button variant="default" type="button" disabled={isDemo || savingPw} onClick={updatePassword}>
                  {savingPw ? <Loader2 size={18} className={styles.spin} /> : null}
                  Mettre à jour le mot de passe
                </Button>
              </div>

              <p className="text-caption" style={{ marginTop: 'var(--spacing-lg)' }}>
                L’authentification à deux facteurs pourra être proposée dans une prochaine version.
              </p>

              <div className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>
                  <AlertTriangle size={18} className={styles.alertTriangle} />
                  Zone de danger
                </h3>
                <p className={styles.dangerDesc}>
                  La suppression de votre compte est <strong>définitive</strong>. Vous perdrez l'accès à toutes vos données (profil, transactions, catégories, paramètres). Cette action ne peut pas être annulée.
                </p>
                <div className={styles.dangerActions}>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    disabled={isDemo || deletingAccount}
                    onClick={deleteAccount}
                  >
                    {deletingAccount ? (
                      <Loader2 size={18} className={styles.spin} />
                    ) : (
                      <Trash2 size={18} strokeWidth={2} />
                    )}
                    Supprimer définitivement mon compte
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className={styles.saveBar} role="region" aria-label="Enregistrer les préférences">
        <button
          type="button"
          className={`btn btn--primary btn--lg ${styles.saveBarMainBtn}`}
          disabled={isDemo || !prefsReady || savingPrefs}
          onClick={saveAllPreferences}
        >
          {savingPrefs ? <Loader2 size={20} className={styles.spin} /> : <Save size={20} strokeWidth={2} />}
          Enregistrer et appliquer les paramètres
        </button>
        {isDemo ? (
          <p className={styles.saveBarHint}>
            Mode démo : connectez-vous pour enregistrer et appliquer vos préférences dans l’app.
          </p>
        ) : !prefsReady ? (
          <p className={styles.saveBarLoading}>Chargement de votre compte…</p>
        ) : (
          <p className={styles.saveBarSub}>
            Affichage, devise, langue, catégories et comptes — appliqués partout après enregistrement.
          </p>
        )}
      </div>
    </div>
  );
}
