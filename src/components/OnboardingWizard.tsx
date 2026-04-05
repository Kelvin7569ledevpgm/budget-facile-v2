import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Target, 
  Wallet, 
  Receipt, 
  ChevronRight, 
  CheckCircle2, 
  X,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import { Input, Select } from '@/components/ui';
import styles from './OnboardingWizard.module.css';

type Step = 'welcome' | 'profile' | 'goal' | 'budget' | 'transaction' | 'success';

export default function OnboardingWizard() {
  const { preferences, loading: prefsLoading, refresh } = useUserPreferences();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [profileName, setProfileName] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [budgetCat, setBudgetCat] = useState(preferences.categories[0] || 'Alimentation');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [txLabel, setTxLabel] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCat, setTxCat] = useState(preferences.categories[0] || 'Alimentation');

  useEffect(() => {
    console.log('[Onboarding] Status:', { 
      onboardingCompleted: preferences.onboardingCompleted, 
      prefsLoading 
    });
  }, [preferences.onboardingCompleted, prefsLoading]);

  // Si on est encore en chargement ou si l'onboarding est déjà fait, on n'affiche rien.
  if (prefsLoading || preferences.onboardingCompleted) {
    return null;
  }

  const handleSkip = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (step === 'welcome') {
      setStep('profile');
    } else if (step === 'profile') {
      if (!profileName.trim()) {
        setError('Veuillez entrer un nom.');
        return;
      }
      setLoading(true);
      const { error: err } = await supabase
        .from('profiles')
        .update({ display_name: profileName.trim() })
        .eq('id', user.id);
      setLoading(false);
      if (err) setError(err.message);
      else setStep('goal');
    } else if (step === 'goal') {
      if (!goalName.trim() || !goalAmount) {
        setStep('budget'); // Skip if empty but allow continuing
        return;
      }
      setLoading(true);
      const { error: err } = await supabase
        .from('savings_goals')
        .insert({
          user_id: user.id,
          name: goalName.trim(),
          target_amount: parseFloat(goalAmount.replace(',', '.')),
          saved_amount: 0
        });
      setLoading(false);
      if (err) setError(err.message);
      else setStep('budget');
    } else if (step === 'budget') {
      if (!budgetAmount) {
        setStep('transaction');
        return;
      }
      setLoading(true);
      const currentPlafonds = preferences.budgetPlafonds['Compte principal'] || {};
      const nextPlafonds = {
        ...preferences.budgetPlafonds,
        'Compte principal': {
          ...currentPlafonds,
          [budgetCat]: parseFloat(budgetAmount.replace(',', '.'))
        }
      };
      const { error: err } = await supabase
        .from('profiles')
        .update({ 
          preferences: { ...preferences, budgetPlafonds: nextPlafonds } 
        })
        .eq('id', user.id);
      setLoading(false);
      if (err) setError(err.message);
      else setStep('transaction');
    } else if (step === 'transaction') {
      if (!txLabel.trim() || !txAmount) {
        finish();
        return;
      }
      setLoading(true);
      const { error: err } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          label: txLabel.trim(),
          amount: parseFloat(txAmount.replace(',', '.')),
          category: txCat,
          type: 'expense',
          account: 'Compte principal',
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        });
      setLoading(false);
      if (err) setError(err.message);
      else finish();
    }
  };

  const finish = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    }
    await refresh();
    setStep('success');
    setTimeout(() => {
      // Just in case refresh didn't unmount us
    }, 2000);
  };

  const progressValues = {
    welcome: 0,
    profile: 20,
    goal: 40,
    budget: 60,
    transaction: 80,
    success: 100
  };

  const currentProgress = progressValues[step] ?? 0;

  return (
    <div className={styles.overlay}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={styles.modal}
      >
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${currentProgress}%` }} />
        </div>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={styles.finalStep}
              >
                <div className={styles.stepIcon}>
                  <CheckCircle2 size={32} />
                </div>
                <h1 className={styles.stepTitle}>Bienvenue sur BudgetFacile !</h1>
                <p className={styles.stepDesc}>
                  Configurons ensemble votre espace en quelques secondes pour commencer du bon pied.
                </p>
                <div className={styles.actions} style={{ justifyContent: 'center', width: '100%' }}>
                  <button onClick={handleNext} className={styles.nextBtn}>
                    C'est parti ! <ChevronRight size={18} />
                  </button>
                </div>
                <button onClick={handleSkip} className={styles.skipBtn}>
                  Passer toutes les étapes
                </button>
              </motion.div>
            )}

            {step === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon}><User size={24} /></div>
                  <h2 className={styles.stepTitle}>Votre profil</h2>
                  <p className={styles.stepDesc}>Comment souhaitez-vous être appelé ?</p>
                </div>
                <div className={styles.form}>
                  <Input 
                    id="onboard-name"
                    label="Nom d'affichage"
                    placeholder="Ex: Samuel"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    autoFocus
                  />
                  {error && <p className={styles.error}>{error}</p>}
                </div>
                <div className={styles.actions}>
                  <button onClick={handleSkip} className={styles.skipBtn}>Plus tard</button>
                  <button onClick={handleNext} className={styles.nextBtn} disabled={loading}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuer'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'goal' && (
              <motion.div
                key="goal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon}><Target size={24} /></div>
                  <h2 className={styles.stepTitle}>Un objectif d'épargne ?</h2>
                  <p className={styles.stepDesc}>Pour quel projet souhaitez-vous épargner ? (Optionnel)</p>
                </div>
                <div className={styles.form}>
                  <Input 
                    id="onboard-goal-name"
                    label="Nom du projet"
                    placeholder="Ex: Voyage au Japon"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                  />
                  <Input 
                    id="onboard-goal-amount"
                    label="Montant cible (€)"
                    type="number"
                    placeholder="Ex: 3000"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                  />
                  {error && <p className={styles.error}>{error}</p>}
                </div>
                <div className={styles.actions}>
                  <button onClick={() => setStep('budget')} className={styles.skipBtn}>Passer</button>
                  <button onClick={handleNext} className={styles.nextBtn} disabled={loading}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuer'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'budget' && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon}><Wallet size={24} /></div>
                  <h2 className={styles.stepTitle}>Un plafond mensuel</h2>
                  <p className={styles.stepDesc}>Fixez-vous une limite de dépense pour une catégorie. (Optionnel)</p>
                </div>
                <div className={styles.form}>
                  <Select 
                    id="onboard-budget-cat"
                    label="Catégorie"
                    value={budgetCat}
                    onChange={(e) => setBudgetCat(e.target.value)}
                  >
                    {preferences.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  <Input 
                    id="onboard-budget-amount"
                    label="Limite mensuelle (€)"
                    type="number"
                    placeholder="Ex: 400"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                  />
                  {error && <p className={styles.error}>{error}</p>}
                </div>
                <div className={styles.actions}>
                  <button onClick={() => setStep('transaction')} className={styles.skipBtn}>Passer</button>
                  <button onClick={handleNext} className={styles.nextBtn} disabled={loading}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continuer'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'transaction' && (
              <motion.div
                key="transaction"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon}><Receipt size={24} /></div>
                  <h2 className={styles.stepTitle}>Votre première dépense</h2>
                  <p className={styles.stepDesc}>Enregistrez votre dernier achat pour tester. (Optionnel)</p>
                </div>
                <div className={styles.form}>
                  <Input 
                    id="onboard-tx-label"
                    label="Libellé"
                    placeholder="Ex: Courses Monoprix"
                    value={txLabel}
                    onChange={(e) => setTxLabel(e.target.value)}
                  />
                  <Input 
                    id="onboard-tx-amount"
                    label="Montant (€)"
                    type="number"
                    placeholder="Ex: 45.50"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                  />
                  <Select 
                    id="onboard-tx-cat"
                    label="Catégorie"
                    value={txCat}
                    onChange={(e) => setTxCat(e.target.value)}
                  >
                    {preferences.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  {error && <p className={styles.error}>{error}</p>}
                </div>
                <div className={styles.actions}>
                  <button onClick={finish} className={styles.skipBtn}>Terminer sans</button>
                  <button onClick={handleNext} className={styles.nextBtn} disabled={loading}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Terminer'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.finalStep}
              >
                <div className={`${styles.stepIcon} ${styles.successIcon}`}>
                  <CheckCircle2 size={48} />
                </div>
                <h2 className={styles.stepTitle}>C'est tout bon !</h2>
                <p className={styles.stepDesc}>Votre compte est prêt. Redirection vers votre tableau de bord...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
